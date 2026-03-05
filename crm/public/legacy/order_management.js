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

    // Luôn load lại PRODUCTS mới nhất từ localStorage để đồng bộ với product module
    const savedProds = localStorage.getItem('netprint_products');
    if (savedProds) {
        const parsedProds = JSON.parse(savedProds);
        // Nếu window.PRODUCTS là cùng array với product_management.js → cập nhật in-place
        if (window.PRODUCTS && Array.isArray(window.PRODUCTS)) {
            window.PRODUCTS.length = 0;
            parsedProds.forEach(p => window.PRODUCTS.push(p));
        } else {
            window.PRODUCTS = parsedProds;
        }
    } else if (typeof window.PRODUCTS === 'undefined') {
        window.PRODUCTS = [];
    }
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

function renderOrderTable(filterText = '', statusFilter = '') {
    const tbody = document.getElementById('orderTableBody');
    if (!tbody) return;

    loadOrders(); // Đảm bảo dữ liệu mới nhất

    // Tab active styling
    const tabs = document.querySelectorAll('.o1-tab');
    tabs.forEach((t, i) => {
        t.classList.remove('active');
        if (i === 0 && !statusFilter) t.classList.add('active');
        if (statusFilter === 'PENDING' && i === 1) t.classList.add('active');
        if (statusFilter === 'PRINTING' && i === 2) t.classList.add('active');
        if (statusFilter === 'DONE' && i === 3) t.classList.add('active');
        if (statusFilter === 'DELIVERED' && i === 4) t.classList.add('active');
    });

    const filtered = ORDERS.filter(o => {
        const cust = (typeof CUSTOMERS !== 'undefined') ? CUSTOMERS.find(c => c.id == o.customerId) : null;
        const custName = cust ? cust.name.toLowerCase() : '';
        const matchText = o.code.toLowerCase().includes(filterText.toLowerCase()) ||
            custName.includes(filterText.toLowerCase());
        const matchStatus = statusFilter ? o.status === statusFilter : true;
        return matchText && matchStatus;
    }).sort((a, b) => b.id - a.id);

    // Status color map
    const statusColorMap = {
        'PENDING': 'orange',
        'PRINTING': 'green',
        'DONE': 'blue',
        'DELIVERED': 'green',
        'CANCELLED': 'red'
    };

    tbody.innerHTML = filtered.map(o => {
        const cust = (typeof CUSTOMERS !== 'undefined') ? CUSTOMERS.find(c => c.id == o.customerId) : null;
        const custDisplayName = cust ? cust.name.toUpperCase() : 'KHÁCH VÃNG LAI';

        // Creator initials
        const creatorInitial = 'P'; // Default user initial

        const orderDate = o.date ? new Date(o.date).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
        const statusInfo = ORDER_STATUS[o.status] || ORDER_STATUS.PENDING;
        const statusColor = statusColorMap[o.status] || 'gray';

        return `
            <tr onclick="editOrder(${o.id})" oncontextmenu="showGlobalContextMenu(event, function(){ editOrder(${o.id}); }, function(){ deleteOrder(${o.id}); })">
                <td class="col-cb" onclick="event.stopPropagation()"><input type="checkbox"></td>
                <td class="o1-date">${orderDate}</td>
                <td class="o1-code">${o.code}</td>
                <td class="o1-customer">${custDisplayName}</td>
                <td class="o1-creator"><div class="o1-avatar">${creatorInitial}</div></td>
                <td class="col-number">${formatNumber(o.total)}</td>
                <td class="col-number">0</td>
                <td><span class="o1-status ${statusColor}">${statusInfo.label}</span></td>
            </tr>
        `;
    }).join('');

    // Update record count
    const countEl = document.querySelector('.o1-record-count');
    if (countEl) {
        countEl.innerHTML = `Hiển thị 1 - ${Math.min(50, filtered.length)} / <strong>${filtered.length}</strong> bản ghi`;
    }
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
            CUSTOMERS.map(c => `<option value="${c.id}">${c.code ? c.code + ' - ' : ''}${c.name} - ${c.phone}</option>`).join('');
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
    initOrderModule('DETAIL', id);
}

function deleteOrder(id) {
    if (confirm('❗ Anh có chắc chắn muốn XÓA VĨNH VIỄN đơn hàng này không?')) {
        const idx = ORDERS.findIndex(o => o.id == id);
        if (idx !== -1) {
            ORDERS.splice(idx, 1);
            saveOrders();
            renderOrderTable();
            showToast('🗑️ Đã xóa đơn hàng vĩnh viễn');
        }
    }
}

// Context Menu - ĐÃ TẮT (Sử dụng menu chuột phải mặc định của trình duyệt)

function printOrder(id) {
    showToast('📑 Đang chuẩn bị mẫu in phiếu đơn hàng...');
}

function initOrderModule(view = 'LIST', extraParam = null) {
    loadOrders();
    if (typeof loadCustomers === 'function') loadCustomers();

    const container = document.getElementById('orders-tab');
    if (!container) return;

    // Hide title and logo, make header minimal floating for hamburger menu only
    const mainTitle = document.getElementById('mainTitle');
    if (mainTitle) mainTitle.style.display = 'none';
    const headerSection = document.querySelector('.header');
    if (headerSection) {
        headerSection.classList.add('orders-minimal-header');
    }

    // Auto-collapse sidebar for full-width 1Office layout
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('collapsed')) {
        sidebar._wasOpenBeforeOrders = true;
        sidebar.classList.add('collapsed');
    }
    // Also hide the sidebar toggle button
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) sidebarToggle.style.display = 'none';

    // Push browser history for order navigation
    if (!window._npSkipPush) {
        history.pushState({ type: 'order', view: view, param: extraParam }, '', null);
    }

    // Lưu order view vào localStorage để khôi phục khi reload (F5)
    localStorage.setItem('netprint_order_view', view);
    localStorage.setItem('netprint_order_param', extraParam != null ? extraParam : '');

    if (view === 'LIST') {
        renderOrderListPage(container);
    } else if (view === 'CREATE') {
        renderCreateOrderPage(container);
    } else if (view === 'DETAIL') {
        renderOrderDetailPage(container, extraParam);
    } else if (view === 'EDIT') {
        renderEditOrderPage(container, extraParam);
    }
}

function renderOrderListPage(container) {
    const pendingCount = ORDERS.filter(o => o.status === 'PENDING').length;
    const printingCount = ORDERS.filter(o => o.status === 'PRINTING').length;
    const doneCount = ORDERS.filter(o => o.status === 'DONE').length;
    const deliveredCount = ORDERS.filter(o => o.status === 'DELIVERED').length;
    const cancelledCount = ORDERS.filter(o => o.status === 'CANCELLED').length;
    const totalPages = Math.max(1, Math.ceil(ORDERS.length / 50));

    container.innerHTML = `
        <div class="o1-order-list">
            <!-- Title Bar -->
            <div class="o1-title-bar">
                <div class="o1-title-left">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mui-text-secondary,#637381)" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    <h2 class="o1-page-title">Danh sách đơn hàng bán</h2>
                </div>
                <div class="o1-title-right">
                    <div class="o1-search-inline">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#919EAB" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" placeholder="Tìm kiếm đơn hàng..." oninput="renderOrderTable(this.value)">
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="o1-tabs">
                <button class="o1-tab active" onclick="renderOrderTable('')">Đơn hàng bán</button>
                <button class="o1-tab" onclick="renderOrderTable('','PENDING')">Đang chờ (${pendingCount})</button>
                <button class="o1-tab" onclick="renderOrderTable('','PRINTING')">Đang in (${printingCount})</button>
                <button class="o1-tab" onclick="renderOrderTable('','DONE')">Hoàn thành (${doneCount})</button>
                <button class="o1-tab" onclick="renderOrderTable('','DELIVERED')">Đã giao (${deliveredCount})</button>
            </div>

            <!-- Toolbar -->
            <div class="o1-toolbar">
                <div class="o1-toolbar-left">
                    <button class="o1-filter-btn" title="Bộ lọc">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    </button>
                    <span class="o1-record-count">Hiển thị 1 - ${Math.min(50, ORDERS.length)} / <strong>${ORDERS.length}</strong> bản ghi</span>
                    <span class="o1-separator">|</span>
                    <span class="o1-page-label">Trang</span>
                    <div class="o1-mini-pagination">
                        <button class="o1-mini-page active">01</button>
                        <span>~</span>
                        <button class="o1-mini-page">${totalPages < 10 ? '0' + totalPages : totalPages}</button>
                    </div>
                </div>
                <div class="o1-toolbar-right">
                    <button class="o1-action-btn primary" onclick="initOrderModule('CREATE')">＋ Tạo Đơn</button>
                    <button class="o1-action-btn" onclick="openOrderSettingsModal()">⚙️ Cài đặt</button>
                </div>
            </div>

            <!-- Data Table -->
            <div class="o1-table-wrap">
                <table class="o1-table">
                    <thead>
                        <tr>
                            <th class="col-cb"><input type="checkbox" title="Chọn tất cả"></th>
                            <th>Ngày bán</th>
                            <th>Mã đơn hàng</th>
                            <th>Khách hàng</th>
                            <th>Người tạo</th>
                            <th class="col-number">Giá trị đơn hàng</th>
                            <th class="col-number">Đã thu</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody id="orderTableBody"></tbody>
                </table>
            </div>
        </div>
    `;
    renderOrderTable();
}


