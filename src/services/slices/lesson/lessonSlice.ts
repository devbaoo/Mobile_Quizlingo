import { axiosInstance } from "@/services/constants/axiosConfig";
import { ENDPOINTS } from "@/services/constants/endpoints";
import {
  ILesson,
  ILessonResponse,
  LessonProgress,
  QuestionSubmission,
  UserProgress
} from "@/types/lesson.type";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";

interface LessonState {
  lessons: ILesson[];
  currentLesson: ILesson | null;
  loading: boolean;
  error: string | null;
  progress: LessonProgress | null;
  userProgress: UserProgress | null;
  status: string | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalTopics: number;
    totalPages: number;
  } | null;
}

const initialState: LessonState = {
  lessons: [],
  currentLesson: null,
  loading: false,
  error: null,
  progress: null,
  userProgress: null,
  status: null,
  pagination: null,
};

export const fetchLessons = createAsyncThunk<
  ILessonResponse,
  { page?: number; limit?: number },
  { rejectValue: { message: string } }
>(
  "lesson/fetchLessons",
  async ({ page = 1, limit = 3 }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `${ENDPOINTS.LESSON.GET_ALL}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch lessons";
      return rejectWithValue({ message });
    }
  }
);

export const fetchLessonById = createAsyncThunk<
  { lesson: ILesson },
  string,
  { rejectValue: { message: string } }
>("lesson/fetchLessonById", async (id, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.LESSON.GET_BY_ID(id));
    return response.data;
  } catch (err: any) {
    const message = err.response?.data?.message || "Failed to fetch lesson";
    return rejectWithValue({ message });
  }
});

export const completeLesson = createAsyncThunk<
  { progress: LessonProgress; user: UserProgress; status: string },
  {
    lessonId: string;
    score: number;
    questionResults: QuestionSubmission[];
    isRetried: boolean;
  },
  { rejectValue: { message: string } }
>("lesson/completeLesson", async (data, { rejectWithValue }) => {
  try {
    
    const response = await axiosInstance.post(
      ENDPOINTS.LESSON.COMPLETE,
      {
        lessonId: data.lessonId,
        score: data.score,
        isRetried: data.isRetried,
        questionResults: data.questionResults
      }
    );


    if (!response.data.success) {
      return rejectWithValue({ message: response.data.message });
    }

    return {
      progress: response.data.progress,
      user: response.data.user,
      status: response.data.status
    };
  } catch (err: any) {
    console.error('Complete lesson error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    const message = err.response?.data?.message || "Failed to complete lesson";
    if (message === "Bài học đã được hoàn thành trước đó") {
      Toast.show({
        type: "info",
        text1: "Bài học đã được hoàn thành trước đó",
      });
    }
    return rejectWithValue({ message });
  }
});

export const retryLesson = createAsyncThunk<
  void,
  { lessonId: string },
  { rejectValue: { message: string } }
>("lesson/retryLesson", async (data, { rejectWithValue }) => {
  try {
    await axiosInstance.post(ENDPOINTS.LESSON.RETRY, data);
  } catch (err: any) {
    const message = err.response?.data?.message || "Failed to retry lesson";
    return rejectWithValue({ message });
  }
});

const lessonSlice = createSlice({
  name: "lesson",
  initialState,
  reducers: {
    clearCurrentLesson: (state) => {
      state.currentLesson = null;
      state.progress = null;
      state.userProgress = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Lessons
      .addCase(fetchLessons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLessons.fulfilled, (state, action) => {
        state.loading = false;
        const allLessons = action.payload.topics.flatMap((topicWithLessons) => {
          return topicWithLessons.lessons;
        });
        state.lessons = allLessons;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchLessons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch lessons";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Fetch Lesson By Id
      .addCase(fetchLessonById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLessonById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLesson = action.payload.lesson;
        state.error = null;
      })
      .addCase(fetchLessonById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch lesson";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Complete Lesson
      .addCase(completeLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.progress = action.payload.progress;
        state.userProgress = action.payload.user;
        state.status = action.payload.status;
        state.error = null;
        Toast.show({
          type: "success",
          text1: "Lesson completed successfully",
        });
      })
      .addCase(completeLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to complete lesson";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Retry Lesson
      .addCase(retryLesson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(retryLesson.fulfilled, (state) => {
        state.loading = false;
        state.progress = null;
        state.error = null;
        Toast.show({
          type: "success",
          text1: "Lesson retry successful",
        });
      })
      .addCase(retryLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to retry lesson";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      });
  },
});

export const { clearCurrentLesson } = lessonSlice.actions;
export default lessonSlice.reducer;
