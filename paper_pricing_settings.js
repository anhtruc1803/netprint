// ===== PAPER PRICING SETTINGS - CLEAN REBUILD =====

// Biến lưu khổ giấy đang được chọn trong modal
let selectedPrintSizeId = null;

// 🔥 DOCUMENT-LEVEL EVENT DELEGATION - Xử lý click cho tất cả các nút
document.addEventListener('click', function (e) {
    const target = e.target;

    // Nút xóa khổ giấy (.btn-delete-size)
    if (target.classList.contains('btn-delete-size')) {
        e.stopPropagation();
        e.preventDefault();
        const sizeBlock = target.closest('.paper-size-block');
        if (sizeBlock && sizeBlock.dataset.sizeId) {
            const sizeId = parseInt(sizeBlock.dataset.sizeId);
            console.log('Xóa khổ giấy:', sizeId);
            if (sizeId && typeof deletePrintSize === 'function') {
                deletePrintSize(sizeId);
            }
        }
        return;
    }

    // Nút thêm loại giấy (.btn-add-paper)
    if (target.classList.contains('btn-add-paper')) {
        e.stopPropagation();
        e.preventDefault();
        const sizeBlock = target.closest('.paper-size-block');
        if (sizeBlock && sizeBlock.dataset.sizeId) {
            const sizeId = parseInt(sizeBlock.dataset.sizeId);
            console.log('Thêm loại giấy cho khổ:', sizeId);
            if (sizeId && typeof addPaperType === 'function') {
                addPaperType(sizeId);
            }
        }
        return;
    }
});

// ===== RENDER MODAL LAYOUT 2 CỘT =====

// Render giao diện 2 cột cho modal cài đặt loại giấy
function renderPaperTypesModal(container) {
    if (!container) return;

    // Chọn khổ giấy đầu tiên nếu chưa có
    if (!selectedPrintSizeId && PAPER_SETTINGS.printSizes.length > 0) {
        selectedPrintSizeId = PAPER_SETTINGS.printSizes[0].id;
    }

    container.innerHTML = `
        <div class="settings-layout-2col">
            <!-- Sidebar - Danh sách khổ giấy -->
            <div class="settings-sidebar">
                <div class="sidebar-header">
                    <h4>📐 Khổ Giấy</h4>
                </div>
                <div class="sidebar-list" id="paperSizesSidebar">
                    ${renderPaperSizesSidebar()}
                </div>
                <button class="sidebar-add-btn" onclick="addPrintSizeNew()">
                    ➕ Thêm khổ giấy
                </button>
            </div>
            
            <!-- Main Content - Chi tiết loại giấy -->
            <div class="settings-main">
                <div id="paperTypesMainContent">
                    ${renderPaperTypesMainContent()}
                </div>
            </div>
        </div>
    `;
}

// Render sidebar danh sách khổ giấy
function renderPaperSizesSidebar() {
    if (!PAPER_SETTINGS.printSizes || PAPER_SETTINGS.printSizes.length === 0) {
        return '<p class="empty-message">Chưa có khổ giấy</p>';
    }

    return PAPER_SETTINGS.printSizes.map(size => {
        const isActive = size.id === selectedPrintSizeId;
        const sizeLabel = `${(size.w / 10).toFixed(1)} x ${(size.h / 10).toFixed(1)} cm`;
        return `
            <div class="sidebar-item ${isActive ? 'active' : ''}" 
                 onclick="selectPrintSize(${size.id})">
                ${sizeLabel}
            </div>
        `;
    }).join('');
}

