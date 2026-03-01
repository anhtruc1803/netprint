// ===== LAMINATION SETTINGS - CÁN MÀNG - CARD-BASED UI =====
// Đồng bộ giao diện với Loại Giấy & Giá In

// State for lamination tab
let _lamExpandedId = null;

// Render toàn bộ giao diện cán màng (được gọi từ settings_panel.js)
function renderLaminationSettings() {
    const container = document.getElementById('laminationContainer');
    if (!container) return;

    const sizes = PAPER_SETTINGS.printSizes || [];
    if (sizes.length === 0) {
        container.innerHTML = `<div class="sp-scroll-content"><div class="sp-empty"><div class="sp-empty-icon">📋</div><h4>Chưa có khổ giấy</h4><p>Vui lòng thêm khổ giấy trong tab "Loại Giấy" trước</p></div></div>`;
        return;
    }

    // Chọn khổ đầu nếu chưa có
    if (!SP.selectedLamSize || !sizes.find(s => s.id === SP.selectedLamSize)) {
        SP.selectedLamSize = sizes[0].id;
    }

    // Size chips (giống Loại Giấy)
    const chips = sizes.map(s => {
        const isActive = s.id === SP.selectedLamSize;
        const lamCount = (PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === s.id)?.laminations || []).length;
        return `
            <div class="sp-size-chip ${isActive ? 'active' : ''}" onclick="spSelectLamSizeNew(${s.id})">
                ${formatSizeShort(s)} <span class="sp-chip-count">(${lamCount})</span>
            </div>`;
    }).join('');

    container.innerHTML = `
        <div class="sp-size-bar">${chips}</div>
        <div class="sp-scroll-content" id="spLamContent">${_renderLamContent()}</div>`;
}

function spSelectLamSizeNew(sizeId) {
    SP.selectedLamSize = sizeId;
    _lamExpandedId = null;
    renderLaminationSettings();
}

function _renderLamContent() {
    const sizeId = SP.selectedLamSize;
    const pricing = PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === sizeId);
    const lams = pricing?.laminations || [];

    if (lams.length === 0) {
        return `
            <div class="sp-empty" style="padding:24px;"><div class="sp-empty-icon">✨</div><h4>Chưa có loại cán màng</h4><p>Nhấn nút bên dưới để thêm</p></div>
            <button class="sp-add-paper-btn" onclick="addLaminationType(${sizeId})">➕ Thêm loại cán màng</button>`;
    }

    const cards = lams.map(lam => _renderLamCard(lam, sizeId)).join('');

    return `
        ${cards}
        <button class="sp-add-paper-btn" onclick="addLaminationType(${sizeId})">➕ Thêm loại cán màng</button>`;
}