function renderOrderDetailPage(container, orderId) {
    const order = ORDERS.find(o => o.id == orderId);
    if (!order) {
        showToast('⚠️ Không tìm thấy đơn hàng!', 'error');
        initOrderModule('LIST');
        return;
    }

    const cust = (typeof CUSTOMERS !== 'undefined') ? CUSTOMERS.find(c => c.id == order.customerId) : null;
    const custName = cust ? ((cust.code ? cust.code + ' - ' : '') + cust.name) : 'Khách vãng lai';
    const custPhone = cust ? (cust.phone || '--') : '--';
    const custEmail = cust ? (cust.email || '--') : '--';
    const custAddress = cust ? (cust.address || '--') : '--';
    const orderDate = order.date ? new Date(order.date).toLocaleDateString('vi-VN') : '--';
    const fmtNum = (v) => typeof formatNumber === 'function' ? formatNumber(v) : v;

    // Auto-migrate đơn hàng cũ: tạo goods array từ thông tin sẵn có
    if (!order.goods && order.items) {
        const prodList = (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
        const itemsArr = order.items.split(', ');
        const migratedGoods = [];
        itemsArr.forEach(item => {
            let itemName = item.trim();
            let qty = 1;
            const qtyMatch = itemName.match(/^(\d+)\s+(.+)$/);
            if (qtyMatch) {
                qty = parseInt(qtyMatch[1]);
                itemName = qtyMatch[2];
            }
            const matchedProd = prodList.find(p =>
                itemName.toLowerCase().includes(p.name.toLowerCase()) ||
                (p.code && itemName.toLowerCase().includes(p.code.toLowerCase()))
            );
            const unit = matchedProd ? (matchedProd.unit || '') : '';
            const price = matchedProd ? matchedProd.price : (itemsArr.length === 1 ? Math.round((order.total || 0) / qty) : 0);
            migratedGoods.push({
                name: itemName,
                unit: unit,
                price: price,
                qty: qty,
                subtotal: price * qty
            });
        });
        // Lưu lại vào order để lần sau không cần migrate nữa
        order.goods = migratedGoods;
        order.subtotal = order.subtotal || order.total || 0;
        saveOrders();
    }

    const statusMap = {
        'PENDING': { label: 'Chờ xử lý', color: '#f59e0b', bg: '#fffbeb' },
        'APPROVED': { label: 'Đã duyệt', color: '#10b981', bg: '#ecfdf5' },
        'COMPLETED': { label: 'Hoàn thành', color: '#3b82f6', bg: '#eff6ff' },
        'CANCELLED': { label: 'Đã hủy', color: '#ef4444', bg: '#fef2f2' }
    };
    const status = statusMap[order.status] || statusMap['PENDING'];

    // Render items từ goods array (đầy đủ chi tiết) hoặc fallback từ text
    let itemRows = '';
    const subtotal = order.subtotal || order.total || 0;
    const taxAmt = order.taxAmount || 0;
    const taxPct = order.taxPercent || 0;

    if (order.goods && order.goods.length > 0) {
        itemRows = order.goods.map((g, i) => {
            // Tìm thêm thông tin desc từ PRODUCTS nếu cưa có
            let desc = g.desc || '';
            let unit = g.unit || '';
            if (!desc || !unit) {
                const prodList = (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
                const matched = prodList.find(p =>
                    (g.name || '').toLowerCase().includes(p.name.toLowerCase()) ||
                    (p.code && (g.name || '').toLowerCase().includes(p.code.toLowerCase()))
                );
                if (matched) {
                    if (!desc) desc = matched.desc || '';
                    if (!unit) unit = matched.unit || '';
                }
            }
            const descHtml = desc
                ? `<div class="ord-1o-items-desc">
                    <span class="ord-1o-items-desc-icon">🔧</span>
                    <span class="ord-1o-items-desc-text" title="${desc}">${unit ? unit + ': ' : ''}${desc}</span>
                  </div>`
                : '';
            return `
            <tr>
                <td class="td-stt">${i + 1}</td>
                <td class="td-product">
                    <div>${g.name}</div>
                    ${descHtml}
                </td>
                <td class="td-unit">${unit || '--'}</td>
                <td class="td-price">${fmtNum(g.price)}</td>
                <td class="td-qty">${g.qty}</td>
                <td class="td-total">${fmtNum(g.subtotal)}</td>
            </tr>`;
        }).join('');
    } else if (order.items) {
        // Fallback cho đơn hàng cũ — tìm sản phẩm trong PRODUCTS để lấy thông tin
        const prodList = (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
        const itemsArr = order.items.split(', ');
        const perItemTotal = itemsArr.length === 1 ? (order.total || 0) : 0;

        itemRows = itemsArr.map((item, i) => {
            // Thử parse "qty tên" (ví dụ: "2 IN NHANH A3")
            let itemName = item.trim();
            let qty = 1;
            const qtyMatch = itemName.match(/^(\d+)\s+(.+)$/);
            if (qtyMatch) {
                qty = parseInt(qtyMatch[1]);
                itemName = qtyMatch[2];
            }

            // Tìm sản phẩm trong database
            const matchedProd = prodList.find(p =>
                itemName.toLowerCase().includes(p.name.toLowerCase()) ||
                (p.code && itemName.toLowerCase().includes(p.code.toLowerCase()))
            );

            const unit = matchedProd ? (matchedProd.unit || '--') : '--';
            const price = matchedProd ? matchedProd.price : (perItemTotal > 0 ? Math.round(perItemTotal / qty) : 0);
            const lineTotal = price * qty || perItemTotal;

            return `
            <tr>
                <td class="td-stt">${i + 1}</td>
                <td class="td-product">${itemName}</td>
                <td class="td-unit">${unit}</td>
                <td class="td-price">${price > 0 ? fmtNum(price) : '--'}</td>
                <td class="td-qty">${qty}</td>
                <td class="td-total">${lineTotal > 0 ? fmtNum(lineTotal) : '--'}</td>
            </tr>`;
        }).join('');
    } else {
        itemRows = '<tr><td colspan="6" class="td-stt" style="padding:16px;">Chưa có sản phẩm</td></tr>';
    }

    // Tên hiển thị: dùng order.name nếu có, fallback về order.items cho đơn cũ
    const displayName = order.name || order.items || 'Đơn hàng';
    const headerTitle = order.code + ' - ' + displayName.toUpperCase();

    container.innerHTML = `
        <div class="ord-1office-layout">
            <div class="ord-main-content">
                <!-- Header -->
                <div class="ord-1o-header">
                    <div class="ord-1o-header-left">
                        <button class="ord-1o-plus-btn" onclick="initOrderModule('LIST')">+</button>
                        <h2 class="ord-1o-header-title">
                            <span
                                id="ord-header-title"
                                class="ord-1o-header-editable"
                                contenteditable="true"
                                data-order-id="${order.id}"
                                data-order-code="${order.code}"
                                onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
                                onblur="saveOrderTitleInline(this)"
                                title="Click để sửa tên đơn hàng"
                            >${headerTitle}</span>
                            <span class="ord-1o-edit-hint" onclick="document.getElementById('ord-header-title').focus()" title="Sửa tên">✏️</span>
                        </h2>
                    </div>
                    <div class="ord-1o-header-right">
                        <button class="ord-1o-btn-action btn-edit" onclick="openEditOrderPanel(${order.id})">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            Sửa
                        </button>
                        <button class="ord-1o-btn-action btn-delete" onclick="deleteOrder(${order.id})">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            Xóa
                        </button>
                    </div>
                </div>

                <!-- Tab bar -->
                <div class="ord-1o-tab-bar">
                    <span class="ord-1o-tab-item active">Chi tiết</span>
                </div>

                <!-- Scrollable content -->
                <div class="ord-1o-scroll-content">

                    <!-- Nội dung đơn hàng -->
                    <div class="ord-1o-card">
                        <div class="ord-1o-card-header">Nội dung đơn hàng</div>
                        <div style="overflow-x:auto;">
                            <table class="ord-1o-items-table">
                                <thead>
                                    <tr>
                                        <th class="col-stt">STT</th>
                                        <th class="col-product">Sản phẩm / dịch vụ</th>
                                        <th class="col-unit">Đơn vị</th>
                                        <th class="col-price">Giá</th>
                                        <th class="col-qty">Số lượng</th>
                                        <th class="col-total">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemRows}
                                </tbody>
                            </table>
                        </div>
                        <!-- Summary -->
                        <div class="ord-1o-summary">
                            <div class="ord-1o-summary-row">
                                <span class="ord-1o-summary-label">Tổng tiền trước thuế</span>
                                <span class="ord-1o-summary-value bold">${fmtNum(subtotal)}</span>
                            </div>
                            <div class="ord-1o-summary-row">
                                <span class="ord-1o-summary-label">Tiền thuế${taxPct ? ' (' + taxPct + '%)' : ''}</span>
                                <span class="ord-1o-summary-value">${fmtNum(taxAmt)}</span>
                            </div>
                            <div class="ord-1o-summary-row total-row">
                                <span class="ord-1o-summary-label">Tổng tiền sau thuế</span>
                                <span class="ord-1o-summary-value">${fmtNum(order.total)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Thông tin chung -->
                    <div class="ord-1o-card">
                        <div class="ord-1o-card-header">Thông tin chung</div>
                        <div class="ord-1o-detail-grid">
                            <div class="ord-1o-detail-field">
                                <div class="ord-1o-detail-label">Mã đơn hàng</div>
                                <div class="ord-1o-detail-value bold">${order.code}</div>
                            </div>
                            <div class="ord-1o-detail-field right-col">
                                <div class="ord-1o-detail-label">Khách hàng</div>
                                <div class="ord-1o-detail-value highlight-blue">${custName}</div>
                            </div>
                            <div class="ord-1o-detail-field">
                                <div class="ord-1o-detail-label">Điện thoại khách hàng</div>
                                <div class="ord-1o-detail-value highlight-red">${custPhone}</div>
                            </div>
                            <div class="ord-1o-detail-field right-col">
                                <div class="ord-1o-detail-label">Email</div>
                                <div class="ord-1o-detail-value">${custEmail}</div>
                            </div>
                            <div class="ord-1o-detail-field">
                                <div class="ord-1o-detail-label">Địa chỉ</div>
                                <div class="ord-1o-detail-value">${custAddress}</div>
                            </div>
                            <div class="ord-1o-detail-field right-col">
                                <div class="ord-1o-detail-label">Ngày bán</div>
                                <div class="ord-1o-detail-value bold">${orderDate}</div>
                            </div>
                            <div class="ord-1o-detail-field">
                                <div class="ord-1o-detail-label">Người tạo đơn</div>
                                <div class="ord-1o-avatar-inline">
                                    <span class="ord-1o-avatar-sm">P</span>
                                    <span class="ord-1o-detail-value">Admin</span>
                                </div>
                            </div>
                            <div class="ord-1o-detail-field right-col">
                                <div class="ord-1o-detail-label">Tên đơn hàng</div>
                                <div class="ord-1o-detail-value editable">
                                    <span id="ord-detail-name-${order.id}">${displayName}</span>
                                    <span class="ord-1o-edit-hint" onclick="openEditOrderPanel(${order.id})" title="Sửa">✏️</span>
                                </div>
                            </div>
                            <div class="ord-1o-detail-field">
                                <div class="ord-1o-detail-label">Giá trị đơn hàng</div>
                                <div class="ord-1o-detail-value highlight-red">${fmtNum(order.total)}</div>
                            </div>
                            <div class="ord-1o-detail-field right-col">
                                <div class="ord-1o-detail-label">Đã thu</div>
                                <div class="ord-1o-detail-value">0</div>
                            </div>
                            <div class="ord-1o-detail-field">
                                <div class="ord-1o-detail-label">Trạng thái</div>
                                <div><span class="ord-1o-status-badge" style="color:${status.color}; background:${status.bg};">${status.label}</span></div>
                            </div>
                            <div class="ord-1o-detail-field right-col">
                                <div class="ord-1o-detail-label">Mô tả</div>
                                <div class="ord-1o-detail-value">--</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    `;
}

// ===== TRANG SỬA ĐƠN HÀNG ĐẦY ĐỦ =====
function saveOrderTitleInline(span) {
    span.style.outline = 'none';
    span.style.padding = '2px 4px';

    const orderId = parseInt(span.dataset.orderId);
    const orderCode = span.dataset.orderCode || '';
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) return;

    // Nội dung user nhập (có thể gồm cả "CODE - TÊN")
    let newTitle = span.textContent.trim();

    // Nếu user không xóa phần prefix code, tách lấy phần tên
    const codePrefix = orderCode + ' - ';
    if (newTitle.toUpperCase().startsWith(codePrefix.toUpperCase())) {
        newTitle = newTitle.substring(codePrefix.length).trim();
    }

    if (!newTitle || newTitle === order.name) return;

    order.name = newTitle;
    order.items = newTitle;
    saveOrders();

    // Cập nhật luôn field tên bên dưới
    const nameSpan = document.getElementById(`ord-detail-name-${orderId}`);
    if (nameSpan) nameSpan.textContent = newTitle;

    // Cập nhật hiển thị span đúng (Code - TÊN)
    span.textContent = orderCode + ' - ' + newTitle.toUpperCase();

    showToast('✅ Đã đổi tên đơn hàng!');
}

window.saveOrderTitleInline = saveOrderTitleInline;


function openEditOrderPanel(orderId) {
    initOrderModule('EDIT', orderId);
}

function renderEditOrderPage(container, orderId) {
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) { initOrderModule('LIST'); return; }

    // Khách hàng
    const custList = (typeof CUSTOMERS !== 'undefined' && Array.isArray(CUSTOMERS)) ? CUSTOMERS : [];
    const cust = custList.find(c => c.id === order.customerId);
    const custDisplay = cust ? ((cust.code ? cust.code + ' - ' : '') + cust.name) : '';

    // Format ngày
    const rawDate = order.date || '';
    let displayDate = rawDate;
    if (rawDate.includes('-')) {
        const parts = rawDate.split('-');
        displayDate = parts.reverse().join('/');
    }

    // Dòng hàng hóa từ order.goods
    const goodsList = order.goods || [];
    const goodsRows = goodsList.map((g, i) => `
        <tr>
            <td>
                <div class="ord-field-wrapper" style="flex-direction:column;align-items:flex-start;">
                    <div style="position:relative;width:100%;">
                        <input type="text" class="g-name" value="${g.name || ''}" placeholder="Nhập tên SP..." oninput="suggestProducts(this)" autocomplete="off">
                        <button class="ord-quick-add-btn" onclick="openProductSidebarFromOrder(this)" title="Tạo mới sản phẩm">＋</button>
                        <button class="ord-spec-edit-btn" onclick="openQuickSpecEdit(this)" title="Sửa nhanh quy cách">📌</button>
                    </div>
                    <div class="g-desc" ${g.desc ? `data-raw-desc="${g.desc}" data-prod-id=""` : ''} style="display:${g.desc ? 'flex' : 'none'};">
                        ${g.desc ? `<span class="g-desc-icon">🔧</span> ${g.unit || ''}: ${g.desc}` : ''}
                    </div>
                    <div class="prod-suggestions" style="display:none;position:absolute;top:100%;left:0;width:100%;border:1px solid #ddd;background:white;z-index:1000;max-height:200px;overflow-y:auto;box-shadow:0 4px 6px rgba(0,0,0,0.1);border-radius:4px;"></div>
                </div>
            </td>
            <td><input type="text" class="g-unit" value="${g.unit || ''}" placeholder="Đơn vị"></td>
            <td><input type="number" class="g-price" value="${g.price || 0}" oninput="calcOrderGoods(this)"></td>
            <td><input type="number" class="g-qty" value="${g.qty || 1}" oninput="calcOrderGoods(this)"></td>
            <td><input type="number" class="g-total" value="${g.subtotal || 0}" readonly></td>
            <td onclick="this.parentElement.remove();recalcTotalOrder()"><span class="ord-goods-row-delete">×</span></td>
        </tr>
    `).join('');

    const displayName = order.name || order.items || '';
    const taxPct = order.taxPercent || 0;

    container.innerHTML = `
        <div class="ord-1office-layout">
            <div class="ord-main-content">
                <!-- Header giống trang chi tiết -->
                <div class="ord-1o-header" style="padding:10px 20px; border-bottom:1px solid #eaedf1;">
                    <div class="ord-1o-header-left" style="gap:10px;">
                        <button onclick="initOrderModule('LIST')" style="width:28px; height:28px; border-radius:4px; border:none; background:#206bc4; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700;">+</button>
                        <h2 style="font-size:15px; font-weight:600; color:#1D232E; margin:0;">✏️ ${order.code} — ${displayName.toUpperCase()}</h2>
                    </div>
                    <div class="ord-1o-header-right" style="gap:8px;">
                        <button onclick="saveUpdateOrder(${orderId})" style="padding:6px 14px; border:none; background:#206bc4; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; color:#fff; display:flex; align-items:center; gap:5px; font-family:inherit;">
                            💾 Lưu thay đổi
                        </button>
                        <button onclick="initOrderModule('DETAIL', ${orderId})" style="padding:6px 14px; border:1px solid #d1d5db; background:#fff; border-radius:6px; cursor:pointer; font-size:12px; font-weight:500; color:#6b7280; display:flex; align-items:center; gap:5px; font-family:inherit;">
                            Hủy bỏ
                        </button>
                    </div>
                </div>
                <!-- Tab bar -->
                <div style="display:flex; padding:0 20px; border-bottom:1px solid #eaedf1; background:#fff;">
                    <span style="padding:10px 2px; font-size:13px; color:#206bc4; border-bottom:2px solid #206bc4; font-weight:500;">Sửa đơn hàng</span>
                </div>
                <!-- Nội dung form -->
                <div style="padding:20px; overflow-y:auto; flex:1; background:#f4f6f8;">
                    <div class="ord-create-body" style="max-width:900px; margin:0 auto;">
                        <!-- Thông tin cơ bản -->
                        <div class="ord-section">
                            <div class="ord-section-header"><span>▼ Thông tin đơn hàng</span></div>
                            <div class="ord-form-grid">
                                <div class="ord-input-group">
                                    <label>Mã đơn hàng</label>
                                    <div class="ord-field-wrapper">
                                        <input type="text" id="curOrderCode" value="${order.code}" readonly style="background:#f9fafb;color:#6b7280;">
                                    </div>
                                </div>
                                <div class="ord-input-group">
                                    <label>Ngày bán</label>
                                    <div class="ord-field-wrapper" style="position:relative;">
                                        <input type="text" id="curOrderDate" value="${displayDate}" placeholder="dd/mm/yyyy" onclick="openOrderDatePicker(this)" readonly style="cursor:pointer;">
                                        <span class="ord-field-icon">📅</span>
                                        <div id="orderDatePickerWrap" style="display:none;position:absolute;top:100%;left:0;z-index:500;"></div>
                                    </div>
                                </div>
                                <div class="ord-input-group" style="grid-column:span 2;">
                                    <label>Tên đơn hàng</label>
                                    <div class="ord-field-wrapper">
                                        <input type="text" id="curOrderName" value="${displayName}" placeholder="Tên đơn hàng (để trống sẽ tự sinh từ sản phẩm)">
                                    </div>
                                </div>
                                <div class="ord-input-group" style="grid-column:span 2;">
                                    <label>Khách hàng <span>*</span></label>
                                    <div class="ord-field-wrapper" style="position:relative;">
                                        <input type="hidden" id="curOrderCustId" value="${order.customerId || ''}">
                                        <input type="text" id="curOrderCustSearch" value="${custDisplay}" placeholder="Nhập mã hoặc tên KH để tìm..." oninput="suggestCustomers(this)" onfocus="suggestCustomers(this)" autocomplete="off">
                                        <span class="ord-field-icon">🔍</span>
                                        <div id="custSuggestions" class="cust-suggestions" style="display:none;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Hàng hóa -->
                        <div class="ord-section">
                            <div class="ord-section-header"><span>▼ Hàng hóa</span></div>
                            <div class="ord-goods-table-container">
                                <table class="ord-goods-table">
                                    <thead>
                                        <tr>
                                            <th style="width:40%;">Sản phẩm <span>*</span></th>
                                            <th>Đơn vị</th>
                                            <th>Giá bán</th>
                                            <th>Số lượng <span>*</span></th>
                                            <th>Thành tiền <span>*</span></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody id="goodsTableBody">
                                        ${goodsRows}
                                    </tbody>
                                </table>
                            </div>
                            <button class="ord-add-row-btn" onclick="addGoodsRow()">+ Thêm dòng</button>
                        </div>
                        <!-- Tổng tiền -->
                        <div class="ord-section">
                            <div class="ord-section-header"><span>▼ Tổng tiền</span></div>
                            <div class="ord-total-grid">
                                <div class="ord-input-group">
                                    <label>Tổng tiền hàng</label>
                                    <div class="ord-field-wrapper">
                                        <input type="text" id="ordSubTotal" value="${formatNumber(order.subtotal || 0)}" readonly>
                                        <span class="ord-field-icon">₫</span>
                                    </div>
                                </div>
                                <div class="ord-input-group">
                                    <label>Thuế (%)</label>
                                    <div class="ord-field-wrapper">
                                        <input type="number" id="ordTaxP" value="${taxPct}" oninput="recalcTotalOrder()">
                                    </div>
                                </div>
                                <div class="ord-input-group">
                                    <label>Tiền thuế</label>
                                    <div class="ord-field-wrapper">
                                        <input type="text" id="ordTaxA" value="${formatNumber(order.taxAmount || 0)}" readonly>
                                        <span class="ord-field-icon">₫</span>
                                    </div>
                                </div>
                                <div class="ord-input-group">
                                    <label>Tổng cộng</label>
                                    <div class="ord-field-wrapper">
                                        <input type="text" id="ordFinalTotal" value="${formatNumber(order.total || 0)}" readonly style="font-weight:700;color:#F94949;">
                                        <span class="ord-field-icon">₫</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;


    // Tính lại ngay khi render
    setTimeout(() => recalcTotalOrder(), 50);
}

function saveUpdateOrder(orderId) {
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) return;

    const custId = document.getElementById('curOrderCustId').value;
    if (!custId) {
        showToast('⚠️ Vui lòng chọn khách hàng!', 'error');
        return;
    }

    const date = document.getElementById('curOrderDate').value;
    const orderName = (document.getElementById('curOrderName')?.value || '').trim();

    let itemsText = [];
    let goodsDetail = [];
    let totalValue = 0;

    document.querySelectorAll('#goodsTableBody tr').forEach(tr => {
        const name = tr.querySelector('.g-name')?.value || '';
        const unit = tr.querySelector('.g-unit')?.value || '';
        const price = parseFloat(tr.querySelector('.g-price')?.value) || 0;
        const qty = parseFloat(tr.querySelector('.g-qty')?.value) || 0;
        const sub = parseFloat(tr.querySelector('.g-total')?.value) || 0;
        const descDiv = tr.querySelector('.g-desc');
        const desc = descDiv ? (descDiv.dataset.rawDesc || '') : '';
        if (name) {
            itemsText.push(`${qty} ${name}`);
            goodsDetail.push({ name, unit, price, qty, subtotal: sub, desc });
            totalValue += sub;
        }
    });

    if (goodsDetail.length === 0) {
        showToast('⚠️ Vui lòng nhập ít nhất một sản phẩm!', 'error');
        return;
    }

    const taxP = parseFloat(document.getElementById('ordTaxP').value) || 0;
    const taxAmount = totalValue * taxP / 100;
    const totalAfterTax = totalValue + taxAmount;
    const displayName = orderName || goodsDetail.map(g => g.name).join(', ');

    // Cập nhật order trong ORDERS
    order.name = displayName;
    order.items = orderName || itemsText.join(', ');
    order.customerId = parseInt(custId);
    order.date = date.split('/').reverse().join('-');
    order.goods = goodsDetail;
    order.subtotal = totalValue;
    order.taxPercent = taxP;
    order.taxAmount = taxAmount;
    order.total = totalAfterTax;

    saveOrders();
    showToast('✅ Đã cập nhật đơn hàng!');
    initOrderModule('DETAIL', orderId);
}

function closeEditOrderPanel() { /* không dùng nữa */ }

window.openEditOrderPanel = openEditOrderPanel;
window.renderEditOrderPage = renderEditOrderPage;
window.saveUpdateOrder = saveUpdateOrder;
window.closeEditOrderPanel = closeEditOrderPanel;



function renderCreateOrderPage(container) {
    const nextCode = generateOrderCode();
    const today = new Date().toLocaleDateString('vi-VN');

    container.innerHTML = `
        <div class="ord-create-page">
            <div class="ord-create-header">
                <button class="ord-btn-back" onclick="initOrderModule('LIST')">←</button>
                <div class="ord-create-title">Tạo mới đơn hàng bán</div>
            </div>

            <div class="ord-content">
                <!-- Thông tin chung -->
                <div class="ord-section">
                    <div class="ord-section-header">
                        <span>▼ Thông tin chung</span>
                    </div>
                    <div class="ord-form-grid">
                        <div class="ord-input-group">
                            <label>Mã đơn hàng <span>*</span></label>
                            <div class="ord-field-wrapper">
                                <input type="text" id="curOrderCode" value="${nextCode}">
                                <span class="ord-field-icon">🔄</span>
                            </div>
                        </div>
                        <div class="ord-input-group">
                            <label>Ngày bán <span>*</span></label>
                            <div class="ord-field-wrapper">
                                <input type="text" id="curOrderDate" value="${today}" readonly style="cursor:pointer;" onclick="openNpDatepicker(this)">
                                <span class="ord-field-icon" style="cursor:pointer;" onclick="openNpDatepicker(document.getElementById('curOrderDate'))">📅</span>
                            </div>
                        </div>
                        <div class="ord-input-group">
                            <label>Tên đơn hàng</label>
                            <div class="ord-field-wrapper">
                                <input type="text" id="curOrderName" placeholder="Nhập tên đơn hàng...">
                                <span class="ord-field-icon">📝</span>
                            </div>
                        </div>
                        <div class="ord-input-group">
                            <label>Khách hàng <span>*</span></label>
                            <div class="ord-field-wrapper" style="position:relative;">
                                <input type="hidden" id="curOrderCustId" value="">
                                <input type="text" id="curOrderCustSearch" placeholder="Nhập mã hoặc tên KH để tìm..." oninput="suggestCustomers(this)" onfocus="suggestCustomers(this)" autocomplete="off">
                                <span class="ord-field-icon">🔍</span>
                                <div id="custSuggestions" class="cust-suggestions" style="display:none;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Hàng hóa -->
                <div class="ord-section">
                    <div class="ord-section-header">
                        <span>▼ Hàng hóa</span>
                    </div>
                    <div class="ord-goods-table-container">
                        <table class="ord-goods-table">
                            <thead>
                                <tr>
                                    <th style="width: 40%;">Sản phẩm <span>*</span></th>
                                    <th>Đơn vị</th>
                                    <th>Giá bán</th>
                                    <th>Số lượng <span>*</span></th>
                                    <th>Thành tiền <span>*</span></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody id="goodsTableBody">
                                <!-- First row default -->
                                <tr>
                                    <td>
                                        <div class="ord-field-wrapper" style="flex-direction: column; align-items: flex-start;">
                                            <div style="position: relative; width: 100%;">
                                                <input type="text" class="g-name" placeholder="Nhập tên SP để tìm..." oninput="suggestProducts(this)" autocomplete="off">
                                                <button class="ord-quick-add-btn" onclick="openProductSidebarFromOrder(this)" title="Tạo mới sản phẩm">＋</button>
                                                <button class="ord-spec-edit-btn" onclick="openQuickSpecEdit(this)" title="Sửa nhanh quy cách">📌</button>
                                            </div>
                                            <div class="g-desc"></div>
                                            <div class="prod-suggestions" style="display:none; position:absolute; top:100%; left:0; width:100%; border:1px solid #ddd; background:white; z-index:1000; max-height:200px; overflow-y:auto; box-shadow:0 4px 6px rgba(0,0,0,0.1); border-radius:4px;"></div>
                                        </div>
                                    </td>
                                    <td><input type="text" class="g-unit" placeholder="Đơn vị"></td>
                                    <td><input type="number" class="g-price" value="0" oninput="calcOrderGoods(this)"></td>
                                    <td><input type="number" class="g-qty" value="1" oninput="calcOrderGoods(this)"></td>
                                    <td><input type="number" class="g-total" value="0" readonly></td>
                                    <td><span class="ord-goods-row-delete">×</span></td>
                                </tr>
                            </tbody>
                        </table>
                        <button class="ord-btn-add-row" onclick="addGoodsRow()">+</button>
                    </div>

                    <div class="ord-calc-panel">
                        <div class="ord-calc-row">
                            <span class="ord-calc-label">Tổng tiền</span>
                            <div class="ord-calc-input-wrapper">
                                <input type="text" id="ordSubTotal" value="0" readonly>
                            </div>
                        </div>
                        <div class="ord-calc-row">
                            <span class="ord-calc-label">Thuế</span>
                            <div class="ord-calc-input-wrapper">
                                <input type="number" id="ordTaxP" value="0" style="width: 60px; margin-right: 5px;" oninput="recalcTotalOrder()">
                                <input type="text" id="ordTaxA" value="0" readonly>
                            </div>
                        </div>
                        <div class="ord-calc-row total">
                            <span class="ord-calc-label">Tổng tiền thanh toán</span>
                            <div class="ord-calc-input-wrapper">
                                <input type="text" id="ordFinalTotal" value="0" readonly>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="ord-footer-actions">
                    <button class="ord-btn-cancel" onclick="initOrderModule('LIST')">Hủy bỏ</button>
                    <button class="ord-btn-save" onclick="saveNewOrderDetailed()">Lưu đơn hàng</button>
                </div>
            </div>
        </div>
    `;
}

function addGoodsRow() {
    const tbody = document.getElementById('goodsTableBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <div class="ord-field-wrapper" style="flex-direction: column; align-items: flex-start;">
                <div style="position: relative; width: 100%;">
                    <input type="text" class="g-name" placeholder="Nhập tên SP..." oninput="suggestProducts(this)" autocomplete="off">
                    <button class="ord-quick-add-btn" onclick="openProductSidebarFromOrder(this)" title="Tạo mới sản phẩm">＋</button>
                    <button class="ord-spec-edit-btn" onclick="openQuickSpecEdit(this)" title="Sửa nhanh quy cách">📌</button>
                </div>
                <div class="g-desc"></div>
                <div class="prod-suggestions" style="display:none; position:absolute; top:100%; left:0; width:100%; border:1px solid #ddd; background:white; z-index:1000; max-height:200px; overflow-y:auto; box-shadow:0 4px 6px rgba(0,0,0,0.1); border-radius:4px;"></div>
            </div>
        </td>
        <td><input type="text" class="g-unit" placeholder="Đơn vị"></td>
        <td><input type="number" class="g-price" value="0" oninput="calcOrderGoods(this)"></td>
        <td><input type="number" class="g-qty" value="1" oninput="calcOrderGoods(this)"></td>
        <td><input type="number" class="g-total" value="0" readonly></td>
        <td onclick="this.parentElement.remove(); recalcTotalOrder()"><span class="ord-goods-row-delete">×</span></td>
    `;
    tbody.appendChild(tr);
}

// Mở nhanh popup sửa quy cách từ nút 📌 trong dòng sản phẩm
function openQuickSpecEdit(btn) {
    const tr = btn.closest('tr');
    const descDiv = tr.querySelector('.g-desc');
    const nameInput = tr.querySelector('.g-name');
    const unitInput = tr.querySelector('.g-unit');

    // Xóa popover cũ
    const oldPopover = document.querySelector('.ord-quick-edit-popover');
    if (oldPopover) oldPopover.remove();

    const currentDesc = descDiv ? (descDiv.dataset.rawDesc || '') : '';
    const prodId = descDiv ? descDiv.dataset.prodId : null;
    const prodName = nameInput ? nameInput.value : '';

    const popover = document.createElement('div');
    popover.className = 'ord-quick-edit-popover';
    popover.style.width = '340px';
    popover.innerHTML = `
        <div style="font-weight:700; font-size:13px; color:#1e293b; margin-bottom:4px;">📌 Sửa nhanh quy cách</div>
        <div style="font-size:12px; color:#64748b; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${prodName}">${prodName || 'Đưa tên sản phẩm...'}</div>
        <textarea id="quick-edit-textarea" placeholder="Nhập quy cách, kích thước, mô tả...">${currentDesc}</textarea>
        <div class="ord-quick-edit-actions">
            <button class="sb-btn-tiny-cancel" id="quick-edit-cancel">Hủy</button>
            <button class="sb-btn-tiny-save" id="quick-edit-save">Lưu nhanh</button>
        </div>
    `;

    // Vị trí popup gần nút
    const rect = btn.getBoundingClientRect();
    const left = Math.min(rect.left, window.innerWidth - 360);
    const top = rect.bottom + window.scrollY + 4;
    popover.style.left = left + 'px';
    popover.style.top = top + 'px';

    document.body.appendChild(popover);
    document.getElementById('quick-edit-textarea').focus();

    document.getElementById('quick-edit-cancel').onclick = () => popover.remove();

    document.getElementById('quick-edit-save').onclick = () => {
        const newDesc = document.getElementById('quick-edit-textarea').value.trim();
        const unit = unitInput ? unitInput.value : '';

        // Cập nhật descDiv
        if (descDiv) {
            descDiv.dataset.rawDesc = newDesc;
            if (newDesc) {
                descDiv.innerHTML = `<span class="g-desc-icon">🔧</span> ${unit ? unit + ': ' : ''}${newDesc} <span class="g-desc-info-icon" onclick="openQuickSpecEdit(this.closest('tr').querySelector('.ord-spec-edit-btn'))">ⓘ</span>`;
                descDiv.style.display = 'flex';
            } else {
                descDiv.style.display = 'none';
            }
        }

        // Sync vào PRODUCTS nếu có prodId
        if (prodId) {
            const p = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(prod => prod.id == prodId) : null;
            if (p) {
                p.desc = newDesc;
                if (typeof saveProducts === 'function') saveProducts();
            }
        }

        popover.remove();
        showToast('✅ Đã cập nhật quy cách!');
    };

    // Đóng khi click ra ngoài
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!popover.contains(e.target) && e.target !== btn) {
                popover.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 10);
}

