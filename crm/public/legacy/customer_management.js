/* 
    NETPRINT - CUSTOMER MANAGEMENT MODULE (CRM STYLE)
    Clean spreadsheet-like design matching reference UI.
*/

let CUSTOMERS = [];
let currentPage = 1;
let pageSize = 20;

// Context Menu - ĐÃ TẮT (Sử dụng menu chuột phải mặc định của trình duyệt)
let currentContextMenuId = null;

function loadCustomers() {
    const saved = localStorage.getItem('netprint_customers');
    if (saved) {
        CUSTOMERS = JSON.parse(saved);
    } else {
        CUSTOMERS = [
            { id: 1, code: "KH_001", name: "Nguyễn Văn Anh", phone: "0901234567", address: "123 Quận 1, TP.HCM", email: "anhnv@gmail.com", type: "Cá nhân", debt: 500000, total_spent: 15000000, last_order: "2024-02-28", seller: "admin", created: "2024-01-15" },
            { id: 2, code: "KH_002", name: "Trần Thị Bình", phone: "0912345678", address: "456 Quận 3, TP.HCM", email: "binh.tran@gmail.com", type: "Cá nhân", debt: 0, total_spent: 2500000, last_order: "2024-03-01", seller: "sale01", created: "2024-02-10" },
            { id: 3, code: "KH_003", name: "Công ty In Ấn ABC", phone: "02838445566", address: "789 Tân Bình, TP.HCM", email: "info@abcprint.vn", type: "Tổ chức", debt: 1200000, total_spent: 45000000, last_order: "2024-02-15", seller: "admin", created: "2024-01-05" }
        ];
        saveCustomers();
    }
}

function saveCustomers() {
    localStorage.setItem('netprint_customers', JSON.stringify(CUSTOMERS));
}