// Render main content với bảng loại giấy
function renderPaperTypesMainContent() {
    if (!selectedPrintSizeId) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <h4>Chọn một khổ giấy</h4>
                <p>Nhấn vào khổ giấy bên trái để xem chi tiết</p>
            </div>
        `;
    }

    const size = PAPER_SETTINGS.printSizes.find(s => s.id === selectedPrintSizeId);
    if (!size) return '<p>Không tìm thấy khổ giấy</p>';

    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === selectedPrintSizeId) || { papers: [] };
    const sizeLabel = `${(size.w / 10).toFixed(1)} x ${(size.h / 10).toFixed(1)} cm`;

    return `
        <!-- Header với thông tin khổ giấy -->
        <div class="main-header">
            <h3>📏 ${sizeLabel}</h3>
            <div class="main-header-actions">
                <button class="btn-edit-size" onclick="editPrintSizeNew(${size.id})">
                    ✏️ Sửa kích thước
                </button>
                ${PAPER_SETTINGS.printSizes.length > 1 ? `
                    <button class="btn-delete-size-new" onclick="deletePrintSizeNew(${size.id})">
                        🗑️ Xóa
                    </button>
                ` : ''}
            </div>
        </div>
        
        <!-- Bảng loại giấy -->
        <div class="main-content">
            ${pricing.papers.length > 0 ? `
                <table class="paper-table">
                    <thead>
                        <tr>
                            <th style="width: 35%">Tên giấy</th>
                            <th style="width: 45%">Giá theo số lượng</th>
                            <th style="width: 20%">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pricing.papers.map(paper => renderPaperRow(size.id, paper)).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h4>Chưa có loại giấy</h4>
                    <p>Nhấn nút bên dưới để thêm loại giấy mới</p>
                </div>
            `}
            
            <div class="add-paper-row">
                <button class="btn-add-paper-new" onclick="addPaperTypeNew(${size.id})">
                    ➕ Thêm loại giấy mới
                </button>
            </div>
        </div>
    `;
}

// Render một dòng trong bảng loại giấy
function renderPaperRow(sizeId, paper) {
    const tiersBadges = paper.tiers.map(tier => {
        const qtyLabel = tier.max === 999999 ? '∞' : tier.max;
        return `<span class="tier-badge"><span class="tier-qty">≤${qtyLabel}:</span> ${formatNumber(tier.price)}đ</span>`;
    }).join('');

    return `
        <tr data-paper-id="${paper.id}">
            <td>
                <input type="text" class="paper-name-input" value="${paper.name}" 
                       onchange="updatePaperNameNew(${sizeId}, ${paper.id}, this.value)"
                       placeholder="Nhập tên giấy">
            </td>
            <td>
                <div class="price-tiers-compact">
                    ${tiersBadges}
                </div>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-edit-paper" onclick="editPaperTiersNew(${sizeId}, ${paper.id})" title="Sửa mốc giá">
                        ✏️
                    </button>
                    <button class="btn-duplicate-paper" onclick="duplicatePaperNew(${sizeId}, ${paper.id})" title="Nhân bản">
                        📑
                    </button>
                    <button class="btn-delete-paper" onclick="deletePaperNew(${sizeId}, ${paper.id})" title="Xóa">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Format số với dấu phẩy
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Chọn khổ giấy trong sidebar
function selectPrintSize(sizeId) {
    selectedPrintSizeId = sizeId;
    refreshPaperTypesModal();
}

// Refresh lại modal mà không đóng
function refreshPaperTypesModal() {
    const sidebar = document.getElementById('paperSizesSidebar');
    const mainContent = document.getElementById('paperTypesMainContent');

    if (sidebar) sidebar.innerHTML = renderPaperSizesSidebar();
    if (mainContent) mainContent.innerHTML = renderPaperTypesMainContent();
}

// ===== CÁC HÀM THAO TÁC MỚI CHO MODAL 2 CỘT =====

// Thêm khổ giấy mới
function addPrintSizeNew() {
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
    PAPER_SETTINGS.paperPricing.push({
        printSizeId: newId,
        papers: []
    });

    // Tự động tạo laminationPricing
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
            { id: newLamId, name: 'Không cán', tiers: [{ max: 999999, price: 0, unit: 'per_sheet' }] },
            { id: newLamId + 1, name: 'Cán bóng 1 mặt', tiers: [{ max: 100, price: 800, unit: 'per_sheet' }, { max: 999999, price: 600, unit: 'per_sheet' }] },
            { id: newLamId + 2, name: 'Cán bóng 2 mặt', tiers: [{ max: 100, price: 1600, unit: 'per_sheet' }, { max: 999999, price: 1200, unit: 'per_sheet' }] },
            { id: newLamId + 3, name: 'Cán mờ 1 mặt', tiers: [{ max: 100, price: 900, unit: 'per_sheet' }, { max: 999999, price: 700, unit: 'per_sheet' }] },
            { id: newLamId + 4, name: 'Cán mờ 2 mặt', tiers: [{ max: 100, price: 1800, unit: 'per_sheet' }, { max: 999999, price: 1400, unit: 'per_sheet' }] }
        ]
    });

    // Tự động tạo printPricingBySize
    if (!PAPER_SETTINGS.printPricingBySize) {
        PAPER_SETTINGS.printPricingBySize = {};
    }

    const sizeKey = `${defaultW}x${defaultH}`;
    const isLargeFormat = defaultW > 480 || defaultH > 480;

    PAPER_SETTINGS.printPricingBySize[sizeKey] = {
        sizeInfo: {
            id: sizeKey,
            name: `Khổ ${defaultW / 10}×${defaultH / 10}${isLargeFormat ? ' (Lớn)' : ''}`,
            width: defaultW,
            height: defaultH,
            isLargeFormat: isLargeFormat,
            printSizeId: newId
        },
        oneSide: {
            name: 'In 1 mặt',
            tiers: [{ max: 2, price: 3000 }, { max: 500, price: 2000 }, { max: 999999, price: 1900 }]
        }
    };

    selectedPrintSizeId = newId;
    savePaperSettings(true);
    refreshPaperTypesModal();
    populatePaperSizeDropdown();
    showToast('✅ Đã thêm khổ giấy mới');
}

// Sửa kích thước khổ giấy
function editPrintSizeNew(sizeId) {
    const size = PAPER_SETTINGS.printSizes.find(s => s.id === sizeId);
    if (!size) return;

    const newW = prompt('Nhập chiều rộng (mm):', size.w);
    if (newW === null) return;

    const newH = prompt('Nhập chiều cao (mm):', size.h);
    if (newH === null) return;

    const w = parseInt(newW);
    const h = parseInt(newH);

    if (isNaN(w) || w < 1 || isNaN(h) || h < 1) {
        alert('⚠️ Kích thước không hợp lệ!');
        return;
    }

    // Lưu sizeKey cũ
    const oldSizeKey = `${size.w}x${size.h}`;

    size.w = w;
    size.h = h;
    size.name = formatSizeName(size);

    // Cập nhật printPricingBySize
    const newSizeKey = `${w}x${h}`;
    if (PAPER_SETTINGS.printPricingBySize && oldSizeKey !== newSizeKey) {
        const oldPricing = PAPER_SETTINGS.printPricingBySize[oldSizeKey];
        if (oldPricing) {
            delete PAPER_SETTINGS.printPricingBySize[oldSizeKey];
            PAPER_SETTINGS.printPricingBySize[newSizeKey] = {
                ...oldPricing,
                sizeInfo: {
                    ...oldPricing.sizeInfo,
                    id: newSizeKey,
                    width: w,
                    height: h,
                    name: `Khổ ${formatMmToCm(w)}×${formatMmToCm(h)}`
                }
            };
        }
    }

    savePaperSettings(true);
    refreshPaperTypesModal();
    populatePaperSizeDropdown();
    showToast('✅ Đã cập nhật khổ giấy');
}

// Xóa khổ giấy
function deletePrintSizeNew(sizeId) {
    if (PAPER_SETTINGS.printSizes.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 khổ giấy!');
        return;
    }

    if (!confirm('🗑️ Xóa khổ giấy này?\n\nTất cả loại giấy trong khổ này cũng sẽ bị xóa.')) return;

    const sizeToDelete = PAPER_SETTINGS.printSizes.find(s => s.id === sizeId);

    PAPER_SETTINGS.printSizes = PAPER_SETTINGS.printSizes.filter(s => s.id !== sizeId);
    PAPER_SETTINGS.paperPricing = PAPER_SETTINGS.paperPricing.filter(p => p.printSizeId !== sizeId);

    if (PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing = PAPER_SETTINGS.laminationPricing.filter(p => p.printSizeId !== sizeId);
    }

    if (sizeToDelete && PAPER_SETTINGS.printPricingBySize) {
        const sizeKey = `${sizeToDelete.w}x${sizeToDelete.h}`;
        delete PAPER_SETTINGS.printPricingBySize[sizeKey];
    }

    // Chọn khổ giấy đầu tiên
    selectedPrintSizeId = PAPER_SETTINGS.printSizes.length > 0 ? PAPER_SETTINGS.printSizes[0].id : null;

    savePaperSettings(true);
    refreshPaperTypesModal();
    populatePaperSizeDropdown();
    showToast('🗑️ Đã xóa khổ giấy');
}