window.openQuickSpecEdit = openQuickSpecEdit;

function suggestProducts(input) {
    const rawVal = input.value;
    const query = rawVal.toLowerCase().trim();
    const wrapper = input.closest('.ord-field-wrapper');
    let suggestionsContainer = wrapper.querySelector('.prod-suggestions');

    if (!suggestionsContainer) {
        suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'prod-suggestions';
        suggestionsContainer.style.cssText = 'display:none; position:absolute; top:100%; left:0; width:100%; border:1px solid #e2e8f0; background:white; z-index:1000; max-height:250px; overflow-y:auto; box-shadow:0 8px 16px rgba(0,0,0,0.1); border-radius:8px;';
        wrapper.appendChild(suggestionsContainer);
    }

    if (rawVal.trim().length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    // Luôn cập nhật PRODUCTS mới nhất từ localStorage — cập nhật in-place để giữ shared reference
    const savedProds = localStorage.getItem('netprint_products');
    if (savedProds) {
        const parsedProds = JSON.parse(savedProds);
        if (window.PRODUCTS && Array.isArray(window.PRODUCTS)) {
            window.PRODUCTS.length = 0;
            parsedProds.forEach(p => window.PRODUCTS.push(p));
        } else {
            window.PRODUCTS = parsedProds;
        }
    } else if (typeof window.PRODUCTS === 'undefined') {
        window.PRODUCTS = [];
    }

    const matches = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)
    );

    suggestionsContainer.innerHTML = '';

    // Show matches
    if (matches.length > 0) {
        matches.forEach(p => {
            const div = document.createElement('div');
            div.style.cssText = 'padding:10px 14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f3f4f6; transition:background 0.1s;';
            div.onmouseover = () => div.style.background = '#f0f7ff';
            div.onmouseout = () => div.style.background = '';
            div.innerHTML = `
                <div>
                    <div style="font-weight:600; font-size:13px; color:#1f2937;">${p.code} - ${p.name}</div>
                    <div style="font-size:11px; color:#9ca3af; margin-top:2px;">${p.unit || ''} ${p.desc ? '• ' + p.desc.substring(0, 50) : ''}</div>
                </div>
                <div style="font-weight:600; color:#2563eb; font-size:13px; white-space:nowrap; margin-left:10px;">${typeof formatNumber === 'function' ? formatNumber(p.price) : p.price}₫</div>
            `;
            div.onmousedown = () => selectProductFromDB(div, p.id);
            suggestionsContainer.appendChild(div);
        });
    } else {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:12px 14px; color:#9ca3af; font-size:13px; text-align:center;';
        empty.textContent = 'Không tìm thấy sản phẩm phù hợp';
        suggestionsContainer.appendChild(empty);
    }

    // Quick Add option
    const quickAdd = document.createElement('div');
    quickAdd.style.cssText = 'padding:10px 14px; cursor:pointer; display:flex; align-items:center; gap:8px; background:#fafafa; border-top:1px solid #e5e7eb; color:#F94949; font-size:13px; font-weight:500;';
    quickAdd.onmouseover = () => quickAdd.style.background = '#fff5f5';
    quickAdd.onmouseout = () => quickAdd.style.background = '#fafafa';
    quickAdd.innerHTML = `<span>➕</span> Tạo nhanh: <strong>${rawVal}</strong>`;
    quickAdd.onmousedown = () => openProductSidebarFromOrder(input.parentElement.querySelector('.ord-quick-add-btn'));
    suggestionsContainer.appendChild(quickAdd);

    suggestionsContainer.style.display = 'block';

    // Close on blur
    input.onblur = () => setTimeout(() => suggestionsContainer.style.display = 'none', 200);
}

