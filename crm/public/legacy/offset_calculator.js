// ==================== OFFSET CALCULATOR ====================
// Module tính giá In Offset — 7 module chi phí + Bảng lợi nhuận

// ===== DEFAULT DATA FOR OFFSET =====
const OFFSET_DEFAULTS = {
    // Danh sách loại giấy offset phổ biến + đơn giá/tờ theo khổ
    papers: [
        { id: 1, name: 'Couché 100gsm', pricePerSheet: 1200 },
        { id: 2, name: 'Couché 150gsm', pricePerSheet: 1500 },
        { id: 3, name: 'Couché 200gsm', pricePerSheet: 2000 },
        { id: 4, name: 'Couché 250gsm', pricePerSheet: 2500 },
        { id: 5, name: 'Couché 300gsm', pricePerSheet: 3000 },
        { id: 6, name: 'Ivory 230gsm', pricePerSheet: 2200 },
        { id: 7, name: 'Ivory 300gsm', pricePerSheet: 2800 },
        { id: 8, name: 'Ivory 350gsm', pricePerSheet: 3500 },
        { id: 9, name: 'Duplex 250gsm', pricePerSheet: 1800 },
        { id: 10, name: 'Duplex 300gsm', pricePerSheet: 2200 },
        { id: 11, name: 'Kraft 120gsm', pricePerSheet: 1600 },
        { id: 12, name: 'Kraft 200gsm', pricePerSheet: 2100 },
        { id: 13, name: 'Decal nhựa', pricePerSheet: 3070 },
        { id: 14, name: 'Decal giấy', pricePerSheet: 2500 },
        { id: 15, name: 'Ford 70gsm', pricePerSheet: 800 },
        { id: 16, name: 'Ford 100gsm', pricePerSheet: 1000 },
        { id: 17, name: 'Bristol 200gsm', pricePerSheet: 2400 },
        { id: 18, name: 'Mỹ thuật 120gsm', pricePerSheet: 3500 },
        { id: 19, name: 'Mỹ thuật 250gsm', pricePerSheet: 5000 },
        { id: 20, name: 'Giấy khác', pricePerSheet: 0 }
    ],
    // Kích thước tờ in offset phổ biến (cm)
    sheetSizes: [
        { id: 1, name: '32.5 × 51 cm', w: 32.5, h: 51 },
        { id: 2, name: '36 × 51 cm', w: 36, h: 51 },
        { id: 3, name: '43 × 61 cm', w: 43, h: 61 },
        { id: 4, name: '52 × 72 cm', w: 52, h: 72 },
        { id: 5, name: '65 × 100 cm', w: 65, h: 100 },
        { id: 6, name: 'Tuỳ chọn', w: 0, h: 0 }
    ],
    // Giá in offset theo tiered (tính theo số tờ)
    printTiers: [
        { max: 200, price: 3000 },
        { max: 500, price: 2500 },
        { max: 1000, price: 2000 },
        { max: 2000, price: 1500 },
        { max: 5000, price: 1200 },
        { max: 999999, price: 1000 }
    ],
    // Kẽm in (chi phí cố định) — mỗi màu 1 kẽm
    platePrice: 300000,
    // Số màu in mặc định
    defaultColors: 4,
    // Hệ số lợi nhuận mặc định
    defaultMargins: [1.2, 1.25, 1.3, 1.35, 1.4, 1.5]
};

// ===== STATE =====
let offsetState = {
    orderName: '',
    quantity: 0,
    // Module 1: Giấy
    paperId: 1,
    customPaperName: '',
    customPaperPrice: 0,
    sheetSizeId: 1,
    customSheetW: 0,
    customSheetH: 0,
    sheetCount: 0,
    // Module 2: In ấn
    printColors: 4,
    // Module 3: Khuôn
    molds: {
        be: { enabled: false, price: 0 },
        epKim: { enabled: false, price: 0 },
        thucNoi: { enabled: false, price: 0 },
        dapChim: { enabled: false, price: 0 },
        khac: { enabled: false, price: 0 }
    },
    // Module 4: Gia công thành phẩm
    finishing: {
        canMang: { enabled: false, price: 0 },
        catXen: { enabled: false, price: 0 },
        be: { enabled: false, price: 0 },
        epKim: { enabled: false, price: 0 },
        thucNoi: { enabled: false, price: 0 },
        dapChim: { enabled: false, price: 0 },
        dan: { enabled: false, price: 0 },
        boi: { enabled: false, price: 0 },
        dongCuon: { enabled: false, price: 0 }
    },
    // Module 5: Vận chuyển
    shipping: {
        vatTu: { enabled: false, price: 0 },
        giaoMau: { enabled: false, price: 0 },
        giaoHang1: { enabled: false, price: 0 },
        giaoHang2: { enabled: false, price: 0 },
        giaoHang3: { enabled: false, price: 0 }
    },
    // Module 6: Phát sinh
    extras: [],
    // Module 7: Kết quả
    customMargins: [1.2, 1.25, 1.3, 1.35, 1.4, 1.5]
};