// Thêm loại giấy mới
function addPaperTypeNew(sizeId) {
    let pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) {
        pricing = { printSizeId: sizeId, papers: [] };
        PAPER_SETTINGS.paperPricing.push(pricing);
    }

    const newId = Math.max(...PAPER_SETTINGS.paperPricing.flatMap(p => p.papers).map(p => p.id), 0) + 1;
    pricing.papers.push({
        id: newId,
        name: 'Loại giấy mới',
        tiers: [{ max: 999999, price: 1000 }]
    });

    savePaperSettings(true);
    refreshPaperTypesModal();
    showToast('✅ Đã thêm loại giấy');
}

// Cập nhật tên giấy
function updatePaperNameNew(sizeId, paperId, name) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (paper && paper.name !== name) {
        paper.name = name;
        savePaperSettings(true);
        populatePaperSizeDropdown();
    }
}

// Sửa mốc giá của loại giấy
function editPaperTiersNew(sizeId, paperId) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper) return;

    // Tạo HTML cho popup chỉnh sửa mốc giá
    let tiersHtml = paper.tiers.map((tier, idx) => {
        const minQty = idx === 0 ? 1 : (paper.tiers[idx - 1].max + 1);
        const isLast = tier.max === 999999;
        return `
            <div class="tier-row-edit" data-tier-idx="${idx}">
                <div>
                    <label>Từ</label>
                    <input type="number" value="${minQty}" readonly style="background: #f0f0f0;">
                </div>
                <div>
                    <label>Đến</label>
                    <input type="number" class="tier-max-edit" value="${isLast ? '' : tier.max}" 
                           placeholder="${isLast ? '∞' : ''}" ${isLast ? 'readonly style="background: #f0f0f0;"' : ''}>
                </div>
                <div>
                    <label>Giá (đ)</label>
                    <input type="number" class="tier-price-edit" value="${tier.price}">
                </div>
                ${paper.tiers.length > 1 ? `
                    <button class="btn-remove-tier" onclick="removeTierFromEditNew(${sizeId}, ${paperId}, ${idx})">×</button>
                ` : '<span></span>'}
            </div>
        `;
    }).join('');

    // Hiển thị modal popup nhỏ trong modal chính
    const mainContent = document.getElementById('paperTypesMainContent');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <div class="main-header">
            <h3>✏️ Sửa mốc giá: ${paper.name}</h3>
            <div class="main-header-actions">
                <button class="btn-edit-size" onclick="refreshPaperTypesModal()">
                    ← Quay lại
                </button>
            </div>
        </div>
        <div class="main-content">
            <div class="paper-tiers-editor">
                <div id="tiersEditorList">
                    ${tiersHtml}
                </div>
                <button class="btn-add-paper-new" style="margin-top: 15px;" onclick="addTierToEditNew(${sizeId}, ${paperId})">
                    ➕ Thêm mốc giá
                </button>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn-primary" style="flex: 1; padding: 12px;" onclick="saveTiersEditNew(${sizeId}, ${paperId})">
                        💾 Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Thêm mốc trong editor
function addTierToEditNew(sizeId, paperId) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper) return;

    const lastTier = paper.tiers[paper.tiers.length - 1];

    if (lastTier.max === 999999) {
        // Thêm mốc trước ∞
        const newMax = paper.tiers.length === 1 ? 500 : (paper.tiers[paper.tiers.length - 2].max * 2);
        paper.tiers.splice(paper.tiers.length - 1, 0, {
            max: newMax,
            price: lastTier.price
        });
    } else {
        // Thêm mốc ∞
        paper.tiers.push({ max: 999999, price: lastTier.price });
    }

    editPaperTiersNew(sizeId, paperId); // Re-render editor
}

// Xóa mốc trong editor
function removeTierFromEditNew(sizeId, paperId, tierIdx) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper || paper.tiers.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 mốc!');
        return;
    }

    const deletedTier = paper.tiers[tierIdx];
    const isLast = deletedTier.max === 999999;

    paper.tiers.splice(tierIdx, 1);

    if (isLast && paper.tiers.length > 0) {
        paper.tiers[paper.tiers.length - 1].max = 999999;
    }

    editPaperTiersNew(sizeId, paperId); // Re-render editor
}

// Lưu mốc giá đã chỉnh sửa
function saveTiersEditNew(sizeId, paperId) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper) return;

    const tierRows = document.querySelectorAll('.tier-row-edit');
    const newTiers = [];

    tierRows.forEach((row, idx) => {
        const maxInput = row.querySelector('.tier-max-edit');
        const priceInput = row.querySelector('.tier-price-edit');

        let max = maxInput.value === '' ? 999999 : parseInt(maxInput.value);
        let price = parseInt(priceInput.value) || 0;

        if (isNaN(max)) max = 999999;

        newTiers.push({ max, price });
    });

    // Validation
    if (newTiers.length === 0) {
        alert('⚠️ Phải có ít nhất 1 mốc!');
        return;
    }

    // Sắp xếp theo max và đảm bảo mốc cuối là ∞
    newTiers.sort((a, b) => a.max - b.max);

    if (newTiers[newTiers.length - 1].max !== 999999) {
        newTiers[newTiers.length - 1].max = 999999;
    }

    paper.tiers = newTiers;

    savePaperSettings(true);
    refreshPaperTypesModal();
    showToast('✅ Đã lưu mốc giá');
}