function openProductSidebarFromOrder(button) {
    const tr = button.closest('tr');
    const nameInput = tr.querySelector('.g-name');
    const initialName = nameInput.value;

    openAddProductModal((newProd) => {
        // Callback: điền vào dòng đơn hàng
        tr.querySelector('.g-name').value = newProd.code + ' - ' + newProd.name;
        tr.querySelector('.g-unit').value = newProd.unit;
        tr.querySelector('.g-price').value = newProd.price;

        // Hiện mô tả
        const descDiv = tr.querySelector('.g-desc');
        if (newProd.desc) {
            descDiv.innerHTML = `<span class="g-desc-icon">🔧</span> ${newProd.unit}: ${newProd.desc} <span class="g-desc-info-icon" onclick="openQuickSpecEdit(this.closest('tr').querySelector('.ord-spec-edit-btn'))">ⓘ</span>`;
            descDiv.dataset.rawDesc = newProd.desc;
            descDiv.dataset.prodId = newProd.id;
            descDiv.style.display = 'flex';
        } else {
            descDiv.style.display = 'none';
        }

        calcOrderGoods(tr.querySelector('.g-price'));

        // ⇄ Sync 2 chiều: cập nhật lại danh mục sản phẩm nếu đang mở
        if (typeof renderProductGrid === 'function') {
            try { renderProductGrid(); } catch (e) { }
        }
        // Đảm bảo window.PRODUCTS có sản phẩm mới (nếu chưa có)
        if (window.PRODUCTS && !window.PRODUCTS.find(p => p.id === newProd.id)) {
            window.PRODUCTS.push(newProd);
        }

        showToast(`✅ Đã tạo và chọn sản phẩm: ${newProd.name}`);
    });

    setTimeout(() => {
        const sbName = document.getElementById('sb-p-name');
        if (sbName && initialName) sbName.value = initialName;
    }, 50);
}

