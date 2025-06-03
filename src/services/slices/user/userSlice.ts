import { axiosInstance } from "@/services/constants/axiosConfig";
import { ENDPOINTS } from "@/services/constants/endpoints";
import { UserProfile } from "@/types/user.types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  avatarUploading: boolean;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  password?: string;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  avatarUploading: false,
};

export const fetchUserProfile = createAsyncThunk<
  { user: UserProfile },
  void,
  { rejectValue: { message: string } }
>("user/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(ENDPOINTS.USER.GET_PROFILE);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch profile";
    return rejectWithValue({ message });
  }
});

export const uploadAvatar = createAsyncThunk<
  { user: UserProfile },
  FormData,
  { rejectValue: { message: string } }
>("user/uploadAvatar", async (formData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      ENDPOINTS.USER.UPDATE_AVATAR,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to upload avatar";
    return rejectWithValue({ message });
  }
});

export const updateProfile = createAsyncThunk<
  { user: UserProfile },
  UpdateProfileData,
  { rejectValue: { message: string } }
>("user/updateProfile", async (data, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(
      ENDPOINTS.USER.UPDATE_PROFILE,
      data
    );
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to update profile";
    return rejectWithValue({ message });
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.user;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch profile";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.avatarUploading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.avatarUploading = false;
        state.profile = action.payload.user;
        Toast.show({
          type: "success",
          text1: "Avatar updated successfully",
        });
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.avatarUploading = false;
        state.error = action.payload?.message || "Failed to upload avatar";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.user;
        Toast.show({
          type: "success",
          text1: "Profile updated successfully",
        });
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update profile";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      });
  },
});

export const { clearUserProfile } = userSlice.actions;
export default userSlice.reducer;
