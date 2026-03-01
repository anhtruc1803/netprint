/* 
    NETPRINT - ORDER MANAGEMENT MODULE
*/

let ORDERS = [];
let ORDER_SETTINGS = {
    codeStructure: 'DH{count,3} - 2026',
    counterStart: 150,
    allowEditCode: true,
    defaultAssignee: 'creator',
    disablePriceEdit: false
};

// Trạng thái đơn hàng
const ORDER_STATUS = {
    PENDING: { label: 'Đang chờ', class: 'status-pending', icon: '⏳' },
    PRINTING: { label: 'Đang in', class: 'status-printing', icon: '🖨️' },
    DONE: { label: 'Xong', class: 'status-done', icon: '✅' },
    DELIVERED: { label: 'Đã giao', class: 'status-delivered', icon: '🚚' },
    CANCELLED: { label: 'Đã hủy', class: 'status-cancelled', icon: '❌' }
};

function loadOrders() {
    const savedOrders = localStorage.getItem('netprint_orders');
    if (savedOrders) ORDERS = JSON.parse(savedOrders);

    const savedSettings = localStorage.getItem('netprint_order_settings');
    if (savedSettings) ORDER_SETTINGS = { ...ORDER_SETTINGS, ...JSON.parse(savedSettings) };
}

function saveOrders() {
    localStorage.setItem('netprint_orders', JSON.stringify(ORDERS));
}

function saveOrderSettings() {
    const struct = document.getElementById('setOrderStruct').value;
    const start = document.getElementById('setOrderStart').value;
    const allowEdit = document.getElementById('setOrderAllowEdit').checked;

    ORDER_SETTINGS.codeStructure = struct;
    ORDER_SETTINGS.counterStart = parseInt(start) || 1;
    ORDER_SETTINGS.allowEditCode = allowEdit;

    localStorage.setItem('netprint_order_settings', JSON.stringify(ORDER_SETTINGS));
    showToast('✅ Đã lưu cấu trúc cài đặt đơn hàng!');
    closeOrderSettingsModal();
}

function generateOrderCode() {
    // Tính toán số thứ tự dựa trên tổng số đơn đã có + số bắt đầu
    const nextCount = ORDER_SETTINGS.counterStart + ORDERS.length;

    let code = ORDER_SETTINGS.codeStructure;

    // Xử lý tag {count,n} hoặc {count}
    const countMatch = code.match(/\{count,(\d+)\}/);
    if (countMatch) {
        const pad = parseInt(countMatch[1]);
        const paddedCount = String(nextCount).padStart(pad, '0');
        code = code.replace(countMatch[0], paddedCount);
    } else {
        code = code.replace('{count}', nextCount);
    }

    return code;
}

