
// ==================== TAB MANAGER & CONTEXT MENU ====================

// Quản lý trạng thái các tab tính giá
const CALC_TABS = {
    tabs: [
        { id: 1, name: 'Tính giá 1', type: 'paper', data: {} } // Tab mặc định
    ],
    currentId: 1,
    nextId: 2
};

// Lưu trạng thái của tab hiện tại
function saveCurrentTabState() {
    const currentTab = CALC_TABS.tabs.find(t => t.id === CALC_TABS.currentId);
    if (!currentTab) return;

    // Chỉ lưu nếu đang ở tab In Nhanh (paper)
    // Nếu mở rộng cho Catalogue thì cần logic thêm
    if (currentTab.type === 'paper') {
        currentTab.data = getPaperCalcState();
    }
}

// Lấy dữ liệu từ giao diện In Nhanh
function getPaperCalcState() {
    return {
        paperTypeId: document.getElementById('paperType')?.value,
        paperTypeSearch: document.getElementById('paperTypeSearch')?.value,
        customPriceToggle: document.getElementById('btnCustomPriceToggle')?.classList.contains('active'),
        customPrice: document.getElementById('paperCustomPrice')?.value,

        prodW: document.getElementById('prodWidth')?.value,
        prodH: document.getElementById('prodHeight')?.value,
        qty: document.getElementById('prodQty')?.value,

        printSize: document.getElementById('paperPrintSize')?.value,

        printId: document.getElementById('paperPrint')?.value,
        lamId: document.getElementById('paperLamination')?.value,

        // Checkbox gia công
        procs: Array.from(document.querySelectorAll('input[name="paperProc"]:checked')).map(cb => cb.value),

        otherCost: document.getElementById('paperOtherCosts')?.value
    };
}

// Khôi phục dữ liệu lên giao diện
function restoreTabState(tabData) {
    if (!tabData) return; // Nếu ko có data thì để nguyên hoặc reset default

    // Reset form trước
    resetPaperCalcForm();

    // Fill data
    if (tabData.paperTypeId) document.getElementById('paperType').value = tabData.paperTypeId;

    // Xử lý Custom Price Toggle
    const btnToggle = document.getElementById('btnCustomPriceToggle');
    const isActive = btnToggle?.classList.contains('active');

    if (tabData.customPriceToggle && !isActive) {
        toggleCustomPrice(); // Bật lên
    } else if (!tabData.customPriceToggle && isActive) {
        toggleCustomPrice(); // Tắt đi
    }

    // Fill các trường khác
    if (tabData.paperTypeSearch) {
        const input = document.getElementById('paperTypeSearch');
        if (input) input.value = tabData.paperTypeSearch;
        // Nếu là custom name thì phải update lại giao diện input
        if (tabData.customPriceToggle) {
            input.style.borderColor = '#ff9800';
            input.style.background = 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)';
        }
    }

    if (tabData.customPrice) document.getElementById('paperCustomPrice').value = tabData.customPrice;

    if (tabData.prodW) document.getElementById('prodWidth').value = tabData.prodW;
    if (tabData.prodH) document.getElementById('prodHeight').value = tabData.prodH;
    if (tabData.qty) document.getElementById('prodQty').value = tabData.qty;

    if (tabData.printSize) document.getElementById('paperPrintSize').value = tabData.printSize;
    if (tabData.printId) document.getElementById('paperPrint').value = tabData.printId;
    if (tabData.lamId) document.getElementById('paperLamination').value = tabData.lamId;

    // Restore Processing Checkboxes
    if (tabData.procs && Array.isArray(tabData.procs)) {
        tabData.procs.forEach(procId => {
            const cb = document.querySelector(`input[name="paperProc"][value="${procId}"]`);
            if (cb) cb.checked = true;
        });
    }

    if (tabData.otherCost) document.getElementById('paperOtherCosts').value = tabData.otherCost;

    // Tính toán lại
    setTimeout(() => {
        if (typeof calculatePaper === 'function') calculatePaper();
    }, 100);
}