// Nhân bản loại giấy
function duplicatePaperNew(sizeId, paperId) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper) return;

    const newId = Math.max(...PAPER_SETTINGS.paperPricing.flatMap(p => p.papers).map(p => p.id), 0) + 1;
    pricing.papers.push({
        id: newId,
        name: paper.name + ' (copy)',
        tiers: JSON.parse(JSON.stringify(paper.tiers))
    });

    savePaperSettings(true);
    refreshPaperTypesModal();
    showToast('✅ Đã nhân bản loại giấy');
}

// Xóa loại giấy
function deletePaperNew(sizeId, paperId) {
    if (!confirm('🗑️ Xóa loại giấy này?')) return;

    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;

    pricing.papers = pricing.papers.filter(p => p.id !== paperId);

    savePaperSettings(true);
    refreshPaperTypesModal();
    populatePaperSizeDropdown();
    showToast('🗑️ Đã xóa loại giấy');
}


// Render toàn bộ giao diện
function renderPaperPricingSettings() {
    const container = document.getElementById('paperPricingContainer');
    if (!container) return;

    // 🔹 GHI NHỚ TRẠNG THÁI MỞ/ĐÓNG TRƯỚC KHI RENDER
    const expandedSizes = new Set();
    const expandedPapers = new Set();

    PAPER_SETTINGS.printSizes.forEach(size => {
        const sizeList = document.getElementById(`paper-types-${size.id}`);
        if (sizeList && sizeList.style.display !== 'none') {
            expandedSizes.add(size.id);
        }
    });

    PAPER_SETTINGS.paperPricing.forEach(pricing => {
        pricing.papers.forEach(paper => {
            const paperTiers = document.getElementById(`paper-tiers-${paper.id}`);
            if (paperTiers && paperTiers.style.display !== 'none') {
                expandedPapers.add(paper.id);
            }
        });
    });

    let html = '';

    // Render từng khổ giấy
    PAPER_SETTINGS.printSizes.forEach((size, sizeIdx) => {
        const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === size.id) || { printSizeId: size.id, papers: [] };
        const isSizeExpanded = expandedSizes.has(size.id);

        html += `
            <div class="paper-size-block" data-size-id="${size.id}">
                <!-- Header khổ giấy -->
                <div class="paper-size-header" onclick="togglePaperSize(${size.id})">
                    <div class="size-info">
                        <span class="collapse-icon" id="collapse-icon-${size.id}">${isSizeExpanded ? '▼' : '▶'}</span>
                        <input type="number" value="${size.w}" placeholder="W" 
                            onclick="event.stopPropagation()"
                            onblur="updatePrintSize(${size.id}, 'w', this.value)"
                            onchange="updatePrintSize(${size.id}, 'w', this.value)">
                        <span>×</span>
                        <input type="number" value="${size.h}" placeholder="H" 
                            onclick="event.stopPropagation()"
                            onblur="updatePrintSize(${size.id}, 'h', this.value)"
                            onchange="updatePrintSize(${size.id}, 'h', this.value)">
                        <span class="unit">mm</span>
                    </div>
                    <div class="size-actions" onclick="event.stopPropagation()">
                        <button class="btn-add-paper" onclick="event.stopPropagation(); addPaperType(${size.id})">+ Thêm loại giấy</button>
                        ${PAPER_SETTINGS.printSizes.length > 1 ? `
                            <button class="btn-delete-size" onclick="event.stopPropagation(); console.log('Delete clicked:', ${size.id}); deletePrintSize(${size.id})">×</button>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Danh sách loại giấy -->
                <div class="paper-types-list" id="paper-types-${size.id}" style="display: ${isSizeExpanded ? 'flex' : 'none'};">
                    ${pricing.papers.map((paper, paperIdx) => {
            const isPaperExpanded = expandedPapers.has(paper.id);
            return `
                        <div class="paper-type-block draggable-paper" 
                             data-paper-id="${paper.id}" 
                             data-paper-index="${paperIdx}"
                             draggable="true"
                             ondragstart="handlePaperDragStart(event, ${size.id}, ${paper.id})"
                             ondragend="handlePaperDragEnd(event)"
                             ondragover="handlePaperDragOver(event)"
                             ondragleave="handlePaperDragLeave(event)"
                             ondrop="handlePaperDrop(event, ${size.id}, ${paper.id})">
                            <!-- Header loại giấy -->
                            <div class="paper-type-header" onclick="togglePaperType(${size.id}, ${paper.id})">
                                <span class="drag-handle" draggable="false" title="Kéo để sắp xếp">⋮⋮</span>
                                <span class="collapse-icon-small" id="collapse-icon-paper-${paper.id}">${isPaperExpanded ? '▼' : '▶'}</span>
                                <input type="text" value="${paper.name}" placeholder="Tên loại giấy" 
                                    onclick="event.stopPropagation()"
                                    onblur="updatePaperName(${size.id}, ${paper.id}, this.value)"
                                    onchange="updatePaperName(${size.id}, ${paper.id}, this.value)">
                                <div class="paper-type-actions" onclick="event.stopPropagation()">
                                    <button class="btn-duplicate" onclick="event.stopPropagation(); duplicatePaper(${size.id}, ${paper.id})">📑</button>
                                    <button class="btn-delete" onclick="event.stopPropagation(); deletePaper(${size.id}, ${paper.id})">×</button>
                                </div>
                            </div>
                            
                            <!-- Tiers -->
                            <div class="paper-tiers-container" id="paper-tiers-${paper.id}" style="display: ${isPaperExpanded ? 'block' : 'none'};">
                                ${paper.tiers.map((tier, tierIdx) => {
                const minQty = tierIdx === 0 ? 1 : (paper.tiers[tierIdx - 1].max + 1);
                const isLastTier = tier.max === 999999;
                const isFirstTier = tierIdx === 0;
                return `
                                        <div class="tier-row" onclick="event.stopPropagation()">
                                            <input type="number" 
                                                class="tier-min-input" 
                                                value="${minQty}" 
                                                ${isFirstTier ? 'readonly' : ''}
                                                placeholder="Min" 
                                                onclick="event.stopPropagation()"
                                                onblur="updateTierMin(${size.id}, ${paper.id}, ${tierIdx}, this.value)"
                                                onchange="updateTierMin(${size.id}, ${paper.id}, ${tierIdx}, this.value)">
                                            <span class="tier-separator">-</span>
                                            <input type="number" 
                                                class="tier-max-input ${isLastTier ? 'tier-infinity' : ''}" 
                                                value="${isLastTier ? '' : tier.max}" 
                                                placeholder="${isLastTier ? '∞' : 'Max'}"
                                                ${isLastTier ? 'readonly' : ''}
                                                onclick="event.stopPropagation()"
                                                onblur="updateTierMax(${size.id}, ${paper.id}, ${tierIdx}, this.value)"
                                                onchange="updateTierMax(${size.id}, ${paper.id}, ${tierIdx}, this.value)">
                                            <span class="tier-separator">×</span>
                                            <input type="number" 
                                                class="tier-price-input"
                                                value="${tier.price}" 
                                                placeholder="Giá" 
                                                onclick="event.stopPropagation()"
                                                onblur="updatePaperTier(${size.id}, ${paper.id}, ${tierIdx}, 'price', this.value)"
                                                onchange="updatePaperTier(${size.id}, ${paper.id}, ${tierIdx}, 'price', this.value)">
                                            <span class="tier-unit">đ</span>
                                            ${paper.tiers.length > 1 ? `
                                                <button type="button" class="btn-tier-del" onclick="event.stopPropagation(); deletePaperTier(${size.id}, ${paper.id}, ${tierIdx})" title="Xóa mốc">×</button>
                                            ` : '<span class="tier-placeholder"></span>'}
                                        </div>
                                    `;
            }).join('')}
                                <button class="btn-add-tier-full" onclick="addPaperTier(${size.id}, ${paper.id})">+ Thêm mốc</button>
                            </div>
                        </div>
                    `;
        }).join('')}
                    ${pricing.papers.length === 0 ? '<p class="empty-message">Chưa có loại giấy. Nhấn "+ Thêm loại giấy"</p>' : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // 🔥 EVENT DELEGATION - Đảm bảo các nút hoạt động (chỉ đăng ký 1 lần)
    if (!container.hasAttribute('data-events-bound')) {
        container.setAttribute('data-events-bound', 'true');
        container.addEventListener('click', function (e) {
            const target = e.target;

            // Nút xóa khổ giấy
            if (target.classList.contains('btn-delete-size')) {
                e.stopPropagation();
                const sizeBlock = target.closest('.paper-size-block');
                if (sizeBlock) {
                    const sizeId = parseInt(sizeBlock.dataset.sizeId);
                    if (sizeId) deletePrintSize(sizeId);
                }
            }

            // Nút thêm loại giấy
            if (target.classList.contains('btn-add-paper')) {
                e.stopPropagation();
                const sizeBlock = target.closest('.paper-size-block');
                if (sizeBlock) {
                    const sizeId = parseInt(sizeBlock.dataset.sizeId);
                    if (sizeId) addPaperType(sizeId);
                }
            }

            // Nút duplicate loại giấy
            if (target.classList.contains('btn-duplicate')) {
                e.stopPropagation();
                const sizeBlock = target.closest('.paper-size-block');
                const paperBlock = target.closest('.paper-type-block');
                if (sizeBlock && paperBlock) {
                    const sizeId = parseInt(sizeBlock.dataset.sizeId);
                    const paperId = parseInt(paperBlock.dataset.paperId);
                    if (sizeId && paperId) duplicatePaper(sizeId, paperId);
                }
            }

            // Nút xóa loại giấy
            if (target.classList.contains('btn-delete') && target.closest('.paper-type-block')) {
                e.stopPropagation();
                const sizeBlock = target.closest('.paper-size-block');
                const paperBlock = target.closest('.paper-type-block');
                if (sizeBlock && paperBlock) {
                    const sizeId = parseInt(sizeBlock.dataset.sizeId);
                    const paperId = parseInt(paperBlock.dataset.paperId);
                    if (sizeId && paperId) deletePaper(sizeId, paperId);
                }
            }

            // Nút xóa tier
            if (target.classList.contains('btn-tier-del')) {
                e.stopPropagation();
                const sizeBlock = target.closest('.paper-size-block');
                const paperBlock = target.closest('.paper-type-block');
                const tierRow = target.closest('.tier-row');
                if (sizeBlock && paperBlock && tierRow) {
                    const sizeId = parseInt(sizeBlock.dataset.sizeId);
                    const paperId = parseInt(paperBlock.dataset.paperId);
                    const tierIdx = Array.from(tierRow.parentNode.querySelectorAll('.tier-row')).indexOf(tierRow);
                    if (sizeId && paperId && tierIdx >= 0) deletePaperTier(sizeId, paperId, tierIdx);
                }
            }

            // Nút thêm tier
            if (target.classList.contains('btn-add-tier-full')) {
                e.stopPropagation();
                const sizeBlock = target.closest('.paper-size-block');
                const paperBlock = target.closest('.paper-type-block');
                if (sizeBlock && paperBlock) {
                    const sizeId = parseInt(sizeBlock.dataset.sizeId);
                    const paperId = parseInt(paperBlock.dataset.paperId);
                    if (sizeId && paperId) addPaperTier(sizeId, paperId);
                }
            }
        });
    }
}

// ===== UPDATE FUNCTIONS =====

function updatePrintSize(sizeId, field, value) {
    const size = PAPER_SETTINGS.printSizes.find(s => s.id === sizeId);
    if (!size) return;
    const newValue = parseInt(value);
    if (isNaN(newValue) || newValue < 1) return;
    if (size[field] === newValue) return; // Không thay đổi

    // Lưu sizeKey cũ trước khi thay đổi
    const oldSizeKey = `${size.w}x${size.h}`;

    size[field] = newValue;
    size.name = formatSizeName(size);

    // Tính sizeKey mới
    const newSizeKey = `${size.w}x${size.h}`;
    const isLargeFormat = size.w > 480 || size.h > 480;

    // ✨ ĐỒNG BỘ GIÁ IN: Cập nhật printPricingBySize nếu sizeKey thay đổi
    if (PAPER_SETTINGS.printPricingBySize && oldSizeKey !== newSizeKey) {
        // Lấy dữ liệu cũ
        const oldPricing = PAPER_SETTINGS.printPricingBySize[oldSizeKey];

        if (oldPricing) {
            // Xóa key cũ
            delete PAPER_SETTINGS.printPricingBySize[oldSizeKey];

            // Tạo key mới với dữ liệu cũ nhưng cập nhật sizeInfo
            PAPER_SETTINGS.printPricingBySize[newSizeKey] = {
                ...oldPricing,
                sizeInfo: {
                    id: newSizeKey,
                    name: `Khổ ${formatMmToCm(size.w)}×${formatMmToCm(size.h)}${isLargeFormat ? ' (Lớn)' : ''}`,
                    width: size.w,
                    height: size.h,
                    isLargeFormat: isLargeFormat,
                    printSizeId: sizeId
                }
            };
        }
    }

    savePaperSettings();
    populatePaperSizeDropdown();

    // Refresh bảng giá in nếu đang mở
    if (typeof renderPrintPricingSettings === 'function') {
        renderPrintPricingSettings();
    }
    // Không re-render để giữ nguyên trạng thái mở/đóng
}

function updatePaperName(sizeId, paperId, name) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (paper && paper.name !== name) {
        paper.name = name;
        savePaperSettings();
        populatePaperSizeDropdown();
        // Không re-render để giữ nguyên trạng thái mở/đóng
    }
}

function updatePaperTier(sizeId, paperId, tierIdx, field, value) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (paper && paper.tiers[tierIdx]) {
        const newValue = parseInt(value);
        if (isNaN(newValue) || newValue < 0) return;
        if (paper.tiers[tierIdx][field] === newValue) return; // Không thay đổi

        paper.tiers[tierIdx][field] = newValue;
        savePaperSettings();
        // Không re-render để giữ nguyên trạng thái mở/đóng
    }
}