// ===================== LIST VIEW =====================
function renderCustomerListView() {
    const container = document.getElementById('customers-tab');
    if (!container) return;

    container.innerHTML = `
        <div class="cust-list-wrapper">
            <!-- Page Header -->
            <div class="cust-page-header">
                <div class="cust-page-left">
                    <h1 class="cust-page-title">Danh sách khách hàng</h1>
                </div>
                <div class="cust-page-right">
                    <div class="cust-search-wrapper">
                        <div class="cust-search-box" onclick="toggleSearchPanel()">
                            <span class="cust-search-icon">🔍</span>
                            <input type="text" id="customerSearchInput" placeholder="Tìm kiếm..." readonly>
                            <span class="cust-search-filter-icon">⚙</span>
                        </div>
                        <!-- Advanced Search Panel -->
                        <div class="cust-search-panel" id="custSearchPanel" style="display:none;">
                            <div class="cust-search-panel-header">
                                <span>Tìm kiếm</span>
                                <span class="cust-search-panel-close" onclick="closeSearchPanel()">✕</span>
                            </div>
                            <div class="cust-search-panel-body">
                                <div class="cust-search-field">
                                    <label>Từ khóa</label>
                                    <input type="text" id="sfKeyword" placeholder="Nhập từ khóa...">
                                </div>
                                <div class="cust-search-field">
                                    <label>Người phụ trách</label>
                                    <select id="sfSeller">
                                        <option value="">Tất cả</option>
                                    </select>
                                </div>
                                <div class="cust-search-field">
                                    <label>Địa chỉ</label>
                                    <input type="text" id="sfAddress" placeholder="Nhập địa chỉ...">
                                </div>
                                <div class="cust-search-field">
                                    <label>Số điện thoại</label>
                                    <input type="text" id="sfPhone" placeholder="Nhập SĐT...">
                                </div>
                                <div class="cust-search-field">
                                    <label>Mã khách hàng</label>
                                    <input type="text" id="sfCode" placeholder="Nhập mã KH...">
                                </div>
                            </div>
                            <div class="cust-search-panel-footer">
                                <button class="cust-search-btn-search" onclick="applySearchFilters()">TÌM KIẾM</button>
                                <button class="cust-search-btn-clear" onclick="clearSearchFilters()">XÓA BỘ LỌC</button>
                            </div>
                        </div>
                    </div>
                    <button class="cust-toolbar-btn cust-btn-create" onclick="openAddCustomerPage()">＋ Tạo</button>
                </div>
            </div>

            <!-- Filter & Pagination bar -->
            <div class="cust-filter-bar">
                <div class="cust-filter-left">
                    <span class="cust-filter-label">Hiển thị</span>
                    <select id="pageSizeSelect" class="cust-filter-select" onchange="changePageSize(this.value)">
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <span class="cust-filter-label">của <strong id="totalCountLabel">0</strong> kết quả</span>
                    <span class="cust-filter-divider">|</span>
                    <span class="cust-filter-label">Trang</span>
                    <select id="sellerFilter" class="cust-filter-select" onchange="renderCustomerTable()">
                        <option value="all">Tất cả</option>
                    </select>
                </div>
                <div class="cust-pagination" id="paginationControls"></div>
            </div>

            <!-- Data Table -->
            <div class="cust-table-container">
                <table class="cust-data-table">
                    <thead>
                        <tr>
                            <th class="cust-th-check"><input type="checkbox" id="checkAllCust" onclick="toggleCheckAll(this)"></th>
                            <th>Mã KH</th>
                            <th>Tên khách hàng</th>
                            <th>Điện thoại</th>
                            <th>Email</th>
                            <th>Địa chỉ</th>
                            <th>Ngày tạo</th>
                        </tr>
                    </thead>
                    <tbody id="customerTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    renderCustomerTable();
    populateSellerFilter();
}

// Current active filters
let activeFilters = { keyword: '', seller: '', address: '', phone: '', code: '' };

function renderCustomerTable() {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;

    const f = activeFilters;

    let filtered = CUSTOMERS.filter(c => {
        if (f.keyword) {
            const kw = f.keyword.toLowerCase();
            const matchKw = (c.name || '').toLowerCase().includes(kw) ||
                (c.email || '').toLowerCase().includes(kw) ||
                (c.phone || '').includes(kw) ||
                (c.code || '').toLowerCase().includes(kw);
            if (!matchKw) return false;
        }
        if (f.seller && (c.seller || '').toLowerCase() !== f.seller.toLowerCase()) return false;
        if (f.address && !(c.address || '').toLowerCase().includes(f.address.toLowerCase())) return false;
        if (f.phone && !(c.phone || '').includes(f.phone)) return false;
        if (f.code && !(c.code || '').toLowerCase().includes(f.code.toLowerCase())) return false;
        return true;
    }).sort((a, b) => b.id - a.id);

    // Update total count
    const totalLabel = document.getElementById('totalCountLabel');
    if (totalLabel) totalLabel.textContent = filtered.length;

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * pageSize;
    const paginated = filtered.slice(startIdx, startIdx + pageSize);

    renderPagination(totalPages);

    tbody.innerHTML = paginated.map(c => {
        const initials = getInitials(c.name);
        const avatarColor = getAvatarColor(c.id);
        const typeIcon = c.type === 'Tổ chức' ? '🏢' : '';
        const createdDate = c.created ? formatDateShort(c.created) : (c.last_order ? formatDateShort(c.last_order) : '-');

        return `
        <tr data-id="${c.id}" onclick="editCustomerPage(${c.id})" oncontextmenu="showGlobalContextMenu(event, function(){ editCustomerPage(${c.id}); }, function(){ deleteCustomer(${c.id}); })" style="cursor:pointer;">
            <td class="cust-td-check" onclick="event.stopPropagation()"><input type="checkbox" class="cust-row-check" value="${c.id}"></td>
            <td class="cust-code-cell">${c.code || ''}</td>
            <td class="cust-name-cell-v2">${c.name || ''}</td>
            <td>${c.phone ? `<span class="cust-phone-badge">${c.phone}</span>` : ''}</td>
            <td class="cust-email-cell">${c.email || ''}</td>
            <td class="cust-address-cell">${c.address || ''}</td>
            <td class="cust-date-cell">${createdDate}</td>
        </tr>`;
    }).join('');

    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="cust-empty-row">Không tìm thấy khách hàng nào</td></tr>`;
    }
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container) return;

    let html = '';
    html += `<button class="page-btn" onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;
    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'page-active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    html += `<button class="page-btn" onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
    container.innerHTML = html;
}

