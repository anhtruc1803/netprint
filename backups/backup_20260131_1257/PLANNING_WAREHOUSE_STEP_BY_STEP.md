# KẾ HOẠCH PHÁT TRIỂN KHO GIẤY - TỪNG BƯỚC

## NGUYÊN TẮC
- **Làm từng bước nhỏ, test kỹ trước khi làm bước tiếp theo**
- **Mỗi bước độc lập, không ảnh hưởng code hiện tại**
- **Có thể dừng ở bất kỳ bước nào mà vẫn hoạt động**

---

## BƯỚC 1: CẤU TRÚC DỮ LIỆU VÀ HELPER FUNCTIONS (CƠ BẢN)

### Mục tiêu:
- Tạo cấu trúc dữ liệu `PAPER_WAREHOUSE`
- Tạo các helper functions cơ bản (get, check, save, load)
- **CHƯA tích hợp với UI**

### File cần tạo:
- `warehouse_paper.js` - Chỉ có helper functions

### Code cần viết:

```javascript
// ===== WAREHOUSE DATA STRUCTURE =====
let PAPER_WAREHOUSE = {
    version: 1,
    stock: [],
    transactions: []
};

// ===== HELPER FUNCTIONS =====
function getPaperStock(paperId, printSizeId) { ... }
function checkPaperStock(paperId, printSizeId, requiredSheets) { ... }
function loadWarehouseSettings() { ... }
function saveWarehouseSettings() { ... }
```

### Test:
- Gọi functions trong Console để test
- Kiểm tra lưu/load localStorage

### ✅ Hoàn thành khi:
- Có thể lưu/load dữ liệu kho
- Helper functions hoạt động đúng

---

## BƯỚC 2: UI QUẢN LÝ KHO (SETTINGS)

### Mục tiêu:
- Tạo tab Settings "📦 Kho Giấy"
- Giao diện quản lý tồn kho (bảng)
- Thêm/Sửa/Xóa loại giấy trong kho
- **CHƯA tích hợp với tính giá**

### File cần tạo:
- `warehouse_paper_settings.js` - UI quản lý kho
- `warehouse_paper.css` - Styles

### File cần sửa:
- `index.html` - Thêm tab Settings
- `app.js` - Thêm menu item Settings

### Code cần viết:
- `renderWarehousePaperSettings()` - Render UI
- `showAddStockModal()` - Modal thêm loại giấy
- `updateStockQuantity()` - Cập nhật số lượng
- `showStockTransactionModal()` - Modal nhập/xuất

### Test:
- Vào Settings → Kho Giấy
- Thêm loại giấy vào kho
- Nhập/Xuất kho
- Kiểm tra lưu vào localStorage

### ✅ Hoàn thành khi:
- Có thể quản lý kho giấy qua UI
- Dữ liệu lưu đúng

---

## BƯỚC 3: HIỂN THỊ TỒN KHO TRONG TÍNH GIÁ (CHỈ HIỂN THỊ)

### Mục tiêu:
- Hiển thị thông tin tồn kho trong kết quả tính giá
- **CHỈ HIỂN THỊ, KHÔNG TRỪ KHO**

### File cần sửa:
- `app.js` - Thêm vào `calculatePaper()`
- `index.html` - Thêm element hiển thị stock info
- `styles.css` - Styles cho stock display

### Code cần viết:

```javascript
// Trong calculatePaper(), sau khi tính xong:
const stockCheck = checkPaperStock(paperTypeId, paper.printSizeId, sheets);
window.lastStockCheck = stockCheck; // Lưu để hiển thị

// Hiển thị trong kết quả:
if (window.lastStockCheck) {
    // Hiển thị badge/tag với màu sắc
}
```

### Test:
- Tính giá → Xem có hiển thị tồn kho không
- Kiểm tra màu sắc (xanh/vàng/đỏ)
- Kiểm tra số liệu đúng

### ✅ Hoàn thành khi:
- Hiển thị tồn kho trong kết quả tính giá
- Màu sắc đúng (xanh/vàng/đỏ)

---

