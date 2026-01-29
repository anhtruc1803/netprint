# KẾ HOẠCH XỬ LÝ: Loại giấy có nhiều khổ in

## VẤN ĐỀ
Một số loại giấy (ví dụ: "Decal giấy", "Decal nhựa sữa") có thể có nhiều khổ in khác nhau (ví dụ: 320 x 420 mm và 330 x 430 mm).

Hiện tại:
- Mỗi loại giấy chỉ có 1 `printSizeId`
- Khi chọn loại giấy → tự động chọn 1 khổ in
- Logic không hỗ trợ nhiều khổ in cho cùng 1 loại giấy

## GIẢI PHÁP ĐỀ XUẤT

### 1. CẤU TRÚC DỮ LIỆU (KHÔNG CẦN THAY ĐỔI)
Hiện tại đã hỗ trợ: Cùng tên loại giấy có thể xuất hiện ở nhiều khổ in với ID khác nhau:
- "Decal giấy" (id: 29) ở khổ 330 x 430 mm (sizeId: 3)
- "Decal giấy" (id: ?) ở khổ 320 x 420 mm (sizeId: 2) - cần thêm vào dữ liệu

### 2. LOGIC MỚI

#### A. Helper Functions (trong `paper_helpers.js`)

**a) `getPaperSizesByName(paperName)`**
```javascript
/**
 * Lấy tất cả khổ in của một loại giấy (theo tên)
 * Trả về array: [{ printSizeId, sizeName, paperId, ... }]
 */
function getPaperSizesByName(paperName) {
    const results = [];
    
    PAPER_SETTINGS.paperPricing.forEach(pricing => {
        const size = PAPER_SETTINGS.printSizes.find(s => s.id === pricing.printSizeId);
        if (!size) return;
        
        pricing.papers.forEach(paper => {
            if (paper.name.toLowerCase() === paperName.toLowerCase()) {
                results.push({
                    paperId: paper.id,
                    printSizeId: size.id,
                    sizeName: size.name,
                    w: size.w,
                    h: size.h,
                    tiers: paper.tiers
                });
            }
        });
    });
    
    return results;
}
```

**b) `getPaperSizesByPaperId(paperId)`**
```javascript
/**
 * Lấy tất cả khổ in của một loại giấy (theo ID - cho trường hợp cùng tên)
 * Trả về array: [{ printSizeId, sizeName, ... }]
 */
function getPaperSizesByPaperId(paperId) {
    const paper = getPaperById(paperId);
    if (!paper) return [];
    
    // Tìm tất cả các khổ in có cùng tên loại giấy
    return getPaperSizesByName(paper.name);
}
```

#### B. Cập nhật `onPaperTypeChange()` (trong `paper_helpers.js`)

**Logic mới:**
1. Khi chọn loại giấy → tìm tất cả khổ in của loại giấy đó
2. Nếu chỉ có 1 khổ in → tự động chọn
3. Nếu có nhiều khổ in → **Filter dropdown khổ in** (chỉ hiển thị các khổ in khả dụng)
4. Nếu khổ in hiện tại không khớp → tự động chọn khổ in đầu tiên

```javascript
function onPaperTypeChange() {
    const paperTypeSelect = document.getElementById('paperType');
    const sizeSelect = document.getElementById('paperSize');

    if (!paperTypeSelect || !sizeSelect) return;

    const selectedPaperId = parseInt(paperTypeSelect.value);
    if (!selectedPaperId) return;

    // Lấy tất cả khổ in của loại giấy đã chọn
    const availableSizes = getPaperSizesByPaperId(selectedPaperId);
    
    if (availableSizes.length === 0) {
        console.warn('Không tìm thấy khổ in cho loại giấy này');
        return;
    }

    // Filter dropdown khổ in - chỉ hiển thị các khổ in khả dụng
    const currentSizeId = parseInt(sizeSelect.value);
    const availableSizeIds = availableSizes.map(s => s.printSizeId);
    
    // Cập nhật options trong dropdown khổ in
    Array.from(sizeSelect.options).forEach(option => {
        const sizeId = parseInt(option.value);
        if (availableSizeIds.includes(sizeId)) {
            option.style.display = '';
            option.disabled = false;
        } else {
            option.style.display = 'none';
            option.disabled = true;
        }
    });

    // Chọn khổ in
    if (availableSizes.length === 1) {
        // Chỉ có 1 khổ in → tự động chọn
        sizeSelect.value = availableSizes[0].printSizeId;
    } else {
        // Có nhiều khổ in → giữ khổ in hiện tại nếu khả dụng, nếu không thì chọn khổ in đầu tiên
        if (!availableSizeIds.includes(currentSizeId)) {
            sizeSelect.value = availableSizes[0].printSizeId;
        }
    }

    // Cập nhật dropdown cán màng theo khổ in mới
    if (typeof populateLaminationDropdown === 'function') {
        populateLaminationDropdown();
    }

    // Cập nhật preview
    if (typeof updatePaperPreview === 'function') {
        updatePaperPreview();
    }
}
```

#### C. Cập nhật `onPaperSizeChange()` (trong `paper_helpers.js`)