window.goToPage = function (page) {
    const totalPages = Math.max(1, Math.ceil(CUSTOMERS.length / pageSize));
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCustomerTable(document.getElementById('customerSearchInput')?.value || '');
};

window.changePageSize = function (size) {
    pageSize = parseInt(size) || 20;
    currentPage = 1;
    renderCustomerTable(document.getElementById('customerSearchInput')?.value || '');
};

window.toggleCheckAll = function (el) {
    document.querySelectorAll('.cust-row-check').forEach(cb => cb.checked = el.checked);
};

// ===================== FORM VIEW (FULL PAGE) =====================
function getCustomerFormHTML(titleText, editingId) {
    return `
        <div class="customer-form-fullpage">
            <div class="cust-form-topbar">
                <button class="cust-form-back-btn" onclick="backToCustomerList()">← Quay lại</button>
                <div class="cust-form-topbar-title">
                    <span class="header-icon-plus">+</span>
                    <h2>${titleText}</h2>
                </div>
                <div class="cust-form-topbar-actions">
                    <button class="btn-crm-cancel" onclick="backToCustomerList()">Hủy bỏ</button>
                    <button class="btn-crm-save" onclick="saveCustomer()">💾 Lưu thông tin</button>
                </div>
            </div>

            <div class="cust-form-body">
                <form id="customerForm">
                    <input type="hidden" id="customerId" value="${editingId || ''}">

                    <!-- Section: Thông tin chung -->
                    <div class="form-section-group">
                        <div class="form-section-header" onclick="toggleFormSection('ttchung')">
                            <span class="section-chevron" id="icon-ttchung">▼</span>
                            <span class="section-title-text">Thông tin chung</span>
                        </div>
                        <div class="form-section-content" id="content-ttchung">
                            <div class="crm-grid">
                                <div class="crm-input-group floating-label-group">
                                    <label class="floating-label">Loại khách hàng <span class="required">*</span></label>
                                    <div class="input-with-icon">
                                        <select id="custType" onchange="toggleCustomerTypeFields()">
                                            <option value="Cá nhân">Cá nhân</option>
                                            <option value="Tổ chức">Tổ chức</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="crm-input-group floating-label-group">
                                    <label class="floating-label">Mã KH <span class="required">*</span></label>
                                    <div class="input-with-icon">
                                        <input type="text" id="custCode" value="">
                                        <span class="right-icon clickable" onclick="reloadCustCode()">↻</span>
                                    </div>
                                </div>

                                <!-- Cá nhân fields -->
                                <div id="caNhanFields" style="display: contents;">
                                    <div class="crm-input-group crm-grid-full">
                                        <input type="text" id="custName" placeholder="Tên khách hàng *" required>
                                    </div>
                                    <div class="crm-input-group">
                                        <select id="custTitle">
                                            <option value="">Danh xưng</option>
                                            <option value="Anh">Anh</option>
                                            <option value="Chị">Chị</option>
                                            <option value="Ông">Ông</option>
                                            <option value="Bà">Bà</option>
                                        </select>
                                    </div>
                                    <div class="crm-input-group">
                                        <div class="input-with-icon">
                                            <input type="text" onfocus="(this.type='date')" onblur="if(!this.value)this.type='text'" id="custDob" placeholder="Ngày sinh">
                                            <span class="right-icon">📅</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Tổ chức fields -->
                                <div id="toChucFields" style="display: none;">
                                    <div class="crm-input-group floating-label-group">
                                        <div class="input-with-icon">
                                            <input type="text" id="custTaxCode" placeholder="Mã số thuế/ĐKKD">
                                            <span class="right-icon">🔍</span>
                                        </div>
                                    </div>
                                    <div class="crm-input-group">
                                        <div class="input-with-icon">
                                            <input type="text" onfocus="(this.type='date')" onblur="if(!this.value)this.type='text'" id="custEstablishDate" placeholder="Ngày thành lập">
                                            <span class="right-icon">📅</span>
                                        </div>
                                    </div>
                                    <div class="crm-input-group crm-grid-full">
                                        <input type="text" id="custOrgName" placeholder="Tên tổ chức *">
                                    </div>
                                </div>

                                <!-- Common -->
                                <div class="crm-input-group">
                                    <input type="text" id="custPhone" placeholder="Số điện thoại" required>
                                </div>
                                <div class="crm-input-group">
                                    <input type="email" id="custEmail" placeholder="Email">
                                </div>

                                <div id="phuTrachField" class="crm-input-group crm-grid-full floating-label-group" style="display: none;">
                                    <label class="floating-label">Phụ trách kinh doanh</label>
                                    <div class="input-with-icon">
                                        <input type="text" id="custAdmin" value="Admin">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Section: Thông tin khác -->
                    <div class="form-section-group">
                        <div class="form-section-header" onclick="toggleFormSection('ttkhac')">
                            <span class="section-chevron" id="icon-ttkhac">▼</span>
                            <span class="section-title-text">Thông tin khác</span>
                        </div>
                        <div class="form-section-content" id="content-ttkhac">
                            <span class="field-label-title">Địa chỉ</span>
                            <div class="crm-grid">
                                <div class="crm-input-group">
                                    <input type="text" id="custAddressNumber" placeholder="Số, đường">
                                </div>
                                <div class="crm-input-group">
                                    <div class="input-with-icon">
                                        <input type="text" id="custAddressGeo" placeholder="Xã phường, Quận huyện, Tỉnh thành">
                                        <span class="right-icon">🔍</span>
                                    </div>
                                </div>
                            </div>

                            <div class="crm-grid" style="margin-top: 12px;">
                                <div class="crm-input-group crm-grid-full floating-label-group" style="margin-top: 8px;">
                                    <label class="floating-label">Mô tả</label>
                                    <input type="text" id="custDesc" placeholder="Điền mô tả khách hàng">
                                </div>

                                <div class="crm-input-group crm-grid-full floating-label-group" style="margin-top: 15px;">
                                    <label class="floating-label" style="color:#b0bec5;">Đính kèm</label>
                                    <div class="file-upload-zone">
                                        <div class="upload-icon-circle"><span>☁</span></div>
                                        <div class="upload-text-area">
                                            <p>Kéo thả file vào đây để tải lên hoặc</p>
                                            <div class="upload-btns">
                                                <button type="button" class="btn-upload-local">📎 CHỌN TỪ MÁY</button>
                                                <button type="button" class="btn-upload-cloud">☁ CHỌN TỪ CLOUD</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <div class="cust-form-bottom-bar">
                    <button class="btn-crm-cancel" onclick="backToCustomerList()">Hủy bỏ</button>
                    <button class="btn-crm-save" onclick="saveCustomer()">💾 Lưu thông tin</button>
                </div>
            </div>
        </div>
    `;
}

