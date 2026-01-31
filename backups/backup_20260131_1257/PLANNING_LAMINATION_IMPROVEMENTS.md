# 📋 PLANNING: CẢI TIẾN TÍNH GIÁ CÁN MÀNG

## 🎯 YÊU CẦU

### 1. Đồng bộ với khổ giấy in đã chọn
- ✅ **ĐÃ CÓ**: Hiện tại đã có cấu trúc `laminationPricing` theo khổ giấy
- ✅ **ĐÃ CÓ**: Mỗi khổ giấy có danh sách cán màng riêng
- 🔧 **CẦN CẢI TIẾN**: Cần đảm bảo khi người dùng chọn khổ giấy ở màn hình tính giá, dropdown cán màng chỉ hiển thị loại cán màng tương ứng với khổ đó

---

### 2. Tự động thêm khổ cán màng khi tạo khổ giấy mới
- ❌ **CHƯA CÓ**: Khi thêm khổ giấy mới trong settings, chưa tự động tạo entry cán màng
- 🔧 **GIẢI PHÁP**: Cập nhật hàm `addPrintSize()` để tự động tạo entry trong `laminationPricing` với các loại cán màng mặc định

---

### 3. Cải tiến cách tính giá cán màng
- ✅ **ĐÃ CÓ**: Tính theo mốc số lượng (min-max tiers)
- ✅ **ĐÃ CÓ**: Đơn vị tính: `per_sheet` (đ/tờ), `per_m2` (đ/m²), `per_lot` (đ/lô)
- 🔧 **CẦN THÊM**: 
  - Checkbox để chọn cán 1 mặt hay 2 mặt
  - Công thức tính chuẩn cho cán màng

---

## 🏗️ KẾ HOẠCH TRIỂN KHAI

### **PHASE 1: Đồng bộ dữ liệu cán màng khi tạo khổ giấy** ⭐ QUAN TRỌNG

#### File: `paper_pricing_settings.js`

**Hàm `addPrintSize()` - Thêm logic tự động tạo cán màng:**

```javascript
function addPrintSize() {
    const newId = Math.max(...PAPER_SETTINGS.printSizes.map(s => s.id), 0) + 1;
    const defaultW = 325;
    const defaultH = 430;

    // Thêm khổ in mới
    PAPER_SETTINGS.printSizes.push({
        id: newId,
        w: defaultW,
        h: defaultH,
        name: `${defaultW} x ${defaultH} mm`
    });

    // Tạo paperPricing entry
    const defaultPaperId = Math.max(...PAPER_SETTINGS.paperPricing.flatMap(p => p.papers).map(p => p.id), 0) + 1;
    PAPER_SETTINGS.paperPricing.push({
        printSizeId: newId,
        papers: [...]
    });

    // ✨ MỚI: Tự động thêm laminationPricing entry
    if (!PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing = [];
    }

    const newLamId = Math.max(
        ...PAPER_SETTINGS.laminationPricing.flatMap(p => p.laminations || []).map(l => l.id),
        0
    ) + 1;

    PAPER_SETTINGS.laminationPricing.push({
        printSizeId: newId,
        laminations: [
            {
                id: newLamId,
                name: 'Không cán',
                tiers: [{ max: 999999, price: 0, unit: 'per_sheet' }]
            },
            {
                id: newLamId + 1,
                name: 'Cán bóng 1 mặt',
                tiers: [
                    { max: 499, price: 600, unit: 'per_sheet' },
                    { max: 999999, price: 2500, unit: 'per_m2' }
                ]
            },
            {
                id: newLamId + 2,
                name: 'Cán bóng 2 mặt',
                tiers: [
                    { max: 499, price: 1200, unit: 'per_sheet' },
                    { max: 999999, price: 5000, unit: 'per_m2' }
                ]
            },
            {
                id: newLamId + 3,
                name: 'Cán mờ 1 mặt',
                tiers: [
                    { max: 499, price: 700, unit: 'per_sheet' },
                    { max: 999999, price: 2700, unit: 'per_m2' }
                ]
            },
            {
                id: newLamId + 4,
                name: 'Cán mờ 2 mặt',
                tiers: [
                    { max: 499, price: 1400, unit: 'per_sheet' },
                    { max: 999999, price: 5400, unit: 'per_m2' }
                ]
            }
        ]
    });

    renderPaperPricingSettings();
    savePaperSettings();
    populatePaperSizeDropdown();
    showToast('✅ Đã thêm khổ giấy và cán màng mới');
}
```

**Hàm `deletePrintSize()` - Xóa cả dữ liệu cán màng:**

