import { axiosInstance } from "@/services/constants/axiosConfig";
import { ENDPOINTS } from "@/services/constants/endpoints";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";

export interface PackageFeature {
  doubleXP: boolean;
  unlimitedLives: boolean;
}

export interface Package {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
  discount: number;
  discountEndDate: string;
  features: PackageFeature;
  createdAt: string;
  updatedAt: string;
}

export interface ActivePackage {
  _id: string;
  userId: string;
  package: Package;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatus {
  status: string;
}

interface PackageState {
  packages: Package[];
  loading: boolean;
  error: string | null;
  purchaseLoading: boolean;
  purchaseError: string | null;
  paymentUrl: string | null;
  hasActivePackage: boolean;
  activePackage: ActivePackage | null;
  activePackageLoading: boolean;
  packageDetails: Package | null;
  paymentStatus: PaymentStatus | null;
}

const initialState: PackageState = {
  packages: [],
  loading: false,
  error: null,
  purchaseLoading: false,
  purchaseError: null,
  paymentUrl: null,
  hasActivePackage: false,
  activePackage: null,
  activePackageLoading: false,
  packageDetails: null,
  paymentStatus: null,
};

export const fetchActivePackages = createAsyncThunk<
  Package[],
  void,
  { rejectValue: { message: string } }
>("package/fetchActivePackages", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(ENDPOINTS.PACKAGE.GET_ACTIVE);
    return res.data.packages || [];
  } catch (err: any) {
    const message = err.response?.data?.message || "Lỗi khi lấy danh sách gói";
    return rejectWithValue({ message });
  }
});

export const purchasePackage = createAsyncThunk<
  { paymentUrl: string },
  string,
  { rejectValue: { message: string } }
>("package/purchasePackage", async (packageId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(ENDPOINTS.PACKAGE.PURCHASE, {
      packageId,
      paymentMethod: "payos",
    });
    return res.data;
  } catch (err: any) {
    const message = err.response?.data?.message || "Lỗi khi mua gói";
    return rejectWithValue({ message });
  }
});

export const checkActivePackage = createAsyncThunk<
  { hasActivePackage: boolean; activePackage: ActivePackage | null },
  void,
  { rejectValue: { message: string } }
>("package/checkActivePackage", async (_, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(ENDPOINTS.PACKAGE.CHECK_ACTIVE);
    return res.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message || "Lỗi khi kiểm tra gói hiện tại";
    return rejectWithValue({ message });
  }
});

export const checkPaymentStatus = createAsyncThunk<
  PaymentStatus,
  string,
  { rejectValue: { message: string } }
>("package/checkPaymentStatus", async (transactionId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(
      ENDPOINTS.PACKAGE.CHECK_PAYMENT_STATUS(transactionId)
    );
    return res.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message || "Lỗi khi kiểm tra trạng thái thanh toán";
    return rejectWithValue({ message });
  }
});

export const cancelPayment = createAsyncThunk<
  { success: boolean },
  string,
  { rejectValue: { message: string } }
>("package/cancelPayment", async (transactionId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post(
      ENDPOINTS.PACKAGE.CANCEL_PAYMENT(transactionId)
    );
    return res.data;
  } catch (err: any) {
    const message = err.response?.data?.message || "Lỗi khi hủy thanh toán";
    return rejectWithValue({ message });
  }
});

const packageSlice = createSlice({
  name: "package",
  initialState,
  reducers: {
    clearPurchaseState: (state) => {
      state.purchaseLoading = false;
      state.purchaseError = null;
      state.paymentUrl = null;
    },
    clearPackageDetails: (state) => {
      state.packageDetails = null;
    },
    clearPaymentStatus: (state) => {
      state.paymentStatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch packages
      .addCase(fetchActivePackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivePackages.fulfilled, (state, action) => {
        state.loading = false;
        state.packages = action.payload;
      })
      .addCase(fetchActivePackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Lỗi khi lấy danh sách gói";
        Toast.show({ type: "error", text1: state.error });
      })
      // Purchase package
      .addCase(purchasePackage.pending, (state) => {
        state.purchaseLoading = true;
        state.purchaseError = null;
      })
      .addCase(purchasePackage.fulfilled, (state, action) => {
        state.purchaseLoading = false;
        state.paymentUrl = action.payload.paymentUrl;
      })
      .addCase(purchasePackage.rejected, (state, action) => {
        state.purchaseLoading = false;
        state.purchaseError = action.payload?.message || "Lỗi khi mua gói";
        Toast.show({ type: "error", text1: state.purchaseError });
      })
      // Check active package
      .addCase(checkActivePackage.pending, (state) => {
        state.activePackageLoading = true;
      })
      .addCase(checkActivePackage.fulfilled, (state, action) => {
        state.activePackageLoading = false;
        state.hasActivePackage = action.payload.hasActivePackage;
        state.activePackage = action.payload.activePackage;
      })
      .addCase(checkActivePackage.rejected, (state, action) => {
        state.activePackageLoading = false;
        state.error =
          action.payload?.message || "Lỗi khi kiểm tra gói hiện tại";
      })
      // Check payment status
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        state.paymentStatus = action.payload;
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.paymentStatus = null;
      })
      // Cancel payment
      .addCase(cancelPayment.fulfilled, (state) => {
        state.paymentStatus = null;
      });
  },
});

export const { clearPurchaseState, clearPackageDetails, clearPaymentStatus } =
  packageSlice.actions;
export default packageSlice.reducer;