function _renderLamCard(lam, sizeId) {
    const isExpanded = _lamExpandedId === lam.id;
    const tiers = lam.tiers || [];

    // Mini badges (collapsed view)
    const miniBadges = tiers.map(t => {
        const qty = t.max === 999999 ? '∞' : `≤${_fmt(t.max)}`;
        const unit = t.unit === 'per_m2' ? 'đ/m²' : t.unit === 'per_lot' ? 'đ/lô' : 'đ/tờ';
        return `<span class="sp-mini-badge">${qty}: ${_fmt(t.price)}${unit}</span>`;
    }).join('');

    // Tier editor (expanded)
    let tierEditor = '';
    if (isExpanded) {
        const tierRows = tiers.map((t, i) => {
            const minQty = i === 0 ? (t.min || 1) : (tiers[i - 1].max + 1);
            const isLast = t.max === 999999;
            const unit = t.unit || 'per_sheet';
            return `
                <div class="sp-tier-grid-row" style="grid-template-columns: 75px 75px 100px 90px 36px;">
                    <input type="number" value="${minQty}" ${i === 0 ? '' : `onchange="updateLamTierMin(${sizeId},${lam.id},${i},this.value)"`}
                        ${i === 0 ? 'readonly' : ''}>
                    <input type="number" value="${isLast ? '' : t.max}" placeholder="${isLast ? '∞' : 'Max'}"
                        ${isLast ? 'readonly' : ''}
                        onchange="updateLamTierMax(${sizeId},${lam.id},${i},this.value)">
                    <input type="number" value="${t.price}" placeholder="Giá" min="0"
                        onchange="updateLamTier(${sizeId},${lam.id},${i},'price',this.value)">
                    <select onchange="updateLamTier(${sizeId},${lam.id},${i},'unit',this.value)" style="padding:6px 4px;border:1px solid #e2e8f0;border-radius:7px;font-size:12px;">
                        <option value="per_sheet" ${unit === 'per_sheet' ? 'selected' : ''}>đ/tờ</option>
                        <option value="per_m2" ${unit === 'per_m2' ? 'selected' : ''}>đ/m²</option>
                        <option value="per_lot" ${unit === 'per_lot' ? 'selected' : ''}>đ/lô</option>
                    </select>
                    <button class="sp-tier-mini-del" ${tiers.length <= 1 ? 'disabled' : ''}
                        onclick="deleteLamTier(${sizeId},${lam.id},${i})">✕</button>
                </div>`;
        }).join('');

        tierEditor = `
            <div class="sp-tier-grid">
                <div class="sp-tier-grid-header" style="grid-template-columns: 75px 75px 100px 90px 36px;">
                    <span>Từ</span><span>Đến</span><span>Giá</span><span>Đơn vị</span><span></span>
                </div>
                ${tierRows}
                <button class="sp-tier-add-btn" onclick="addLamTier(${sizeId},${lam.id})">➕ Thêm mốc giá</button>
            </div>`;
    }

    return `
        <div class="sp-paper-card ${isExpanded ? 'expanded' : ''}">
            <div class="sp-paper-card-header" onclick="spToggleLamEditor(${lam.id})">
                <input type="text" class="sp-paper-name-input" value="${lam.name.replace(/"/g, '&quot;')}"
                    onclick="event.stopPropagation()" onchange="updateLaminationName(${sizeId},${lam.id},this.value)">
                <div class="sp-paper-tiers-preview">${miniBadges}</div>
                <div class="sp-paper-card-actions" onclick="event.stopPropagation()">
                    <button class="sp-icon-btn dup" onclick="duplicateLamination(${sizeId},${lam.id})" title="Nhân bản">📑</button>
                    <button class="sp-icon-btn del" onclick="deleteLamination(${sizeId},${lam.id})" title="Xóa">🗑️</button>
                </div>
                <span class="sp-expand-icon">${isExpanded ? '▲' : '▼'}</span>
            </div>
            <div class="sp-paper-card-body">
                ${tierEditor}
            </div>
        </div>`;
}

function spToggleLamEditor(lamId) {
    _lamExpandedId = (_lamExpandedId === lamId) ? null : lamId;
    const el = document.getElementById('spLamContent');
    if (el) el.innerHTML = _renderLamContent();
}

// ===== UPDATE FUNCTIONS =====

function updateLaminationName(sizeId, lamId, name) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (lam) {
        lam.name = name;
        savePaperSettings();
    }
}

function updateLamTier(sizeId, lamId, tierIdx, field, value) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam || !lam.tiers[tierIdx]) return;

    if (field === 'price') {
        const priceVal = parseInt(value);
        if (isNaN(priceVal) || priceVal < 0) return;
        lam.tiers[tierIdx][field] = priceVal;
        autoSyncTwoSidedFromOneSided(pricing, lam, tierIdx);
    } else if (field === 'unit') {
        lam.tiers[tierIdx][field] = value;
        autoSyncTwoSidedFromOneSided(pricing, lam, tierIdx);
    }

    savePaperSettings();
    if (field !== 'price') {
        const el = document.getElementById('spLamContent');
        if (el) el.innerHTML = _renderLamContent();
    }
}

function updateLamTierMin(sizeId, lamId, tierIdx, value) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam || !lam.tiers[tierIdx]) return;

    const newMin = parseInt(value);
    if (isNaN(newMin) || newMin < 1) return;

    const tier = lam.tiers[tierIdx];
    const currentMax = tier.max === 999999 ? Infinity : tier.max;
    if (newMin > currentMax) return;

    tier.min = newMin;
    if (tierIdx > 0) {
        const prevTier = lam.tiers[tierIdx - 1];
        prevTier.max = newMin - 1;
        const prevMin = tierIdx === 1 ? (prevTier.min || 1) : (lam.tiers[tierIdx - 2].max + 1);
        if (prevTier.max < prevMin) prevTier.max = prevMin;
    }
    if (tier.max !== 999999 && tier.max < newMin) tier.max = newMin + 100;

    savePaperSettings();
    const el = document.getElementById('spLamContent');
    if (el) el.innerHTML = _renderLamContent();
}

