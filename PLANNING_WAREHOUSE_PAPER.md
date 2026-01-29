# KẾ HOẠCH PHÁT TRIỂN: CHỨC NĂNG KHO GIẤY

## MỤC TIÊU
Quản lý kho giấy, kiểm tra số lượng còn lại khi tính giá, và đồng bộ khi chốt đơn hàng.

## YÊU CẦU CHỨC NĂNG

### 1. QUẢN LÝ KHO GIẤY
- **Thêm/Sửa/Xóa loại giấy trong kho**
- **Nhập/Xuất giấy** (nhập hàng, xuất hàng)
- **Xem lịch sử nhập/xuất**
- **Báo cáo tồn kho**

### 2. TÍCH HỢP VỚI TÍNH GIÁ
- **CHỈ hiển thị số lượng** trong kho (báo cáo/thông tin)
- **KHÔNG trừ kho** khi tính giá
- **Hiển thị thông tin tồn kho** trong kết quả tính giá
- **Cảnh báo nếu không đủ giấy** (để biết trước)

### 3. ĐỒNG BỘ KHI CHỐT ĐƠN HÀNG (RA LỆNH SẢN XUẤT)
- **Chỉ trừ kho khi chốt đơn** (ra lệnh sản xuất in)
- **Kiểm tra lại tồn kho** trước khi chốt
- **Tự động trừ kho** sau khi xác nhận chốt đơn
- **Lưu lịch sử xuất kho**
- **Rollback** nếu hủy đơn (tùy chọn)

---

## CẤU TRÚC DỮ LIỆU

### 1. CẤU TRÚC KHO GIẤY (PAPER_WAREHOUSE)

```javascript
let PAPER_WAREHOUSE = {
    version: 1,
    // Lưu tồn kho theo: khổ giấy + loại giấy
    stock: [
        {
            paperId: 29,              // ID loại giấy
            paperName: 'Decal giấy',  // Tên loại giấy (để hiển thị)
            printSizeId: 3,           // ID khổ in
            sizeName: '330 x 430 mm', // Tên khổ in
            quantity: 1500,           // Số lượng hiện tại (tờ)
            unit: 'tờ',               // Đơn vị: 'tờ' hoặc 'kg'
            minStock: 100,            // Mức tồn kho tối thiểu (cảnh báo)
            maxStock: 5000,           // Mức tồn kho tối đa
            location: 'Kho A',        // Vị trí kho (tùy chọn)
            lastUpdated: '2025-01-02T10:30:00Z' // Lần cập nhật cuối
        },
        // ... các loại giấy khác
    ],
    
    // Lịch sử nhập/xuất
    transactions: [
        {
            id: 1,
            type: 'in',               // 'in' (nhập) hoặc 'out' (xuất)
            paperId: 29,
            printSizeId: 3,
            quantity: 500,            // Số lượng
            unit: 'tờ',
            reason: 'Nhập hàng từ NCC X', // Lý do
            orderId: null,            // ID đơn hàng (nếu là xuất cho đơn hàng)
            createdBy: 'admin',       // Người tạo
            createdAt: '2025-01-02T10:30:00Z'
        },
        // ... các giao dịch khác
    ]
};
```

### 2. LƯU TRỮ
- **localStorage**: `paper_warehouse_settings`
- **Backup**: Có thể export/import JSON

---

## KIẾN TRÚC CODE

### A. FILE MỚI: `warehouse_paper.js`

#### 1. Helper Functions