function selectProductFromDB(suggestionElement, productId) {
    const tr = suggestionElement.closest('tr');
    const p = PRODUCTS.find(prod => prod.id === productId);
    if (!p) return;

    tr.querySelector('.g-name').value = p.code + ' - ' + p.name;
    tr.querySelector('.g-price').value = p.price;
    tr.querySelector('.g-unit').value = p.unit;

    // Update description display
    const descDiv = tr.querySelector('.g-desc');
    if (p.desc) {
        descDiv.innerHTML = `<span class="g-desc-icon">🔧</span> ${p.unit}: ${p.desc} <span class="g-desc-info-icon" onclick="openQuickEditDesc(this)">ⓘ</span>`;
        descDiv.dataset.rawDesc = p.desc;
        descDiv.dataset.prodId = p.id;
        descDiv.style.display = 'flex';
    } else {
        descDiv.style.display = 'none';
    }

    const suggestionsContainer = tr.querySelector('.prod-suggestions');
    if (suggestionsContainer) suggestionsContainer.style.display = 'none';

    calcOrderGoods(tr.querySelector('.g-price'));
}

function calcOrderGoods(input) {
    const tr = input.closest('tr');
    const price = parseFloat(tr.querySelector('.g-price').value) || 0;
    const qty = parseFloat(tr.querySelector('.g-qty').value) || 0;

    let total = price * qty;
    tr.querySelector('.g-total').value = total;

    recalcTotalOrder();
}