function updateLamTierMax(sizeId, lamId, tierIdx, value) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam || !lam.tiers[tierIdx]) return;

    const tier = lam.tiers[tierIdx];
    if (tier.max === 999999) return;

    const newMax = parseInt(value);
    if (isNaN(newMax) || newMax < 1) return;

    const minQty = tierIdx === 0 ? (tier.min || 1) : (lam.tiers[tierIdx - 1].max + 1);
    tier.min = minQty;
    if (newMax < minQty) return;

    if (tierIdx < lam.tiers.length - 1) {
        const nextTier = lam.tiers[tierIdx + 1];
        if (nextTier.max !== 999999 && nextTier.max < newMax + 1) {
            nextTier.max = newMax + 1;
        }
    }

    tier.max = newMax;
    savePaperSettings();
    const el = document.getElementById('spLamContent');
    if (el) el.innerHTML = _renderLamContent();
}

// ===== ADD FUNCTIONS =====

function addLaminationType(sizeId) {
    if (!PAPER_SETTINGS.laminationPricing) PAPER_SETTINGS.laminationPricing = [];

    let pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) {
        pricing = { printSizeId: sizeId, laminations: [] };
        PAPER_SETTINGS.laminationPricing.push(pricing);
    }

    const newId = Math.max(...PAPER_SETTINGS.laminationPricing.flatMap(p => p.laminations || []).map(l => l.id), 0) + 1;
    pricing.laminations.push({
        id: newId,
        name: 'Cán màng mới',
        tiers: [{ min: 1, max: 999999, price: 1000, unit: 'per_sheet' }]
    });

    _lamExpandedId = newId;
    savePaperSettings();
    renderLaminationSettings();
    showToast('✅ Đã thêm loại cán màng');
}

function addLamTier(sizeId, lamId) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam) return;

    const lastTier = lam.tiers[lam.tiers.length - 1];
    if (lastTier.max === 999999) {
        let newMax;
        if (lam.tiers.length === 1) {
            newMax = 500;
        } else {
            const secondLastTier = lam.tiers[lam.tiers.length - 2];
            const minOfSecondLast = lam.tiers.length >= 3 ? (lam.tiers[lam.tiers.length - 3].max + 1) : 1;
            const gap = secondLastTier.max - minOfSecondLast + 1;
            newMax = secondLastTier.max + gap;
        }
        const prevTierMax = lam.tiers.length >= 2 ? lam.tiers[lam.tiers.length - 2].max : 0;
        lam.tiers.splice(lam.tiers.length - 1, 0, {
            min: prevTierMax + 1, max: newMax, price: lastTier.price, unit: lastTier.unit || 'per_sheet'
        });
    } else {
        lam.tiers.push({ min: lastTier.max + 1, max: 999999, price: lastTier.price, unit: lastTier.unit || 'per_sheet' });
    }

    savePaperSettings();
    const el = document.getElementById('spLamContent');
    if (el) el.innerHTML = _renderLamContent();
    showToast('✅ Đã thêm mốc');
}

// ===== AUTO CALCULATE: Cán màng 2 mặt = 1 mặt x 2 =====

function autoSyncTwoSidedFromOneSided(pricing, oneSidedLam, tierIdx = -1) {
    if (!pricing || !oneSidedLam) return;
    const isOneSided = oneSidedLam.name.includes('1 mặt');
    if (!isOneSided) return;

    const twoSidedName = oneSidedLam.name.replace('1 mặt', '2 mặt');
    const twoSidedLam = pricing.laminations.find(l => l.name === twoSidedName);
    if (!twoSidedLam) return;

    while (twoSidedLam.tiers.length < oneSidedLam.tiers.length) {
        twoSidedLam.tiers.push({ min: 1, max: 999999, price: 0, unit: 'per_sheet' });
    }

    if (tierIdx >= 0 && tierIdx < oneSidedLam.tiers.length) {
        const oneTier = oneSidedLam.tiers[tierIdx];
        if (twoSidedLam.tiers[tierIdx]) {
            twoSidedLam.tiers[tierIdx].price = oneTier.price * 2;
            twoSidedLam.tiers[tierIdx].unit = oneTier.unit;
            twoSidedLam.tiers[tierIdx].min = oneTier.min;
            twoSidedLam.tiers[tierIdx].max = oneTier.max;
        }
    } else {
        oneSidedLam.tiers.forEach((oneTier, idx) => {
            if (twoSidedLam.tiers[idx]) {
                twoSidedLam.tiers[idx].price = oneTier.price * 2;
                twoSidedLam.tiers[idx].unit = oneTier.unit;
                twoSidedLam.tiers[idx].min = oneTier.min;
                twoSidedLam.tiers[idx].max = oneTier.max;
            }
        });
    }
}

