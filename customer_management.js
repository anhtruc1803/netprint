/* 
    NETPRINT - CUSTOMER MANAGEMENT MODULE (PROFESSIONAL VERSION)
*/

let CUSTOMERS = [];

function loadCustomers() {
    const saved = localStorage.getItem('netprint_customers');
    if (saved) {
        CUSTOMERS = JSON.parse(saved);
    } else {
        CUSTOMERS = [
            { id: 1, code: "KH001", name: "Nguyễn Văn Anh", phone: "0901234567", address: "123 Quận 1, TP.HCM", email: "anhnv@gmail.com", type: "Đại lí cấp 1", debt: 500000, total_spent: 15000000, last_order: "2024-02-28", seller: "admin" },
            { id: 2, code: "KH002", name: "Trần Thị Bình", phone: "0912345678", address: "456 Quận 3, TP.HCM", email: "binh.tran@gmail.com", type: "Khách lẻ", debt: 0, total_spent: 2500000, last_order: "2024-03-01", seller: "sale01" },
            { id: 3, code: "KH003", name: "Công ty In Ấn ABC", phone: "02838445566", address: "789 Tân Bình, TP.HCM", email: "info@abcprint.vn", type: "Đại lí cấp 2", debt: 1200000, total_spent: 45000000, last_order: "2024-02-15", seller: "admin" }
        ];
        saveCustomers();
    }
}

function saveCustomers() {
    localStorage.setItem('netprint_customers', JSON.stringify(CUSTOMERS));
}

function renderCustomerTable(filterText = '') {
    const tbody = document.getElementById('customerTableBody');
    if (!tbody) return;

    const sellerFilter = document.getElementById('sellerFilter')?.value || 'all';

    const filtered = CUSTOMERS.filter(c => {
        const matchText = (c.name || '').toLowerCase().includes(filterText.toLowerCase()) ||
            (c.phone || '').includes(filterText) ||
            (c.code || '').toLowerCase().includes(filterText.toLowerCase());
        const matchSeller = sellerFilter === 'all' || c.seller === sellerFilter;
        return matchText && matchSeller;
    }).sort((a, b) => b.id - a.id); // Mới nhất lên đầu cho chuyên nghiệp

    tbody.innerHTML = filtered.map(c => `
        <tr data-id="${c.id}">
            <td class="text-center"><span class="cust-id-badge">${c.code || generateCustomerCode(c.id)}</span></td>
            <td>
                <div class="cust-name-cell">
                    <span class="cust-name-main">${c.name}</span>
                    <span class="cust-info-sub">📍 ${c.address || 'Chưa cập nhật địa chỉ'}</span>
                </div>
            </td>
            <td>
                <div class="cust-name-cell">
                    <span class="cust-name-main">${c.phone}</span>
                    <span class="cust-info-sub">📧 ${c.email || 'N/A'}</span>
                </div>
            </td>
            <td><span class="crm-badge ${c.type === 'Khách lẻ' ? 'badge-retail' : 'badge-agency'}">${c.type}</span></td>
            <td>
                <div class="seller-avatar-tag">
                    <div class="seller-avatar-circle">${(c.seller || 'A').toUpperCase().charAt(0)}</div>
                    <span class="form-label">${c.seller || 'admin'}</span>
                </div>
            </td>
            <td class="text-right ${c.debt > 0 ? 'debt-active' : ''}"><strong>${formatNumber(c.debt)}đ</strong></td>
            <td class="text-right"><strong>${formatNumber(c.total_spent)}đ</strong></td>
            <td class="text-center" style="font-size: 0.85rem;">${formatDate(c.last_order)}</td>
            <td class="text-center">
                <div style="display: flex; justify-content: center;">
                    <button class="crm-btn-icon" onclick="editCustomer(${c.id})" title="Sửa thông tin">✏️</button>
                    <button class="crm-btn-icon" onclick="viewCustomerHistory(${c.id})" title="Lịch sử giao dịch">📊</button>
                    <button class="crm-btn-icon delete" onclick="deleteCustomer(${c.id})" title="Xóa">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');

    updateStats();

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-message" style="padding: 50px; text-align: center; color: #888;">🚫 Không tìm thấy khách hàng nào khớp với tìm kiếm</td></tr>`;
    }
}

function updateStats() {
    const totalCust = CUSTOMERS.length;
    const totalDebt = CUSTOMERS.reduce((sum, c) => sum + (c.debt || 0), 0);
    const totalRevenue = CUSTOMERS.reduce((sum, c) => sum + (c.total_spent || 0), 0);

    const statsGroup = document.getElementById('crmStatsGroup');
    if (statsGroup) {
        statsGroup.innerHTML = `
            <div class="crm-stat-card">
                <span class="crm-stat-label">Tổng khách hàng</span>
                <span class="crm-stat-value">${totalCust}</span>
                <span class="crm-stat-trend trend-up">↑ 100% Active</span>
            </div>
            <div class="crm-stat-card">
                <span class="crm-stat-label">Tổng công nợ</span>
                <span class="crm-stat-value" style="color: #d63939;">${formatNumber(totalDebt)}đ</span>
                <span class="crm-stat-trend">Phải thu hồi</span>
            </div>
            <div class="crm-stat-card">
                <span class="crm-stat-label">Tổng doanh thu</span>
                <span class="crm-stat-value" style="color: #2fb344;">${formatNumber(totalRevenue)}đ</span>
                <span class="crm-stat-trend trend-up">↑ Tăng trưởng tốt</span>
            </div>
            <div class="crm-stat-card">
                <span class="crm-stat-label">Phân hạng ưu tiên</span>
                <span class="crm-stat-value">${CUSTOMERS.filter(c => c.total_spent > 10000000).length}</span>
                <span class="crm-stat-trend">Khách đại lý</span>
            </div>
        `;
    }
}