function updateTierMin(sizeId, paperId, tierIdx, value) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper || tierIdx === 0) return; // Không cho edit min của tier đầu tiên

    const newMin = parseInt(value);
    if (isNaN(newMin) || newMin < 1) {
        // Nếu giá trị không hợp lệ, giữ nguyên và không làm gì
        return;
    }

    // Update max của tier trước đó
    if (tierIdx > 0) {
        paper.tiers[tierIdx - 1].max = newMin - 1;
    }

    savePaperSettings();
    // Re-render để cập nhật min của tier tiếp theo (nếu có)
    renderPaperPricingSettings();
}

function updateTierMax(sizeId, paperId, tierIdx, value) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper) return;

    const tier = paper.tiers[tierIdx];
    if (tier.max === 999999) return; // Không cho edit tier ∞

    const newMax = parseInt(value);
    if (isNaN(newMax) || newMax < 1) {
        // Nếu giá trị không hợp lệ, giữ nguyên và không làm gì
        return;
    }

    // Kiểm tra min của tier hiện tại
    const minQty = tierIdx === 0 ? 1 : (paper.tiers[tierIdx - 1].max + 1);
    if (newMax < minQty) {
        alert(`⚠️ Max phải >= ${minQty}`);
        // Re-render để khôi phục giá trị cũ
        renderPaperPricingSettings();
        return;
    }

    // Kiểm tra xem có thay đổi không
    if (tier.max === newMax) return;

    tier.max = newMax;
    savePaperSettings();
    // Re-render để cập nhật min của tier tiếp theo (nếu có)
    renderPaperPricingSettings();
}