function openAddCustomerPage() {
    const container = document.getElementById('customers-tab');
    if (!container) return;

    const nextId = Math.max(0, ...CUSTOMERS.map(c => c.id)) + 1;
    container.innerHTML = getCustomerFormHTML('Tạo mới khách hàng', '');

    document.getElementById('custCode').value = generateCustomerCode(nextId);
    document.getElementById('custType').value = 'Cá nhân';
    toggleCustomerTypeFields();
}

function editCustomerPage(id) {
    const c = CUSTOMERS.find(c => c.id == id);
    if (!c) return;

    if (typeof currentUser !== 'undefined' && currentUser && currentUser.role !== 'admin' && c.seller !== currentUser.username) {
        showToast('⚠️ Bạn không có quyền sửa khách hàng của Sale khác!');
        return;
    }

    const container = document.getElementById('customers-tab');
    if (!container) return;

    container.innerHTML = getCustomerFormHTML('Chỉnh sửa khách hàng', c.id);

    document.getElementById('custCode').value = c.code || generateCustomerCode(c.id);
    document.getElementById('custType').value = c.type === 'Tổ chức' ? 'Tổ chức' : 'Cá nhân';
    toggleCustomerTypeFields();

    if (c.type === 'Tổ chức') {
        document.getElementById('custOrgName').value = c.name;
        document.getElementById('custTaxCode').value = c.taxCode || '';
        document.getElementById('custEstablishDate').value = c.estDate || '';
        document.getElementById('custAdmin').value = c.adminLabel || 'Admin';
    } else {
        document.getElementById('custName').value = c.name;
        document.getElementById('custTitle').value = c.title || '';
        document.getElementById('custDob').value = c.dob || '';
    }

    document.getElementById('custPhone').value = c.phone || '';

    let addressNum = c.address || '';
    let addressGeo = '';
    if (c.address && c.address.includes(',')) {
        let parts = c.address.split(',');
        addressNum = parts[0].trim();
        addressGeo = parts.slice(1).join(',').trim();
    }
    document.getElementById('custAddressNumber').value = addressNum;
    document.getElementById('custAddressGeo').value = addressGeo;

    document.getElementById('custEmail').value = c.email || '';
    document.getElementById('custDesc').value = c.note || '';
}

