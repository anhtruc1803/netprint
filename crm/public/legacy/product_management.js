/* 
    NETPRINT - PRODUCT MANAGEMENT MODULE
*/

let PRODUCT_CATEGORIES = [];
window.PRODUCTS = window.PRODUCTS || [];   // Dùng window để chia sẻ với order module
let PRODUCTS = window.PRODUCTS;           // Alias cục bộ trỏ về cùng array

let PRODUCT_SETTINGS = {
    codeStructure: 'NP_{count,4}',
    counterStart: 1000,
    allowEditCode: true
};
let PRODUCT_UNITS = ['Tờ', 'Hộp', 'Cuốn', 'Bộ', 'Cái', 'm2', 'kg'];

function loadProductData() {
    const savedCats = localStorage.getItem('netprint_product_categories');
    if (savedCats) {
        PRODUCT_CATEGORIES = JSON.parse(savedCats);
    }

    const savedProds = localStorage.getItem('netprint_products');
    if (savedProds) {
        const parsed = JSON.parse(savedProds);
        PRODUCTS.length = 0;
        parsed.forEach(p => PRODUCTS.push(p));  // Giữ nguyên reference, cập nhật nội dung
    } else {
        // Seed some data
        PRODUCTS = [
            { id: 1, catId: 1, name: 'Danh thiếp Standard', price: 15000, unit: 'hộp', code: 'DT-STD' },
            { id: 2, catId: 2, name: 'Tờ rơi A5 C150', price: 800, unit: 'tờ', code: 'TR-A5' },
            { id: 3, catId: 4, name: 'Decal giấy cán bóng', price: 2500, unit: 'tờ A3', code: 'DC-GB' }
        ];
        saveProducts();
    }

    // Load product units
    const savedUnits = localStorage.getItem('netprint_product_units');
    if (savedUnits) PRODUCT_UNITS = JSON.parse(savedUnits);

    // Load product settings
    const savedProdSettings = localStorage.getItem('netprint_product_settings');
    if (savedProdSettings) PRODUCT_SETTINGS = { ...PRODUCT_SETTINGS, ...JSON.parse(savedProdSettings) };
}

function saveCategories() {
    localStorage.setItem('netprint_product_categories', JSON.stringify(PRODUCT_CATEGORIES));
}

function addQuickUnit(selectId) {
    openQuickManageModal('unit', selectId);
}

function addQuickGroup(selectId) {
    openQuickManageModal('group', selectId);
}

function openQuickManageModal(type, selectId) {
    // Remove existing
    let modal = document.getElementById('quickManageModal');
    if (modal) modal.remove();

    const isUnit = type === 'unit';
    const title = isUnit ? 'Quản lý đơn vị tính' : 'Quản lý nhóm sản phẩm';
    const placeholder = isUnit ? 'Nhập đơn vị mới...' : 'Nhập tên nhóm mới...';

    modal = document.createElement('div');
    modal.id = 'quickManageModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="qm-panel">
            <div class="qm-header">
                <h3>${title}</h3>
                <span class="qm-close" onclick="closeQuickManageModal()">×</span>
            </div>
            <div class="qm-add-row">
                <input type="text" id="qmNewInput" placeholder="${placeholder}" onkeydown="if(event.key==='Enter') addQuickItem('${type}','${selectId}')">
                <button onclick="addQuickItem('${type}','${selectId}')">+ Thêm</button>
            </div>
            <div class="qm-list" id="qmListBody">
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) closeQuickManageModal(); };

    renderQuickManageList(type, selectId);
    setTimeout(() => document.getElementById('qmNewInput')?.focus(), 100);
}

function renderQuickManageList(type, selectId) {
    const listBody = document.getElementById('qmListBody');
    if (!listBody) return;

    const isUnit = type === 'unit';
    const items = isUnit
        ? PRODUCT_UNITS.map((u, i) => ({ id: i, label: u }))
        : PRODUCT_CATEGORIES.map(c => ({ id: c.id, label: (c.icon || '📁') + ' ' + c.name }));

    if (items.length === 0) {
        listBody.innerHTML = '<div class="qm-empty">Chưa có mục nào. Hãy thêm mới!</div>';
        return;
    }

    listBody.innerHTML = items.map(item => `
        <div class="qm-item">
            <span class="qm-item-label">${item.label}</span>
            <button class="qm-item-del" onclick="deleteQuickItem('${type}', ${JSON.stringify(item.id)}, '${selectId}')" title="Xóa">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
        </div>
    `).join('');
}