// ===== ADD FUNCTIONS =====

function addPrintSize() {
    const newId = Math.max(...PAPER_SETTINGS.printSizes.map(s => s.id), 0) + 1;
    const defaultW = 325;
    const defaultH = 430;

    // Thêm khổ in mới
    PAPER_SETTINGS.printSizes.push({
        id: newId,
        w: defaultW,
        h: defaultH,
        name: formatSizeName({ w: defaultW, h: defaultH })
    });

    // Tạo paperPricing entry với 1 loại giấy mặc định
    const defaultPaperId = Math.max(...PAPER_SETTINGS.paperPricing.flatMap(p => p.papers).map(p => p.id), 0) + 1;
    PAPER_SETTINGS.paperPricing.push({
        printSizeId: newId,
        papers: [
            {
                id: defaultPaperId,
                name: 'Giấy mới',
                tiers: [
                    { max: 999999, price: 1000 }
                ]
            }
        ]
    });

    // ✨ ĐỒNG BỘ: Tự động thêm laminationPricing entry với 5 loại cán màng
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
                    { max: 100, price: 800, unit: 'per_sheet' },
                    { max: 300, price: 700, unit: 'per_sheet' },
                    { max: 500, price: 600, unit: 'per_sheet' },
                    { max: 999999, price: 2500, unit: 'per_m2' }
                ]
            },
            {
                id: newLamId + 2,
                name: 'Cán bóng 2 mặt',
                tiers: [
                    { max: 100, price: 1600, unit: 'per_sheet' },
                    { max: 300, price: 1400, unit: 'per_sheet' },
                    { max: 500, price: 1200, unit: 'per_sheet' },
                    { max: 999999, price: 5000, unit: 'per_m2' }
                ]
            },
            {
                id: newLamId + 3,
                name: 'Cán mờ 1 mặt',
                tiers: [
                    { max: 100, price: 900, unit: 'per_sheet' },
                    { max: 300, price: 800, unit: 'per_sheet' },
                    { max: 500, price: 700, unit: 'per_sheet' },
                    { max: 999999, price: 2700, unit: 'per_m2' }
                ]
            },
            {
                id: newLamId + 4,
                name: 'Cán mờ 2 mặt',
                tiers: [
                    { max: 100, price: 1800, unit: 'per_sheet' },
                    { max: 300, price: 1600, unit: 'per_sheet' },
                    { max: 500, price: 1400, unit: 'per_sheet' },
                    { max: 999999, price: 5400, unit: 'per_m2' }
                ]
            }
        ]
    });

    // ✨ ĐỒNG BỘ GIÁ IN: Tự động thêm printPricingBySize cho khổ mới
    if (!PAPER_SETTINGS.printPricingBySize) {
        PAPER_SETTINGS.printPricingBySize = {};
    }

    // Tạo ID cho bảng giá in dựa trên kích thước
    const sizeKey = `${defaultW}x${defaultH}`;
    const isLargeFormat = defaultW > 480 || defaultH > 480;

    PAPER_SETTINGS.printPricingBySize[sizeKey] = {
        sizeInfo: {
            id: sizeKey,
            name: `Khổ ${formatMmToCm(defaultW)}×${formatMmToCm(defaultH)}${isLargeFormat ? ' (Lớn)' : ''}`,
            width: defaultW,
            height: defaultH,
            isLargeFormat: isLargeFormat,
            printSizeId: newId // Liên kết với printSizes
        },
        oneSide: {
            name: 'In 1 mặt',
            tiers: isLargeFormat ? [
                { max: 2, price: 5000 },
                { max: 100, price: 3500 },
                { max: 500, price: 3000 },
                { max: 999999, price: 2800 }
            ] : [
                { max: 2, price: 3000 },
                { max: 500, price: 2000 },
                { max: 999999, price: 1900 }
            ]
        }
    };

    renderPaperPricingSettings();
    savePaperSettings();
    populatePaperSizeDropdown();

    // Refresh bảng giá in nếu đang mở
    if (typeof renderPrintPricingSettings === 'function') {
        renderPrintPricingSettings();
    }

    showToast('✅ Đã thêm khổ giấy, cán màng và giá in mới');
}

