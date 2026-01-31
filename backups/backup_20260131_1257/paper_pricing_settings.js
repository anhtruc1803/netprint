// ===== PAPER PRICING SETTINGS - CLEAN REBUILD =====

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
                            <button class="btn-delete-size" onclick="event.stopPropagation(); deletePrintSize(${size.id})">×</button>
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
}

// ===== UPDATE FUNCTIONS =====

function updatePrintSize(sizeId, field, value) {
    const size = PAPER_SETTINGS.printSizes.find(s => s.id === sizeId);
    if (!size) return;
    const newValue = parseInt(value);
    if (isNaN(newValue) || newValue < 1) return;
    if (size[field] === newValue) return; // Không thay đổi
    
    size[field] = newValue;
    size.name = `${size.w} x ${size.h} mm`;
    savePaperSettings();
    populatePaperSizeDropdown();
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
        name: `${defaultW} x ${defaultH} mm`
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

    renderPaperPricingSettings();
    savePaperSettings();
    populatePaperSizeDropdown();
    showToast('✅ Đã thêm khổ giấy và cán màng mới');
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
    if (PAPER_SETTINGS.printSizes.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 khổ giấy!');
        return;
    }
    if (!confirm('🗑️ Xóa khổ giấy này?\n\nTất cả loại giấy và cán màng trong khổ này cũng sẽ bị xóa.')) return;

    PAPER_SETTINGS.printSizes = PAPER_SETTINGS.printSizes.filter(s => s.id !== sizeId);
    PAPER_SETTINGS.paperPricing = PAPER_SETTINGS.paperPricing.filter(p => p.printSizeId !== sizeId);

    // ✨ ĐỒNG BỘ: Xóa luôn laminationPricing
    if (PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing = PAPER_SETTINGS.laminationPricing.filter(p => p.printSizeId !== sizeId);
    }

    renderPaperPricingSettings();
    savePaperSettings();
    populatePaperSizeDropdown();
    showToast('🗑️ Đã xóa khổ giấy và cán màng');
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
