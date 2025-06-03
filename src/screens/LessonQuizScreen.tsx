import { completeLesson, fetchLessonById } from '@/services/slices/lesson/lessonSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { QuestionResult, QuestionResultWithScore, QuestionSubmission } from '@/types/lesson.type';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';

// Define navigation params
type RootStackParamList = {
    LessonQuiz: { lessonId: string };
    LessonComplete: {
        lessonId: string;
        score: number;
        questionResults: QuestionResultWithScore[];
        isRetried: boolean;
    };
    UserHome: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'LessonQuiz'>;

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 360; // For very small devices
const scale = (size: number) => (width / 375) * size; // Scale based on a 375px base width (common for mobile)

const LessonQuizScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch<AppDispatch>();
    const { lessonId } = route.params;
    const { currentLesson, loading } = useSelector((state: RootState) => state.lesson);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [textAnswer, setTextAnswer] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [questionResults, setQuestionResults] = useState<any[]>([]);
    const [remainingTime, setRemainingTime] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);

    // Prevent accidental back button press
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            Alert.alert(
                'Thoát bài học',
                'Bạn có chắc muốn thoát? Tiến độ bài học sẽ không được lưu.',
                [
                    { text: 'Hủy', style: 'cancel', onPress: () => {} },
                    { text: 'Thoát', style: 'destructive', onPress: () => navigation.navigate('UserHome') },
                ]
            );
            return true;
        });
        return () => backHandler.remove();
    }, [navigation]);

    // Fetch lesson data
    useEffect(() => {
        const loadLesson = async () => {
            try {
                await dispatch(fetchLessonById(lessonId)).unwrap();
                setIsInitialized(true);
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Không thể tải bài học',
                    text2: 'Vui lòng thử lại sau',
                });
                navigation.navigate('UserHome');
            }
        };
        loadLesson();
    }, [dispatch, lessonId, navigation]);

    // Set timer for each question - only after initialization
    useEffect(() => {
        if (!currentLesson || !isInitialized) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        const initialTime = currentQuestion.timeLimit || 30; // default 30s if not set
        setRemainingTime(initialTime);
    }, [currentLesson, currentQuestionIndex, isInitialized]);

    // Timer countdown for each question - only after initialization
    useEffect(() => {
        if (!isInitialized) return;

        const timer = setInterval(() => {
            setRemainingTime((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQuestionIndex, isInitialized]);

    // Watch for timeout
    useEffect(() => {
        if (!isInitialized || remainingTime > 0) return;
        if (questionResults.length === 0) return; // Nếu chưa làm câu nào thì không gọi handleTimeout
        handleTimeout();
    }, [remainingTime, isInitialized, questionResults.length]);

    // Handle timeout for a question
    const handleTimeout = async () => {
        if (!currentLesson || !isInitialized) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];

        const result: QuestionResult = {
            questionId: currentQuestion._id,
            answer: '[TIMEOUT]',
            isCorrect: false,
            isTimeout: true,
            score: 0,
        };

        const newResults = [...questionResults, result];
        setQuestionResults(newResults);

        if (currentQuestionIndex < currentLesson.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            try {
                const cleanResults: QuestionSubmission[] = newResults.map((r) => ({
                    questionId: r.questionId,
                    answer: r.answer || '[TIMEOUT]',
                    isCorrect: r.isCorrect,
                    isTimeout: r.isTimeout,
                }));

                const response = await dispatch(
                    completeLesson({
                        lessonId,
                        score: 0,
                        questionResults: cleanResults,
                        isRetried: false,
                    })
                ).unwrap();

                const apiResults = response.progress.questionResults as any[];
                const processedResults: QuestionResultWithScore[] = apiResults.map((r) => ({
                    questionId: r.questionId,
                    answer: r.answer,
                    isCorrect: r.isCorrect,
                    isTimeout: r.isTimeout,
                    score: r.score || 0,
                    feedback: r.feedback || null,
                    transcription: r.transcription || null,
                    _id: r._id || '',
                }));

                navigation.navigate('LessonComplete', {
                    lessonId,
                    score: response.progress.score,
                    questionResults: processedResults,
                    isRetried: false,
                });
            } catch (error: any) {
                Toast.show({
                    type: 'error',
                    text1: 'Không thể hoàn thành bài học',
                    text2: error?.message || 'Vui lòng thử lại',
                });
            }
        }
    };

    const handleNextQuestion = () => {
        if (!currentLesson || !isInitialized) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        let answer = '';

        if (remainingTime <= 0) {
            const result = {
                questionId: currentQuestion._id,
                answer: '[TIMEOUT]',
                isCorrect: false,
                isTimeout: true,
                score: 0,
            };
            const newResults = [...questionResults, result];
            setQuestionResults(newResults);
            moveToNextOrComplete(newResults);
            return;
        }

        switch (currentQuestion.type) {
            case 'multiple_choice': {
                answer = selectedAnswer;
                if (!answer) {
                    Toast.show({ type: 'warning', text1: 'Vui lòng chọn một đáp án' });
                    return;
                }
                break;
            }
            case 'text_input': {
                answer = textAnswer.trim();
                if (!answer) {
                    Toast.show({ type: 'warning', text1: 'Vui lòng nhập câu trả lời' });
                    return;
                }
                break;
            }
            case 'audio_input': {
                answer = textAnswer.trim();
                if (!answer) {
                    Toast.show({ type: 'warning', text1: 'Vui lòng nhập câu trả lời' });
                    return;
                }
                break;
            }
            default: {
                Toast.show({ type: 'error', text1: 'Loại câu hỏi không được hỗ trợ' });
                return;
            }
        }

        const isCorrect = answer === currentQuestion.correctAnswer;
        const questionScore = isCorrect ? currentQuestion.score : 0;

        const result = {
            questionId: currentQuestion._id,
            answer,
            isCorrect,
            isTimeout: false,
            score: questionScore,
        };

        const newResults = [...questionResults, result];
        setQuestionResults(newResults);
        moveToNextOrComplete(newResults);
    };

    const moveToNextOrComplete = async (newResults: QuestionResult[]) => {
        setTextAnswer('');
        setSelectedAnswer('');

        if (currentLesson && currentQuestionIndex < currentLesson.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            try {
                const totalScore = newResults.reduce((sum, result) => sum + (result.score || 0), 0);

                const cleanResults: QuestionSubmission[] = newResults.map((r) => ({
                    questionId: r.questionId,
                    answer: r.answer || '[TIMEOUT]',
                    isCorrect: r.isCorrect,
                    isTimeout: r.isTimeout,
                }));

                const response = await dispatch(
                    completeLesson({
                        lessonId,
                        score: totalScore,
                        questionResults: cleanResults,
                        isRetried: false,
                    })
                ).unwrap();

                const apiResults = response.progress.questionResults as any[];
                const processedResults: QuestionResultWithScore[] = apiResults.map((r) => ({
                    questionId: r.questionId,
                    answer: r.answer,
                    isCorrect: r.isCorrect,
                    isTimeout: r.isTimeout,
                    score: r.score || 0,
                    feedback: r.feedback || null,
                    transcription: r.transcription || null,
                    _id: r._id || '',
                }));

                navigation.navigate('LessonComplete', {
                    lessonId,
                    score: response.progress.score,
                    questionResults: processedResults,
                    isRetried: false,
                });
            } catch (error: any) {
                Toast.show({
                    type: 'error',
                    text1: 'Không thể hoàn thành bài học',
                    text2: error?.message || 'Vui lòng thử lại',
                });
            }
        }
    };

    const handleOptionSelect = (questionId: string, answer: string) => {
        setSelectedAnswer(answer);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading || !currentLesson || !isInitialized) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#58CC02" />
                <Text style={styles.loadingText}>Đang tải bài học...</Text>
            </View>
        );
    }

    const currentQuestion = currentLesson.questions[currentQuestionIndex];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with timer and progress */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        Alert.alert(
                            'Thoát bài học',
                            'Bạn có chắc muốn thoát? Tiến độ bài học sẽ không được lưu.',
                            [
                                { text: 'Hủy', style: 'cancel', onPress: () => {} },
                                { text: 'Thoát', style: 'destructive', onPress: () => navigation.navigate('UserHome') },
                            ]
                        );
                    }}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${((currentQuestionIndex + 1) / currentLesson.questions.length) * 100}%`,
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {currentQuestionIndex + 1}/{currentLesson.questions.length}
                    </Text>
                </View>

                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>⏱️ {formatTime(remainingTime)}</Text>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Question */}
                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>{currentQuestion.content}</Text>

                    {/* Type-specific answer UI */}
                    {currentQuestion.type === 'multiple_choice' && (
                        <View style={styles.optionsContainer}>
                            {currentQuestion.options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.optionButton,
                                        selectedAnswer === option && styles.optionSelected,
                                    ]}
                                    onPress={() => handleOptionSelect(currentQuestion._id, option)}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedAnswer === option && styles.optionTextSelected,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {currentQuestion.type === 'text_input' && (
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Nhập câu trả lời của bạn..."
                                value={textAnswer}
                                onChangeText={setTextAnswer}
                                multiline
                            />
                        </View>
                    )}

                    {currentQuestion.type === 'audio_input' && (
                        <View style={styles.audioInputContainer}>
                            <Text style={styles.audioInputText}>
                                🎤 Nhấn để ghi âm câu trả lời của bạn
                            </Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Nhập câu trả lời của bạn (tạm thời)..."
                                value={textAnswer}
                                onChangeText={setTextAnswer}
                                multiline
                            />
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNextQuestion}
                    disabled={!isInitialized}
                >
                    <Text style={styles.nextButtonText}>
                        {currentQuestionIndex < currentLesson.questions.length - 1 ? 'Tiếp tục' : 'Hoàn thành'}
                    </Text>
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
        padding: scale(16),
    },
    loadingText: {
        marginTop: scale(16),
        fontSize: scale(16),
        color: '#4b4b4b',
        textAlign: 'center',
    },
    header: {
        paddingTop: scale(8),  // giảm padding top xuống mức thấp hơn
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(12),
        paddingVertical: scale(6),  // giảm vertical để không cao
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },        
    backButton: {
        padding: scale(6),
        borderRadius: scale(8),
        backgroundColor: '#f5f5f5',
    },
    backButtonText: {
        fontSize: scale(20),
        color: '#4b4b4b',
        fontWeight: '600',
    },
    progressContainer: {
        flex: 1,
        marginHorizontal: scale(8),
    },
    progressBar: {
        height: scale(8),
        backgroundColor: '#f0f0f0',
        borderRadius: scale(4),
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#58CC02',
    },
    progressText: {
        textAlign: 'center',
        fontSize: scale(12),
        color: '#4b4b4b',
        marginTop: scale(4),
        fontWeight: '600',
    },
    timerContainer: {
        backgroundColor: '#FFF8E6',
        paddingHorizontal: scale(10),
        paddingVertical: scale(6),
        borderRadius: scale(12),
        borderWidth: 1,
        borderColor: '#FFE0B2',
        minWidth: scale(70),
        alignItems: 'center',
    },
    timerText: {
        fontSize: scale(14),
        color: '#FF9600',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: scale(12),
    },
    contentContainer: {
        paddingVertical: scale(8),
        flexGrow: 1,
    },
    questionContainer: {
        backgroundColor: '#fff',
        borderRadius: scale(12),
        padding: scale(12),
        marginBottom: scale(8),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        width: '100%',
    },
    questionText: {
        fontSize: scale(16),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: scale(10),
        lineHeight: scale(22),
        textAlign: 'left',
    },
    optionsContainer: {
        marginTop: scale(4),
        width: '100%',
    },
    optionButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: scale(10),
        padding: scale(12),
        marginBottom: scale(6),
        borderWidth: 2,
        borderColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        width: '100%',
    },
    optionSelected: {
        backgroundColor: '#E6F8E0',
        borderColor: '#58CC02',
    },
    optionText: {
        fontSize: scale(15),
        color: '#333',
        flex: 1,
        paddingRight: scale(8),
    },
    optionTextSelected: {
        fontWeight: 'bold',
        color: '#58CC02',
    },
    inputContainer: {
        marginTop: scale(8),
        width: '100%',
    },
    textInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: scale(10),
        borderWidth: 2,
        borderColor: '#e0e0e0',
        padding: scale(12),
        fontSize: scale(15),
        minHeight: scale(100),
        textAlignVertical: 'top',
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        width: '100%',
    },
    audioInputContainer: {
        marginTop: scale(8),
        alignItems: 'center',
        width: '100%',
    },
    audioInputText: {
        fontSize: scale(15),
        color: '#4b4b4b',
        marginBottom: scale(8),
        textAlign: 'center',
    },
    bottomContainer: {
        padding: scale(12),
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        width: '100%',
    },
    nextButton: {
        backgroundColor: '#58CC02',
        borderRadius: scale(12),
        padding: scale(14),
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 4,
        borderBottomColor: '#4BA502',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 8,
        width: '100%',
    },
    nextButtonText: {
        color: 'white',
        fontSize: scale(16),
        fontWeight: 'bold',
    },
});

export default LessonQuizScreen;