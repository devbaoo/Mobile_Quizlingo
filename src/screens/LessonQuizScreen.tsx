import { fetchLessonById } from '@/services/slices/lesson/lessonSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
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
type RouteProps = RouteProp<RootStackParamList, 'LessonQuiz'>;

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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Prevent accidental back button press
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            Alert.alert(
                'Thoát bài học',
                'Bạn có chắc muốn thoát? Tiến độ bài học sẽ không được lưu.',
                [
                    { text: 'Hủy', style: 'cancel', onPress: () => { } },
                    { text: 'Thoát', style: 'destructive', onPress: () => navigation.navigate('UserHome') }
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
            } catch (error) {
                console.error('Failed to load lesson:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Không thể tải bài học',
                    text2: 'Vui lòng thử lại sau'
                });
                navigation.navigate('UserHome');
            }
        };
        loadLesson();
    }, [dispatch, lessonId, navigation]);

    // Set timer for each question
    useEffect(() => {
        if (!currentLesson) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        setRemainingTime(currentQuestion.timeLimit || 30); // default 30s if not set
    }, [currentLesson, currentQuestionIndex]);

    // Timer countdown for each question
    useEffect(() => {
        if (!currentLesson) return;
        if (remainingTime <= 0) {
            handleTimeout();
            return;
        }
        const timerId = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerId);
    }, [remainingTime, currentLesson, currentQuestionIndex]);

    // Handle timeout for a question
    const handleTimeout = () => {
        if (!currentLesson) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        const result = {
            questionId: currentQuestion._id,
            answer: '',
            isCorrect: false,
            isTimeout: true
        };
        setQuestionResults(prev => [...prev, result]);
        setTextAnswer('');
        setSelectedAnswer('');
        if (currentQuestionIndex < currentLesson.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmitLesson([...questionResults, result]);
        }
    };

    const handleNextQuestion = () => {
        if (!currentLesson) return;
        const currentQuestion = currentLesson.questions[currentQuestionIndex];
        let answer = '';
        if (currentQuestion.type === 'multiple_choice') {
            answer = selectedAnswer;
            if (!answer) {
                Toast.show({
                    type: 'warning',
                    text1: 'Vui lòng chọn một đáp án'
                });
                return;
            }
        } else {
            answer = textAnswer;
            if (!answer.trim()) {
                Toast.show({
                    type: 'warning',
                    text1: 'Vui lòng nhập câu trả lời'
                });
                return;
            }
        }
        const result = {
            questionId: currentQuestion._id,
            answer,
            isCorrect: false,
            isTimeout: false
        };
        setTextAnswer('');
        setSelectedAnswer('');
        if (currentQuestionIndex < currentLesson.questions.length - 1) {
            setQuestionResults(prev => [...prev, result]);
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmitLesson([...questionResults, result]);
        }
    };

    const handleOptionSelect = (questionId: string, answer: string) => {
        setSelectedAnswer(answer);
    };

    const handleSubmitLesson = (results: any[]) => {
        if (!currentLesson || isSubmitting) return;
        setIsSubmitting(true);
        // Đảm bảo số lượng câu trả lời đúng bằng số câu hỏi
        if (results.length !== currentLesson.questions.length) {
            Toast.show({
                type: 'error',
                text1: 'Số lượng câu trả lời không khớp số câu hỏi!'
            });
            setIsSubmitting(false);
            return;
        }
        // Dọn sạch kết quả, chỉ giữ đúng 4 trường
        const cleanResults = results.map(q => ({
            questionId: q.questionId,
            answer: q.answer,
            isCorrect: false,
            isTimeout: !!q.isTimeout
        }));
        navigation.navigate('LessonComplete', {
            lessonId,
            score: 0,
            questionResults: cleanResults,
            isRetried: false
        });
        setIsSubmitting(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading || !currentLesson) {
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
                                { text: 'Hủy', style: 'cancel', onPress: () => { } },
                                { text: 'Thoát', style: 'destructive', onPress: () => navigation.navigate('UserHome') }
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
                                    width: `${((currentQuestionIndex + 1) / currentLesson.questions.length) * 100}%`
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {currentQuestionIndex + 1}/{currentLesson.questions.length}
                    </Text>
                </View>

                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>
                        ⏱️ {formatTime(remainingTime)}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.content}>
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
                                        selectedAnswer === option && styles.optionSelected
                                    ]}
                                    onPress={() => handleOptionSelect(currentQuestion._id, option)}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedAnswer === option && styles.optionTextSelected
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
                            {/* Audio recording UI would go here */}
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
                    disabled={isSubmitting}
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
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#4b4b4b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 24,
        color: '#4b4b4b',
    },
    progressContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#58CC02',
    },
    progressText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#4b4b4b',
        marginTop: 4,
    },
    timerContainer: {
        backgroundColor: '#FFF8E6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    timerText: {
        fontSize: 14,
        color: '#FF9600',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    questionContainer: {
        marginBottom: 24,
    },
    questionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    optionsContainer: {
        marginTop: 8,
    },
    optionButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    optionSelected: {
        backgroundColor: '#E6F8E0',
        borderColor: '#58CC02',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    optionTextSelected: {
        fontWeight: 'bold',
        color: '#58CC02',
    },
    inputContainer: {
        marginTop: 16,
    },
    textInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        padding: 16,
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    audioInputContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    audioInputText: {
        fontSize: 16,
        color: '#4b4b4b',
        marginBottom: 16,
    },
    bottomContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    nextButton: {
        backgroundColor: '#58CC02',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 4,
        borderBottomColor: '#4BA502',
    },
    nextButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default LessonQuizScreen; 