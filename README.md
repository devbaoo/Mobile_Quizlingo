# QuizLingo Mobile App

A mobile quiz application built with React Native, Expo, and GlueStack UI for language learning.
Ứng dụng di động học ngôn ngữ thông qua câu đố, được xây dựng bằng React Native, Expo và GlueStack UI.

## Prerequisites | Yêu cầu

- Node.js (v14 or newer)
- npm or yarn
- Expo Go app on your mobile device | Ứng dụng Expo Go trên thiết bị di động
- Code editor (VS Code recommended) | Editor code (khuyến nghị dùng VS Code)

## Installation | Cài đặt

1. Clone the repository | Clone dự án:

```bash
git clone <repository-url>
cd Mobile_Quizlingo
```

2. Install dependencies | Cài đặt các dependencies:

```bash
npm install
# or | hoặc
yarn install
```

## Project Structure | Cấu trúc dự án

```
Mobile_Quizlingo/
├── src/
│   ├── screens/          # Main screen components | Các màn hình chính
│   │   ├── Home/        # Home screen | Màn hình trang chủ
│   │   ├── Quiz/        # Quiz screens | Các màn hình câu đố
│   │   ├── Profile/     # User profile | Màn hình thông tin người dùng
│   │   └── Settings/    # App settings | Màn hình cài đặt
│   │
│   ├── components/       # Reusable UI components | Các component có thể tái sử dụng
│   │   ├── common/      # Common UI elements | Các element UI dùng chung
│   │   ├── quiz/        # Quiz-specific components | Components riêng cho phần quiz
│   │   └── layout/      # Layout components | Components bố cục
│   │
│   ├── navigation/      # Navigation setup | Cấu hình điều hướng
│   │   ├── stacks/     # Stack navigators | Điều hướng theo stack
│   │   └── tabs/       # Tab navigators | Điều hướng theo tab
│   │
│   ├── services/        # API and backend services | Các service giao tiếp backend
│   │   ├── api/        # API calls | Các cuộc gọi API
│   │   └── storage/    # Local storage | Lưu trữ cục bộ
│   │
│   ├── utils/          # Utility functions | Các hàm tiện ích
│   │   ├── helpers/    # Helper functions | Các hàm hỗ trợ
│   │   └── constants/  # Constants and configs | Các hằng số và cấu hình
│   │
│   ├── hooks/          # Custom React hooks | Các hook tùy chỉnh
│   │
│   ├── assets/         # Static assets | Tài nguyên tĩnh
│   │   ├── images/     # Images | Hình ảnh
│   │   ├── fonts/      # Custom fonts | Font chữ
│   │   └── icons/      # Icons | Biểu tượng
│   │
│   └── types/          # TypeScript type definitions | Định nghĩa kiểu dữ liệu TypeScript
│
├── App.tsx             # Root component | Component gốc
├── babel.config.js     # Babel configuration | Cấu hình Babel
├── tsconfig.json       # TypeScript configuration | Cấu hình TypeScript
└── package.json        # Project dependencies | Các dependency của dự án
```

## Development Guide | Hướng dẫn phát triển

### Getting Started | Bắt đầu

1. Start with the screens in `src/screens/` | Bắt đầu với các màn hình trong `src/screens/`
2. Create reusable components in `src/components/` | Tạo các component có thể tái sử dụng trong `src/components/`
3. Set up navigation in `src/navigation/` | Thiết lập điều hướng trong `src/navigation/`
4. Add services and API calls in `src/services/` | Thêm các service và gọi API trong `src/services/`

### Coding Flow | Quy trình code

1. **Screen Development | Phát triển màn hình:**

   - Start with screen layout | Bắt đầu với bố cục màn hình
   - Add navigation logic | Thêm logic điều hướng
   - Implement business logic | Thực hiện logic nghiệp vụ
   - Add state management | Thêm quản lý state

2. **Component Development | Phát triển component:**

   - Create base component structure | Tạo cấu trúc component cơ bản
   - Add props and types | Thêm props và types
   - Implement styling | Thực hiện style
   - Add functionality | Thêm chức năng

3. **Service Integration | Tích hợp service:**
   - Set up API services | Thiết lập các service API
   - Implement data fetching | Thực hiện lấy dữ liệu
   - Add error handling | Thêm xử lý lỗi

## Running the App | Chạy ứng dụng

1. Start the development server | Khởi động server phát triển:

```bash
npm start
# or | hoặc
yarn start
```

2. Run on specific platform | Chạy trên nền tảng cụ thể:

```bash
# For iOS | Cho iOS
npm run ios
# or | hoặc
yarn ios

# For Android | Cho Android
npm run android
# or | hoặc
yarn android
```

3. Scan the QR code with your mobile device | Quét mã QR bằng thiết bị di động:
   - iOS: Use the Camera app | Sử dụng ứng dụng Camera
   - Android: Use the Expo Go app | Sử dụng ứng dụng Expo Go

## Features | Tính năng

- Modern UI with GlueStack UI components | Giao diện hiện đại với các component GlueStack UI
- Interactive quiz interface | Giao diện câu đố tương tác
- Progress tracking | Theo dõi tiến độ
- Multiple language support | Hỗ trợ nhiều ngôn ngữ
- Cross-platform compatibility (iOS and Android) | Tương thích đa nền tảng (iOS và Android)

## Best Practices | Các quy tắc thực hành tốt nhất

- Use TypeScript for type safety | Sử dụng TypeScript để đảm bảo an toàn kiểu dữ liệu
- Follow component-based architecture | Tuân thủ kiến trúc dựa trên component
- Implement proper error handling | Thực hiện xử lý lỗi phù hợp
- Write clean, documented code | Viết code sạch và có tài liệu
- Use consistent naming conventions | Sử dụng quy ước đặt tên nhất quán

## Troubleshooting | Xử lý sự cố

Common issues and solutions | Các vấn đề thường gặp và giải pháp:

1. **Metro bundler issues | Vấn đề với Metro bundler:**

   ```bash
   # Clear metro cache | Xóa cache của metro
   npm start --reset-cache
   ```

2. **Dependencies issues | Vấn đề với dependencies:**
   ```bash
   # Remove node_modules and reinstall | Xóa node_modules và cài lại
   rm -rf node_modules
   npm install
   ```