```javascript
function deletePrintSize(sizeId) {
    if (PAPER_SETTINGS.printSizes.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 khổ giấy!');
        return;
    }
    if (!confirm('🗑️ Xóa khổ giấy này?\n\nTất cả loại giấy và cán màng trong khổ này cũng sẽ bị xóa.')) return;

    PAPER_SETTINGS.printSizes = PAPER_SETTINGS.printSizes.filter(s => s.id !== sizeId);
    PAPER_SETTINGS.paperPricing = PAPER_SETTINGS.paperPricing.filter(p => p.printSizeId !== sizeId);
    
    // ✨ MỚI: Xóa luôn laminationPricing
    if (PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing = PAPER_SETTINGS.laminationPricing.filter(p => p.printSizeId !== sizeId);
    }

    renderPaperPricingSettings();
    savePaperSettings();
    populatePaperSizeDropdown();
    showToast('🗑️ Đã xóa khổ giấy và cán màng');
}
```

---

### **PHASE 2: Cải tiến giao diện tính giá cán màng**

#### File mới: `lamination_calculation.js`

**Thêm checkbox chọn 1 mặt / 2 mặt:**

```javascript
// Hàm tính giá cán màng - CẢI TIẾN
function calculateLaminationPrice(laminationId, quantity, paperSizeId, isTwoSided = false) {
    // Lấy thông tin cán màng theo khổ giấy
    const pricing = PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === paperSizeId);
    if (!pricing) return 0;
    
    const lamination = pricing.laminations.find(l => l.id === laminationId);
    if (!lamination) return 0;
    
    // Tìm tier phù hợp
    const tier = lamination.tiers.find(t => quantity <= t.max);
    if (!tier) return 0;
    
    let unitCost = 0;
    
    switch (tier.unit) {
        case 'per_sheet':
            // Tính theo tờ
            unitCost = tier.price * quantity;
            break;
            
        case 'per_m2':
            // Tính theo m² - cần diện tích khổ giấy
            const size = PAPER_SETTINGS.printSizes.find(s => s.id === paperSizeId);
            if (size) {
                const areaM2 = (size.w * size.h) / 1000000; // mm² -> m²
                unitCost = tier.price * areaM2 * quantity;
            }
            break;
            
        case 'per_lot':
            // Tính theo lô (giá cố định)
            unitCost = tier.price;
            break;
    }
    
    // ✨ MỚI: Nếu cán 2 mặt thì nhân đôi
    if (isTwoSided && tier.unit !== 'per_lot') {
        unitCost *= 2;
    }
    
    return Math.round(unitCost);
}
```

---

### **PHASE 3: Cập nhật UI trong Calculator**

#### File: Cần xác định file chính xử lý calculator (có thể là `app.js` hoặc file riêng)

**Thêm checkbox vào phần chọn cán màng:**

```html
<!-- Trong phần dropdown cán màng -->
<div class="lamination-selection">
    <label>🎨 Cán Màng</label>
    <select id="laminationSelect" onchange="calculateTotal()">
        <!-- Options được populate bởi populateLaminationDropdown() -->
    </select>
    
    <!-- ✨ MỚI: Checkbox chọn 1 mặt / 2 mặt -->
    <div class="lamination-sides">
        <label>
            <input type="radio" name="laminationSides" value="1" checked onchange="calculateTotal()">
            <span>Cán 1 mặt</span>
        </label>
        <label>
            <input type="radio" name="laminationSides" value="2" onchange="calculateTotal()">
            <span>Cán 2 mặt</span>
        </label>
    </div>
</div>
```

**Cập nhật hàm tính tổng:**

```javascript
function calculateTotal() {
    // ... existing code ...
    
    const laminationId = parseInt(document.getElementById('laminationSelect').value);
    const isTwoSided = document.querySelector('input[name="laminationSides"]:checked').value === '2';
    const paperSizeId = getCurrentPaperSizeId(); // Hàm lấy ID khổ giấy đang chọn
    
    const laminationCost = calculateLaminationPrice(
        laminationId, 
        quantity, 
        paperSizeId, 
        isTwoSided
    );
    
    // ... rest of calculation ...
}
```

---

### **PHASE 4: Hiển thị chi tiết trong breakdown**

#### Cập nhật phần hiển thị chi phí cán màng