```javascript
// ===== WAREHOUSE HELPER FUNCTIONS =====

/**
 * Lấy thông tin tồn kho của một loại giấy
 * @param {number} paperId - ID loại giấy
 * @param {number} printSizeId - ID khổ in
 * @returns {object|null} - Thông tin tồn kho hoặc null
 */
function getPaperStock(paperId, printSizeId) {
    if (!PAPER_WAREHOUSE || !PAPER_WAREHOUSE.stock) return null;
    
    return PAPER_WAREHOUSE.stock.find(item => 
        item.paperId === parseInt(paperId) && 
        item.printSizeId === parseInt(printSizeId)
    );
}

/**
 * Kiểm tra số lượng giấy còn đủ không
 * @param {number} paperId - ID loại giấy
 * @param {number} printSizeId - ID khổ in
 * @param {number} requiredSheets - Số tờ cần dùng
 * @returns {object} - { enough: boolean, available: number, needed: number }
 */
function checkPaperStock(paperId, printSizeId, requiredSheets) {
    const stock = getPaperStock(paperId, printSizeId);
    
    if (!stock) {
        return {
            enough: false,
            available: 0,
            needed: requiredSheets,
            message: '⚠️ Loại giấy này chưa có trong kho'
        };
    }
    
    const available = stock.quantity || 0;
    const enough = available >= requiredSheets;
    const needed = enough ? 0 : (requiredSheets - available);
    
    return {
        enough,
        available,
        needed,
        required: requiredSheets,
        stock: stock
    };
}

/**
 * Trừ kho khi chốt đơn hàng
 * @param {number} paperId - ID loại giấy
 * @param {number} printSizeId - ID khổ in
 * @param {number} quantity - Số lượng cần trừ
 * @param {string} orderId - ID đơn hàng
 * @returns {boolean} - Thành công hay không
 */
function deductPaperStock(paperId, printSizeId, quantity, orderId) {
    const stock = getPaperStock(paperId, printSizeId);
    
    if (!stock) {
        console.error('Không tìm thấy loại giấy trong kho:', paperId, printSizeId);
        return false;
    }
    
    if (stock.quantity < quantity) {
        console.error('Không đủ giấy trong kho:', {
            available: stock.quantity,
            required: quantity
        });
        return false;
    }
    
    // Trừ kho
    stock.quantity -= quantity;
    stock.lastUpdated = new Date().toISOString();
    
    // Thêm transaction (xuất kho)
    if (!PAPER_WAREHOUSE.transactions) {
        PAPER_WAREHOUSE.transactions = [];
    }
    
    PAPER_WAREHOUSE.transactions.push({
        id: Date.now(),
        type: 'out',
        paperId: parseInt(paperId),
        printSizeId: parseInt(printSizeId),
        quantity: quantity,
        unit: stock.unit || 'tờ',
        reason: `Xuất kho cho đơn hàng #${orderId}`,
        orderId: orderId,
        createdBy: currentUser?.username || 'system',
        createdAt: new Date().toISOString()
    });
    
    // Lưu vào localStorage
    saveWarehouseSettings();
    
    return true;
}

/**
 * Nhập kho
 * @param {number} paperId - ID loại giấy
 * @param {number} printSizeId - ID khổ in
 * @param {number} quantity - Số lượng nhập
 * @param {string} reason - Lý do nhập kho
 * @returns {boolean} - Thành công hay không
 */
function addPaperStock(paperId, printSizeId, quantity, reason) {
    let stock = getPaperStock(paperId, printSizeId);
    
    // Nếu chưa có trong kho, tạo mới
    if (!stock) {
        const paper = getPaperById(paperId);
        const size = PAPER_SETTINGS.printSizes.find(s => s.id === printSizeId);
        
        if (!PAPER_WAREHOUSE.stock) {
            PAPER_WAREHOUSE.stock = [];
        }
        
        stock = {
            paperId: parseInt(paperId),
            paperName: paper ? paper.name : '',
            printSizeId: parseInt(printSizeId),
            sizeName: size ? size.name : '',
            quantity: 0,
            unit: 'tờ',
            minStock: 100,
            maxStock: 5000,
            location: 'Kho A',
            lastUpdated: new Date().toISOString()
        };
        
        PAPER_WAREHOUSE.stock.push(stock);
    }
    
    // Cộng kho
    stock.quantity += quantity;
    stock.lastUpdated = new Date().toISOString();
    
    // Thêm transaction (nhập kho)
    if (!PAPER_WAREHOUSE.transactions) {
        PAPER_WAREHOUSE.transactions = [];
    }
    
    PAPER_WAREHOUSE.transactions.push({
        id: Date.now(),
        type: 'in',
        paperId: parseInt(paperId),
        printSizeId: parseInt(printSizeId),
        quantity: quantity,
        unit: stock.unit || 'tờ',
        reason: reason || 'Nhập kho',
        orderId: null,
        createdBy: currentUser?.username || 'system',
        createdAt: new Date().toISOString()
    });
    
    // Lưu vào localStorage
    saveWarehouseSettings();
    
    return true;
}

/**
 * Lưu cài đặt kho vào localStorage
 */
function saveWarehouseSettings() {
    try {
        localStorage.setItem('paper_warehouse_settings', JSON.stringify(PAPER_WAREHOUSE));
        console.log('✅ Đã lưu cài đặt kho giấy');
    } catch (e) {
        console.error('❌ Lỗi lưu cài đặt kho:', e);
    }
}