function generateCustomerCode(nextId) {
    return 'KH' + nextId.toString().padStart(3, '0');
}

function formatNumber(num) {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
}

function openAddCustomerModal() {
    document.getElementById('customerModalTitle').textContent = '➕ THÊM KHÁCH HÀNG MỚI';
    const nextId = Math.max(0, ...CUSTOMERS.map(c => c.id)) + 1;
    document.getElementById('customerId').value = '';
    document.getElementById('custCode').value = generateCustomerCode(nextId);
    document.getElementById('customerForm').reset();
    document.getElementById('customerModal').style.display = 'flex';
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
}

function saveCustomer() {
    const id = document.getElementById('customerId').value;
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const type = document.getElementById('custType').value;
    const debt = parseInt(document.getElementById('custDebt').value) || 0;
    const note = document.getElementById('custNote').value.trim();

    if (!name || !phone) {
        showToast('⚠️ Vui lòng nhập Tên và Số điện thoại!');
        return;
    }

    if (id) {
        const idx = CUSTOMERS.findIndex(c => c.id == id);
        if (idx !== -1) {
            CUSTOMERS[idx] = { ...CUSTOMERS[idx], name, phone, address, email, type, debt, note };
        }
    } else {
        const newId = Math.max(0, ...CUSTOMERS.map(c => c.id)) + 1;
        CUSTOMERS.push({
            id: newId,
            code: generateCustomerCode(newId),
            name, phone, address, email, type, debt,
            total_spent: 0, last_order: null, note,
            seller: currentUser ? currentUser.username : 'admin'
        });
    }

    saveCustomers();
    closeCustomerModal();
    renderCustomerTable();
    showToast('✅ Đã lưu thông tin khách hàng');
}

function editCustomer(id) {
    const c = CUSTOMERS.find(c => c.id == id);
    if (!c) return;

    if (currentUser && currentUser.role !== 'admin' && c.seller !== currentUser.username) {
        showToast('⚠️ Bạn không có quyền sửa khách hàng của Sale khác!');
        return;
    }

    document.getElementById('customerModalTitle').textContent = '✏️ CHỈNH SỬA KHÁCH HÀNG';
    document.getElementById('customerId').value = c.id;
    document.getElementById('custCode').value = c.code || generateCustomerCode(c.id);
    document.getElementById('custName').value = c.name;
    document.getElementById('custPhone').value = c.phone;
    document.getElementById('custAddress').value = c.address || '';
    document.getElementById('custEmail').value = c.email || '';
    document.getElementById('custType').value = c.type;
    document.getElementById('custDebt').value = c.debt;
    document.getElementById('custNote').value = c.note || '';

    document.getElementById('customerModal').style.display = 'flex';
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
    renderCustomerTable(query);
}

function initCustomerModule() {
    loadCustomers();
    const container = document.getElementById('customers-tab');
    if (container) {
        container.innerHTML = `
            <div class="customer-management-wrapper">
                <div id="crmStatsGroup" class="crm-stats-grid">
                    <!-- Stats will be loaded here -->
                </div>

                <div class="crm-main-card">
                    <div class="crm-toolbar">
                        <div class="crm-title-section">
                            <h2>💬 QUẢN LÝ KHÁCH HÀNG</h2>
                        </div>
                        <div class="crm-actions-section">
                            <select id="sellerFilter" class="crm-filter-select" onchange="renderCustomerTable()">
                                <option value="all">👥 Tất cả Sale</option>
                            </select>
                            <div class="crm-search-input-wrapper">
                                <input type="text" id="customerSearchInput" placeholder="Tìm tên, SĐT, mã KH..." oninput="searchCustomers(this.value)">
                            </div>
                            <button class="crm-btn-primary" onclick="openAddCustomerModal()">➕ THÊM MỚI</button>
                        </div>
                    </div>

                    <div class="crm-table-container">
                        <table class="crm-data-table">
                            <thead>
                                <tr>
                                    <th class="text-center" width="80">Mã KH</th>
                                    <th>Khách Hàng & Địa Chỉ</th>
                                    <th>Liên Hệ</th>
                                    <th>Hạng</th>
                                    <th>Sale</th>
                                    <th class="text-right">Công Nợ</th>
                                    <th class="text-right">Doanh Số</th>
                                    <th class="text-center">Giao Dịch</th>
                                    <th class="text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody id="customerTableBody">
                                <!-- Data populated here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        renderCustomerTable();
        populateSellerFilter();
    }
}

function populateSellerFilter() {
    const filter = document.getElementById('sellerFilter');
    if (!filter) return;
    const sellers = [...new Set(CUSTOMERS.map(c => c.seller).filter(Boolean))];
    filter.innerHTML = '<option value="all">👥 Tất cả Sale</option>';
    sellers.forEach(s => {
        const option = document.createElement('option');
        option.value = s;
        option.textContent = '👤 ' + s;
        filter.appendChild(option);
    });
}