```javascript
// Hiển thị chi tiết cán màng
function displayLaminationBreakdown(laminationCost, quantity, isTwoSided, tier) {
    let breakdown = '';
    
    switch (tier.unit) {
        case 'per_sheet':
            const sheetPrice = tier.price * (isTwoSided ? 2 : 1);
            breakdown = `${quantity} tờ × ${sheetPrice.toLocaleString()}đ/${isTwoSided ? '2 mặt' : 'mặt'} = ${laminationCost.toLocaleString()}đ`;
            break;
            
        case 'per_m2':
            const areaM2 = (size.w * size.h) / 1000000;
            const m2Price = tier.price * (isTwoSided ? 2 : 1);
            breakdown = `${quantity} tờ × ${areaM2.toFixed(4)}m² × ${m2Price.toLocaleString()}đ/m² = ${laminationCost.toLocaleString()}đ`;
            break;
            
        case 'per_lot':
            breakdown = `Giá lô cố định: ${laminationCost.toLocaleString()}đ`;
            break;
    }
    
    return breakdown;
}
```

---

## 📊 CẤU TRÚC DỮ LIỆU MỚI

### Không thay đổi - Giữ nguyên cấu trúc hiện tại:

```javascript
PAPER_SETTINGS = {
    printSizes: [
        { id: 1, w: 325, h: 430, name: "325 x 430 mm" },
        { id: 2, w: 210, h: 297, name: "210 x 297 mm" }
    ],
    
    paperPricing: [
        {
            printSizeId: 1,
            papers: [
                {
                    id: 1,
                    name: 'Couche 150',
                    tiers: [
                        { max: 500, price: 1000 },
                        { max: 999999, price: 900 }
                    ]
                }
            ]
        }
    ],
    
    laminationPricing: [
        {
            printSizeId: 1,
            laminations: [
                {
                    id: 1,
                    name: 'Không cán',
                    tiers: [
                        { max: 999999, price: 0, unit: 'per_sheet' }
                    ]
                },
                {
                    id: 2,
                    name: 'Cán bóng 1 mặt',
                    tiers: [
                        { max: 499, price: 600, unit: 'per_sheet' },
                        { max: 999999, price: 2500, unit: 'per_m2' }
                    ]
                },
                {
                    id: 3,
                    name: 'Cán bóng 2 mặt',
                    tiers: [
                        { max: 499, price: 1200, unit: 'per_sheet' },
                        { max: 999999, price: 5000, unit: 'per_m2' }
                    ]
                },
                {
                    id: 4,
                    name: 'Cán mờ 1 mặt',
                    tiers: [
                        { max: 499, price: 700, unit: 'per_sheet' },
                        { max: 999999, price: 2700, unit: 'per_m2' }
                    ]
                },
                {
                    id: 5,
                    name: 'Cán mờ 2 mặt',
                    tiers: [
                        { max: 499, price: 1400, unit: 'per_sheet' },
                        { max: 999999, price: 5400, unit: 'per_m2' }
                    ]
                }
            ]
        }
    ]
}
```

---

## 🎨 CÔNG THỨC TÍNH CHUẨN

### 1. **Tính theo TỜ (per_sheet)**
```
Giá = Số lượng × Giá đơn vị × (Cán 2 mặt ? 2 : 1)
```
**Ví dụ cán bóng:** 
- 300 tờ × 600đ/tờ × 1 mặt = 180,000đ (Cán bóng 1 mặt)
- 300 tờ × 600đ/tờ × 2 mặt = 360,000đ (Cán bóng 2 mặt)

**Ví dụ cán mờ:**
- 300 tờ × 700đ/tờ × 1 mặt = 210,000đ (Cán mờ 1 mặt)
- 300 tờ × 700đ/tờ × 2 mặt = 420,000đ (Cán mờ 2 mặt)

---

### 2. **Tính theo M² (per_m2)**
```
Diện tích 1 tờ (m²) = (W × H) / 1,000,000
Giá = Số lượng × Diện tích 1 tờ × Giá m² × (Cán 2 mặt ? 2 : 1)
```
**Ví dụ cán bóng:** Khổ 325 × 430mm, 600 tờ
- Diện tích 1 tờ = (325 × 430) / 1,000,000 = 0.13975 m²
- **1 mặt**: 600 tờ × 0.13975 m² × 2,500đ/m² = 209,625đ
- **2 mặt**: 600 tờ × 0.13975 m² × 5,000đ/m² = 419,250đ

**Ví dụ cán mờ:** Khổ 325 × 430mm, 600 tờ
- Diện tích 1 tờ = 0.13975 m²
- **1 mặt**: 600 tờ × 0.13975 m² × 2,700đ/m² = 226,395đ
- **2 mặt**: 600 tờ × 0.13975 m² × 5,400đ/m² = 452,790đ

---

### 3. **Tính theo LÔ (per_lot)**
```
Giá = Giá cố định (không phụ thuộc số lượng, không nhân đôi)
```
**Ví dụ:** 
- Lô cán màng đặc biệt: 50,000đ (cố định)

