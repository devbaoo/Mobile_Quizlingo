import { clearCurrentLesson } from '@/services/slices/lesson/lessonSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { QuestionResultWithScore } from '@/types/lesson.type';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';


// Define navigation params
type RootStackParamList = {
    LessonQuiz: { lessonId: string };
    LessonComplete: {
        lessonId: string,
        score: number,
        questionResults: QuestionResultWithScore[],
        isRetried: boolean
    };
    UserHome: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'LessonComplete'>;

const LessonCompleteScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch<AppDispatch>();
    const { lessonId, score, questionResults, isRetried } = route.params;
    const { currentLesson, loading, progress, userProgress } = useSelector((state: RootState) => state.lesson);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Prevent going back with hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            // Always navigate to home instead of going back to quiz
            navigation.reset({
                index: 0,
                routes: [{ name: 'UserHome' }],
            });
            return true;
        });

        return () => backHandler.remove();
    }, [navigation]);

    // Cleanup function when navigating away
    useEffect(() => {
        return () => {
            dispatch(clearCurrentLesson());
        };
    }, [dispatch]);

    const handleContinue = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'UserHome', params: { isLessonJustCompleted: true } }],
        });
    };

    const renderScoreMessage = () => {
        if (!progress) return 'Hoàn thành bài học!';

        const scorePercentage = (progress.score / (currentLesson?.maxScore || 100)) * 100;

        if (scorePercentage >= 80) {
            return 'Tuyệt vời! Bạn đã làm rất tốt!';
        } else if (scorePercentage >= 60) {
            return 'Khá tốt! Bạn đã hoàn thành bài học.';
        } else if (scorePercentage >= 40) {
            return 'Bạn đã hoàn thành bài học. Hãy tiếp tục cố gắng!';
        } else {
            return 'Bạn đã hoàn thành bài học. Có lẽ bạn nên ôn tập lại!';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#58CC02" />
                <Text style={styles.loadingText}>Đang tải kết quả...</Text>
            </View>
        );
    }

    if (submitError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorTitle}>Đã xảy ra lỗi</Text>
                    <Text style={styles.errorMessage}>{submitError}</Text>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={() => navigation.navigate('UserHome')}
                    >
                        <Text style={styles.continueButtonText}>Quay về trang chủ</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{renderScoreMessage()}</Text>
                </View>

                <View style={styles.resultCard}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>Điểm số của bạn</Text>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreValue}>{score}</Text>
                        </View>
                    </View>

                    {userProgress && (
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{userProgress.xp}</Text>
                                <Text style={styles.statLabel}>XP Tổng</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{userProgress.userLevel}</Text>
                                <Text style={styles.statLabel}>Cấp độ</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{userProgress.lives}</Text>
                                <Text style={styles.statLabel}>Mạng</Text>
                            </View>
                        </View>
                    )}
                </View>

                {questionResults && questionResults.length > 0 && (
                    <View style={styles.questionsContainer}>
                        <Text style={styles.questionsTitle}>Chi tiết câu trả lời</Text>
                        {questionResults.map((result, index) => (
                            <View key={index} style={styles.questionResult}>
                                <View style={styles.questionResultHeader}>
                                    <Text style={styles.questionNumber}>Câu {index + 1}</Text>
                                    <View
                                        style={[
                                            styles.resultBadge,
                                            result.isCorrect ? styles.correctBadge : styles.incorrectBadge
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.resultBadgeText,
                                                result.isCorrect ? styles.correctBadgeText : styles.incorrectBadgeText
                                            ]}
                                        >
                                            {result.isCorrect ? 'Đúng' : 'Sai'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.answerContainer}>
                                    <Text style={styles.answerLabel}>Câu trả lời của bạn:</Text>
                                    <Text style={styles.answerText}>{result.answer || '[Không có câu trả lời]'}</Text>
                                </View>
                                {result.feedback && (
                                    <View style={styles.feedbackContainer}>
                                        <Text style={styles.feedbackLabel}>Nhận xét của AI:</Text>
                                        <Text style={styles.feedbackText}>{result.feedback}</Text>
                                    </View>
                                )}
                                {result.transcription && (
                                    <View style={styles.transcriptionContainer}>
                                        <Text style={styles.transcriptionLabel}>Ghi âm:</Text>
                                        <Text style={styles.transcriptionText}>{result.transcription}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>Tiếp tục</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) : 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        color: '#4b4b4b',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 24,
    },
    errorTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 16,
    },
    errorMessage: {
        fontSize: 18,
        color: '#4b4b4b',
        textAlign: 'center',
        marginBottom: 32,
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        alignItems: 'center',
        marginVertical: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#58CC02',
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    resultCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 20,
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreLabel: {
        fontSize: 20,
        color: '#4b4b4b',
        marginBottom: 12,
    },
    scoreCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#58CC02',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: 'white',
    },
    scoreMax: {
        fontSize: 24,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 24,
        marginTop: 8,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 16,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#3B82F6',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 16,
        color: '#4b4b4b',
        textAlign: 'center',
    },
    questionsContainer: {
        marginBottom: 20,
    },
    questionsTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    questionResult: {
        backgroundColor: '#f9f9f9',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    questionResultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    questionNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    resultBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    correctBadge: {
        backgroundColor: '#E6F8E0',
    },
    incorrectBadge: {
        backgroundColor: '#FFEBEE',
    },
    resultBadgeText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    correctBadgeText: {
        color: '#58CC02',
    },
    incorrectBadgeText: {
        color: '#d32f2f',
    },
    answerContainer: {
        marginBottom: 16,
    },
    answerLabel: {
        fontSize: 16,
        color: '#4b4b4b',
        marginBottom: 8,
    },
    answerText: {
        fontSize: 18,
        color: '#333',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    feedbackContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F0F8FF',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    feedbackLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3B82F6',
        marginBottom: 8,
    },
    feedbackText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
    transcriptionContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
    },
    transcriptionLabel: {
        fontSize: 16,
        color: '#4b4b4b',
        marginBottom: 8,
    },
    transcriptionText: {
        fontSize: 18,
        color: '#333',
        fontStyle: 'italic',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    continueButton: {
        backgroundColor: '#58CC02',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 4,
        borderBottomColor: '#4BA502',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 8,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default LessonCompleteScreen; 