function backToCustomerList() {
    currentPage = 1;
    renderCustomerListView();
}

// ===================== HELPERS =====================
function generateCustomerCode(nextId) {
    return 'KH_' + nextId.toString().padStart(3, '0');
}

function formatNumber(num) {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDateShort(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name[0].toUpperCase();
}

function getAvatarColor(id) {
    const colors = ['#e74c3c', '#e67e22', '#f39c12', '#27ae60', '#2980b9', '#8e44ad', '#1abc9c', '#d35400'];
    return colors[id % colors.length];
}

window.toggleCustomerTypeFields = function () {
    const type = document.getElementById('custType')?.value;
    const caNhan = document.getElementById('caNhanFields');
    const toChuc = document.getElementById('toChucFields');
    const phuTrach = document.getElementById('phuTrachField');
    if (!caNhan || !toChuc) return;
    if (type === 'Cá nhân') {
        caNhan.style.display = 'contents';
        toChuc.style.display = 'none';
        if (phuTrach) phuTrach.style.display = 'none';
    } else {
        caNhan.style.display = 'none';
        toChuc.style.display = 'contents';
        if (phuTrach) phuTrach.style.display = 'flex';
    }
};

window.toggleFormSection = function (section) {
    const content = document.getElementById('content-' + section);
    const icon = document.getElementById('icon-' + section);
    if (!content || !icon) return;
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.classList.remove('collapsed');
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.classList.add('collapsed');
        icon.textContent = '▶';
    }
};

window.reloadCustCode = function () {
    const nextId = Math.max(0, ...CUSTOMERS.map(c => c.id)) + 1;
    document.getElementById('custCode').value = generateCustomerCode(nextId);
};

