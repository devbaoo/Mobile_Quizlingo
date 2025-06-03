import { clearCurrentLesson, completeLesson } from '@/services/slices/lesson/lessonSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    SafeAreaView,
    ScrollView,
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
        questionResults: {
            questionId: string;
            answer: string;
            isCorrect: boolean;
            isTimeout: boolean;
        }[],
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

    const [submitting, setSubmitting] = useState(true);
    const [submitError, setSubmitError] = useState<string | null>(null);

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

    // Submit lesson results on component mount
    useEffect(() => {
        const submitLesson = async () => {
            try {
                await dispatch(completeLesson({
                    lessonId,
                    score,
                    isRetried,
                    questionResults
                })).unwrap();
                setSubmitting(false);
            } catch (error: any) {
                console.error('Failed to submit lesson:', error);
                setSubmitError(error?.message || 'Không thể hoàn thành bài học');
                setSubmitting(false);
            }
        };

        submitLesson();

        // Cleanup function to clear current lesson when navigating away
        return () => {
            dispatch(clearCurrentLesson());
        };
    }, [dispatch, lessonId, score, questionResults, isRetried]);

    const handleContinue = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'UserHome' }],
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

    if (submitting) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#58CC02" />
                <Text style={styles.loadingText}>Đang hoàn thành bài học...</Text>
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
                        onPress={handleContinue}
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
                            <Text style={styles.scoreValue}>{progress?.score || score}</Text>
                            <Text style={styles.scoreMax}>/{currentLesson?.maxScore || 100}</Text>
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

                {progress && progress.questionResults && (
                    <View style={styles.questionsContainer}>
                        <Text style={styles.questionsTitle}>Chi tiết câu trả lời</Text>
                        {progress.questionResults.map((result, index) => (
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
                                    <Text style={styles.answerText}>{result.answer}</Text>
                                </View>
                                {result.feedback && (
                                    <View style={styles.feedbackContainer}>
                                        <Text style={styles.feedbackLabel}>Phản hồi:</Text>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 16,
        color: '#4b4b4b',
        textAlign: 'center',
        marginBottom: 24,
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        alignItems: 'center',
        marginVertical: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#58CC02',
        textAlign: 'center',
    },
    resultCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 24,
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreLabel: {
        fontSize: 16,
        color: '#4b4b4b',
        marginBottom: 8,
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#58CC02',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    scoreMax: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    statLabel: {
        fontSize: 14,
        color: '#4b4b4b',
    },
    questionsContainer: {
        marginBottom: 24,
    },
    questionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    questionResult: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    questionResultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    resultBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    correctBadge: {
        backgroundColor: '#E6F8E0',
    },
    incorrectBadge: {
        backgroundColor: '#FFEBEE',
    },
    resultBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    correctBadgeText: {
        color: '#58CC02',
    },
    incorrectBadgeText: {
        color: '#d32f2f',
    },
    answerContainer: {
        marginBottom: 8,
    },
    answerLabel: {
        fontSize: 14,
        color: '#4b4b4b',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 16,
        color: '#333',
    },
    feedbackContainer: {
        marginTop: 8,
    },
    feedbackLabel: {
        fontSize: 14,
        color: '#4b4b4b',
        marginBottom: 4,
    },
    feedbackText: {
        fontSize: 16,
        color: '#333',
    },
    transcriptionContainer: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    transcriptionLabel: {
        fontSize: 14,
        color: '#4b4b4b',
        marginBottom: 4,
    },
    transcriptionText: {
        fontSize: 16,
        color: '#333',
        fontStyle: 'italic',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    continueButton: {
        backgroundColor: '#58CC02',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 4,
        borderBottomColor: '#4BA502',
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default LessonCompleteScreen; 