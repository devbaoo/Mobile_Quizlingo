import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SidebarOverlay from '@/components/SidebarOverlay';
import { fetchLessons, retryLesson } from '@/services/slices/lesson/lessonSlice';
import { fetchUserProfile } from '@/services/slices/user/userSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { ILesson, ITopicWithLessons } from '@/types/lesson.type';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

type RootStackParamList = {
    LessonQuiz: { lessonId: string };
    UserHome: undefined;
    Leaderboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Extend the ILesson type with ACTIVE status
type ExtendedLesson = Omit<ILesson, 'status'> & {
    status: "COMPLETE" | "LOCKED" | "ACTIVE";
};

// Create a modified version of ITopicWithLessons that uses ExtendedLesson
interface ExtendedTopicWithLessons extends Omit<ITopicWithLessons, 'lessons'> {
    lessons: ExtendedLesson[];
}

const UserHomeScreen = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<NavigationProp>();
    const { loading: lessonLoading, error } = useSelector((state: RootState) => state.lesson);
    const { profile, loading: userLoading } = useSelector((state: RootState) => state.user);

    const [topics, setTopics] = useState<ExtendedTopicWithLessons[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const sidebarOpacity = useRef(new Animated.Value(0)).current;

    // Load data on initial mount
    useEffect(() => {
        loadUserData();
        loadLessons();
    }, []);

    // Refresh data when returning to this screen
    useFocusEffect(
        useCallback(() => {
            loadLessons();
            return () => { };
        }, [])
    );

    useEffect(() => {
        if (isSidebarOpen) {
            Animated.timing(sidebarOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(sidebarOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isSidebarOpen]);

    const loadUserData = async () => {
        try {
            await dispatch(fetchUserProfile()).unwrap();
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    };

    const loadLessons = async () => {
        try {
            const response = await dispatch(fetchLessons({ page: 1, limit: 10 })).unwrap();

            // Process topics to determine which lessons should be unlocked
            const processedTopics = processTopicsForUnlocking(response.topics);
            setTopics(processedTopics);
        } catch (error) {
            console.error('Failed to load lessons:', error);
        }
    };

    // Process topics to determine which lessons should be unlocked
    const processTopicsForUnlocking = (topicsData: ITopicWithLessons[]): ExtendedTopicWithLessons[] => {
        return topicsData.map((topicWithLessons, topicIndex) => {
            // For the first topic, make sure the first lesson is always unlocked
            const updatedLessons = topicWithLessons.lessons.map((lesson, lessonIndex) => {
                // Convert to ExtendedLesson type
                const extendedLesson = { ...lesson } as ExtendedLesson;

                // For the first lesson in the first topic, always make it ACTIVE if it's LOCKED
                if (topicIndex === 0 && lessonIndex === 0 && extendedLesson.status === 'LOCKED') {
                    extendedLesson.status = 'ACTIVE';
                }
                // If this is the first lesson in topic and not the first topic,
                // check if all lessons in previous topic are completed
                else if (lessonIndex === 0 && topicIndex > 0) {
                    const previousTopic = topicsData[topicIndex - 1];
                    const allPreviousTopicLessonsCompleted = previousTopic.lessons.every(
                        prevLesson => prevLesson.status === 'COMPLETE'
                    );

                    if (allPreviousTopicLessonsCompleted && extendedLesson.status === 'LOCKED') {
                        extendedLesson.status = 'ACTIVE';
                    }
                }
                // If not the first lesson, check if previous lesson is completed
                else if (lessonIndex > 0) {
                    const previousLesson = topicWithLessons.lessons[lessonIndex - 1];
                    if (previousLesson.status === 'COMPLETE' && extendedLesson.status === 'LOCKED') {
                        extendedLesson.status = 'ACTIVE';
                    }
                }

                return extendedLesson;
            });

            return {
                ...topicWithLessons,
                lessons: updatedLessons
            };
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([loadUserData(), loadLessons()]);
        } catch (error) {
            console.error('Failed to refresh data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLessonPress = (lessonId: string, status: string) => {
        if (status === 'LOCKED') {
            Alert.alert(
                "Bài học đang khóa",
                "Bạn cần hoàn thành các bài học trước để mở khóa bài học này.",
                [{ text: "OK" }]
            );
            return;
        } else if (status === 'COMPLETE') {
            // Show confirmation dialog for retrying a completed lesson
            Alert.alert(
                "Bài học đã hoàn thành",
                "Bạn muốn làm lại bài học này?",
                [
                    {
                        text: "Hủy",
                        style: "cancel"
                    },
                    {
                        text: "Làm lại",
                        onPress: async () => {
                            try {
                                setRefreshing(true);
                                await dispatch(retryLesson({ lessonId })).unwrap();
                                // After successfully retrying, navigate to the lesson quiz
                                navigation.navigate('LessonQuiz', { lessonId });
                            } catch (error) {
                                console.error('Failed to retry lesson:', error);
                                Toast.show({
                                    type: 'error',
                                    text1: 'Không thể làm lại bài học',
                                    text2: 'Vui lòng thử lại sau'
                                });
                            } finally {
                                setRefreshing(false);
                            }
                        }
                    }
                ]
            );
        } else {
            // For ACTIVE lessons, navigate directly to the quiz
            navigation.navigate('LessonQuiz', { lessonId });
        }
    };

    const renderLessonIcon = (status: string, index: number) => {
        if (status === 'COMPLETE') {
            return (
                <View style={[styles.lessonIcon, styles.lessonComplete, styles.lessonIconShadow]}>
                    <Text style={styles.lessonIconText}>✓</Text>
                </View>
            );
        } else if (status === 'LOCKED') {
            return (
                <View style={[styles.lessonIcon, styles.lessonLocked, styles.lessonIconShadow]}>
                    <Text style={styles.lessonIconText}>🔒</Text>
                </View>
            );
        } else {
            return (
                <View style={[styles.lessonIcon, styles.lessonAvailable, styles.lessonIconShadow]}>
                    <Text style={styles.lessonIconText}>{index + 1}</Text>
                </View>
            );
        }
    };

    if ((lessonLoading || userLoading) && topics.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#58CC02" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            {/* Header */}
            <Header
                user={profile}
                onProfilePress={toggleSidebar}
            />

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#58CC02']}
                        tintColor={'#58CC02'}
                    />
                }
            >
                <View style={styles.learningPathContainer}>
                    {topics.map((topicWithLessons, topicIndex) => (
                        <View key={topicWithLessons.topic._id} style={styles.topicSection}>
                            <View style={styles.topicHeader}>
                                <View style={styles.topicIcon}><Text>🧩</Text></View>
                                <View>
                                    <Text style={styles.topicName}>{topicWithLessons.topic.name.toUpperCase()}</Text>
                                    <Text style={styles.topicDescription}>{topicWithLessons.topic.description}</Text>
                                </View>
                            </View>

                            <View style={styles.pathContainer}>
                                {topicWithLessons.lessons.map((lesson, lessonIndex) => (
                                    <React.Fragment key={lesson._id}>
                                        {lessonIndex > 0 && (
                                            <View
                                                style={[
                                                    styles.pathLine,
                                                    lesson.status === 'LOCKED' ? styles.pathLineLocked :
                                                        (lessonIndex % 2 === 0 ? styles.pathLineEven : styles.pathLineOdd)
                                                ]}
                                            />
                                        )}
                                        <TouchableOpacity
                                            style={[
                                                styles.lessonContainer,
                                                lesson.status === 'LOCKED' ? styles.lessonContainerLocked :
                                                    lesson.status === 'COMPLETE' ? styles.lessonContainerComplete :
                                                        styles.lessonContainerActive
                                            ]}
                                            onPress={() => handleLessonPress(lesson._id, lesson.status)}
                                            activeOpacity={lesson.status === 'LOCKED' ? 1 : 0.85}
                                        >
                                            {renderLessonIcon(lesson.status, lessonIndex)}
                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={[
                                                        styles.lessonTitle,
                                                        lesson.status === 'LOCKED' ? styles.lessonTitleLocked : {}
                                                    ]}
                                                    numberOfLines={2}
                                                >
                                                    {lesson.title}
                                                </Text>
                                                <View style={styles.lessonMetaContainer}>
                                                    <View style={styles.levelIndicator}>
                                                        <Text style={styles.levelIndicatorText}>
                                                            {lesson.level?.name || 'Beginner'}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.skillsContainer}>
                                                        {lesson.skills.map((skill) => (
                                                            <View key={skill._id} style={styles.skillBadge}>
                                                                <Text style={styles.skillText}>
                                                                    {skill.name === 'Writing' ? '✏️' :
                                                                        skill.name === 'Listening' ? '👂' :
                                                                            skill.name === 'Speaking' ? '🗣️' :
                                                                                skill.name === 'Vocabulary' ? '📚' : '🧠'}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </React.Fragment>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Sidebar and Overlay */}
            <SidebarOverlay
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                opacity={sidebarOpacity}
            />
            <Sidebar
                user={profile}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#4b4b4b',
    },
    scrollView: {
        flex: 1,
    },
    learningPathContainer: {
        padding: 16,
    },
    topicSection: {
        marginBottom: 28,
    },
    topicHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    topicIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E6F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    topicName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    topicDescription: {
        fontSize: 14,
        color: '#666',
    },
    pathContainer: {
        position: 'relative',
        alignItems: 'center',
    },
    pathLine: {
        width: 4,
        height: 30,
        backgroundColor: '#58CC02',
        borderRadius: 2,
        marginVertical: 2,
    },
    pathLineEven: {
        backgroundColor: '#58CC02',
    },
    pathLineOdd: {
        backgroundColor: '#1CB0F6',
    },
    pathLineLocked: {
        backgroundColor: '#ccc',
    },
    lessonContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
    },
    lessonContainerLocked: {
        borderColor: '#ccc',
        backgroundColor: '#f9f9f9',
    },
    lessonContainerActive: {
        borderColor: '#1CB0F6',
    },
    lessonContainerComplete: {
        borderColor: '#58CC02',
    },
    lessonIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    lessonIconShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 2,
    },
    lessonComplete: {
        backgroundColor: '#58CC02',
    },
    lessonAvailable: {
        backgroundColor: '#1CB0F6',
    },
    lessonLocked: {
        backgroundColor: '#ccc',
    },
    lessonIconText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    lessonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    lessonTitleLocked: {
        color: '#999',
    },
    lessonMetaContainer: {
        marginLeft: 'auto',
        alignItems: 'flex-end',
    },
    levelIndicator: {
        backgroundColor: '#F7F7F7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginBottom: 6,
    },
    levelIndicatorText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    skillsContainer: {
        flexDirection: 'row',
    },
    skillBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F0F8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    skillText: {
        fontSize: 16,
    },
});

export default UserHomeScreen;