function recalcTotalOrder() {
    let subTotal = 0;
    document.querySelectorAll('#goodsTableBody tr').forEach(tr => {
        subTotal += parseFloat(tr.querySelector('.g-total').value) || 0;
    });

    const taxP = parseFloat(document.getElementById('ordTaxP').value) || 0;
    const taxA = subTotal * (taxP / 100);
    const final = subTotal + taxA;

    document.getElementById('ordSubTotal').value = formatNumber(subTotal);
    document.getElementById('ordTaxA').value = formatNumber(taxA);
    document.getElementById('ordFinalTotal').value = formatNumber(final);
}

function saveNewOrderDetailed() {
    const code = document.getElementById('curOrderCode').value;
    const custId = document.getElementById('curOrderCustId').value;
    const date = document.getElementById('curOrderDate').value;

    if (!custId) {
        showToast('⚠️ Vui lòng chọn khách hàng!', 'error');
        return;
    }

    // Thu thập items chi tiết
    let itemsText = [];
    let goodsDetail = [];
    let totalValue = 0;

    document.querySelectorAll('#goodsTableBody tr').forEach(tr => {
        const name = tr.querySelector('.g-name').value;
        const unit = tr.querySelector('.g-unit')?.value || '';
        const price = parseFloat(tr.querySelector('.g-price')?.value) || 0;
        const qty = parseFloat(tr.querySelector('.g-qty')?.value) || 0;
        const sub = parseFloat(tr.querySelector('.g-total')?.value) || 0;
        // Lưu thêm mô tả/spec sản phẩm
        const descDiv = tr.querySelector('.g-desc');
        const desc = descDiv ? (descDiv.dataset.rawDesc || '') : '';
        if (name) {
            itemsText.push(`${qty} ${name}`);
            goodsDetail.push({ name, unit, price, qty, subtotal: sub, desc });
            totalValue += sub;
        }
    });

    if (goodsDetail.length === 0) {
        showToast('⚠️ Vui lòng nhập ít nhất một sản phẩm!', 'error');
        return;
    }

    // Xử lý thuế
    const taxP = parseFloat(document.getElementById('ordTaxP').value) || 0;
    const taxAmount = totalValue * taxP / 100;
    const totalAfterTax = totalValue + taxAmount;

    // Lưu tên riêng biệt với items text
    const orderName = (document.getElementById('curOrderName')?.value || '').trim();
    const displayName = orderName || goodsDetail.map(g => g.name).join(', ');

    const newId = ORDERS.length > 0 ? Math.max(...ORDERS.map(o => o.id)) + 1 : 1;
    const newOrder = {
        id: newId,
        code: code,
        name: displayName,          // Tên hiển thị sạch
        customerId: parseInt(custId),
        date: date.split('/').reverse().join('-'),
        items: orderName || itemsText.join(', '),  // Legacy field
        goods: goodsDetail,
        subtotal: totalValue,
        taxPercent: taxP,
        taxAmount: taxAmount,
        total: totalAfterTax,
        status: 'PENDING'
    };

    ORDERS.push(newOrder);
    saveOrders();
    showToast('✅ Đã tạo đơn hàng thành công!');
    initOrderModule('LIST');
}

