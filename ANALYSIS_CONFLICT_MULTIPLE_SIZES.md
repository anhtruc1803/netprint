# PHÂN TÍCH XUNG ĐỘT: Loại giấy có nhiều khổ in

## TÌNH HUỐNG HIỆN TẠI

### Giả sử sau khi setup:
- **"Decal giấy"** có 2 khổ:
  - id=29, khổ 330x430 mm (sizeId=3)
  - id=34, khổ 320x420 mm (sizeId=2)

## PHÂN TÍCH CODE HIỆN TẠI

### ✅ KHÔNG XUNG ĐỘT:

1. **`getPaperById(paperId)`**
   - Tìm theo ID (unique) → trả về đúng 1 paper
   - Không xung đột vì ID là unique

2. **`getAllPapers()`**
   - Trả về TẤT CẢ papers (kể cả cùng tên)
   - Dropdown sẽ hiển thị 2 options: "Decal giấy" (id=29) và "Decal giấy" (id=34)
   - OK - user có thể chọn

3. **`calculatePaper()` - Tính giá**
   - Dùng `getPaperById(paperTypeId)` → lấy đúng paper theo ID đã chọn
   - Lấy `paper.printSizeId` và `paper.w, paper.h` → tính toán chính xác
   - ✅ KHÔNG XUNG ĐỘT

### ⚠️ CÓ XUNG ĐỘT (Logic không đúng):

#### 1. **`onPaperTypeChange()` - Khi chọn loại giấy**

**Code hiện tại:**
```javascript
function onPaperTypeChange() {
    const paper = getPaperById(selectedPaperId); // Chỉ lấy 1 paper
    if (paper.printSizeId) {
        sizeSelect.value = paper.printSizeId; // Chỉ set 1 khổ in
    }
}
```

**Vấn đề:**
- User chọn "Decal giấy" (id=29) → tự động set khổ 330x430 mm
- User KHÔNG BIẾT có khổ 320x420 mm khác
- Nếu user muốn dùng "Decal giấy" ở khổ 320x420, phải chọn "Decal giấy" (id=34) → confusing

**XUNG ĐỘT:** Logic không hỗ trợ nhiều khổ cho cùng 1 loại giấy

---

#### 2. **`onPaperSizeChange()` - Khi chọn khổ in**

**Code hiện tại:**
```javascript
function onPaperSizeChange() {
    // Chỉ cập nhật cán màng và preview
    // KHÔNG filter loại giấy
}
```

**Vấn đề:**
- User chọn khổ 320x420 mm
- Dropdown loại giấy vẫn hiển thị TẤT CẢ papers (kể cả papers không có khổ này)
- User có thể chọn "Decal giấy" (id=29) - nhưng id=29 thuộc khổ 330x430 mm
- Khi tính giá → lấy `paper.w=330, paper.h=430` → tính SAI!

**XUNG ĐỘT:** Có thể chọn loại giấy không khớp với khổ in đã chọn

---

## TÓM TẮT XUNG ĐỘT

### ⚠️ XUNG ĐỘT 1: `onPaperTypeChange()` không biết có khổ khác
- Khi chọn "Decal giấy", chỉ tự động set 1 khổ
- User không biết có khổ khác

### ⚠️ XUNG ĐỘT 2: `onPaperSizeChange()` không filter loại giấy
- Khi chọn khổ in, loại giấy không được filter
- Có thể chọn loại giấy không khớp → tính toán sai

### ✅ KHÔNG XUNG ĐỘT: Tính giá (`calculatePaper`)
- Luôn dùng `getPaperById()` → lấy đúng paper theo ID
- Tính toán chính xác (nếu user chọn đúng)

## GIẢI PHÁP

### CẦN SỬA:

1. **`onPaperTypeChange()`**
   - Phải tìm TẤT CẢ khổ in của loại giấy (theo tên)
   - Nếu có nhiều khổ → filter dropdown khổ in (chỉ hiển thị khổ khả dụng)
   - Nếu chỉ có 1 khổ → tự động chọn

2. **`onPaperSizeChange()`**
   - Phải filter dropdown loại giấy (chỉ hiển thị loại giấy có khổ này)
   - Nếu loại giấy hiện tại không khả dụng → tự động chọn loại giấy khả dụng

### KHÔNG CẦN SỬA:

- `getPaperById()` - OK
- `calculatePaper()` - OK
- `getPaperPrice()` - OK

## KẾT LUẬN

**CÓ XUNG ĐỘT** nếu setup nhiều khổ cho cùng 1 loại giấy mà không sửa logic `onPaperTypeChange()` và `onPaperSizeChange()`.

**Cách xử lý:** 
- Nếu setup xong, test ngay → sẽ thấy bug
- Cần implement code theo plan trong `PLANNING_PAPER_MULTIPLE_SIZES.md`