function addPaperType(sizeId) {
    let pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) {
        pricing = { printSizeId: sizeId, papers: [] };
        PAPER_SETTINGS.paperPricing.push(pricing);
    }

    const newId = Math.max(...PAPER_SETTINGS.paperPricing.flatMap(p => p.papers).map(p => p.id), 0) + 1;
    pricing.papers.push({
        id: newId,
        name: 'Loại giấy mới',
        tiers: [{ max: 999999, price: 1000 }]
    });

    renderPaperPricingSettings();
    savePaperSettings();
    showToast('✅ Đã thêm loại giấy');
}

function addPaperTier(sizeId, paperId) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper) return;

    const lastTier = paper.tiers[paper.tiers.length - 1];
    let newMax;

    // 🔹 TỰ ĐỘNG TÍNH TOÁN SỐ CUỐI THÔNG MINH
    if (lastTier.max === 999999) {
        // Nếu mốc cuối là ∞, thêm mốc mới trước nó
        if (paper.tiers.length === 1) {
            // Chỉ có 1 mốc (1-∞) → Thêm mốc đầu với khoảng mặc định
            newMax = 500;
        } else {
            // Có nhiều mốc → Tính khoảng cách trung bình
            const secondLastTier = paper.tiers[paper.tiers.length - 2];
            const minOfSecondLast = paper.tiers.length >= 3
                ? (paper.tiers[paper.tiers.length - 3].max + 1)
                : 1;
            const gap = secondLastTier.max - minOfSecondLast + 1;
            newMax = secondLastTier.max + gap;
        }

        // Chèn mốc mới TRƯỚC mốc ∞
        paper.tiers.splice(paper.tiers.length - 1, 0, {
            max: newMax,
            price: lastTier.price
        });
    } else {
        // Nếu mốc cuối KHÔNG phải ∞ → Thêm mốc ∞ vào cuối
        paper.tiers.push({
            max: 999999,
            price: lastTier.price
        });
    }

    renderPaperPricingSettings();
    savePaperSettings();
    showToast('✅ Đã thêm mốc');
}

// ===== DELETE FUNCTIONS =====

function deletePrintSize(sizeId) {
    console.log('deletePrintSize called with:', sizeId);
    if (PAPER_SETTINGS.printSizes.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 khổ giấy!');
        return;
    }
    if (!confirm('🗑️ Xóa khổ giấy này?\n\nTất cả loại giấy, cán màng và giá in trong khổ này cũng sẽ bị xóa.')) return;

    // Lấy thông tin khổ giấy trước khi xóa để tìm sizeKey
    const sizeToDelete = PAPER_SETTINGS.printSizes.find(s => s.id === sizeId);

    PAPER_SETTINGS.printSizes = PAPER_SETTINGS.printSizes.filter(s => s.id !== sizeId);
    PAPER_SETTINGS.paperPricing = PAPER_SETTINGS.paperPricing.filter(p => p.printSizeId !== sizeId);

    // ✨ ĐỒNG BỘ: Xóa luôn laminationPricing
    if (PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing = PAPER_SETTINGS.laminationPricing.filter(p => p.printSizeId !== sizeId);
    }

    // ✨ ĐỒNG BỘ GIÁ IN: Xóa luôn printPricingBySize
    if (sizeToDelete && PAPER_SETTINGS.printPricingBySize) {
        const sizeKey = `${sizeToDelete.w}x${sizeToDelete.h}`;
        if (PAPER_SETTINGS.printPricingBySize[sizeKey]) {
            delete PAPER_SETTINGS.printPricingBySize[sizeKey];
        }

        // Cũng tìm và xóa theo printSizeId
        Object.keys(PAPER_SETTINGS.printPricingBySize).forEach(key => {
            const pricing = PAPER_SETTINGS.printPricingBySize[key];
            if (pricing.sizeInfo?.printSizeId === sizeId) {
                delete PAPER_SETTINGS.printPricingBySize[key];
            }
        });
    }

    renderPaperPricingSettings();
    savePaperSettings();
    populatePaperSizeDropdown();

    // Refresh bảng giá in nếu đang mở
    if (typeof renderPrintPricingSettings === 'function') {
        renderPrintPricingSettings();
    }

    showToast('🗑️ Đã xóa khổ giấy, cán màng và giá in');
}

function deletePaper(sizeId, paperId) {
    if (!confirm('🗑️ Xóa loại giấy này?')) return;

    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;

    pricing.papers = pricing.papers.filter(p => p.id !== paperId);

    renderPaperPricingSettings();
    savePaperSettings();
    populatePaperSizeDropdown();
    showToast('🗑️ Đã xóa loại giấy');
}