/**
 * Load cài đặt kho từ localStorage
 */
function loadWarehouseSettings() {
    try {
        const saved = localStorage.getItem('paper_warehouse_settings');
        if (saved) {
            PAPER_WAREHOUSE = JSON.parse(saved);
        } else {
            // Khởi tạo mặc định
            PAPER_WAREHOUSE = {
                version: 1,
                stock: [],
                transactions: []
            };
        }
    } catch (e) {
        console.error('❌ Lỗi load cài đặt kho:', e);
        PAPER_WAREHOUSE = {
            version: 1,
            stock: [],
            transactions: []
        };
    }
}
```

### B. CẬP NHẬT `calculatePaper()` trong `app.js`

#### Thêm hiển thị thông tin tồn kho (CHỈ BÁO CÁO, KHÔNG TRỪ KHO):

```javascript
function calculatePaper() {
    // ... code hiện tại ...
    
    // Lấy thông tin loại giấy và khổ in
    const paper = getPaperById(paperTypeId);
    const sheets = baseSheets + waste; // Số tờ cần dùng
    
    // ===== HIỂN THỊ THÔNG TIN TỒN KHO (CHỈ BÁO CÁO) =====
    // KHÔNG TRỪ KHO - Chỉ hiển thị để người dùng biết số lượng còn lại
    if (typeof checkPaperStock === 'function') {
        const stockCheck = checkPaperStock(paperTypeId, paper.printSizeId, sheets);
        
        // Lưu thông tin để hiển thị trong kết quả
        window.lastStockCheck = stockCheck;
        
        // KHÔNG alert cảnh báo ở đây - chỉ hiển thị trong kết quả
        // Tính giá vẫn diễn ra bình thường, chỉ báo cáo tồn kho
    }
    
    // ... tiếp tục tính giá như bình thường ...
}
```

#### Hiển thị thông tin tồn kho trong kết quả (CHỈ HIỂN THỊ):

```javascript
// Trong phần hiển thị kết quả (cuối calculatePaper)
if (window.lastStockCheck) {
    const stockInfo = window.lastStockCheck;
    const stockElement = document.getElementById('paperResStockInfo');
    if (stockElement) {
        if (stockInfo.enough) {
            stockElement.innerHTML = `
                <div class="stock-info stock-ok">
                    <span>📦 Tồn kho: ${formatNumber(stockInfo.available)} tờ</span>
                </div>
            `;
        } else {
            stockElement.innerHTML = `
                <div class="stock-info stock-warning">
                    <span>⚠️ Không đủ kho: Còn ${formatNumber(stockInfo.available)} tờ, thiếu ${formatNumber(stockInfo.needed)} tờ</span>
                </div>
            `;
        }
    }
}
```

### C. FILE MỚI: `warehouse_paper_settings.js`

#### Giao diện quản lý kho giấy:

```javascript
// ===== WAREHOUSE PAPER SETTINGS UI =====

/**
 * Render giao diện quản lý kho giấy
 */
function renderWarehousePaperSettings() {
    const container = document.getElementById('warehousePaperContainer');
    if (!container) return;
    
    loadWarehouseSettings();
    
    let html = `
        <div class="warehouse-header">
            <h3>📦 Quản Lý Kho Giấy</h3>
            <button class="btn-add-stock" onclick="showAddStockModal()">+ Thêm loại giấy vào kho</button>
        </div>
        
        <!-- Bảng tồn kho -->
        <div class="warehouse-stock-table">
            <table>
                <thead>
                    <tr>
                        <th>Khổ giấy</th>
                        <th>Loại giấy</th>
                        <th>Tồn kho</th>
                        <th>Đơn vị</th>
                        <th>Tối thiểu</th>
                        <th>Tối đa</th>
                        <th>Vị trí</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="warehouseStockList">
                    ${renderWarehouseStockList()}
                </tbody>
            </table>
        </div>
        
        <!-- Lịch sử nhập/xuất -->
        <div class="warehouse-transactions">
            <h4>📋 Lịch sử nhập/xuất kho</h4>
            <div id="warehouseTransactionsList">
                ${renderWarehouseTransactions()}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderWarehouseStockList() {
    if (!PAPER_WAREHOUSE.stock || PAPER_WAREHOUSE.stock.length === 0) {
        return '<tr><td colspan="8">Chưa có dữ liệu kho</td></tr>';
    }
    
    return PAPER_WAREHOUSE.stock.map(item => {
        const stockStatus = item.quantity <= item.minStock ? 'low-stock' : 
                           item.quantity >= item.maxStock ? 'full-stock' : '';
        
        return `
            <tr class="${stockStatus}">
                <td>${item.sizeName}</td>
                <td>${item.paperName}</td>
                <td>
                    <input type="number" value="${item.quantity}" 
                        onchange="updateStockQuantity(${item.paperId}, ${item.printSizeId}, this.value)">
                </td>
                <td>${item.unit}</td>
                <td>
                    <input type="number" value="${item.minStock}" 
                        onchange="updateMinStock(${item.paperId}, ${item.printSizeId}, this.value)">
                </td>
                <td>
                    <input type="number" value="${item.maxStock}" 
                        onchange="updateMaxStock(${item.paperId}, ${item.printSizeId}, this.value)">
                </td>
                <td>
                    <input type="text" value="${item.location || ''}" 
                        onchange="updateStockLocation(${item.paperId}, ${item.printSizeId}, this.value)">
                </td>
                <td>
                    <button onclick="showStockTransactionModal(${item.paperId}, ${item.printSizeId})">Nhập/Xuất</button>
                    <button onclick="deleteStockItem(${item.paperId}, ${item.printSizeId})">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}