function openQuickEditDesc(icon) {
    // Remove existing popover if any
    const oldPopover = document.querySelector('.ord-quick-edit-popover');
    if (oldPopover) oldPopover.remove();

    const descDiv = icon.parentElement;
    const currentDesc = descDiv.dataset.rawDesc || '';
    const prodId = descDiv.dataset.prodId;

    const popover = document.createElement('div');
    popover.className = 'ord-quick-edit-popover';
    popover.innerHTML = `
        <div style="font-weight: 700; font-size: 14px; color: #1e293b;">Hiệu chỉnh quy cách nhanh</div>
        <textarea id="quick-edit-textarea">${currentDesc}</textarea>
        <div class="ord-quick-edit-actions">
            <button class="sb-btn-tiny-cancel" id="quick-edit-cancel">Hủy</button>
            <button class="sb-btn-tiny-save" id="quick-edit-save">Lưu nhanh</button>
        </div>
    `;

    // Position popover
    const rect = icon.getBoundingClientRect();
    popover.style.left = (rect.left - 320) + 'px';
    popover.style.top = (rect.top + window.scrollY - 150) + 'px';

    document.body.appendChild(popover);

    document.getElementById('quick-edit-cancel').onclick = () => popover.remove();

    document.getElementById('quick-edit-save').onclick = () => {
        const newDesc = document.getElementById('quick-edit-textarea').value.trim();
        descDiv.dataset.rawDesc = newDesc;

        // Update UI
        const unit = descDiv.innerText.split(':')[0].replace('🔧', '').trim();
        descDiv.innerHTML = `<span class="g-desc-icon">🔧</span> ${unit}: ${newDesc} <span class="g-desc-info-icon" onclick="openQuickEditDesc(this)">ⓘ</span>`;

        // Sync back to PRODUCTS if available
        if (prodId) {
            const p = PRODUCTS.find(prod => prod.id == prodId);
            if (p) {
                p.desc = newDesc;
                saveProducts();
            }
        }

        popover.remove();
        showToast('✅ Đã cập nhật quy cách!');
    };

    // Close on click outside
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!popover.contains(e.target) && e.target !== icon) {
                popover.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 10);
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
window.openProductSidebarFromOrder = openProductSidebarFromOrder;
window.selectProductFromDB = selectProductFromDB;
window.suggestProducts = suggestProducts;
window.addGoodsRow = addGoodsRow;
window.calcOrderGoods = calcOrderGoods;
window.openQuickEditDesc = openQuickEditDesc;

