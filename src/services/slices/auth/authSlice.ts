import { axiosInstance } from "@/services/constants/axiosConfig";
import { ENDPOINTS } from "@/services/constants/endpoints";
import { LoginResponse, User } from "@/types/user.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResendVerificationRequest {
  email: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: { message: string } }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    return response.data;
  } catch (err: any) {
    const message = err.response?.data?.message || "Đăng nhập thất bại";
    return rejectWithValue({ message });
  }
});

export const registerUser = createAsyncThunk<
  LoginResponse,
  RegisterCredentials,
  { rejectValue: { message: string } }
>("auth/registerUser", async (credentials, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      ENDPOINTS.AUTH.REGISTER,
      credentials
    );
    return response.data;
  } catch (err: any) {
    const message = err.response?.data?.message || "Đăng ký thất bại";
    return rejectWithValue({ message });
  }
});

export const forgotPassword = createAsyncThunk<
  { success: boolean; message: string },
  ForgotPasswordRequest,
  { rejectValue: { message: string } }
>("auth/forgotPassword", async (request, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      ENDPOINTS.AUTH.FORGOT_PASSWORD,
      request
    );
    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message || "Yêu cầu đặt lại mật khẩu thất bại";
    return rejectWithValue({ message });
  }
});

export const resetPassword = createAsyncThunk<
  { success: boolean; message: string },
  ResetPasswordRequest,
  { rejectValue: { message: string } }
>("auth/resetPassword", async (request, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      `${ENDPOINTS.AUTH.RESET_PASSWORD}/${request.token}`,
      { password: request.password }
    );
    return response.data;
  } catch (err: any) {
    const message = err.response?.data?.message || "Đặt lại mật khẩu thất bại";
    return rejectWithValue({ message });
  }
});

export const verifyEmail = createAsyncThunk<
  { success: boolean; message: string },
  string,
  { rejectValue: { message: string } }
>("auth/verifyEmail", async (token, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(
      `${ENDPOINTS.AUTH.VERIFY_EMAIL}/${token}`
    );
    return response.data;
  } catch (err: any) {
    const message = err.response?.data?.message || "Xác thực email thất bại";
    return rejectWithValue({ message });
  }
});

export const resendVerification = createAsyncThunk<
  { success: boolean; message: string },
  ResendVerificationRequest,
  { rejectValue: { message: string } }
>("auth/resendVerification", async (request, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      ENDPOINTS.AUTH.RESEND_VERIFICATION,
      request
    );
    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message || "Gửi lại email xác thực thất bại";
    return rejectWithValue({ message });
  }
});

export const changePassword = createAsyncThunk<
  { success: boolean; message: string },
  ChangePasswordRequest,
  { rejectValue: { message: string } }
>("auth/changePassword", async (request, { rejectWithValue }) => {
  try {
    if (request.newPassword !== request.confirmPassword) {
      return rejectWithValue({
        message: "Mật khẩu mới và xác nhận mật khẩu không khớp",
      });
    }
    const response = await axiosInstance.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      oldPassword: request.oldPassword,
      newPassword: request.newPassword,
    });
    return response.data;
  } catch (err: any) {
    const message = err.response?.data?.message || "Đổi mật khẩu thất bại";
    return rejectWithValue({ message });
  }
});

export const refreshToken = createAsyncThunk<
  { accessToken: string; refreshToken: string },
  string,
  { rejectValue: { message: string } }
>("auth/refreshToken", async (refreshToken, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refreshToken,
    });
    return response.data;
  } catch (err: any) {
    const message = err.response?.data?.message || "Làm mới token thất bại";
    return rejectWithValue({ message });
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      AsyncStorage.removeItem("token");
      AsyncStorage.removeItem("refreshToken");
    },
    setAvatar: (state, action) => {
      if (state.user) {
        state.user.avatar = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        AsyncStorage.setItem("token", action.payload.accessToken);
        AsyncStorage.setItem("refreshToken", action.payload.refreshToken);

        Toast.show({
          type: "success",
          text1: action.payload.message,
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message || "Đăng nhập thất bại";

        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        Toast.show({
          type: "success",
          text1: action.payload.message || "Đăng ký thành công",
        });
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message || "Đăng ký thất bại";

        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Forgot password cases
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (action.payload.success) {
          Toast.show({
            type: "success",
            text1:
              action.payload.message || "Email đặt lại mật khẩu đã được gửi",
          });
        } else {
          Toast.show({
            type: "error",
            text1:
              action.payload.message || "Yêu cầu đặt lại mật khẩu thất bại",
          });
        }
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Yêu cầu đặt lại mật khẩu thất bại";

        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        if (action.payload.success) {
          Toast.show({
            type: "success",
            text1:
              action.payload.message || "Mật khẩu đã được đặt lại thành công",
          });
        } else {
          Toast.show({
            type: "error",
            text1: action.payload.message || "Đặt lại mật khẩu thất bại",
          });
        }
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Đặt lại mật khẩu thất bại";

        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Verify email cases
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
        if (state.user) {
          state.user.isVerify = true;
        }
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Xác thực email thất bại";
      })
      // Resend verification cases
      .addCase(resendVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendVerification.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resendVerification.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Gửi lại email xác thực thất bại";
      })
      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        Toast.show({
          type: "success",
          text1: action.payload.message || "Đổi mật khẩu thành công",
        });
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Đổi mật khẩu thất bại";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      })
      // Refresh token cases
      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        AsyncStorage.setItem("token", action.payload.accessToken);
        AsyncStorage.setItem("refreshToken", action.payload.refreshToken);
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Làm mới token thất bại";
        Toast.show({
          type: "error",
          text1: state.error,
        });
      });
  },
});

export const { logout, setAvatar } = authSlice.actions;
export default authSlice.reducer;