## BƯỚC 4: CHỨC NĂNG CHỐT ĐƠN VÀ TRỪ KHO

### Mục tiêu:
- Thêm button "Chốt đơn" / "Ra lệnh sản xuất"
- Kiểm tra tồn kho trước khi chốt
- Trừ kho khi chốt đơn
- Lưu transaction

### File cần sửa:
- `app.js` - Thêm function `confirmPaperOrder()`
- `index.html` - Thêm button "Chốt đơn"
- `warehouse_paper.js` - Thêm `deductPaperStock()`

### Code cần viết:

```javascript
function confirmPaperOrder() {
    // 1. Lấy thông tin từ form
    // 2. Kiểm tra tồn kho
    // 3. Xác nhận
    // 4. Trừ kho (deductPaperStock)
    // 5. Lưu transaction
    // 6. Cập nhật hiển thị
}
```

### Test:
- Tính giá → Click "Chốt đơn"
- Kiểm tra trừ kho đúng
- Kiểm tra lưu transaction
- Test trường hợp không đủ kho

### ✅ Hoàn thành khi:
- Chốt đơn trừ kho đúng
- Lưu transaction đúng
- Không cho chốt nếu không đủ kho

---

## BƯỚC 5: LỊCH SỬ NHẬP/XUẤT (NÂNG CAO)

### Mục tiêu:
- Hiển thị lịch sử nhập/xuất trong Settings
- Filter, search lịch sử
- Export lịch sử

### File cần sửa:
- `warehouse_paper_settings.js` - Thêm render transactions

### Code cần viết:
- `renderWarehouseTransactions()` - Hiển thị lịch sử
- Filter theo ngày, loại giấy, loại giao dịch

### Test:
- Xem lịch sử nhập/xuất
- Filter lịch sử

### ✅ Hoàn thành khi:
- Hiển thị lịch sử đầy đủ
- Filter hoạt động

---

## THỨ TỰ THỰC HIỆN

### ✅ BƯỚC 1: Cấu trúc dữ liệu (30 phút)
- Tạo file `warehouse_paper.js`
- Viết helper functions cơ bản
- Test lưu/load

### ✅ BƯỚC 2: UI Quản lý kho (1-2 giờ)
- Tạo UI Settings
- Thêm/Sửa/Xóa kho
- Test quản lý kho

### ✅ BƯỚC 3: Hiển thị tồn kho (30 phút)
- Tích hợp vào `calculatePaper()`
- Hiển thị trong kết quả
- Test hiển thị

### ✅ BƯỚC 4: Chốt đơn trừ kho (1 giờ)
- Thêm button "Chốt đơn"
- Logic trừ kho
- Test chốt đơn

### ✅ BƯỚC 5: Lịch sử (30 phút - 1 giờ)
- Hiển thị lịch sử
- Filter lịch sử

---

## LƯU Ý QUAN TRỌNG

### 1. Mỗi bước độc lập
- Bước 1-2: Có thể dừng ở đây, chưa ảnh hưởng tính giá
- Bước 3: Chỉ hiển thị, không ảnh hưởng logic hiện tại
- Bước 4: Mới trừ kho, nhưng có kiểm tra kỹ

### 2. Không xung đột
- Mỗi bước test kỹ trước khi làm bước tiếp
- Code mới không ảnh hưởng code cũ
- Có thể tắt/bật từng tính năng

### 3. Backup
- Backup code trước mỗi bước lớn
- Có thể rollback nếu cần

---

## KHUYẾN NGHỊ

**Làm theo thứ tự:**
1. ✅ Bước 1 (Cấu trúc dữ liệu) - Nền tảng
2. ✅ Bước 2 (UI Quản lý kho) - Có thể quản lý kho
3. ✅ Bước 3 (Hiển thị tồn kho) - Người dùng thấy thông tin
4. ✅ Bước 4 (Chốt đơn trừ kho) - Tính năng chính
5. ✅ Bước 5 (Lịch sử) - Nâng cao

**Có thể dừng ở bất kỳ bước nào** mà vẫn hoạt động tốt!
