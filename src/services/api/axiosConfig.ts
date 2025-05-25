import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = "https://quizlingo-mb7fv.ondigitalocean.app/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Thêm token vào header nếu có
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý lỗi authentication
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Nếu token hết hạn hoặc không hợp lệ
    if (error.response?.status === 401) {
      // Xóa token và chuyển về màn login
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      // Người dùng sẽ được chuyển về màn login thông qua Redux state
    }
    return Promise.reject(error);
  }
);
