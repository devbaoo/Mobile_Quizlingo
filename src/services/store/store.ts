import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import authReducer from "../slices/auth/authSlice";
import leaderboardReducer from "../slices/leaderboard/leaderboardSlice";
import lessonReducer from "../slices/lesson/lessonSlice";
import userReducer from "../slices/user/userSlice";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth", "lesson", "user"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  lesson: lessonReducer,
  user: userReducer,
  leaderboard: leaderboardReducer,
  // Thêm các reducer khác ở đây
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