function addQuickItem(type, selectId) {
    const input = document.getElementById('qmNewInput');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    const isUnit = type === 'unit';

    if (isUnit) {
        if (PRODUCT_UNITS.includes(val)) {
            showToast('⚠️ Đơn vị "' + val + '" đã tồn tại', 'error');
            return;
        }
        PRODUCT_UNITS.push(val);
        localStorage.setItem('netprint_product_units', JSON.stringify(PRODUCT_UNITS));
        // Add to select
        const sel = document.getElementById(selectId);
        if (sel) {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            opt.selected = true;
            sel.appendChild(opt);
        }
        showToast('✅ Đã thêm đơn vị "' + val + '"');
    } else {
        if (PRODUCT_CATEGORIES.some(c => c.name.toLowerCase() === val.toLowerCase())) {
            showToast('⚠️ Nhóm "' + val + '" đã tồn tại', 'error');
            return;
        }
        const newId = PRODUCT_CATEGORIES.length > 0 ? Math.max(...PRODUCT_CATEGORIES.map(c => c.id)) + 1 : 1;
        PRODUCT_CATEGORIES.push({ id: newId, name: val, icon: '📁' });
        saveCategories();
        // Add to select
        const sel = document.getElementById(selectId);
        if (sel) {
            const opt = document.createElement('option');
            opt.value = newId;
            opt.textContent = '📁 ' + val;
            opt.selected = true;
            sel.appendChild(opt);
        }
        showToast('✅ Đã thêm nhóm "' + val + '"');
    }

    input.value = '';
    input.focus();
    renderQuickManageList(type, selectId);
}

function deleteQuickItem(type, itemId, selectId) {
    const isUnit = type === 'unit';

    if (isUnit) {
        const unitName = PRODUCT_UNITS[itemId];
        if (!confirm('Xóa đơn vị "' + unitName + '"?')) return;
        PRODUCT_UNITS.splice(itemId, 1);
        localStorage.setItem('netprint_product_units', JSON.stringify(PRODUCT_UNITS));
        // Remove from select
        const sel = document.getElementById(selectId);
        if (sel) {
            const opt = sel.querySelector('option[value="' + unitName + '"]');
            if (opt) opt.remove();
        }
        showToast('🗑️ Đã xóa đơn vị "' + unitName + '"');
    } else {
        const cat = PRODUCT_CATEGORIES.find(c => c.id === itemId);
        if (!cat || !confirm('Xóa nhóm "' + cat.name + '"?')) return;
        PRODUCT_CATEGORIES = PRODUCT_CATEGORIES.filter(c => c.id !== itemId);
        saveCategories();
        // Remove from select
        const sel = document.getElementById(selectId);
        if (sel) {
            const opt = sel.querySelector('option[value="' + itemId + '"]');
            if (opt) opt.remove();
        }
        showToast('🗑️ Đã xóa nhóm "' + cat.name + '"');
    }

    renderQuickManageList(type, selectId);
}

function closeQuickManageModal() {
    const modal = document.getElementById('quickManageModal');
    if (modal) modal.remove();
}

function saveProducts() {
    localStorage.setItem('netprint_products', JSON.stringify(PRODUCTS));
}

let activeCategoryId = 1;

function generateProductCode() {
    const nextCount = PRODUCT_SETTINGS.counterStart + PRODUCTS.length;
    const year = new Date().getFullYear();
    let code = PRODUCT_SETTINGS.codeStructure;
    code = code.replace(/{count,?(\d+)?}/g, (m, digits) => {
        const d = parseInt(digits) || 3;
        return String(nextCount).padStart(d, '0');
    });
    code = code.replace(/{year}/g, year);
    return code;
}

function saveProductSettings() {
    const struct = document.getElementById('setProdStruct').value;
    const start = document.getElementById('setProdStart').value;
    const allowEdit = document.getElementById('setProdAllowEdit').checked;

    PRODUCT_SETTINGS.codeStructure = struct;
    PRODUCT_SETTINGS.counterStart = parseInt(start) || 1;
    PRODUCT_SETTINGS.allowEditCode = allowEdit;

    localStorage.setItem('netprint_product_settings', JSON.stringify(PRODUCT_SETTINGS));
    showToast('✅ Đã lưu cài đặt sản phẩm!');
    closeProductSettingsModal();
}

