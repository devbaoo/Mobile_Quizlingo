import { axiosInstance } from "@/services/constants/axiosConfig";
import { ENDPOINTS } from "@/services/constants/endpoints";
import { LeaderboardEntry, LeaderboardResponse } from "@/types/user.types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";

interface LeaderboardState {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  entries: [],
  loading: false,
  error: null,
};

export const fetchLeaderboard = createAsyncThunk<
  LeaderboardResponse,
  void,
  { rejectValue: { message: string } }
>("leaderboard/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.LEADERBOARD.GET_ALL);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch leaderboard";
    return rejectWithValue({ message });
  }
});

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {
    clearLeaderboard: (state) => {
      state.entries = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.data;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch leaderboard";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      });
  },
});

export const { clearLeaderboard } = leaderboardSlice.actions;
export default leaderboardSlice.reducer; 