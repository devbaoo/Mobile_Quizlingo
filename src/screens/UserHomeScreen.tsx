import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SidebarOverlay from '@/components/SidebarOverlay';
import { fetchLessons, retryLesson } from '@/services/slices/lesson/lessonSlice';
import { fetchUserProfile } from '@/services/slices/user/userSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { ILearningPathLesson } from '@/types/lesson.type';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
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

// Extend ILearningPathLesson to include ACTIVE status
type ExtendedLearningPathLesson = Omit<ILearningPathLesson, 'status'> & {
    status: "COMPLETE" | "LOCKED" | "ACTIVE";
};

const UserHomeScreen = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute();
    const { loading: lessonLoading, error, lessons } = useSelector((state: RootState) => state.lesson);
    const { profile, loading: userLoading } = useSelector((state: RootState) => state.user);

    const [processedLessons, setProcessedLessons] = useState<ExtendedLearningPathLesson[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const sidebarOpacity = useRef(new Animated.Value(0)).current;

    // Tính progress tổng thể
    const completedCount = processedLessons.filter(l => l.status === 'COMPLETE').length;
    const totalCount = processedLessons.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Gom bài học theo chủ đề (nếu có trường topicName)
    const lessonsByTopic = React.useMemo(() => {
        const map: { [topic: string]: ExtendedLearningPathLesson[] } = {};
        processedLessons.forEach(lesson => {
            const topic = (lesson as any).topicName || 'Chủ đề ';
            if (!map[topic]) map[topic] = [];
            map[topic].push(lesson);
        });
        return map;
    }, [processedLessons]);

    // Process lessons to determine which ones should be active
    useEffect(() => {
        if (lessons && lessons.length > 0) {
            const updatedLessons = lessons.map((lesson, index) => {
                const extendedLesson = { ...lesson } as ExtendedLearningPathLesson;

                // First lesson should be ACTIVE if it's LOCKED
                if (index === 0 && lesson.status === 'LOCKED') {
                    extendedLesson.status = 'ACTIVE';
                }
                // For other lessons, if previous lesson is COMPLETE and this one is LOCKED, make it ACTIVE
                else if (index > 0 && lesson.status === 'LOCKED') {
                    const previousLesson = lessons[index - 1];
                    if (previousLesson.status === 'COMPLETE') {
                        extendedLesson.status = 'ACTIVE';
                    }
                }

                return extendedLesson;
            });
            setProcessedLessons(updatedLessons);
        }
    }, [lessons]);

    // Load data on initial mount
    useEffect(() => {
        loadUserData();
        // Kiểm tra nếu vừa hoàn thành bài học thì delay 5s trước khi loadLessons
        if (route?.params && (route.params as any).isLessonJustCompleted) {
            setTimeout(() => {
                loadLessons();
            }, 5000);
        } else {
            loadLessons();
        }
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
            await dispatch(fetchLessons({ page: 1, limit: 10 })).unwrap();
        } catch (error) {
            console.error('Failed to load lessons:', error);
        }
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

    if ((lessonLoading || userLoading) && !processedLessons.length) {
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
            <Header user={profile} onProfilePress={toggleSidebar} />


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
                {/* Render lessons by topic */}
                <View style={styles.learningPathContainer}>
                    {Object.entries(lessonsByTopic).map(([topic, lessons]) => (
                        <View key={topic} style={styles.topicSection}>
                            <View style={styles.topicHeader}>
                                <Text style={styles.topicIcon}>{getTopicIcon(topic)}</Text>
                                <View>
                                    <Text style={styles.topicName}>{topic}</Text>
                                    {/* Có thể thêm mô tả chủ đề nếu có */}
                                </View>
                            </View>
                            <View style={styles.lessonCardList}>
                                {lessons.map((lesson, index) => {
                                    // Xác định trạng thái
                                    const isComplete = lesson.status === 'COMPLETE';
                                    const isLocked = lesson.status === 'LOCKED';
                                    const isActive = lesson.status === 'ACTIVE';
                                    return (
                                        <TouchableOpacity
                                            key={lesson.lessonId}
                                            style={[
                                                stylesV2.lessonCard,
                                                isComplete && stylesV2.lessonCardComplete,
                                                isActive && stylesV2.lessonCardActive,
                                                isLocked && stylesV2.lessonCardLocked,
                                            ]}
                                            onPress={() => handleLessonPress(lesson.lessonId, lesson.status)}
                                            activeOpacity={isLocked ? 1 : 0.85}
                                            disabled={isLocked}
                                        >
                                            {/* Icon trạng thái */}
                                            <View style={stylesV2.lessonCardIconBox}>
                                                {isComplete ? (
                                                    <View style={stylesV2.iconCircleComplete}>
                                                        <Text style={stylesV2.iconText}>✓</Text>
                                                    </View>
                                                ) : isLocked ? (
                                                    <View style={stylesV2.iconCircleLocked}>
                                                        <Text style={stylesV2.iconText}>🔒</Text>
                                                    </View>
                                                ) : (
                                                    <View style={stylesV2.iconCircleActive}>
                                                        <Text style={stylesV2.iconText}>{index + 1}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {/* Nội dung bài học */}
                                            <View style={{ flex: 1 }}>
                                                <Text style={stylesV2.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
                                                <View style={stylesV2.lessonMetaRow}>
                                                    <View style={stylesV2.levelBadge}>
                                                        <Text style={stylesV2.levelBadgeText}>{lesson.level}</Text>
                                                    </View>
                                                    <View style={stylesV2.skillsRow}>
                                                        {lesson.focusSkills.map((skill, i) => (
                                                            <Text key={i} style={stylesV2.skillIcon}>{getSkillIcon(skill)}</Text>
                                                        ))}
                                                    </View>
                                                </View>
                                            </View>
                                            {/* Overlay icon khóa lớn nếu bị khóa */}
                                            {isLocked && (
                                                <View style={stylesV2.lockOverlayBig} pointerEvents="none">
                                                    <Text style={stylesV2.lockOverlayIcon}>🔒</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
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

// Helper: icon cho chủ đề
function getTopicIcon(topic: string) {
    switch (topic.toLowerCase()) {
        case 'vocabulary': return '📚';
        case 'speaking': return '🗣️';
        case 'listening': return '👂';
        case 'writing': return '✏️';
        case 'grammar': return '🧩';
        default: return '🧠';
    }
}
// Helper: icon cho kỹ năng
function getSkillIcon(skill: string) {
    switch (skill) {
        case 'Writing': return '✏️';
        case 'Listening': return '👂';
        case 'Speaking': return '🗣️';
        case 'Vocabulary': return '📚';
        default: return '🧠';
    }
}

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
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    topicIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    topicName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
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
    userProgressSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        marginBottom: 8,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e0e7ef',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#e0e7ef',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#222',
    },
    userLevel: {
        fontSize: 14,
        color: '#3B82F6',
    },
    userXP: {
        fontSize: 14,
        color: '#fbbf24',
    },
    progressBarContainer: {
        marginTop: 4,
    },
    progressBarBg: {
        width: '100%',
        height: 10,
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#58CC02',
        borderRadius: 8,
    },
    progressText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'right',
    },
    lessonCardList: {
        gap: 12,
    },
    lessonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 2,
        position: 'relative',
    },
    lessonCardLocked: {
        borderColor: '#ccc',
        backgroundColor: '#f3f4f6',
        opacity: 0.7,
    },
    lessonCardActive: {
        borderColor: '#1CB0F6',
    },
    lessonCardComplete: {
        borderColor: '#58CC02',
    },
    lessonCardIconWrapper: {
        marginRight: 18,
    },
    lessonCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    lessonMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    badgeComplete: {
        position: 'absolute',
        top: 8,
        right: 12,
        backgroundColor: '#58CC02',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeCompleteText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    lockOverlay: {
        position: 'absolute',
        top: 8,
        right: 12,
        backgroundColor: '#ccc',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    lockIcon: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

// Thêm style mới cho lesson card
const stylesV2 = StyleSheet.create({
    lessonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        position: 'relative',
        minHeight: 80,
    },
    lessonCardComplete: {
        borderColor: '#58CC02',
        backgroundColor: '#f0fdf4',
    },
    lessonCardActive: {
        borderColor: '#1CB0F6',
        backgroundColor: '#f0f8ff',
    },
    lessonCardLocked: {
        borderColor: '#ccc',
        backgroundColor: '#f3f4f6',
        opacity: 0.6,
    },
    lessonCardIconBox: {
        marginRight: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleComplete: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#58CC02',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleActive: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1CB0F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleLocked: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    lessonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 6,
    },
    lessonMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    levelBadge: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
    },
    levelBadgeText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    skillsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    skillIcon: {
        fontSize: 18,
        marginRight: 2,
    },
    lockOverlayBig: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        zIndex: 2,
    },
    lockOverlayIcon: {
        fontSize: 38,
        color: '#ccc',
        fontWeight: 'bold',
    },
});

export default UserHomeScreen;