**Logic mới:**
1. Khi thay đổi khổ in → **Filter loại giấy** (chỉ hiển thị các loại giấy có khổ in này)
2. Nếu loại giấy hiện tại không khả dụng → tự động chọn loại giấy đầu tiên

```javascript
function onPaperSizeChange() {
    const sizeSelect = document.getElementById('paperSize');
    const paperTypeSelect = document.getElementById('paperType');

    if (!sizeSelect || !paperTypeSelect) return;

    const selectedSizeId = parseInt(sizeSelect.value);
    if (!selectedSizeId) return;

    // Lấy danh sách loại giấy của khổ in đã chọn
    const availablePapers = getPapersBySize(selectedSizeId);

    // Filter dropdown loại giấy
    const currentPaperId = parseInt(paperTypeSelect.value);
    const availablePaperIds = availablePapers.map(p => p.id);

    // Cập nhật options trong dropdown loại giấy
    Array.from(paperTypeSelect.options).forEach(option => {
        const paperId = parseInt(option.value);
        if (availablePaperIds.includes(paperId)) {
            option.style.display = '';
            option.disabled = false;
        } else {
            option.style.display = 'none';
            option.disabled = true;
        }
    });

    // Cập nhật allOptions cho search
    const formattedOptions = availablePapers.map(p => ({
        ...p,
        name: capitalizeWords(p.name)
    }));
    paperTypeSelect.dataset.allOptions = JSON.stringify(formattedOptions);

    // Chọn loại giấy
    if (!availablePaperIds.includes(currentPaperId)) {
        // Loại giấy hiện tại không khả dụng → chọn loại giấy đầu tiên
        if (availablePapers.length > 0) {
            paperTypeSelect.value = availablePapers[0].id;
            // Cập nhật search input
            const searchInput = document.getElementById('paperTypeSearch');
            if (searchInput) {
                searchInput.value = capitalizeWords(availablePapers[0].name);
            }
        }
    }

    // Cập nhật dropdown cán màng theo khổ giấy mới
    if (typeof populateLaminationDropdown === 'function') {
        populateLaminationDropdown();
    }

    // Cập nhật preview
    if (typeof updatePaperPreview === 'function') {
        updatePaperPreview();
    }
}
```

#### D. Cập nhật `getPaperById()` cho trường hợp nhiều khổ in

**Có thể cần thêm:**
```javascript
/**
 * Lấy loại giấy theo ID và printSizeId (chính xác hơn)
 */
function getPaperByIdAndSize(paperId, printSizeId) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === parseInt(printSizeId));
    if (!pricing) return null;

    const paper = pricing.papers.find(p => p.id === parseInt(paperId));
    if (!paper) return null;

    const size = PAPER_SETTINGS.printSizes.find(s => s.id === parseInt(printSizeId));
    if (!size) return null;

    return {
        ...paper,
        w: size.w,
        h: size.h,
        printSizeId: size.id
    };
}
```

### 3. LUỒNG HOẠT ĐỘNG MỚI

#### Khi chọn LOẠI GIẤY:
1. User chọn "Decal giấy" → `onPaperTypeChange()` được gọi
2. Tìm tất cả khổ in có "Decal giấy" → giả sử có 2: 320x420 và 330x430
3. Filter dropdown khổ in → chỉ hiển thị 2 khổ này, ẩn các khổ khác
4. Nếu có 1 khổ → tự động chọn
5. Nếu có nhiều khổ → giữ khổ hiện tại (nếu khả dụng) hoặc chọn khổ đầu tiên
6. Cập nhật cán màng và preview

#### Khi chọn KHỔ IN:
1. User chọn "330 x 430 mm" → `onPaperSizeChange()` được gọi
2. Tìm tất cả loại giấy có khổ này → lọc danh sách
3. Filter dropdown loại giấy → chỉ hiển thị các loại giấy khả dụng
4. Nếu loại giấy hiện tại không khả dụng → chọn loại giấy đầu tiên
5. Cập nhật cán màng và preview

### 4. CẬP NHẬT DỮ LIỆU

Cần thêm "Decal giấy" và "Decal nhựa sữa" vào khổ 320 x 420 mm nếu chúng có 2 khổ:

```javascript
// Trong import_paper_data.js, thêm vào papers2:
const papers2 = [
    { id: 26, name: 'Decal da bò (kraft)', tiers: [{ max: 999999, price: 3100 }] },
    { id: 29, name: 'Decal giấy', tiers: [{ max: 999999, price: 2500 }] }, // ID khác với khổ 330x430
    { id: 30, name: 'Decal nhựa sữa', tiers: [{ max: 999999, price: 3500 }] } // ID khác với khổ 330x430
];
```

## ƯU ĐIỂM
- ✅ Không cần thay đổi cấu trúc dữ liệu
- ✅ Tự động filter khi chọn loại giấy/khổ in
- ✅ Hỗ trợ cả 2 chiều: chọn loại giấy trước hoặc chọn khổ in trước
- ✅ UX tốt: tự động chọn nếu chỉ có 1 lựa chọn

## LƯU Ý
- Cần đảm bảo ID của loại giấy là unique (nếu cùng tên ở khổ khác thì cần ID khác)
- Filter bằng `display: none` và `disabled` thay vì xóa options
- Giữ lại logic hiện tại để tương thích ngược
