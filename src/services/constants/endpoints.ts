export const API_URL = "https://quizlingo-mb7fv.ondigitalocean.app/api";

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_EMAIL: "/auth/verify-email",
    CHANGE_PASSWORD: "/auth/change-password",
    REFRESH_TOKEN: "/auth/refresh-token",
    RESEND_VERIFICATION: "/auth/resend-verification",
  },
  LESSON: {
    GET_ALL: "/user-lessons-learning-path",
    GET_BY_ID: (id: string) => `/lessons/${id}`,
    COMPLETE: "/progress",
    RETRY: "/lessons/retry",
  },
  USER: {
    GET_PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    UPDATE_AVATAR: "/users/profile/avatar",
  },
  LEADERBOARD: {
    GET_ALL: "/leaderboard",
  },
  PACKAGE: {
    GET_ACTIVE: "/packages",
    PURCHASE: "/packages/purchase",
    CHECK_ACTIVE: "/packages/user/active",
    CHECK_PAYMENT_STATUS: (transactionId: string) =>
      `/packages/payment-status/${transactionId}`,
    CANCEL_PAYMENT: (transactionId: string) =>
      `/packages/cancel-payment/${transactionId}`,
  },
};