// ===== INIT =====
function initOffsetCalculator() {
    populateOffsetDropdowns();
    bindOffsetEvents();
    recalculateOffset();
    console.log('✅ Offset Calculator initialized');
}

function populateOffsetDropdowns() {
    // Populate paper type dropdown
    const paperSelect = document.getElementById('offsetPaperType');
    if (paperSelect) {
        paperSelect.innerHTML = '';
        OFFSET_DEFAULTS.papers.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.pricePerSheet > 0
                ? `${p.name} — ${formatVND(p.pricePerSheet)}/tờ`
                : p.name;
            paperSelect.appendChild(opt);
        });
    }

    // Populate sheet size dropdown
    const sizeSelect = document.getElementById('offsetSheetSize');
    if (sizeSelect) {
        sizeSelect.innerHTML = '';
        OFFSET_DEFAULTS.sheetSizes.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            sizeSelect.appendChild(opt);
        });
    }

    // Populate custom margins
    renderOffsetMargins();
}

function bindOffsetEvents() {
    // Paper type change
    const paperSelect = document.getElementById('offsetPaperType');
    if (paperSelect) {
        paperSelect.addEventListener('change', () => {
            const paper = OFFSET_DEFAULTS.papers.find(p => p.id === parseInt(paperSelect.value));
            const priceInput = document.getElementById('offsetPaperPrice');
            if (paper && priceInput) {
                priceInput.value = paper.pricePerSheet;
            }
            // Show/hide custom name input
            const customNameRow = document.getElementById('offsetCustomPaperNameRow');
            if (customNameRow) {
                customNameRow.style.display = paper && paper.name === 'Giấy khác' ? 'flex' : 'none';
            }
            recalculateOffset();
        });
    }

    // Sheet size change
    const sizeSelect = document.getElementById('offsetSheetSize');
    if (sizeSelect) {
        sizeSelect.addEventListener('change', () => {
            const size = OFFSET_DEFAULTS.sheetSizes.find(s => s.id === parseInt(sizeSelect.value));
            const customRow = document.getElementById('offsetCustomSizeRow');
            if (customRow) {
                customRow.style.display = size && size.name === 'Tuỳ chọn' ? 'flex' : 'none';
            }
            recalculateOffset();
        });
    }
}

// ===== CHECKBOX TOGGLE HELPERS =====
function toggleOffsetCheckItem(moduleName, key, checkbox) {
    const priceInput = checkbox.closest('.offset-check-item').querySelector('input[type="number"]');
    if (priceInput) {
        priceInput.disabled = !checkbox.checked;
        if (!checkbox.checked) {
            priceInput.value = 0;
        }
    }
    recalculateOffset();
}

// ===== ADD EXTRA ITEM (Module 6) =====
function addOffsetExtraItem() {
    const container = document.getElementById('offsetExtrasList');
    if (!container) return;

    const idx = container.querySelectorAll('.offset-check-item').length;
    const div = document.createElement('div');
    div.className = 'offset-check-item';
    div.innerHTML = `
        <label class="offset-check-label">
            <input type="checkbox" checked onchange="toggleOffsetCheckItem('extras', ${idx}, this); recalculateOffset()">
            <input type="text" class="offset-extra-name" placeholder="Tên mục..." value="Mục ${idx + 1}" style="border:none; background:transparent; font-weight:600; width:100px;">
        </label>
        <div class="offset-check-value">
            <input type="number" value="0" min="0" step="1000" oninput="recalculateOffset()">
            <span class="offset-unit">đ</span>
            <button type="button" class="btn-remove-extra" onclick="this.closest('.offset-check-item').remove(); recalculateOffset();" title="Xóa">✕</button>
        </div>
    `;
    container.appendChild(div);
}