function openProductSettingsModal() {
    let modal = document.getElementById('productSettingsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'productSettingsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:480px;">
                <h2 style="margin-bottom:20px;">⚙️ Cài đặt sản phẩm</h2>
                <div class="form-group">
                    <label>Cấu trúc mã sản phẩm</label>
                    <input type="text" id="setProdStruct" value="NP_{count,4}" placeholder="VD: NP_{count,4}">
                    <small style="color:#6b7280; display:block; margin-top:4px;">
                        {count,N} = số thứ tự N chữ số &nbsp;|&nbsp; {year} = năm hiện tại<br>
                        VD: NP_{count,4} → NP_1003 &nbsp;|&nbsp; SP-{year}-{count,3} → SP-2026-001
                    </small>
                </div>
                <div class="form-group">
                    <label>Số bắt đầu</label>
                    <input type="number" id="setProdStart" value="1000" min="1">
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:10px;">
                    <input type="checkbox" id="setProdAllowEdit" checked>
                    <label for="setProdAllowEdit" style="margin:0;">Cho phép sửa mã khi tạo sản phẩm</label>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button class="btn-primary" onclick="saveProductSettings()" style="flex:1;">💾 Lưu cài đặt</button>
                    <button class="btn-secondary" onclick="closeProductSettingsModal()" style="flex:1; background:#6c757d; color:#fff; border:none; padding:10px; border-radius:8px; cursor:pointer;">Đóng</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.onclick = (e) => { if (e.target === modal) closeProductSettingsModal(); };
    }
    document.getElementById('setProdStruct').value = PRODUCT_SETTINGS.codeStructure;
    document.getElementById('setProdStart').value = PRODUCT_SETTINGS.counterStart;
    document.getElementById('setProdAllowEdit').checked = PRODUCT_SETTINGS.allowEditCode;
    modal.style.display = 'flex';
}

function closeProductSettingsModal() {
    const modal = document.getElementById('productSettingsModal');
    if (modal) modal.style.display = 'none';
}