function deletePaperTier(sizeId, paperId, tierIdx) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper || paper.tiers.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 mốc!');
        return;
    }

    if (!confirm('🗑️ Xóa mốc này?')) return;

    const deletedTier = paper.tiers[tierIdx];
    const isLastTier = deletedTier.max === 999999;

    paper.tiers.splice(tierIdx, 1);

    // Nếu xóa tier cuối cùng (∞), chuyển tier trước đó thành ∞
    if (isLastTier && paper.tiers.length > 0) {
        const newLastTier = paper.tiers[paper.tiers.length - 1];
        newLastTier.max = 999999;
    }

    renderPaperPricingSettings();
    savePaperSettings();
    showToast('🗑️ Đã xóa mốc');
}

function duplicatePaper(sizeId, paperId) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper) return;

    const newId = Math.max(...PAPER_SETTINGS.paperPricing.flatMap(p => p.papers).map(p => p.id), 0) + 1;
    const clone = {
        id: newId,
        name: paper.name + ' (copy)',
        tiers: JSON.parse(JSON.stringify(paper.tiers))
    };

    pricing.papers.push(clone);

    renderPaperPricingSettings();
    savePaperSettings();
    showToast('✅ Đã nhân bản');
}

// ===== DRAG & DROP FUNCTIONS =====

let draggedPaperElement = null;
let draggedPaperId = null;
let draggedSizeId = null;

function handlePaperDragStart(event, sizeId, paperId) {
    draggedPaperElement = event.currentTarget;
    draggedPaperId = paperId;
    draggedSizeId = sizeId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', '');
    draggedPaperElement.classList.add('dragging');
}

function handlePaperDragEnd(event) {
    if (draggedPaperElement) {
        draggedPaperElement.classList.remove('dragging');
        // Remove all drop indicators
        document.querySelectorAll('.paper-type-block').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
    }
    draggedPaperElement = null;
    draggedPaperId = null;
    draggedSizeId = null;
}

function handlePaperDragOver(event) {
    if (!draggedPaperElement) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const currentElement = event.currentTarget;
    if (currentElement === draggedPaperElement) return;

    const rect = currentElement.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const mouseY = event.clientY;

    // Remove previous indicators
    document.querySelectorAll('.paper-type-block').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    // Add indicator based on position
    if (mouseY < midY) {
        currentElement.classList.add('drag-over-top');
    } else {
        currentElement.classList.add('drag-over-bottom');
    }
}

function handlePaperDragLeave(event) {
    // Only remove indicator if leaving the element entirely
    const relatedTarget = event.relatedTarget;
    const currentElement = event.currentTarget;

    if (!currentElement.contains(relatedTarget)) {
        currentElement.classList.remove('drag-over-top', 'drag-over-bottom');
    }
}

function handlePaperDrop(event, targetSizeId, targetPaperId) {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedPaperElement || !draggedPaperId || draggedSizeId !== targetSizeId) return;
    if (draggedPaperId === targetPaperId) return;

    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === targetSizeId);
    if (!pricing) return;

    const targetElement = event.currentTarget;
    const rect = targetElement.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const mouseY = event.clientY;

    // Find current indices
    const draggedIndex = pricing.papers.findIndex(p => p.id === draggedPaperId);
    const targetIndex = pricing.papers.findIndex(p => p.id === targetPaperId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged paper from array
    const [draggedPaper] = pricing.papers.splice(draggedIndex, 1);

    // Calculate new index
    let newIndex;
    if (mouseY < midY) {
        // Insert above
        newIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    } else {
        // Insert below
        newIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    }

    // Insert at new position
    pricing.papers.splice(newIndex, 0, draggedPaper);

    // Clean up
    document.querySelectorAll('.paper-type-block').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    // Save and re-render
    savePaperSettings();
    renderPaperPricingSettings();
    showToast('✅ Đã sắp xếp lại thứ tự');
}

// ===== TOGGLE FUNCTIONS=====

function togglePaperSize(sizeId) {
    const container = document.getElementById(`paper-types-${sizeId}`);
    const icon = document.getElementById(`collapse-icon-${sizeId}`);
    if (!container || !icon) return;

    if (container.style.display === 'none') {
        container.style.display = 'flex';
        icon.textContent = '▼';
    } else {
        container.style.display = 'none';
        icon.textContent = '▶';
    }
}

function togglePaperType(sizeId, paperId) {
    const container = document.getElementById(`paper-tiers-${paperId}`);
    const icon = document.getElementById(`collapse-icon-paper-${paperId}`);
    if (!container || !icon) return;

    if (container.style.display === 'none') {
        container.style.display = 'block';
        icon.textContent = '▼';
    } else {
        container.style.display = 'none';
        icon.textContent = '▶';
    }
}

// ===== AUTO-ADD TIER =====

function autoAddTierIfNeeded(sizeId, paperId, tierIdx) {
    const pricing = PAPER_SETTINGS.paperPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const paper = pricing.papers.find(p => p.id === paperId);
    if (!paper) return;

    const isLastTier = tierIdx === paper.tiers.length - 1;
    if (!isLastTier) return;

    const lastTier = paper.tiers[tierIdx];
    if (lastTier.max !== 999999) return;
    if (paper.tiers.length >= 5) return;

    const inputEl = document.querySelector(`#paper-tiers-${paperId} .tier-row:nth-child(${tierIdx + 1}) input[type="number"]`);
    const currentPrice = parseInt(inputEl?.value);
    if (!currentPrice || currentPrice === 0) return;

    let newMax = tierIdx === 0 ? 500 : paper.tiers[tierIdx - 1].max * 2;

    lastTier.max = newMax;
    paper.tiers.push({ max: 999999, price: currentPrice });

    renderPaperPricingSettings();
    savePaperSettings();

    const container = document.getElementById(`paper-tiers-${paperId}`);
    if (container) {
        container.style.display = 'block';
        const icon = document.getElementById(`collapse-icon-paper-${paperId}`);
        if (icon) icon.textContent = '▼';
    }

    showToast('✅ Đã tự động thêm mốc');
}
