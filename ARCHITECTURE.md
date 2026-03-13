# Kỹ Thuật & Cấu Trúc Dự Án CRM NetPrint

Tài liệu này giải thích cấu trúc mã nguồn, các công nghệ sử dụng và luồng thao tác dữ liệu bên trong phần mềm CRM NetPrint, giúp các Developers (hoặc AI Agents) có cái nhìn tổng quan khi muốn chỉnh sửa, bảo trì hay phát triển thêm tính năng mới.

## 1. Công nghệ Sử Dụng (Tech Stack)

Đây là một dự án **Frontend Single Page Application (SPA)** được build bằng Vite.
- **Library/Framework**: React 19.
- **Routing**: React Router v7.
- **UI Component & Styling**: Material UI (MUI v7), kết hợp với Emotion (styled-components).
- **Form & Validation**: `react-hook-form` kết hợp với `zod` để validate dữ liệu đầu vào.
- **Dev/Build Tool**: Vite (có sử dụng `vite-plugin-checker` cho ESLint).
- **Template Core**: Dự án sử dụng cấu trúc template `@minimal-kit/vite-js` (phiên bản 7.x).

---

## 2. Cấu Trúc Thư Mục Hệ Thống
Toàn bộ mã nguồn chính nằm trong thư mục `CRM/src/`. Dưới đây là các thư mục quan trọng nhất:

```
CRM/
├── data/                      # Chứa các file JSON dữ liệu (settings.json, price_history.json) được dùng bởi Fake API.
├── public/                    # Static assets
├── api_server.py              # Xử lý server Python chạy port 8510 trên production (Đọc/ghi file settings.json).
├── vite.config.js             # Cấu hình Vite, đặc biệt chứa 2 custom plugin làm Fake API (settingsApiPlugin, historyApiPlugin) khi chạy Dev.
└── src/
    ├── _mock/                 # Chứa dữ liệu giả (Hardcoded fake data) phục vụ cho giao diện User, Order, Product.
    ├── auth/                  # Logic xử lý Authentication. Mặc định dùng context `jwt` với `localStorage` và `data-seeder.js` (tạo user ảo).
    ├── components/            # Các UI component dùng chung trên toàn app (Table, Chart, Markdown, Upload, Snackbar...).
    ├── layouts/               # Định nghĩa các Layout của ứng dụng (Dashboard, Auth, Main). File `nav-config-dashboard.jsx` chứa cấu hình Menu Sidebar.
    ├── pages/                 # Endpoint của các Route. File ở đây thường rất mỏng, chỉ import View tương ứng từ `src/sections/`.
    ├── routes/                # Cấu hình React Router (`paths.js` định nghĩa URL tĩnh, `sections` định nghĩa cấu trúc route component).
    ├── sections/              # **THƯ MỤC QUAN TRỌNG NHẤT**: Chứa logic, state, và UI cụ thể của từng Module (Ví dụ: `order`, `product`, `user`, `pricing`, `workplace`).
    ├── theme/                 # Nơi ghi đè các style mặc định của MUI (Colors, Typography, Components overrides).
    └── utils/                 # Các hàm helper dùng chung.
```

---

## 3. Kiến Trúc Luồng Dữ Liệu (Data Flow & State)

Hiện tại dự án đang chạy theo mô hình **Mock Data** ở hầu hết các tính năng, ngoại trừ một số tính năng có Local DB giả lập qua file JSON.

### 3.1. Dữ liệu Danh sách (Orders, Users, v.v.)
- Tất cả các danh sách (Bảng Đơn hàng, Bảng Khách hàng) được import tĩnh từ thư mục `src/_mock`.
- **Flow hoạt động**: `View Component` (VD: `order-list-view.jsx`) -> Load data từ `import { _orders } from 'src/_mock'` -> Lưu vào local state `useState` -> Pass vào `TableComponent` để render. Dữ liệu khi thêm, xóa, sửa hiện tại chỉ lưu tạm trên RAM (trong `useState` của trang đó), nếu F5 sẽ mất.

### 3.2. Authentication (Đăng nhập cá nhân)
- CRM quản lý Auth qua **JWT Context** (`src/auth/context/jwt`).
- File `data-seeder.js` tự động inject danh sách User giả vào `localStorage` ở lần chạy đầu tiên.
- Khi user đăng nhập, app lấy thông tin từ `localStorage`, giải mã JWT giả để lấy role/permission và cấp quyền truy cập qua Guard Component (`AuthGuard`).

### 3.3. Module Tính/Cài Đặt Giá (Fake API)
Module duy nhất có tính persistent (lưu cứng vào đĩa) là Cài đặt giá (`settings.json`).
- **Dev Mode (`yarn dev`)**: File `vite.config.js` đã đính kèm `settingsApiPlugin` hứng API `GET/POST /api/settings`. Khi React gọi `axios.post('/api/settings')`, plugin này sẽ chộp lấy request và ghi file vào `CRM/data/settings.json`.
- **Production Mode**: Trên VPS, Nginx sẽ proxy request có đuôi `/api/` thẳng vào Backend Python `api_server.py` đang chạy ở `port 8510`, Python sẽ đảm nhận việc đọc/ghi `settings.json`.

---

## 4. Hướng dẫn Phát triển & Nâng Cấp Tương Lai

Nếu Dev/Agent mới vào nhận dự án và muốn chuyển hệ thống từ Mock/Fake API sang kết nối Backend thật (REST API / GraphQL), hãy làm theo các bước:

1. **Khởi tạo API Client**: Tạo một instance Axios (ví dụ `src/utils/axios.js`) chứa Base URL và Inteceptor (nhét JWT Token).
2. **Sửa Auth Provider**: Thay đổi `src/auth/context/jwt/auth-provider.jsx` để call API login thật, thay vì kiểm tra localStorage rỗng.
3. **Thay thế Mock trong Sections**: 
   - Thay vì dùng `useState(_orders)`, hãy dùng React Query, SWR, hoặc `useEffect` để fetch đơn hàng từ backend.
   - Sửa các thao tác `handleDelete`, `onSubmit Form` thành gọi API REST. Thay vì thao tác mảng cục bộ, gọi `axios.post()` rồi refetch lại danh sách.
4. **Sidebar Navigation**: Menu sidebar được config tại `src/layouts/nav-config-dashboard.jsx`. Để thêm menu mới, nối thêm path vào đây và tạo Component trong `src/pages` và `src/sections`.

*Tài liệu được cập nhật tự động hỗ trợ Team Dev.*