function initProductModule() {
    loadProductData();
    const container = document.getElementById('products-tab');
    if (!container) return;

    // Hide title and make header minimal (same as orders module)
    const mainTitle = document.getElementById('mainTitle');
    if (mainTitle) mainTitle.style.display = 'none';
    const headerSection = document.querySelector('.header');
    if (headerSection) headerSection.classList.add('orders-minimal-header');

    // Auto-collapse sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('collapsed')) {
        sidebar._wasOpenBeforeOrders = true;
        sidebar.classList.add('collapsed');
    }
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) sidebarToggle.style.display = 'none';

    const allProducts = PRODUCTS;
    const totalPages = Math.max(1, Math.ceil(allProducts.length / 50));

    container.innerHTML = `
        <div class="ord-1office-layout">
            <div class="ord-main-content">
                <div class="ord-1o-header">
                    <div class="ord-1o-header-left">
                        <button class="ord-1o-add-btn" onclick="openAddProductModal()" title="Thêm sản phẩm mới">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                        <h2 class="ord-1o-title">Danh sách sản phẩm</h2>
                    </div>
                    <div class="ord-1o-header-right">
                        <div class="ord-1o-search">
                            <svg class="ord-1o-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0b7c3" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input type="text" placeholder="Tìm kiếm" id="prodSearchInput" oninput="renderProductGrid()">
                            <svg class="ord-1o-search-filter" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0b7c3" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
                        </div>
                    </div>
                </div>
                <div class="ord-1o-tabs-row">
                    <div class="ord-1o-tabs-left">
                        <button class="ord-1o-hamburger">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        </button>
                        <div class="ord-1o-tab active" id="prodTabCount">Sản phẩm (${allProducts.length})</div>
                    </div>
                </div>
                <div class="ord-1o-toolbar">
                    <div class="ord-1o-toolbar-left">
                        <button class="ord-1o-tool-icon" title="Bộ lọc">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
                        </button>
                        <button class="ord-1o-tool-icon" title="Hiển thị dạng lưới">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                        </button>
                        <span class="ord-1o-record-info">Hiển thị 1 - ${Math.min(50, allProducts.length)} / ${allProducts.length} bản ghi</span>
                        <span class="ord-1o-page-label">Trang:</span>
                        <span class="ord-1o-page-num">01</span>
                        <svg class="ord-1o-page-dropdown" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                        <span class="ord-1o-page-sep">/ ${totalPages < 10 ? '0' + totalPages : totalPages}</span>
                        <button class="ord-1o-page-arrow">&lt;</button>
                        <button class="ord-1o-page-arrow">&gt;</button>
                    </div>
                    <div class="ord-1o-toolbar-right">
                        <button class="ord-1o-action-btn" onclick="openProductSettingsModal()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> Cài đặt</button>
                    </div>
                </div>
                <div class="ord-1o-table-wrap">
                    <table class="ord-1o-table">
                        <thead>
                            <tr>
                                <th class="ord-1o-th-cb"><input type="checkbox"></th>
                                <th style="min-width:120px;">Mã sản phẩm</th>
                                <th style="min-width:300px;">Tên sản phẩm</th>
                                <th style="width:80px;">Đơn vị</th>
                                <th style="width:60px;"></th>
                                <th style="width:100px; text-align:center;">Người tạo</th>
                                <th style="width:120px; text-align:right; padding-right:20px;">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody id="prodTableBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    renderProductGrid();
}

function renderCategories() {
    const list = document.getElementById('prodCatList');
    if (!list) return;

    list.innerHTML = PRODUCT_CATEGORIES.map(cat => `
        <div class="prod-cat-item ${cat.id === activeCategoryId ? 'active' : ''}" onclick="selectCategory(${cat.id})">
            <span class="prod-cat-icon">${cat.icon || '📁'}</span>
            <span>${cat.name}</span>
        </div>
    `).join('');
}

function selectCategory(id) {
    activeCategoryId = id;
    renderCategories();
    renderProductGrid();
}

function renderProductGrid() {
    const tbody = document.getElementById('prodTableBody');
    if (!tbody) return;

    const searchText = document.getElementById('prodSearchInput')?.value.toLowerCase() || '';

    const filtered = PRODUCTS.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchText) || p.code.toLowerCase().includes(searchText);
        return matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" style="text-align:center; padding:50px; color:#94a3b8;">
                <div style="font-size:40px; margin-bottom:15px;">📦</div>
                <p>Chưa có sản phẩm nào</p>
            </td></tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const creatorInitial = 'P';
        const createdDate = p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '--';
        return `
            <tr onclick="editProduct(${p.id})" oncontextmenu="showGlobalContextMenu(event, function(){ editProduct(${p.id}); }, function(){ deleteProduct(${p.id}); })" style="cursor:pointer;">
                <td class="ord-1o-td-cb" onclick="event.stopPropagation()"><input type="checkbox"></td>
                <td style="color:#6b7280; font-size:14px;">${p.code}</td>
                <td><span class="ord-1o-so-text">${p.name.toUpperCase()}</span></td>
                <td style="color:#6b7280; font-size:14px;">${p.unit || '--'}</td>
                <td></td>
                <td style="text-align:center;"><div class="ord-1o-avatar">${creatorInitial}</div></td>
                <td style="text-align:right; padding-right:20px; color:#6b7280; font-size:13px;">${createdDate}</td>
            </tr>
        `;
    }).join('');

    // Update tab count
    const tabCount = document.getElementById('prodTabCount');
    if (tabCount) tabCount.textContent = 'Sản phẩm (' + filtered.length + ')';
}

// ---- Context Menu (Right-Click) - ĐÃ TẮT (Sử dụng menu chuột phải mặc định) ----
function showProductContextMenu(e, productId) {
    // Đã tắt - sử dụng menu chuột phải mặc định của trình duyệt
}

function hideProductContextMenu() {
    const menu = document.getElementById('prodContextMenu');
    if (menu) menu.remove();
}

function deleteProduct(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) return;

    PRODUCTS = PRODUCTS.filter(p => p.id !== id);
    saveProducts();
    renderProductGrid();
    showToast('🗑️ Đã xóa sản phẩm "' + product.name + '"');
}

function openAddProductModal() {
    renderCreateProductPage();
}

function renderCreateProductPage(editId = null) {
    const container = document.getElementById('products-tab');
    const existing = editId ? PRODUCTS.find(p => p.id === editId) : null;

    container.innerHTML = `
        <div class="prod-create-container">
            <div class="prod-create-header">
                <h2>${editId ? 'Cập nhật sản phẩm' : 'Tạo mới sản phẩm'}</h2>
            </div>

            <div class="prod-form-section">
                <div class="prod-section-title">
                    <span>∨</span> Thông tin chung
                </div>
                
                <div class="prod-form-grid">
                    <!-- Mã sản phẩm -->
                    <div class="prod-input-box">
                        <label>Mã sản phẩm <span>*</span></label>
                        <input type="text" id="p-code" value="${existing ? existing.code : generateProductCode()}">
                        <span class="prod-input-icon" onclick="document.getElementById('p-code').value = generateProductCode()">🔄</span>
                    </div>

                    <!-- Tên sản phẩm -->
                    <div class="prod-input-box">
                        <label>Tên sản phẩm <span>*</span></label>
                        <input type="text" id="p-name" placeholder="Tên sản phẩm" value="${existing ? existing.name : ''}">
                    </div>

                    <!-- Đơn vị -->
                    <div class="prod-input-box" style="display:flex; align-items:center; gap:6px;">
                        <div style="flex:1;">
                            <label>Đơn vị <span>*</span></label>
                            <select id="p-unit">
                                ${PRODUCT_UNITS.map(u => '<option value="' + u + '"' + (existing?.unit === u ? ' selected' : '') + '>' + u + '</option>').join('')}
                            </select>
                        </div>
                        <button type="button" onclick="addQuickUnit('p-unit')" title="Thêm đơn vị mới" style="background:none; border:1px solid #d1d5db; border-radius:6px; width:28px; height:28px; cursor:pointer; color:#9ca3af; font-size:15px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0; margin-top:8px;" onmouseover="this.style.borderColor='#F94949'; this.style.color='#F94949';" onmouseout="this.style.borderColor='#d1d5db'; this.style.color='#9ca3af';">+</button>
                    </div>

                    <!-- Giá bán -->
                    <div class="prod-input-box">
                        <label>Giá bán <span>*</span></label>
                        <input type="number" id="p-price" value="${existing ? existing.price : '0'}">
                    </div>
                    <!-- Mô tả / Quy cách -->
                    <div class="prod-input-box full" style="grid-column: span 2;">
                        <label>Mô tả / Quy cách sản phẩm</label>
                        <textarea id="p-desc" placeholder="Ví dụ: Kích thước 21x29.7cm, Giấy C150, Cán màng mờ..." style="width: 100%; height: 80px; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">${existing ? (existing.desc || '') : ''}</textarea>
                    </div>
                </div>
            </div>

            <div class="prod-create-footer">
                <button class="prod-btn-primary" onclick="saveProductDetailed(${editId})">Lưu sản phẩm</button>
                <button class="prod-btn-secondary" onclick="initProductModule()">Hủy bỏ</button>
            </div>
        </div>
    `;
}

function saveProductDetailed(editId = null) {
    const code = document.getElementById('p-code').value.trim();
    const name = document.getElementById('p-name').value.trim();
    const unit = document.getElementById('p-unit').value;
    const price = parseInt(document.getElementById('p-price').value) || 0;
    const desc = document.getElementById('p-desc').value.trim();

    if (!code || !name) {
        showToast('❌ Vui lòng nhập đầy đủ Mã và Tên sản phẩm', 'error');
        return;
    }

    if (editId) {
        const idx = PRODUCTS.findIndex(p => p.id === editId);
        if (idx !== -1) {
            PRODUCTS[idx] = { ...PRODUCTS[idx], code, name, unit, price, desc };
        }
    } else {
        const newId = PRODUCTS.length > 0 ? Math.max(...PRODUCTS.map(p => p.id)) + 1 : 1;
        PRODUCTS.push({
            id: newId,
            catId: activeCategoryId,
            code,
            name,
            unit,
            price,
            desc
        });
    }

    saveProducts();

    // ⇄ Phát sự kiện để đồng bộ 2 chiều với các module khác
    window.dispatchEvent(new CustomEvent('netprint:products-updated', { detail: { products: PRODUCTS } }));

    initProductModule();
    showToast('✅ Đã lưu sản phẩm thành công!');
}

function editProduct(id) {
    renderCreateProductPage(id);
}

// Sidebar logic for 1Office style
function toggleProductSidebar(active = true, callback = null) {
    let overlay = document.querySelector('.prod-sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'prod-sidebar-overlay';
        overlay.innerHTML = `
            <div class="prod-sidebar-container">
                <div class="prod-sidebar-header">
                    <h3>Tạo mới sản phẩm</h3>
                    <span class="prod-sidebar-close" onclick="toggleProductSidebar(false)">×</span>
                </div>
                <div class="prod-sidebar-body" id="prodSidebarBody"></div>
                <div class="prod-sidebar-footer">
                    <button class="prod-btn-secondary" onclick="toggleProductSidebar(false)">Hủy bỏ</button>
                    <button class="prod-btn-primary" id="prodSidebarSaveBtn">Cập nhật</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.onclick = (e) => { if (e.target === overlay) toggleProductSidebar(false); };
    }

    const container = overlay.querySelector('.prod-sidebar-container');
    if (active) {
        overlay.style.display = 'block';
        setTimeout(() => container.classList.add('active'), 10);
        renderSidebarForm(callback);
    } else {
        container.classList.remove('active');
        setTimeout(() => overlay.style.display = 'none', 300);
    }
}