---

## 📝 CHECKLIST TRIỂN KHAI

### ✅ Phase 1: Đồng bộ dữ liệu
- [ ] Cập nhật `addPrintSize()` trong `paper_pricing_settings.js`
- [ ] Cập nhật `deletePrintSize()` trong `paper_pricing_settings.js`
- [ ] Test: Thêm khổ giấy mới → Kiểm tra `laminationPricing` tự động thêm
- [ ] Test: Xóa khổ giấy → Kiểm tra `laminationPricing` tự động xóa

### ✅ Phase 2: Hàm tính giá
- [ ] Tạo file mới `lamination_calculation.js`
- [ ] Implement hàm `calculateLaminationPrice()`
- [ ] Test với các trường hợp:
  - [ ] per_sheet × 1 mặt
  - [ ] per_sheet × 2 mặt
  - [ ] per_m2 × 1 mặt
  - [ ] per_m2 × 2 mặt
  - [ ] per_lot

### ✅ Phase 3: Cập nhật UI
- [ ] Thêm radio buttons cho chọn 1/2 mặt
- [ ] Style CSS cho radio buttons
- [ ] Cập nhật `calculateTotal()` để sử dụng hàm mới
- [ ] Import `lamination_calculation.js` vào `index.html`

### ✅ Phase 4: Hiển thị breakdown
- [ ] Implement `displayLaminationBreakdown()`
- [ ] Cập nhật UI để hiển thị công thức tính
- [ ] Test hiển thị với các đơn vị khác nhau

### ✅ Testing tổng thể
- [ ] Test flow: Thêm khổ giấy → Chọn trong calculator → Tính giá
- [ ] Test: Thay đổi số lượng → Giá cán màng tự động cập nhật
- [ ] Test: Chuyển đổi 1 mặt/2 mặt → Giá thay đổi tương ứng
- [ ] Test: localStorage lưu và khôi phục đúng

---

## 🎯 KẾT QUẢ MONG ĐỢI

1. ✅ **Đồng bộ hoàn toàn**: Mỗi khổ giấy tự động có danh sách cán màng riêng
2. ✅ **Tính giá chính xác**: Hỗ trợ đầy đủ 3 đơn vị (tờ, m², lô) và cán 1/2 mặt
3. ✅ **UX tốt**: Người dùng dễ dàng chọn và hiểu được cách tính giá
4. ✅ **Maintainable**: Code sạch, dễ bảo trì và mở rộng sau này

---

## ❓ CÂU HỎI CHO ANH

1. **Giá mặc định khi tạo khổ mới**: Em đặt như sau có OK không?
   - **Không cán**: 0đ
   - **Cán bóng 1 mặt**: 600đ/tờ (< 500 tờ), 2500đ/m² (≥ 500 tờ)
   - **Cán bóng 2 mặt**: 1200đ/tờ (< 500 tờ), 5000đ/m² (≥ 500 tờ)
   - **Cán mờ 1 mặt**: 700đ/tờ (< 500 tờ), 2700đ/m² (≥ 500 tờ)
   - **Cán mờ 2 mặt**: 1400đ/tờ (< 500 tờ), 5400đ/m² (≥ 500 tờ)

2. **Cách hiển thị trong dropdown**: 
   - **Option A** *(Em recommend)*: Hiển thị đầy đủ tất cả loại như trên (5 options)
   - **Option B**: Chỉ hiển thị "Cán bóng" và "Cán mờ", sau đó có radio buttons để chọn 1/2 mặt

3. **Vị trí hiển thị**: Phần chọn cán màng anh muốn đặt ở đâu trong UI calculator?
   - Ngay sau phần chọn loại giấy?
   - Hay ở vị trí khác?

4. **Cách tính cho option B** (nếu dùng radio buttons): 
   - Tính giá động: Chọn "Cán bóng" × Radio "2 mặt" → Tự động tính giá × 2
   - Hay giữ nguyên như hiện tại: Có sẵn 4 loại riêng biệt trong data?

> **💡 Gợi ý của em**: Nên dùng **Option A** (5 loại riêng) vì:
> - Dễ quản lý giá: Mỗi loại có bảng giá riêng, linh hoạt hơn
> - UX đơn giản: Chọn 1 lần trong dropdown, không cần thêm radio buttons
> - Tương thích với cấu trúc hiện tại: Đã có sẵn trong `laminationPricing`

---

**Anh review planning này xem có cần điều chỉnh gì không, em sẽ bắt đầu code theo đúng plan này! 🚀**
