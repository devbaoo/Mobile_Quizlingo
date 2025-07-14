import { completeLesson, fetchLessonById } from '@/services/slices/lesson/lessonSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import { IQuestion, QuestionResult, QuestionResultWithScore, QuestionSubmission } from '@/types/lesson.type';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
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

interface AudioRecording {
    questionId: string;
    uri: string;
    duration: number;
}

interface ShuffledQuestion extends Omit<IQuestion, 'options'> {
    options: string[];
    originalCorrectAnswer?: string;
}

const LessonQuizScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useDispatch<AppDispatch>();
    const { lessonId } = route.params;
    const { currentLesson, loading } = useSelector((state: RootState) => state.lesson);

    // Reset currentQuestionIndex to 0 when component mounts
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [textAnswer, setTextAnswer] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [questionResults, setQuestionResults] = useState<any[]>([]);
    const [remainingTime, setRemainingTime] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioRecordings, setAudioRecordings] = useState<AudioRecording[]>([]);
    const recordingTimeRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);
    const [isCanceling, setIsCanceling] = useState(false);
    const [questionAudio, setQuestionAudio] = useState<Audio.Sound | null>(null);
    const [isQuestionAudioPlaying, setIsQuestionAudioPlaying] = useState(false);

    // Add effect to ensure currentQuestionIndex is 0 when lesson loads
    useEffect(() => {
        if (currentLesson) {
            console.log('Lesson loaded, resetting question index');
            setCurrentQuestionIndex(0);
            setQuestionResults([]);
            setSelectedAnswer('');
            setTextAnswer('');
        }
    }, [currentLesson]);

    // Add logging to track currentQuestionIndex changes
    useEffect(() => {
        console.log('Current question index changed:', currentQuestionIndex);
    }, [currentQuestionIndex]);

    // Prevent accidental back button press
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            Alert.alert(
                'Thoát bài học',
                'Bạn có chắc muốn thoát? Tiến độ bài học sẽ không được lưu.',
                [
                    { text: 'Hủy', style: 'cancel', onPress: () => { } },
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

    // Watch for timeout
    useEffect(() => {
        if (!isInitialized || remainingTime > 0) return;
        handleTimeout();
    }, [remainingTime, isInitialized]);

    // Handle timeout for a question
    const handleTimeout = async () => {
        if (!currentLesson) return;
        const currentQuestion = shuffledQuestions[currentQuestionIndex];

        const result: QuestionResult = {
            questionId: currentQuestion._id,
            answer: '[TIMEOUT]',
            isCorrect: false,
            isTimeout: true,
            score: 0,
        };

        const newResults = [...questionResults, result];
        setQuestionResults(newResults);

        // Reset states for next question
        setSelectedAnswer('');
        setTextAnswer('');
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
        }
        setIsPlaying(false);

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

    // Initialize shuffled questions when lesson loads
    useEffect(() => {
        if (currentLesson) {
            console.log('Initializing lesson:', {
                lessonId: currentLesson._id,
                questionCount: currentLesson.questions.length
            });

            const shuffled = shuffleQuestionsAndOptions(currentLesson.questions);
            console.log('Shuffled questions:', shuffled.map(q => ({
                id: q._id,
                type: q.type,
                content: q.content.substring(0, 50)
            })));

            // Batch all state updates together
            const initialState = {
                questions: shuffled,
                questionIndex: 0,
                results: [],
                answer: '',
                textInput: '',
                initialized: true,
                time: shuffled[0]?.timeLimit || 30
            };

            // Update all states at once
            setShuffledQuestions(initialState.questions);
            setCurrentQuestionIndex(initialState.questionIndex);
            setQuestionResults(initialState.results);
            setSelectedAnswer(initialState.answer);
            setTextAnswer(initialState.textInput);
            setRemainingTime(initialState.time);
            setIsInitialized(initialState.initialized);

            console.log('Initial state set:', {
                questionIndex: initialState.questionIndex,
                questionCount: initialState.questions.length,
                firstQuestionId: initialState.questions[0]?._id
            });
        }
    }, [currentLesson]);

    // Set timer for each question - only after initialization
    useEffect(() => {
        if (!currentLesson || !isInitialized || !shuffledQuestions.length) return;

        const currentQuestion = shuffledQuestions[currentQuestionIndex];
        console.log('Setting timer for question:', {
            index: currentQuestionIndex,
            questionId: currentQuestion._id
        });

        const initialTime = currentQuestion.timeLimit || 30;
        setRemainingTime(initialTime);

        // Cleanup any existing recording when moving to a new question
        if (recording) {
            recording.stopAndUnloadAsync();
            setRecording(null);
            setIsRecording(false);
            setRecordingTime(0);
        }
        if (recordingTimeRef.current) {
            clearInterval(recordingTimeRef.current);
        }
    }, [currentLesson, currentQuestionIndex, isInitialized, shuffledQuestions]);

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

    // Cleanup function for audio resources
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
            if (recording) {
                recording.stopAndUnloadAsync();
            }
            if (recordingTimeRef.current) {
                clearInterval(recordingTimeRef.current);
            }
            if (questionAudio) {
                questionAudio.unloadAsync();
            }
            // Cleanup all stored recordings
            audioRecordings.forEach(async (rec) => {
                try {
                    await FileSystem.deleteAsync(rec.uri, { idempotent: true });
                } catch (error) {
                    console.error('Error cleaning up recording:', error);
                }
            });
        };
    }, [sound, recording, questionAudio, audioRecordings]);

    // Request audio permissions
    const requestAudioPermission = async () => {
        try {
            const { granted } = await Audio.requestPermissionsAsync();
            if (!granted) {
                Toast.show({
                    type: 'error',
                    text1: 'Không thể truy cập microphone',
                    text2: 'Vui lòng cấp quyền để ghi âm',
                });
                return false;
            }
            return true;
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi khi yêu cầu quyền',
                text2: 'Vui lòng thử lại',
            });
            return false;
        }
    };

    // Function to shuffle array
    const shuffleArray = <T,>(array: T[]): T[] => {
        console.log('Shuffling array of length:', array.length);
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    // Function to shuffle questions and their options
    const shuffleQuestionsAndOptions = (questions: IQuestion[]): ShuffledQuestion[] => {
        console.log('Processing questions for shuffle:', questions.length);
        return questions.map(question => {
            if (question.type === 'multiple_choice') {
                const shuffledOptions = shuffleArray(question.options);
                return {
                    ...question,
                    options: shuffledOptions,
                    originalCorrectAnswer: question.correctAnswer || ''
                };
            }
            return {
                ...question,
                options: question.options,
            };
        });
    };

    // Start recording function
    const startRecording = async () => {
        try {
            const hasPermission = await requestAudioPermission();
            if (!hasPermission) return;

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setRecordingTime(0);
            setIsRecording(true);
            setIsCanceling(false);

            recordingTimeRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Không thể bắt đầu ghi âm',
                text2: 'Vui lòng thử lại',
            });
        }
    };

    // Stop recording function
    const stopRecording = async () => {
        try {
            if (!recording || !currentLesson) return;

            await recording.stopAndUnloadAsync();
            if (recordingTimeRef.current) {
                clearInterval(recordingTimeRef.current);
            }

            if (!isCanceling) {
                const uri = recording.getURI();
                if (!uri) {
                    Toast.show({
                        type: 'error',
                        text1: 'Không thể lưu file ghi âm',
                        text2: 'Vui lòng thử lại',
                    });
                    return;
                }

                // Create a permanent copy of the recording in app's cache directory
                const fileName = `recording_${Date.now()}.m4a`;
                const permanentUri = FileSystem.cacheDirectory + fileName;
                await FileSystem.copyAsync({
                    from: uri,
                    to: permanentUri
                });

                // Ensure the file exists and is readable
                const fileInfo = await FileSystem.getInfoAsync(permanentUri);
                if (!fileInfo.exists) {
                    Toast.show({
                        type: 'error',
                        text1: 'Không thể lưu file ghi âm',
                        text2: 'Vui lòng thử lại',
                    });
                    return;
                }

                const currentQuestion = shuffledQuestions[currentQuestionIndex];
                const newRecording: AudioRecording = {
                    questionId: currentQuestion._id,
                    uri: permanentUri,
                    duration: recordingTime,
                };

                setAudioRecordings((prev) => {
                    // Remove old recording file if exists
                    const oldRecording = prev.find(r => r.questionId === currentQuestion._id);
                    if (oldRecording) {
                        FileSystem.deleteAsync(oldRecording.uri, { idempotent: true })
                            .catch(err => console.error('Error deleting old recording:', err));
                    }
                    const filtered = prev.filter(r => r.questionId !== currentQuestion._id);
                    return [...filtered, newRecording];
                });

                const { sound: newSound } = await Audio.Sound.createAsync({ uri: permanentUri });
                setSound(newSound);
            }

            setRecording(null);
            setIsRecording(false);
            setIsCanceling(false);
        } catch (error) {
            console.error('Stop recording error:', error);
            Toast.show({
                type: 'error',
                text1: 'Không thể dừng ghi âm',
                text2: 'Vui lòng thử lại',
            });
        }
    };

    // Cancel recording
    const cancelRecording = async () => {
        if (!recording) return;
        setIsCanceling(true);
        await recording.stopAndUnloadAsync();
        if (recordingTimeRef.current) {
            clearInterval(recordingTimeRef.current);
        }
        setRecording(null);
        setIsRecording(false);
        setRecordingTime(0);
    };

    // Play recorded audio
    const playRecordedAudio = async () => {
        try {
            if (!sound) {
                const currentQuestion = shuffledQuestions[currentQuestionIndex];
                const recording = audioRecordings.find(r => r.questionId === currentQuestion._id);
                if (!recording) return;

                const { sound: newSound } = await Audio.Sound.createAsync({ uri: recording.uri });
                setSound(newSound);
                await newSound.playAsync();
                setIsPlaying(true);

                newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                    if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
                        setIsPlaying(false);
                    }
                });
            } else {
                if (isPlaying) {
                    await sound.stopAsync();
                    setIsPlaying(false);
                } else {
                    await sound.replayAsync();
                    setIsPlaying(true);
                }
            }
        } catch (error) {
            console.error('Playback error:', error);
            Toast.show({
                type: 'error',
                text1: 'Không thể phát audio',
                text2: 'Vui lòng thử lại',
            });
        }
    };

    // Format time function
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle next question with audio recordings
    const handleNextQuestion = async () => {
        if (!currentLesson) return;
        const currentQuestion = shuffledQuestions[currentQuestionIndex];
        let answer = '';

        if (remainingTime <= 0) {
            return handleTimeout();
        }

        if (currentQuestion.type === 'multiple_choice') {
            if (!selectedAnswer) {
                Toast.show({ type: 'error', text1: 'Vui lòng chọn đáp án' });
                return;
            }
            answer = selectedAnswer;
        } else if (currentQuestion.type === 'text_input') {
            if (!textAnswer.trim()) {
                Toast.show({ type: 'error', text1: 'Vui lòng nhập câu trả lời' });
                return;
            }
            answer = textAnswer.trim();
        } else if (currentQuestion.type === 'audio_input') {
            const recording = audioRecordings.find(r => r.questionId === currentQuestion._id);
            if (!recording) {
                Toast.show({ type: 'error', text1: 'Vui lòng ghi âm câu trả lời' });
                return;
            }

            try {
                // Check if file exists before trying to read it
                const fileInfo = await FileSystem.getInfoAsync(recording.uri);
                if (!fileInfo.exists) {
                    Toast.show({
                        type: 'error',
                        text1: 'Không tìm thấy file ghi âm',
                        text2: 'Vui lòng ghi âm lại',
                    });
                    return;
                }

                // Try to read the file
                answer = await FileSystem.readAsStringAsync(recording.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                if (!answer) {
                    Toast.show({
                        type: 'error',
                        text1: 'File ghi âm trống',
                        text2: 'Vui lòng ghi âm lại',
                    });
                    return;
                }
            } catch (error) {
                console.error('Audio processing error:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Không thể xử lý file ghi âm',
                    text2: 'Vui lòng ghi âm lại',
                });
                return;
            }
        }

        const result: QuestionResult = {
            questionId: currentQuestion._id,
            answer,
            isCorrect: false,
            isTimeout: false,
            score: 0,
        };

        const newResults = [...questionResults, result];
        setQuestionResults(newResults);
        setSelectedAnswer('');
        setTextAnswer('');

        // Cleanup current audio if moving to next question
        if (sound) {
            await sound.unloadAsync();
            setSound(null);
        }
        setIsPlaying(false);

        if (currentQuestionIndex < shuffledQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            await submitLesson(newResults);
        }
    };

    // Submit lesson function
    const submitLesson = async (results: QuestionResult[]) => {
        try {
            const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);

            const cleanResults: QuestionSubmission[] = results.map((r) => ({
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
    };

    const handleOptionSelect = (questionId: string, answer: string) => {
        setSelectedAnswer(answer);
    };

    // Cleanup question audio when unmounting or changing question
    useEffect(() => {
        return () => {
            if (questionAudio) {
                questionAudio.unloadAsync();
            }
        };
    }, [currentQuestionIndex]);

    // Function to play question audio
    const playQuestionAudio = async () => {
        try {
            const currentQuestion = shuffledQuestions[currentQuestionIndex];
            if (!currentQuestion.audioContent) {
                Toast.show({
                    type: 'error',
                    text1: 'Không có audio cho câu hỏi này',
                });
                return;
            }

            if (questionAudio) {
                if (isQuestionAudioPlaying) {
                    await questionAudio.stopAsync();
                    setIsQuestionAudioPlaying(false);
                } else {
                    await questionAudio.replayAsync();
                    setIsQuestionAudioPlaying(true);
                }
            } else {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: currentQuestion.audioContent },
                    { shouldPlay: true }
                );
                setQuestionAudio(sound);
                setIsQuestionAudioPlaying(true);

                sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                    if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
                        setIsQuestionAudioPlaying(false);
                    }
                });
            }
        } catch (error) {
            console.error('Error playing question audio:', error);
            Toast.show({
                type: 'error',
                text1: 'Không thể phát audio',
                text2: 'Vui lòng thử lại',
            });
        }
    };

    // Helper function to determine if a question is a listening type
    const isListeningQuestion = (question: IQuestion): boolean => {
        // Check if the question has audioContent
        if (question.audioContent) {
            return true;
        }

        // If skill is a string (ID), we can't determine the type directly
        // If skill is an object, check its name
        if (typeof question.skill === 'object' && question.skill?.name === 'Listening') {
            return true;
        }

        return false;
    };

    if (loading || !currentLesson || !isInitialized) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#58CC02" />
                <Text style={styles.loadingText}>Đang tải bài học...</Text>
            </View>
        );
    }

    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        Alert.alert(
                            'Thoát bài học',
                            'Bạn có chắc muốn thoát? Tiến độ bài học sẽ không được lưu.',
                            [
                                { text: 'Hủy', style: 'cancel', onPress: () => { } },
                                { text: 'Thoát', style: 'destructive', onPress: () => navigation.navigate('UserHome') },
                            ]
                        );
                    }}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                </View>

                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>⏱️ {formatTime(remainingTime)}</Text>
                </View>
            </View>

            {/* Số câu hỏi ở trên box câu hỏi */}
            <View style={styles.questionIndexBox}>
                <Text style={styles.questionIndexText}>{currentQuestionIndex + 1}/{shuffledQuestions.length}</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.questionContainer}>
                    <View style={styles.questionHeader}>
                        {isListeningQuestion(currentQuestion) ? (
                            <View style={styles.listeningContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.audioButton,
                                        isQuestionAudioPlaying && styles.audioButtonPlaying
                                    ]}
                                    onPress={playQuestionAudio}
                                >
                                    <Text style={styles.audioButtonText}>
                                        {isQuestionAudioPlaying ? '⏹️' : '🎧'}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.listeningText}>
                                    Nghe và chọn câu trả lời đúng
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.questionText}>{currentQuestion.content}</Text>
                        )}
                    </View>

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
                            {!isRecording && !audioRecordings.find(r => r.questionId === currentQuestion._id) && (
                                <TouchableOpacity
                                    style={styles.recordButton}
                                    onPress={startRecording}
                                >
                                    <Text style={styles.recordButtonText}>🎤 Bắt đầu ghi âm</Text>
                                </TouchableOpacity>
                            )}

                            {isRecording && (
                                <View style={styles.recordingContainer}>
                                    <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
                                    <View style={styles.recordingControls}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={cancelRecording}
                                        >
                                            <Text style={styles.cancelButtonText}>✕ Hủy</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.stopButton}
                                            onPress={stopRecording}
                                        >
                                            <Text style={styles.stopButtonText}>⬛ Dừng</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {!isRecording && audioRecordings.find(r => r.questionId === currentQuestion._id) && (
                                <View style={styles.playbackContainer}>
                                    <TouchableOpacity
                                        style={styles.playButton}
                                        onPress={playRecordedAudio}
                                    >
                                        <Text style={styles.playButtonText}>
                                            {isPlaying ? '⏹️ Dừng' : '▶️ Phát'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.reRecordButton}
                                        onPress={() => {
                                            if (sound) {
                                                sound.unloadAsync();
                                            }
                                            setSound(null);
                                            setAudioRecordings(prev =>
                                                prev.filter(r => r.questionId !== currentQuestion._id)
                                            );
                                            setRecordingTime(0);
                                        }}
                                    >
                                        <Text style={styles.reRecordButtonText}>🔄 Ghi âm lại</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        (!selectedAnswer && currentQuestion.type === 'multiple_choice') ||
                            (!textAnswer.trim() && currentQuestion.type === 'text_input') ||
                            (!audioRecordings.find(r => r.questionId === currentQuestion._id) &&
                                currentQuestion.type === 'audio_input')
                            ? styles.nextButtonDisabled
                            : null,
                    ]}
                    onPress={handleNextQuestion}
                    disabled={
                        (!selectedAnswer && currentQuestion.type === 'multiple_choice') ||
                        (!textAnswer.trim() && currentQuestion.type === 'text_input') ||
                        (!audioRecordings.find(r => r.questionId === currentQuestion._id) &&
                            currentQuestion.type === 'audio_input')
                    }
                >
                    <Text style={styles.nextButtonText}>
                        {currentQuestionIndex === shuffledQuestions.length - 1 ? 'Hoàn thành' : 'Tiếp tục'}
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
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: scale(16),
        fontSize: scale(16),
        color: '#4b4b4b',
    },
    header: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 36) : 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(12),
        paddingVertical: scale(8),
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: scale(2), // giảm padding
        borderRadius: scale(6), // giảm borderRadius
        backgroundColor: '#f5f5f5',
    },
    backButtonText: {
        fontSize: scale(16), // giảm fontSize
        color: '#4b4b4b',
    },
    progressContainer: {
        flex: 1,
        marginHorizontal: scale(12),
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
    },
    timerContainer: {
        backgroundColor: '#FFF8E6',
        paddingHorizontal: scale(12),
        paddingVertical: scale(6),
        borderRadius: scale(12),
    },
    timerText: {
        fontSize: scale(14),
        color: '#FF9600',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: scale(16),
    },
    questionContainer: {
        backgroundColor: '#fff',
        borderRadius: scale(16),
        padding: scale(16),
        paddingTop: scale(40),
        marginBottom: scale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    questionText: {
        flex: 1,
        fontSize: scale(18),
        color: '#333',
        fontWeight: 'bold',
        marginRight: 12,
    },
    listeningContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: scale(20),
    },
    audioButton: {
        backgroundColor: '#1CB0F6',
        width: scale(60),
        height: scale(60),
        borderRadius: scale(30),
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 4,
        borderBottomColor: '#0091D4',
        marginBottom: scale(12),
    },
    audioButtonPlaying: {
        backgroundColor: '#FF3B30',
        borderBottomColor: '#D63125',
    },
    audioButtonText: {
        fontSize: scale(24),
        color: '#fff',
    },
    listeningText: {
        fontSize: scale(16),
        color: '#666',
        textAlign: 'center',
        marginTop: scale(8),
    },
    optionsContainer: {
        gap: scale(8),
    },
    optionButton: {
        backgroundColor: '#f5f5f5',
        padding: scale(16),
        borderRadius: scale(12),
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    optionSelected: {
        backgroundColor: '#E6F8E0',
        borderColor: '#58CC02',
    },
    optionText: {
        fontSize: scale(16),
        color: '#333',
    },
    optionTextSelected: {
        color: '#58CC02',
        fontWeight: 'bold',
    },
    inputContainer: {
        marginTop: scale(8),
    },
    textInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: scale(12),
        padding: scale(16),
        fontSize: scale(16),
        minHeight: scale(120),
        textAlignVertical: 'top',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    audioInputContainer: {
        alignItems: 'center',
        marginTop: scale(16),
    },
    recordButton: {
        backgroundColor: '#58CC02',
        paddingVertical: scale(16),
        paddingHorizontal: scale(32),
        borderRadius: scale(24),
        borderBottomWidth: 4,
        borderBottomColor: '#4BA502',
    },
    recordButtonText: {
        color: 'white',
        fontSize: scale(18),
        fontWeight: 'bold',
    },
    recordingContainer: {
        alignItems: 'center',
    },
    recordingTime: {
        fontSize: scale(24),
        fontWeight: 'bold',
        color: '#FF3B30',
        marginBottom: scale(16),
    },
    recordingControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: scale(12),
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: scale(12),
        paddingHorizontal: scale(24),
        borderRadius: scale(20),
        borderBottomWidth: 4,
        borderBottomColor: '#D63125',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: scale(16),
        fontWeight: 'bold',
    },
    stopButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: scale(12),
        paddingHorizontal: scale(24),
        borderRadius: scale(20),
        borderBottomWidth: 4,
        borderBottomColor: '#2563EB',
    },
    stopButtonText: {
        color: 'white',
        fontSize: scale(16),
        fontWeight: 'bold',
    },
    playbackContainer: {
        alignItems: 'center',
        gap: scale(12),
    },
    playButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: scale(12),
        paddingHorizontal: scale(24),
        borderRadius: scale(20),
        borderBottomWidth: 4,
        borderBottomColor: '#2563EB',
    },
    playButtonText: {
        color: 'white',
        fontSize: scale(16),
        fontWeight: 'bold',
    },
    reRecordButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: scale(12),
        paddingHorizontal: scale(24),
        borderRadius: scale(20),
        borderBottomWidth: 4,
        borderBottomColor: '#2563EB',
    },
    reRecordButtonText: {
        color: 'white',
        fontSize: scale(16),
        fontWeight: 'bold',
    },
    bottomContainer: {
        padding: scale(16),
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    nextButton: {
        backgroundColor: '#58CC02',
        padding: scale(16),
        borderRadius: scale(12),
        alignItems: 'center',
        borderBottomWidth: 4,
        borderBottomColor: '#4BA502',
    },
    nextButtonDisabled: {
        backgroundColor: '#cccccc',
        borderBottomColor: '#999999',
    },
    nextButtonText: {
        color: 'white',
        fontSize: scale(18),
        fontWeight: 'bold',
    },
    // Thêm style cho số câu hỏi
    questionIndexBox: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 4,
    },
    questionIndexText: {
        fontSize: scale(15),
        color: '#888',
        fontWeight: 'bold',
    },
});

export default LessonQuizScreen;