function renderSidebarForm(callback) {
    const body = document.getElementById('prodSidebarBody');
    const tempId = generateProductCode();

    body.innerHTML = `
        <div class="prod-sidebar-section">
            <div class="prod-sidebar-section-title">
                <i>∨</i> Thông tin sản phẩm
            </div>
            
            <div class="prod-sidebar-grid">
                <!-- Mã sản phẩm -->
                <div class="prod-sidebar-field">
                    <label>Mã sản phẩm <span>*</span></label>
                    <div class="prod-sidebar-input-wrapper">
                        <input type="text" id="sb-p-code" value="${tempId}" placeholder="Mã tự động">
                    </div>
                </div>

                <!-- Đơn vị -->
                <div class="prod-sidebar-field">
                    <label>Đơn vị tính <span>*</span></label>
                    <div class="prod-sidebar-input-wrapper" style="display:flex; align-items:center; gap:6px;">
                        <select id="sb-p-unit" style="flex:1;">
                            ${PRODUCT_UNITS.map(u => '<option value="' + u + '"' + (u === 'Cái' ? ' selected' : '') + '>' + u + '</option>').join('')}
                        </select>
                        <button type="button" onclick="addQuickUnit('sb-p-unit')" title="Thêm đơn vị mới" style="background:none; border:1px solid #d1d5db; border-radius:6px; width:30px; height:30px; cursor:pointer; color:#9ca3af; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0;" onmouseover="this.style.borderColor='#F94949'; this.style.color='#F94949';" onmouseout="this.style.borderColor='#d1d5db'; this.style.color='#9ca3af';">+</button>
                    </div>
                </div>

                <!-- Tên sản phẩm -->
                <div class="prod-sidebar-field full">
                    <label>Tên sản phẩm <span>*</span></label>
                    <div class="prod-sidebar-input-wrapper">
                        <input type="text" id="sb-p-name" placeholder="Ví dụ: Catalogue A4 - Couche 150">
                    </div>
                </div>

                <!-- Nhóm sản phẩm -->
                <div class="prod-sidebar-field full">
                    <label>Nhóm sản phẩm</label>
                    <div class="prod-sidebar-input-wrapper" style="display:flex; align-items:center; gap:6px;">
                        <select id="sb-p-group" style="flex:1;">
                            <option value="">-- Chọn nhóm --</option>
                            ${PRODUCT_CATEGORIES.map(c => '<option value="' + c.id + '">' + (c.icon || '📁') + ' ' + c.name + '</option>').join('')}
                        </select>
                        <button type="button" onclick="addQuickGroup('sb-p-group')" title="Thêm nhóm mới" style="background:none; border:1px solid #d1d5db; border-radius:6px; width:30px; height:30px; cursor:pointer; color:#9ca3af; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0;" onmouseover="this.style.borderColor='#F94949'; this.style.color='#F94949';" onmouseout="this.style.borderColor='#d1d5db'; this.style.color='#9ca3af';">+</button>
                    </div>
                </div>

                <!-- Giá bán -->
                <div class="prod-sidebar-field full">
                    <label>Giá bán mặc định (VNĐ) <span>*</span></label>
                    <div class="prod-sidebar-input-wrapper">
                        <input type="number" id="sb-p-price" value="0" placeholder="0">
                        <span class="prod-sidebar-input-icon">₫</span>
                    </div>
                </div>

                <!-- Quy cách / Mô tả -->
                <div class="prod-sidebar-field full">
                    <label>Mô tả / Quy cách sản phẩm</label>
                    <div class="prod-sidebar-input-wrapper">
                        <textarea id="sb-p-desc" placeholder="Ví dụ: Kích thước 21x29.7cm, Giấy C150, Cán màng mờ..." style="width: 100%; height: 100px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; outline: none; transition: all 0.2s; resize: vertical;"></textarea>
                    </div>
                </div>
            </div>
        </div>

        <div style="padding: 0 10px; color: #64748b; font-size: 13px; line-height: 1.6;">
            <p>💡 <b>Mẹo:</b> Sản phẩm sau khi tạo sẽ được lưu vào danh mục hiện tại và tự động áp dụng vào đơn hàng đang soạn thảo.</p>
        </div>
    `;

    // Update footer buttons classes
    const footer = document.querySelector('.prod-sidebar-footer');
    if (footer) {
        footer.innerHTML = `
            <button class="sb-btn-cancel" onclick="toggleProductSidebar(false)">Hủy bỏ</button>
            <button class="sb-btn-submit" id="prodSidebarSaveBtn">Lưu sản phẩm</button>
        `;
    }

    document.getElementById('prodSidebarSaveBtn').onclick = () => {
        const code = document.getElementById('sb-p-code').value.trim();
        const name = document.getElementById('sb-p-name').value.trim();
        const unit = document.getElementById('sb-p-unit').value;
        const price = parseInt(document.getElementById('sb-p-price').value) || 0;
        const desc = document.getElementById('sb-p-desc').value.trim();

        if (!name) {
            const nameInput = document.getElementById('sb-p-name');
            nameInput.style.borderColor = '#ef4444';
            nameInput.focus();
            return showToast('❌ Vui lòng nhập tên sản phẩm', 'error');
        }

        const newId = PRODUCTS.length > 0 ? Math.max(...PRODUCTS.map(p => p.id)) + 1 : 1;
        // Use selected group, or default category
        const groupSelect = document.getElementById('sb-p-group');
        const catId = groupSelect && groupSelect.value ? parseInt(groupSelect.value) : ((typeof activeCategoryId !== 'undefined') ? activeCategoryId : 1);

        const newProd = { id: newId, catId, code, name, unit, price, desc };
        PRODUCTS.push(newProd);

        // Sync with storage
        if (typeof saveProducts === 'function') {
            saveProducts();
        } else {
            localStorage.setItem('netprint_products', JSON.stringify(PRODUCTS));
        }

        if (callback && typeof callback === 'function') {
            callback(newProd);
        }

        toggleProductSidebar(false);
        if (typeof renderProductGrid === 'function') renderProductGrid();
        showToast('✅ Đã tạo sản phẩm thành công!');
    };
}