```

### D. TÍCH HỢP VỚI UI TÍNH GIÁ

#### Hiển thị thông tin tồn kho trong form:

```html
<!-- Trong index.html, sau phần kết quả tính giá -->
<div id="paperResStockInfo" class="stock-info-container"></div>
```

#### CSS cho stock info:

```css
.stock-info-container {
    margin-top: 12px;
    padding: 12px;
    border-radius: 8px;
}

.stock-info.stock-ok {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.stock-info.stock-warning {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}
```

### E. TÍCH HỢP KHI CHỐT ĐƠN

#### Thêm button "Chốt đơn" trong kết quả tính giá:

```javascript
function confirmPaperOrder() {
    // Lấy thông tin từ form
    const paperTypeId = parseInt(document.getElementById('paperType')?.value);
    const paper = getPaperById(paperTypeId);
    const sheets = parseInt(document.getElementById('paperResSheets')?.textContent) || 0;
    
    if (!paper || sheets <= 0) {
        return alert('⚠️ Vui lòng tính giá trước!');
    }
    
    // Kiểm tra tồn kho lần nữa
    const stockCheck = checkPaperStock(paperTypeId, paper.printSizeId, sheets);
    
    if (!stockCheck.enough) {
        return alert(`❌ Không thể chốt đơn!\n\n` +
            `Không đủ giấy trong kho:\n` +
            `- Cần: ${sheets} tờ\n` +
            `- Còn: ${stockCheck.available} tờ\n` +
            `- Thiếu: ${stockCheck.needed} tờ`);
    }
    
    // Xác nhận
    const confirmMsg = `Xác nhận chốt đơn?\n\n` +
        `- Loại giấy: ${paper.name}\n` +
        `- Khổ in: ${paper.printSizeId}\n` +
        `- Số tờ: ${sheets}\n` +
        `- Tồn kho sau khi trừ: ${stockCheck.available - sheets} tờ`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Tạo ID đơn hàng
    const orderId = `ORD-${Date.now()}`;
    
    // Trừ kho
    const success = deductPaperStock(paperTypeId, paper.printSizeId, sheets, orderId);
    
    if (success) {
        alert(`✅ Đã chốt đơn thành công!\n\nĐơn hàng: ${orderId}\nĐã trừ ${sheets} tờ khỏi kho.`);
        
        // Cập nhật lại hiển thị tồn kho
        updateStockDisplay(paperTypeId, paper.printSizeId);
        
        // Có thể lưu vào lịch sử đơn hàng
        // saveOrderToHistory(orderId, ...);
    } else {
        alert('❌ Lỗi khi chốt đơn! Vui lòng thử lại.');
    }
}
```

---

## UI/UX

### 1. TAB SETTINGS - "📦 Kho Giấy"
- Thêm tab mới trong Settings menu
- Giao diện quản lý tồn kho (bảng)
- Form nhập/xuất kho
- Lịch sử giao dịch

### 2. HIỂN THỊ TRONG FORM TÍNH GIÁ
- Badge/tag hiển thị số lượng tồn kho
- Màu sắc:
  - 🟢 Xanh: Đủ giấy (> minStock)
  - 🟡 Vàng: Còn ít (<= minStock)
  - 🔴 Đỏ: Không đủ

### 3. CẢNH BÁO
- **Khi tính giá**: CHỈ hiển thị thông tin tồn kho (màu sắc: xanh/vàng/đỏ)
- **Khi chốt đơn**: KIỂM TRA LẠI và KHÔNG cho chốt nếu không đủ kho
- Gợi ý loại giấy khác nếu có (tùy chọn)

---

## LUỒNG HOẠT ĐỘNG

### 1. QUẢN LÝ KHO
```
Settings → Kho Giấy
  → Thêm loại giấy vào kho
  → Nhập/Xuất kho
  → Xem lịch sử
```

### 2. TÍNH GIÁ VÀ BÁO CÁO KHO
```
Chọn loại giấy + Khổ in
  → Tính giá (calculatePaper)
  → Kiểm tra tồn kho (checkPaperStock) - CHỈ ĐỂ BÁO CÁO
  → Hiển thị thông tin tồn kho trong kết quả (KHÔNG TRỪ KHO)
  → Người dùng biết số lượng còn lại để quyết định
```

### 3. CHỐT ĐƠN HÀNG VÀ TRỪ KHO
```
Click "Chốt đơn" / "Ra lệnh sản xuất"
  → Kiểm tra tồn kho (checkPaperStock) - LẦN NỮA
  → Xác nhận chốt đơn
  → Trừ kho (deductPaperStock) - MỚI TRỪ Ở ĐÂY
  → Lưu transaction (xuất kho)
  → Cập nhật hiển thị tồn kho
  → Lưu đơn hàng vào lịch sử
```

---

## LƯU Ý VÀ YÊU CẦU

### 1. ĐỒNG BỘ DỮ LIỆU
- Kho phải đồng bộ với `PAPER_SETTINGS` (loại giấy, khổ in)
- Nếu xóa loại giấy trong Settings, cần xử lý dữ liệu kho tương ứng

### 2. BẢO MẬT
- Chỉ admin mới được quản lý kho
- Lưu lịch sử giao dịch (audit trail)

### 3. BACKUP/RESTORE
- Export/Import dữ liệu kho (JSON)
- Backup định kỳ

### 4. MỞ RỘNG
- Có thể thêm: Đơn vị tính (tờ/kg), Hạn sử dụng, Batch/Lot number
- Tích hợp với hệ thống kế toán
- Báo cáo xuất Excel

---

## FILE CẦN TẠO/SỬA

### File mới:
1. `warehouse_paper.js` - Logic quản lý kho
2. `warehouse_paper_settings.js` - UI quản lý kho
3. `warehouse_paper.css` - Styles cho kho

### File cần sửa:
1. `app.js` - Tích hợp kiểm tra kho trong `calculatePaper()`
2. `index.html` - Thêm tab Settings, hiển thị stock info
3. `styles.css` - Styles cho stock display

---

## PRIORITY

### Phase 1 (Cơ bản):
1. ✅ Cấu trúc dữ liệu PAPER_WAREHOUSE
2. ✅ Helper functions (getPaperStock, checkPaperStock)
3. ✅ UI Settings - Quản lý kho
4. ✅ Kiểm tra tồn kho trong tính giá

### Phase 2 (Tích hợp):
1. ✅ Hiển thị tồn kho trong form tính giá
2. ✅ Chức năng chốt đơn và trừ kho
3. ✅ Lịch sử nhập/xuất

### Phase 3 (Nâng cao):
1. Báo cáo tồn kho
2. Export/Import dữ liệu
3. Cảnh báo tự động (email/notification)
4. Phân quyền (admin/user)

---

## THỜI GIAN ƯỚC TÍNH

- **Phase 1**: 2-3 giờ
- **Phase 2**: 1-2 giờ  
- **Phase 3**: 2-3 giờ

**Tổng: ~6-8 giờ**

---

## CÂU HỎI CẦN LÀM RÕ

1. **Đơn vị tính**: Chỉ dùng "tờ" hay có "kg", "cuộn"?
2. **Vị trí kho**: Có nhiều kho không? (Kho A, Kho B...)
3. **Rollback**: Có cần hủy đơn và hoàn lại kho không?
4. **Phân quyền**: Ai được quản lý kho? Chỉ admin?
5. **Lịch sử đơn hàng**: Có cần lưu riêng không hay chỉ trong transactions?