// Reset form về mặc định
function resetPaperCalcForm() {
    // Xoá các input text/number
    const inputs = document.querySelectorAll('#paper-calculator input[type="text"], #paper-calculator input[type="number"]');
    inputs.forEach(input => {
        // Giữ lại các giá trị mặc định nếu cần, hoặc clear hết
        if (input.id === 'paperMarginH' || input.id === 'paperMarginV') return; // Giữ lề
        input.value = '';
    });

    // Reset dropdowns về option đầu tiên
    const selects = document.querySelectorAll('#paper-calculator select');
    selects.forEach(select => select.selectedIndex = 0);

    // Uncheck checkboxes
    const checkboxes = document.querySelectorAll('#paper-calculator input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);

    // Reset Toggle Custom Price nếu đang bật
    const btnToggle = document.getElementById('btnCustomPriceToggle');
    if (btnToggle && btnToggle.classList.contains('active')) {
        toggleCustomPrice();
    }

    // Clear kết quả
    setText('paperYield', '0');
    setText('paperSheets', '0');
    setText('paperResQty', '0 sp');
    setText('paperResTotalSell', '0đ');

    // Vẽ lại grid trống
    const grid = document.getElementById('paperSheetGrid');
    if (grid) grid.innerHTML = '';
}


// ===== TAB OPERATIONS =====

function switchCalcTab(tabId) {
    if (tabId === CALC_TABS.currentId) return;

    // 1. Lưu state tab cũ
    saveCurrentTabState();

    // 2. Update UI active tab
    document.querySelectorAll('.calc-tab').forEach(el => el.classList.remove('active'));
    document.querySelector(`.calc-tab[data-id="${tabId}"]`)?.classList.add('active');

    // 3. Load state tab mới
    const newTab = CALC_TABS.tabs.find(t => t.id === tabId);
    if (newTab) {
        CALC_TABS.currentId = tabId;
        restoreTabState(newTab.data);
    }
}

function createNewCalcTab(name = null) {
    // Lưu tab hiện tại trước
    saveCurrentTabState();

    const newId = CALC_TABS.nextId++;
    const newTabName = name || `Tính giá ${newId}`;

    const newTab = {
        id: newId,
        name: newTabName,
        type: 'paper',
        data: {} // Tab mới dữ liệu trống
    };

    CALC_TABS.tabs.push(newTab);

    // Render tab button mới
    const container = document.getElementById('calc-tabs-container');
    const tabEl = document.createElement('div');
    tabEl.className = 'calc-tab';
    tabEl.dataset.id = newId;
    tabEl.onclick = () => switchCalcTab(newId);
    tabEl.innerHTML = `
        <span>${newTabName}</span>
        <span class="close-tab" onclick="closeCalcTab(event, ${newId})">×</span>
    `;

    container.appendChild(tabEl);

    // Switch sang tab mới
    switchCalcTab(newId);
}

function closeCalcTab(event, id) {
    if (event) event.stopPropagation();

    // Không cho đóng tab cuối cùng
    if (CALC_TABS.tabs.length <= 1) {
        showToast('⚠️ Không thể đóng tab cuối cùng!');
        return;
    }

    const index = CALC_TABS.tabs.findIndex(t => t.id === id);
    if (index === -1) return;

    // Xoá khỏi mảng
    CALC_TABS.tabs.splice(index, 1);

    // Xoá UI
    const tabEl = document.querySelector(`.calc-tab[data-id="${id}"]`);
    if (tabEl) tabEl.remove();

    // Nếu đóng tab đang active, switch sang tab khác (ví dụ tab trước đó)
    if (id === CALC_TABS.currentId) {
        const newActiveTab = CALC_TABS.tabs[Math.max(0, index - 1)];
        // Gán thủ công id để switchCalcTab nhận diện thay đổi
        CALC_TABS.currentId = -1;
        switchCalcTab(newActiveTab.id);
    }
}