// ===== CORE CALCULATION =====
function recalculateOffset() {
    // --- Module 1: Giấy In ---
    const paperPrice = parseFloat(document.getElementById('offsetPaperPrice')?.value) || 0;
    const sheetCount = parseInt(document.getElementById('offsetSheetCount')?.value) || 0;
    const paperTotal = sheetCount * paperPrice;

    const sizeSelect = document.getElementById('offsetSheetSize');
    const selectedSize = OFFSET_DEFAULTS.sheetSizes.find(s => s.id === parseInt(sizeSelect?.value));
    let sheetW = selectedSize ? selectedSize.w : 0;
    let sheetH = selectedSize ? selectedSize.h : 0;
    if (selectedSize && selectedSize.name === 'Tuỳ chọn') {
        sheetW = parseFloat(document.getElementById('offsetCustomW')?.value) || 0;
        sheetH = parseFloat(document.getElementById('offsetCustomH')?.value) || 0;
    }

    // Update Paper subtotal
    setText('offsetPaperSubtotal', formatVND(paperTotal));

    // --- Module 2: In Ấn ---
    const printColors = parseInt(document.getElementById('offsetPrintColors')?.value) || 4;
    const platePrice = OFFSET_DEFAULTS.platePrice * printColors;
    const printPricePerSheet = getPrintTierPrice(sheetCount);
    const printCost = sheetCount * printPricePerSheet;
    const printTotal = platePrice + printCost;

    // Update Print auto-display
    setText('offsetPrintSheetSize', sheetW && sheetH ? `${sheetW} × ${sheetH} cm` : '—');
    setText('offsetPrintSheetCount', sheetCount);
    setText('offsetPlatePrice', formatVND(platePrice));
    setText('offsetPrintPrice', formatVND(printCost));
    setText('offsetPrintSubtotal', formatVND(printTotal));

    // --- Module 3: Khuôn ---
    const moldTotal = sumCheckItems('offsetMoldsGroup');
    setText('offsetMoldSubtotal', formatVND(moldTotal));

    // --- Module 4: Gia Công Thành Phẩm ---
    const finishingTotal = sumCheckItems('offsetFinishingGroup');
    setText('offsetFinishingSubtotal', formatVND(finishingTotal));

    // --- Module 5: Vận Chuyển ---
    const shippingTotal = sumCheckItems('offsetShippingGroup');
    setText('offsetShippingSubtotal', formatVND(shippingTotal));

    // --- Module 6: Phát Sinh ---
    const extrasTotal = sumCheckItems('offsetExtrasList');
    setText('offsetExtrasSubtotal', formatVND(extrasTotal));

    // --- Module 7: Tổng Hợp ---
    const grandTotal = paperTotal + printTotal + moldTotal + finishingTotal + shippingTotal + extrasTotal;
    const quantity = parseInt(document.getElementById('offsetQuantity')?.value) || 0;

    // Update cost breakdown
    setText('offsetSumPaper', formatVND(paperTotal));
    setText('offsetSumPrint', formatVND(printTotal));
    setText('offsetSumMold', formatVND(moldTotal));
    setText('offsetSumFinishing', formatVND(finishingTotal));
    setText('offsetSumShipping', formatVND(shippingTotal));
    setText('offsetSumExtras', formatVND(extrasTotal));
    setText('offsetGrandTotal', formatVND(grandTotal));

    // Update profit table
    renderOffsetProfitTable(grandTotal, quantity);
}

function getPrintTierPrice(sheetCount) {
    for (const tier of OFFSET_DEFAULTS.printTiers) {
        if (sheetCount <= tier.max) return tier.price;
    }
    return OFFSET_DEFAULTS.printTiers[OFFSET_DEFAULTS.printTiers.length - 1].price;
}

function sumCheckItems(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return 0;
    let total = 0;
    container.querySelectorAll('.offset-check-item').forEach(item => {
        const cb = item.querySelector('input[type="checkbox"]');
        const valInput = item.querySelector('input[type="number"]');
        if (cb && cb.checked && valInput) {
            total += parseFloat(valInput.value) || 0;
        }
    });
    return total;
}