// Override old functions to use sidebar when needed
function openAddProductModal(callback = null) {
    toggleProductSidebar(true, callback);
}

function openAddCategoryModal() {
    const name = prompt("Tên danh mục mới:");
    if (!name) return;
    const icon = prompt("Icon (Emoji):", "📁");

    const newId = PRODUCT_CATEGORIES.length > 0 ? Math.max(...PRODUCT_CATEGORIES.map(c => c.id)) + 1 : 1;
    PRODUCT_CATEGORIES.push({ id: newId, name, icon });

    saveCategories();
    renderCategories();
}

// Exposure
window.initProductModule = initProductModule;
window.selectCategory = selectCategory;
window.openAddProductModal = openAddProductModal;
window.openAddCategoryModal = openAddCategoryModal;
window.editProduct = editProduct;
window.openProductSettingsModal = openProductSettingsModal;
window.closeProductSettingsModal = closeProductSettingsModal;
window.saveProductSettings = saveProductSettings;
window.generateProductCode = generateProductCode;
window.showProductContextMenu = showProductContextMenu;
window.hideProductContextMenu = hideProductContextMenu;
window.deleteProduct = deleteProduct;
window.addQuickUnit = addQuickUnit;
window.addQuickGroup = addQuickGroup;
window.openQuickManageModal = openQuickManageModal;
window.closeQuickManageModal = closeQuickManageModal;
window.addQuickItem = addQuickItem;
window.deleteQuickItem = deleteQuickItem;