function autoCalculateTwoSidedLamination(sizeId) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;

    const oneSidedLams = pricing.laminations.filter(lam => lam.name.includes('1 mặt'));
    oneSidedLams.forEach(oneSided => {
        autoSyncTwoSidedFromOneSided(pricing, oneSided, -1);
    });

    savePaperSettings();
    renderLaminationSettings();
}

// ===== DELETE FUNCTIONS =====

function deleteLamination(sizeId, lamId) {
    if (!confirm('🗑️ Xóa loại cán màng này?')) return;
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    pricing.laminations = pricing.laminations.filter(l => l.id !== lamId);
    if (_lamExpandedId === lamId) _lamExpandedId = null;
    savePaperSettings();
    renderLaminationSettings();
    showToast('🗑️ Đã xóa loại cán màng');
}

function deleteLamTier(sizeId, lamId, tierIdx) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam || lam.tiers.length <= 1) { alert('⚠️ Phải có ít nhất 1 mốc!'); return; }
    lam.tiers.splice(tierIdx, 1);
    savePaperSettings();
    const el = document.getElementById('spLamContent');
    if (el) el.innerHTML = _renderLamContent();
    showToast('🗑️ Đã xóa mốc');
}

function duplicateLamination(sizeId, lamId) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam) return;

    const newId = Math.max(...PAPER_SETTINGS.laminationPricing.flatMap(p => p.laminations || []).map(l => l.id), 0) + 1;
    pricing.laminations.push({
        id: newId,
        name: lam.name + ' (copy)',
        tiers: JSON.parse(JSON.stringify(lam.tiers))
    });

    savePaperSettings();
    renderLaminationSettings();
    showToast('✅ Đã nhân bản');
}

// ===== TOGGLE FUNCTIONS (legacy compat) =====
function toggleLamSize(sizeId) { spSelectLamSizeNew(sizeId); }
function toggleLamType(sizeId, lamId) { spToggleLamEditor(lamId); }

// ===== SYNC FUNCTION: 32.5x43 -> ALL SIZES =====
function syncAllLaminationsFromStandard() {
    const sourceSize = PAPER_SETTINGS.printSizes.find(s => Math.abs(s.w - 325) < 2 && Math.abs(s.h - 430) < 2);
    if (!sourceSize) return;

    const sourcePricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sourceSize.id);
    if (!sourcePricing || !sourcePricing.laminations || sourcePricing.laminations.length === 0) return;

    const sourceArea = sourceSize.w * sourceSize.h;
    let updatedCount = 0;

    PAPER_SETTINGS.printSizes.forEach(targetSize => {
        if (targetSize.id === sourceSize.id) return;
        const targetArea = targetSize.w * targetSize.h;
        const ratio = targetArea / sourceArea;

        let targetPricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === targetSize.id);
        if (!targetPricing) {
            targetPricing = { printSizeId: targetSize.id, laminations: [] };
            PAPER_SETTINGS.laminationPricing.push(targetPricing);
        }

        targetPricing.laminations = [];
        sourcePricing.laminations.forEach(srcLam => {
            const newLam = { id: Date.now() + Math.random() + Math.random(), name: srcLam.name, tiers: [] };
            srcLam.tiers.forEach(srcTier => {
                let newPrice = srcTier.price;
                if (srcTier.unit !== 'per_m2' && srcTier.price > 0) {
                    newPrice = Math.round((srcTier.price * ratio) / 10) * 10;
                }
                newLam.tiers.push({ min: srcTier.min, max: srcTier.max, price: newPrice, unit: srcTier.unit || 'per_sheet' });
            });
            targetPricing.laminations.push(newLam);
        });
        updatedCount++;
    });

    if (updatedCount > 0) {
        savePaperSettings();
        renderLaminationSettings();
    }
}