// ===== PROFIT TABLE =====
function renderOffsetProfitTable(grandTotal, quantity) {
    const tbody = document.getElementById('offsetProfitTableBody');
    if (!tbody) return;

    // Get margins from custom inputs
    const margins = getCustomMargins();

    let html = '';
    margins.forEach(m => {
        const total = Math.round(grandTotal * m);
        const profit = total - grandTotal;
        const unitPrice = quantity > 0 ? Math.round(total / quantity) : 0;
        const isHighlight = m === 1.3 || m === 1.5;
        html += `
            <tr class="${isHighlight ? 'highlight-row' : ''}">
                <td class="margin-cell">×${m}</td>
                <td>${formatVND(total)}</td>
                <td class="profit-cell">${formatVND(profit)}</td>
                <td class="unit-price-cell">${quantity > 0 ? formatVND(unitPrice) : '—'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function getCustomMargins() {
    const inputs = document.querySelectorAll('#offsetCustomMarginsList .margin-input');
    const margins = [];
    inputs.forEach(inp => {
        const val = parseFloat(inp.value);
        if (val > 0) margins.push(val);
    });
    return margins.length > 0 ? margins.sort((a, b) => a - b) : OFFSET_DEFAULTS.defaultMargins;
}

function renderOffsetMargins() {
    const container = document.getElementById('offsetCustomMarginsList');
    if (!container) return;

    const margins = OFFSET_DEFAULTS.defaultMargins;
    container.innerHTML = '';
    margins.forEach((m) => {
        const span = document.createElement('span');
        span.className = 'margin-input-wrap';
        span.innerHTML = `
            <span class="margin-prefix">×</span>
            <input type="number" class="margin-input" value="${m}" min="1" max="5" step="0.05" oninput="recalculateOffset()">
        `;
        container.appendChild(span);
    });
}

function addOffsetMargin() {
    const container = document.getElementById('offsetCustomMarginsList');
    if (!container) return;
    const existing = container.querySelectorAll('.margin-input-wrap').length;
    if (existing >= 10) {
        showToast('⚠️ Tối đa 10 mức hệ số!', 'error');
        return;
    }
    const lastVal = container.querySelector('.margin-input-wrap:last-child .margin-input');
    const newVal = lastVal ? (parseFloat(lastVal.value) + 0.1).toFixed(2) : '1.6';

    const span = document.createElement('span');
    span.className = 'margin-input-wrap';
    span.innerHTML = `
        <span class="margin-prefix">×</span>
        <input type="number" class="margin-input" value="${newVal}" min="1" max="5" step="0.05" oninput="recalculateOffset()">
        <button type="button" class="btn-remove-margin" onclick="this.closest('.margin-input-wrap').remove(); recalculateOffset();" title="Xóa">✕</button>
    `;
    container.appendChild(span);
    recalculateOffset();
}

// ===== RESET =====
function resetOffsetCalculator() {
    if (!confirm('🔄 Xóa tất cả dữ liệu Offset?')) return;

    // Reset all inputs
    const calc = document.getElementById('offset-calculator');
    if (!calc) return;

    calc.querySelectorAll('input[type="number"]').forEach(inp => {
        if (inp.classList.contains('margin-input')) return; // Keep margin inputs
        inp.value = 0;
    });
    calc.querySelectorAll('input[type="text"]').forEach(inp => inp.value = '');
    calc.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        const priceInput = cb.closest('.offset-check-item')?.querySelector('input[type="number"]');
        if (priceInput) priceInput.disabled = true;
    });

    // Reset dropdowns
    const paperSelect = document.getElementById('offsetPaperType');
    if (paperSelect) paperSelect.selectedIndex = 0;
    const sizeSelect = document.getElementById('offsetSheetSize');
    if (sizeSelect) sizeSelect.selectedIndex = 0;

    // Reset paper price
    const paper = OFFSET_DEFAULTS.papers[0];
    const priceInput = document.getElementById('offsetPaperPrice');
    if (priceInput && paper) priceInput.value = paper.pricePerSheet;

    // Reset colors
    const colorsInput = document.getElementById('offsetPrintColors');
    if (colorsInput) colorsInput.value = 4;

    // Clear extras
    const extrasList = document.getElementById('offsetExtrasList');
    if (extrasList) extrasList.innerHTML = '';

    // Hide custom fields
    const customNameRow = document.getElementById('offsetCustomPaperNameRow');
    if (customNameRow) customNameRow.style.display = 'none';
    const customSizeRow = document.getElementById('offsetCustomSizeRow');
    if (customSizeRow) customSizeRow.style.display = 'none';

    // Reset margins
    renderOffsetMargins();
    recalculateOffset();

    showToast('🔄 Đã reset Offset Calculator!');
}

// ===== UTILITY =====
// formatVND: only define if not already available
if (typeof window.formatVND === 'undefined') {
    window.formatVND = function (n) {
        if (typeof n !== 'number' || isNaN(n)) return '0';
        return n.toLocaleString('vi-VN');
    };
}
function formatVND(n) {
    return window.formatVND(n);
}
// setText is already defined in app.js — reuse it