function saveCustomer() {
    const id = document.getElementById('customerId').value;
    const type = document.getElementById('custType').value;
    const code = document.getElementById('custCode').value.trim();

    let name = '';
    if (type === 'Cá nhân') {
        name = document.getElementById('custName').value.trim();
    } else {
        name = document.getElementById('custOrgName').value.trim();
    }

    const phone = document.getElementById('custPhone').value.trim();

    const addressNum = document.getElementById('custAddressNumber').value.trim();
    const addressGeo = document.getElementById('custAddressGeo').value.trim();
    const address = addressNum + (addressNum && addressGeo ? ', ' : '') + addressGeo;

    const email = document.getElementById('custEmail').value.trim();
    const note = document.getElementById('custDesc')?.value.trim() || '';

    const title = type === 'Cá nhân' ? (document.getElementById('custTitle')?.value || '') : '';
    const dob = type === 'Cá nhân' ? (document.getElementById('custDob')?.value || '') : '';
    const taxCode = type === 'Tổ chức' ? (document.getElementById('custTaxCode')?.value || '') : '';
    const estDate = type === 'Tổ chức' ? (document.getElementById('custEstablishDate')?.value || '') : '';
    const adminLabel = type === 'Tổ chức' ? (document.getElementById('custAdmin')?.value || '') : '';

    if (!name || !phone) {
        showToast('⚠️ Vui lòng nhập Tên và Số điện thoại!');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (id) {
        const idx = CUSTOMERS.findIndex(c => c.id == id);
        if (idx !== -1) {
            CUSTOMERS[idx] = {
                ...CUSTOMERS[idx],
                code, name, phone, address, email, type, note,
                title, dob, taxCode, estDate, adminLabel
            };
        }
    } else {
        const newId = Math.max(0, ...CUSTOMERS.map(c => c.id)) + 1;
        CUSTOMERS.push({
            id: newId,
            code: code || generateCustomerCode(newId),
            name, phone, address, email, type, debt: 0,
            total_spent: 0, last_order: null, note,
            title, dob, taxCode, estDate, adminLabel,
            created: today,
            seller: typeof currentUser !== 'undefined' && currentUser ? currentUser.username : 'admin'
        });
    }

    saveCustomers();
    backToCustomerList();
    showToast('✅ Đã lưu thông tin khách hàng');
}

function deleteCustomer(id) {
    if (confirm('🗑️ Bạn có chắc chắn muốn xóa khách hàng này?')) {
        CUSTOMERS = CUSTOMERS.filter(c => c.id != id);
        saveCustomers();
        renderCustomerTable();
        showToast('🗑️ Đã xóa khách hàng');
    }
}

function searchCustomers(query) {
    activeFilters.keyword = query || '';
    currentPage = 1;
    renderCustomerTable();
}

// === Search Panel Functions ===
window.toggleSearchPanel = function () {
    const panel = document.getElementById('custSearchPanel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};

window.closeSearchPanel = function () {
    const panel = document.getElementById('custSearchPanel');
    if (panel) panel.style.display = 'none';
};

window.applySearchFilters = function () {
    activeFilters.keyword = (document.getElementById('sfKeyword')?.value || '').trim();
    activeFilters.seller = (document.getElementById('sfSeller')?.value || '').trim();
    activeFilters.address = (document.getElementById('sfAddress')?.value || '').trim();
    activeFilters.phone = (document.getElementById('sfPhone')?.value || '').trim();
    activeFilters.code = (document.getElementById('sfCode')?.value || '').trim();

    // Update search input display text
    const parts = [];
    if (activeFilters.keyword) parts.push(activeFilters.keyword);
    if (activeFilters.seller) parts.push('PT: ' + activeFilters.seller);
    if (activeFilters.address) parts.push('ĐC: ' + activeFilters.address);
    if (activeFilters.phone) parts.push('SĐT: ' + activeFilters.phone);
    if (activeFilters.code) parts.push('Mã: ' + activeFilters.code);

    const searchInput = document.getElementById('customerSearchInput');
    if (searchInput) searchInput.value = parts.join(' | ') || '';

    currentPage = 1;
    renderCustomerTable();
    closeSearchPanel();
};

window.clearSearchFilters = function () {
    activeFilters = { keyword: '', seller: '', address: '', phone: '', code: '' };
    const ids = ['sfKeyword', 'sfSeller', 'sfAddress', 'sfPhone', 'sfCode'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const searchInput = document.getElementById('customerSearchInput');
    if (searchInput) searchInput.value = '';
    currentPage = 1;
    renderCustomerTable();
};

// Backward compatibility aliases
function openAddCustomerModal() { openAddCustomerPage(); }
function closeCustomerModal() { backToCustomerList(); }
function editCustomer(id) { editCustomerPage(id); }

function initCustomerModule() {
    loadCustomers();
    renderCustomerListView();
}

function populateSellerFilter() {
    const sellers = [...new Set(CUSTOMERS.map(c => c.seller).filter(Boolean))];

    // Populate filter bar dropdown
    const filter = document.getElementById('sellerFilter');
    if (filter) {
        filter.innerHTML = '<option value="all">Tất cả</option>';
        sellers.forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            filter.appendChild(option);
        });
    }

    // Populate search panel seller dropdown
    const sfSeller = document.getElementById('sfSeller');
    if (sfSeller) {
        sfSeller.innerHTML = '<option value="">Tất cả</option>';
        sellers.forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            sfSeller.appendChild(option);
        });
    }
}

// === Context Menu Functions - ĐÃ TẮT (Sử dụng menu chuột phải mặc định của trình duyệt) ===
window.showCustContextMenu = function (e, id) {
    // Đã tắt - sử dụng menu chuột phải mặc định
};

window.custCmEdit = function () {
    if (currentContextMenuId) {
        editCustomerPage(currentContextMenuId);
    }
};

window.custCmDelete = function () {
    if (currentContextMenuId) {
        deleteCustomer(currentContextMenuId);
    }
};