function renderOrderTable(filterText = '') {
    const tbody = document.getElementById('orderTableBody');
    if (!tbody) return;

    loadOrders(); // Đảm bảo dữ liệu mới nhất

    const filtered = ORDERS.filter(o => {
        const cust = (typeof CUSTOMERS !== 'undefined') ? CUSTOMERS.find(c => c.id == o.customerId) : null;
        const custName = cust ? cust.name.toLowerCase() : '';
        return o.code.toLowerCase().includes(filterText.toLowerCase()) ||
            custName.includes(filterText.toLowerCase());
    }).sort((a, b) => b.id - a.id);

    tbody.innerHTML = filtered.map(o => {
        const cust = (typeof CUSTOMERS !== 'undefined') ? CUSTOMERS.find(c => c.id == o.customerId) : null;
        const custDisplayName = cust ? cust.name : 'Khách vãng lai';
        const custDisplayPhone = cust ? cust.phone : '-';
        const status = ORDER_STATUS[o.status] || ORDER_STATUS.PENDING;

        return `
            <tr>
                <td class="text-center"><span class="order-code">${o.code}</span></td>
                <td>
                    <div class="order-customer-info">
                        <span class="order-cust-name">${custDisplayName}</span>
                        <span class="order-cust-phone">📱 ${custDisplayPhone}</span>
                    </div>
                </td>
                <td><span style="font-size: 0.9rem;">${o.items}</span></td>
                <td class="text-right"><span class="order-price">${formatNumber(o.total)}đ</span></td>
                <td class="text-center" style="font-size: 0.85rem; color: #64748b;">${o.date}</td>
                <td class="text-center">
                    <span class="status-badge ${status.class}">${status.icon} ${status.label}</span>
                </td>
                <td class="text-center">
                    <div style="display: flex; justify-content: center; gap: 5px;">
                        <button class="crm-btn-icon" onclick="editOrder(${o.id})" title="Sửa đơn">✏️</button>
                        <button class="crm-btn-icon" onclick="printOrder(${o.id})" title="In phiếu">📑</button>
                        <button class="crm-btn-icon delete" onclick="deleteOrder(${o.id})" title="Hủy đơn">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateOrderStats();
}

function updateOrderStats() {
    const total = ORDERS.length;
    const pending = ORDERS.filter(o => o.status === 'PENDING' || o.status === 'PRINTING').length;
    const revenue = ORDERS.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0);

    const statsGroup = document.getElementById('orderStatsGroup');
    if (statsGroup) {
        statsGroup.innerHTML = `
            <div class="crm-stat-card">
                <span class="crm-stat-label">Tổng đơn hàng</span>
                <span class="crm-stat-value">${total}</span>
                <span class="crm-stat-trend">Tháng này</span>
            </div>
            <div class="crm-stat-card">
                <span class="crm-stat-label">Đang xử lý</span>
                <span class="crm-stat-value" style="color: var(--order-pending);">${pending}</span>
                <span class="crm-stat-trend">Cần hoàn thành</span>
            </div>
            <div class="crm-stat-card">
                <span class="crm-stat-label">Doanh thu tạm tính</span>
                <span class="crm-stat-value" style="color: var(--crm-success);">${formatNumber(revenue)}đ</span>
                <span class="crm-stat-trend trend-up">↑ 12% so với tháng trước</span>
            </div>
            <div class="crm-stat-card">
                <span class="crm-stat-label">Đã giao hàng</span>
                <span class="crm-stat-value">${ORDERS.filter(o => o.status === 'DELIVERED').length}</span>
                <span class="crm-stat-trend text-success">Đã thu tiền</span>
            </div>
        `;
    }
}

function openAddOrderModal() {
    document.getElementById('orderModalTitle').innerText = '➕ TẠO ĐƠN HÀNG MỚI';

    // Dùng mã sinh theo cấu trúc cài đặt
    document.getElementById('orderCode').value = generateOrderCode();
    document.getElementById('orderCode').disabled = !ORDER_SETTINGS.allowEditCode;

    // Set date
    const now = new Date();
    document.getElementById('orderDate').value = now.toLocaleString('vi-VN');

    // Populate customers select
    const custSelect = document.getElementById('orderCustomerId');
    if (typeof CUSTOMERS !== 'undefined') {
        custSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>' +
            CUSTOMERS.map(c => `<option value="${c.id}">${c.name} - ${c.phone}</option>`).join('');
    }

    // Reset form
    document.getElementById('orderForm').reset();
    document.getElementById('orderId').value = '';
    document.getElementById('orderStatus').value = 'PENDING';

    document.getElementById('orderModal').style.display = 'flex';
}

function openOrderSettingsModal() {
    document.getElementById('setOrderStruct').value = ORDER_SETTINGS.codeStructure;
    document.getElementById('setOrderStart').value = ORDER_SETTINGS.counterStart;
    document.getElementById('setOrderAllowEdit').checked = ORDER_SETTINGS.allowEditCode;
    document.getElementById('orderSettingsModal').style.display = 'flex';
}

function closeOrderSettingsModal() {
    document.getElementById('orderSettingsModal').style.display = 'none';
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

function saveOrder() {
    const idField = document.getElementById('orderId').value;
    const custId = document.getElementById('orderCustomerId').value;
    const items = document.getElementById('orderItems').value;
    const total = document.getElementById('orderTotal').value;
    const status = document.getElementById('orderStatus').value;
    const code = document.getElementById('orderCode').value;

    if (!custId || !items || !total) {
        showToast('⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc!', 'error');
        return;
    }

    if (idField) {
        // Update
        const idx = ORDERS.findIndex(o => o.id == idField);
        if (idx !== -1) {
            ORDERS[idx].customerId = parseInt(custId);
            ORDERS[idx].items = items;
            ORDERS[idx].total = parseFloat(total);
            ORDERS[idx].status = status;
            ORDERS[idx].code = code;
        }
    } else {
        // Create new
        const newId = ORDERS.length > 0 ? Math.max(...ORDERS.map(o => o.id)) + 1 : 1;
        const newOrder = {
            id: newId,
            code: code,
            customerId: parseInt(custId),
            date: document.getElementById('orderDate').value,
            items: items,
            total: parseFloat(total),
            status: status
        };
        ORDERS.push(newOrder);
    }

    saveOrders();
    renderOrderTable();
    closeOrderModal();
    showToast('✅ Đã lưu đơn hàng thành công!');
}

function editOrder(id) {
    const order = ORDERS.find(o => o.id == id);
    if (!order) return;

    openAddOrderModal();
    document.getElementById('orderModalTitle').innerText = '✏️ CHỈNH SỬA ĐƠN HÀNG';
    document.getElementById('orderId').value = order.id;
    document.getElementById('orderCode').value = order.code;
    document.getElementById('orderCode').disabled = !ORDER_SETTINGS.allowEditCode;
    document.getElementById('orderDate').value = order.date;
    document.getElementById('orderCustomerId').value = order.customerId;
    document.getElementById('orderItems').value = order.items;
    document.getElementById('orderTotal').value = order.total;
    document.getElementById('orderStatus').value = order.status;
}

function deleteOrder(id) {
    if (confirm('❗ Anh có chắc chắn muốn hủy/xóa đơn hàng này không?')) {
        const idx = ORDERS.findIndex(o => o.id == id);
        if (idx !== -1) {
            ORDERS[idx].status = 'CANCELLED';
            saveOrders();
            renderOrderTable();
            showToast('🗑️ Đã chuyển trạng thái đơn hàng sang Hủy');
        }
    }
}

function printOrder(id) {
    showToast('📑 Đang chuẩn bị mẫu in phiếu đơn hàng...');
}

function initOrderModule() {
    loadOrders();
    if (typeof loadCustomers === 'function') loadCustomers();

    const container = document.getElementById('orders-tab');
    if (container) {
        container.innerHTML = `
            <div class="order-management-wrapper">
                <div id="orderStatsGroup" class="crm-stats-grid"></div>

                <div class="crm-main-card">
                    <div class="crm-toolbar">
                        <div class="crm-title-section">
                            <h2>📦 QUẢN LÝ ĐƠN HÀNG IN</h2>
                        </div>
                        <div class="crm-actions-section">
                            <div class="crm-search-input-wrapper">
                                <input type="text" placeholder="Tìm mã đơn, tên khách..." oninput="renderOrderTable(this.value)">
                            </div>
                            <button class="crm-btn-icon" onclick="openOrderSettingsModal()" title="Cài đặt mã đơn">⚙️</button>
                            <button class="crm-btn-add-order" onclick="openAddOrderModal()">➕ TẠO ĐƠN MỚI</button>
                        </div>
                    </div>

                    <div class="crm-table-container">
                        <table class="crm-data-table">
                            <thead>
                                <tr>
                                    <th class="text-center" width="100">Mã Đơn</th>
                                    <th>Khách Hàng</th>
                                    <th>Nội Dung Sản Xuất</th>
                                    <th class="text-right">Thành Tiền</th>
                                    <th class="text-center">Ngày Tạo</th>
                                    <th class="text-center">Trạng Thái</th>
                                    <th class="text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody id="orderTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        renderOrderTable();
    }
}

// Global exposure
window.initOrderModule = initOrderModule;
window.openAddOrderModal = openAddOrderModal;
window.closeOrderModal = closeOrderModal;
window.saveOrder = saveOrder;
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;
window.printOrder = printOrder;
window.openOrderSettingsModal = openOrderSettingsModal;
window.closeOrderSettingsModal = closeOrderSettingsModal;
window.saveOrderSettings = saveOrderSettings;
