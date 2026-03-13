# Hướng dẫn sử dụng CRM NetPrint

Chào mừng bạn đến với Hệ thống CRM (Quản lý Quan hệ Khách hàng) của NetPrint. Tài liệu này sẽ hướng dẫn bạn các bước cơ bản để làm quen và sử dụng các tính năng quan trọng nhất trong hệ thống.

## 1. Đăng nhập và Giao diện chính (Workplace)

### Đăng nhập
Khi truy cập vào CRM, bạn sẽ thấy màn hình đăng nhập. Hệ thống hiện được cấu hình sẵn một tài khoản mặc định. Bạn chỉ cần click **Login** để tiếp tục vào trang Dashboard chính.

### Workplace (Bảng điều khiển)
Workplace là nơi bạn theo dõi các thông số và hoạt động hàng ngày của công ty.

#### Tính năng nổi bật:
- **Lời chào & Thống kê cá nhân**: Hiển thị số lượng công việc bạn cần hoàn thành trong ngày (ví dụ: *Hôm nay bạn có X công việc cần hoàn thành*).
- **Thống kê tổng quan**: Xem nhanh số lượng đơn hàng mới, doanh thu trong ngày, đơn hàng đang xử lý (cần gấp) và lượng khách hàng mới.
- **Truy cập nhanh (Quick Actions)**: Dễ dàng mở các chức năng thường dùng nhất như:
  - Tính giá In Nhanh / Catalogue
  - Tạo đơn hàng mới
  - Mở danh sách Khách hàng / Sản phẩm
  - Cài đặt giá
- **Công việc hôm nay**: Bạn có thể thêm mới công việc dạng to-do list (Nhập text và nhấn Thêm), hoặc tích chọn để hoàn thành các việc đã làm.
- **Trạng thái sản xuất (Bên phải)**: Theo dõi số lượng đơn hàng theo từng tiến độ: *Chờ in, Đang in, Gia công, Chờ giao, Hoàn thành*.
- **Hoạt động gần đây**: Lịch sử thao tác của các nhân viên (ai vừa tạo đơn, ai vừa giao hàng, ai vừa duyệt file in).

---

## 2. Quản lý Đơn hàng (Orders)

Menu: **Đơn hàng** > **Danh sách** (hoặc truy cập qua *Truy cập nhanh -> Tạo đơn hàng*)

### Danh sách đơn hàng
- Liệt kê toàn bộ các đơn hàng đã tạo với thông tin: Ngày bán, Mã đơn, Tên Khách hàng, Giá trị, Đã thu, và Trạng thái.
- **Bộ lọc**: Sử dụng các tab (Tất cả, Đã hoàn thành, Chờ xử lý, Đã hủy) để phân loại đơn hàng nhanh chóng. Bạn cũng có thể lọc theo khoảng thời gian và tìm kiếm tên khách hàng.

### Tạo đơn hàng mới
- Click biểu tượng dấu cộng **(+)** ở danh sách để mở trang Tạo Đơn.
- Tại đây, bạn có thể chọn Khách hàng (hoặc thêm mới), nhập các chi tiết in ấn (Sản phẩm, kích thước, số lượng, quy cách gia công, yêu cầu thiết kế), hệ thống sẽ tính giá và tạo đơn hàng gửi sang xưởng.

---

## 3. Cài đặt Bảng giá (Pricing)

Menu: **Tính giá** (Pricing)

- **Tính giá In Nhanh (Calculator)**: Công cụ cho phép Sales nhập nhanh các thông số (Loại giấy in, số trang, kích thước, cán màng, bế) để ra báo giá lập tức cho khách mà không cần thủ công.
- **Tính giá Catalogue**: Tương tự In Nhanh nhưng chuyên dụng với các tham số phức tạp hơn (Bìa, Ruột, Đóng cuốn, Cán màng bìa).
- **Cài đặt hệ thống giá (Settings)**: Nơi Admin quản lý đơn giá cấu hình nền (Giá giấy C150, giá kẽm, giá click máy in màu, phí cán màng m2). **Lưu ý:** Việc thay đổi tại đây sẽ cập nhật trực tiếp vào file cấu hình trên server, tự động làm thay đổi công thức tính giá cho toàn bộ nhân viên Sales.

---

## 4. Quản lý Khách hàng (Users)

Menu: **Tài khoản** > **Danh sách**

- Quản lý thông tin chi tiết các cá nhân, doanh nghiệp đối tác (Tên công ty, MST, Địa chỉ, SĐT liên hệ, Hạng thành viên).
- Cung cấp lịch sử giao dịch và doanh số của từng khách hàng, từ đó có chính sách chăm sóc/giảm giá (chiết khấu) phù hợp.

---

## FAQ (Câu hỏi thường gặp)
- **Làm sao để thay đổi báo giá chung?** → Vào `Cài đặt giá` để điều chỉnh chi phí đầu vào, hệ thống tính giá của tất cả các dịch vụ (In nhanh, Catalogue) sẽ tự động được cập nhật.
- **Làm sao để theo dõi đơn nào cần giao gấp?** → Xem mục `Trạng thái sản xuất` và `Công việc hôm nay` trên màn hình Dashboard (Workplace) để biết đơn nào đang tồn đọng.

*(Vui lòng liên hệ Admin nếu bạn không thể thực hiện một tác vụ do thiếu phân quyền.)*