// =========================================
// MINI CALENDAR DATE PICKER
// =========================================
let _npDpCurrentMonth = null;
let _npDpCurrentYear = null;
let _npDpTargetInput = null;
let _npDpSelectedDate = null;

function openNpDatepicker(inputEl) {
    // Close any existing
    closeNpDatepicker();

    _npDpTargetInput = inputEl;

    // Parse current value (d/m/yyyy)
    const parts = (inputEl.value || '').split('/');
    const now = new Date();
    if (parts.length === 3) {
        _npDpSelectedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        _npDpCurrentMonth = parseInt(parts[1]) - 1;
        _npDpCurrentYear = parseInt(parts[2]);
    } else {
        _npDpSelectedDate = now;
        _npDpCurrentMonth = now.getMonth();
        _npDpCurrentYear = now.getFullYear();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'np-datepicker-overlay';
    overlay.onclick = closeNpDatepicker;
    document.body.appendChild(overlay);

    // Create calendar
    const cal = document.createElement('div');
    cal.className = 'np-datepicker';
    cal.id = 'npDatepickerPopup';

    // Position near the input
    const rect = inputEl.getBoundingClientRect();
    cal.style.left = rect.left + 'px';
    cal.style.top = (rect.bottom + 4) + 'px';

    document.body.appendChild(cal);
    renderNpCalendar();
}

function closeNpDatepicker() {
    const existing = document.getElementById('npDatepickerPopup');
    if (existing) existing.remove();
    const overlay = document.querySelector('.np-datepicker-overlay');
    if (overlay) overlay.remove();
    _npDpTargetInput = null;
}

function renderNpCalendar() {
    const cal = document.getElementById('npDatepickerPopup');
    if (!cal) return;

    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    const selStr = _npDpSelectedDate
        ? `${_npDpSelectedDate.getFullYear()}-${_npDpSelectedDate.getMonth()}-${_npDpSelectedDate.getDate()}`
        : '';

    // First day of month
    const firstDay = new Date(_npDpCurrentYear, _npDpCurrentMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(_npDpCurrentYear, _npDpCurrentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(_npDpCurrentYear, _npDpCurrentMonth, 0).getDate();

    // Build days
    let daysHTML = '';

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const prevM = _npDpCurrentMonth - 1;
        const prevY = prevM < 0 ? _npDpCurrentYear - 1 : _npDpCurrentYear;
        const pm = prevM < 0 ? 11 : prevM;
        daysHTML += `<div class="np-dp-day other-month" data-d="${d}" data-m="${pm}" data-y="${prevY}" onclick="selectNpDate(${d},${pm},${prevY})">${d}</div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${_npDpCurrentYear}-${_npDpCurrentMonth}-${d}`;
        let cls = 'np-dp-day';
        if (ds === todayStr) cls += ' today';
        if (ds === selStr) cls += ' selected';
        daysHTML += `<div class="${cls}" data-d="${d}" data-m="${_npDpCurrentMonth}" data-y="${_npDpCurrentYear}" onclick="selectNpDate(${d},${_npDpCurrentMonth},${_npDpCurrentYear})">${d}</div>`;
    }

    // Next month leading days
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
        const nextM = _npDpCurrentMonth + 1;
        const nextY = nextM > 11 ? _npDpCurrentYear + 1 : _npDpCurrentYear;
        const nm = nextM > 11 ? 0 : nextM;
        daysHTML += `<div class="np-dp-day other-month" data-d="${d}" data-m="${nm}" data-y="${nextY}" onclick="selectNpDate(${d},${nm},${nextY})">${d}</div>`;
    }

    cal.innerHTML = `
        <div class="np-dp-header">
            <button class="np-dp-nav" onclick="npDpPrev()" type="button">‹</button>
            <span class="np-dp-title">${months[_npDpCurrentMonth]} ${_npDpCurrentYear}</span>
            <button class="np-dp-nav" onclick="npDpNext()" type="button">›</button>
        </div>
        <div class="np-dp-weekdays">
            ${weekdays.map(w => `<div class="np-dp-weekday">${w}</div>`).join('')}
        </div>
        <div class="np-dp-days">
            ${daysHTML}
        </div>
        <div class="np-dp-footer">
            <button class="np-dp-today-btn" onclick="selectNpDate(${today.getDate()},${today.getMonth()},${today.getFullYear()})" type="button">Hôm nay</button>
        </div>
    `;
}

function npDpPrev() {
    _npDpCurrentMonth--;
    if (_npDpCurrentMonth < 0) {
        _npDpCurrentMonth = 11;
        _npDpCurrentYear--;
    }
    renderNpCalendar();
}

function npDpNext() {
    _npDpCurrentMonth++;
    if (_npDpCurrentMonth > 11) {
        _npDpCurrentMonth = 0;
        _npDpCurrentYear++;
    }
    renderNpCalendar();
}

function selectNpDate(d, m, y) {
    if (_npDpTargetInput) {
        _npDpTargetInput.value = `${d}/${m + 1}/${y}`;
    }
    _npDpSelectedDate = new Date(y, m, d);
    closeNpDatepicker();
}

// Expose globally
window.openNpDatepicker = openNpDatepicker;
window.closeNpDatepicker = closeNpDatepicker;
window.selectNpDate = selectNpDate;
window.npDpPrev = npDpPrev;
window.npDpNext = npDpNext;

// =========================================
// SEARCHABLE CUSTOMER DROPDOWN
// =========================================
function suggestCustomers(input) {
    const query = (input.value || '').toLowerCase().trim();
    const container = document.getElementById('custSuggestions');
    if (!container) return;

    // Always reload latest customers
    if (typeof loadCustomers === 'function') loadCustomers();
    const custs = (typeof CUSTOMERS !== 'undefined') ? CUSTOMERS : [];

    // Filter by code or name
    const matches = query.length === 0
        ? custs // show all when empty/focused
        : custs.filter(c =>
            (c.code || '').toLowerCase().includes(query) ||
            (c.name || '').toLowerCase().includes(query) ||
            (c.phone || '').includes(query)
        );

    container.innerHTML = '';

    if (matches.length > 0) {
        matches.forEach(c => {
            const div = document.createElement('div');
            div.className = 'cust-suggest-item';
            div.innerHTML = `
                <div class="cust-suggest-main">
                    <span class="cust-suggest-code">${c.code || '--'}</span>
                    <span class="cust-suggest-name">${c.name}</span>
                </div>
                <span class="cust-suggest-phone">${c.phone || ''}</span>
            `;
            div.onmousedown = (e) => { e.preventDefault(); selectCustomerFromList(c); };
            container.appendChild(div);
        });
    } else {
        const empty = document.createElement('div');
        empty.className = 'cust-suggest-empty';
        empty.textContent = 'Không tìm thấy khách hàng';
        container.appendChild(empty);
    }

    container.style.display = 'block';

    // Close on blur
    input.onblur = () => setTimeout(() => {
        if (container) container.style.display = 'none';
    }, 200);
}

function selectCustomerFromList(cust) {
    const hiddenInput = document.getElementById('curOrderCustId');
    const searchInput = document.getElementById('curOrderCustSearch');
    const container = document.getElementById('custSuggestions');

    if (hiddenInput) hiddenInput.value = cust.id;
    if (searchInput) searchInput.value = (cust.code ? cust.code + ' - ' : '') + cust.name;
    if (container) container.style.display = 'none';
}

window.suggestCustomers = suggestCustomers;
window.selectCustomerFromList = selectCustomerFromList;
