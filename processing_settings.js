// ===== PROCESSING SETTINGS - CARD-BASED UI =====
// Đồng bộ giao diện với Loại Giấy, Giá In, Cán Màng

// State
let _procExpandedId = null;

function ensureProcTierUnits(proc) {
    if (!proc) return;
    const hasAnyTierUnit = !!(proc.tiers && proc.tiers.some(t => !!t.unit));

    if (proc.unit === 'per_lot' && !hasAnyTierUnit && proc.fixedTiers && proc.fixedTiers.length > 0) {
        proc.tiers = proc.fixedTiers.map(ft => ({ max: ft.max, price: ft.fixed, unit: 'per_lot' }));
        return;
    }
    if ((!proc.tiers || proc.tiers.length === 0) && proc.fixedTiers && proc.fixedTiers.length > 0) {
        proc.tiers = proc.fixedTiers.map(ft => ({ max: ft.max, price: ft.fixed, unit: 'per_lot' }));
    }
    const fallbackUnit = proc.unit || determineDefaultUnit(proc);
    if (proc.tiers && proc.tiers.length > 0) {
        proc.tiers.forEach(t => { if (!t.unit) t.unit = fallbackUnit; });
    }
}

function determineDefaultUnit(proc) {
    if ((!proc.tiers || proc.tiers.length === 0) && proc.fixedTiers && proc.fixedTiers.length > 0) return 'per_lot';
    if (proc.name && proc.name.includes('Bế')) return 'per_sheet';
    return 'per_item';
}

// Render toàn bộ giao diện gia công (card-based)
function renderProcessingSettings() {
    const container = document.getElementById('processingContainer');
    if (!container) return;

    const procs = PAPER_SETTINGS.processing || [];

    if (procs.length === 0) {
        container.innerHTML = `
            <div class="sp-scroll-content">
                <div class="sp-empty"><div class="sp-empty-icon">✂️</div><h4>Chưa có gia công</h4><p>Nhấn nút bên dưới để thêm loại gia công</p></div>
                <button class="sp-add-paper-btn" onclick="addProcType()">➕ Thêm gia công</button>
            </div>`;
        return;
    }

    const cards = procs.map(proc => {
        ensureProcTierUnits(proc);
        return _renderProcCard(proc);
    }).join('');

    container.innerHTML = `
        <div class="sp-scroll-content">
            ${cards}
            <button class="sp-add-paper-btn" onclick="addProcType()">➕ Thêm gia công</button>
        </div>`;
}

function _renderProcCard(proc) {
    const isExpanded = _procExpandedId === proc.id;
    const tiers = proc.tiers || [];
    const hasTiers = tiers.length > 0;

    // Mini badges (collapsed)
    const miniBadges = tiers.map(t => {
        const qty = t.max === 999999 ? '∞' : `≤${_fmt(t.max)}`;
        const unitLabel = t.unit === 'per_lot' ? 'đ/lô' : t.unit === 'per_sheet' ? 'đ/tờ' : 'đ/sp';
        return `<span class="sp-mini-badge">${qty}: ${_fmt(t.price)}${unitLabel}</span>`;
    }).join('');

    // Tier editor (expanded)
    let tierEditor = '';
    if (isExpanded) {
        if (!hasTiers) {
            tierEditor = `
                <div style="padding:16px;text-align:center;">
                    <p style="color:#64748b;margin-bottom:12px;font-size:13px;">Chưa có mốc giá. Thêm mốc đầu tiên:</p>
                    <button class="sp-tier-add-btn" onclick="addFirstProcTier(${proc.id})">➕ Thêm mốc đầu tiên</button>
                </div>`;
        } else {
            const tierRows = tiers.map((t, i) => {
                const minQty = i === 0 ? 1 : (tiers[i - 1].max + 1);
                const isLast = t.max === 999999;
                const currentUnit = t.unit || proc.unit || determineDefaultUnit(proc);
                return `
                    <div class="sp-tier-grid-row" style="grid-template-columns: 75px 75px 100px 90px 36px;">
                        <input type="number" value="${minQty}" ${i === 0 ? 'readonly' : ''}
                            ${i > 0 ? `onchange="updateProcTierMin(${proc.id},${i},this.value)"` : ''}>
                        <input type="number" value="${isLast ? '' : t.max}" placeholder="${isLast ? '∞' : 'Max'}"
                            ${isLast ? 'readonly' : ''}
                            onchange="updateProcTierMax(${proc.id},${i},this.value)">
                        <input type="number" value="${t.price}" placeholder="Giá" min="0"
                            onchange="updateProcTier(${proc.id},${i},'price',this.value)">
                        <select onchange="updateProcTier(${proc.id},${i},'unit',this.value)" style="padding:6px 4px;border:1px solid #e2e8f0;border-radius:7px;font-size:12px;">
                            <option value="per_sheet" ${currentUnit === 'per_sheet' ? 'selected' : ''}>đ/tờ</option>
                            <option value="per_item" ${currentUnit === 'per_item' ? 'selected' : ''}>đ/sp</option>
                            <option value="per_lot" ${currentUnit === 'per_lot' ? 'selected' : ''}>đ/lô</option>
                            <option value="per_m2" ${currentUnit === 'per_m2' ? 'selected' : ''}>đ/m²</option>
                        </select>
                        <button class="sp-tier-mini-del" ${tiers.length <= 1 ? 'disabled' : ''}
                            onclick="deleteProcTier(${proc.id},${i})">✕</button>
                    </div>`;
            }).join('');

            tierEditor = `
                <div class="sp-tier-grid">
                    <div class="sp-tier-grid-header" style="grid-template-columns: 75px 75px 100px 90px 36px;">
                        <span>Từ</span><span>Đến</span><span>Giá</span><span>Đơn vị</span><span></span>
                    </div>
                    ${tierRows}
                    <button class="sp-tier-add-btn" onclick="addProcTier(${proc.id})">➕ Thêm mốc giá</button>
                </div>`;
        }
    }

    return `
        <div class="sp-paper-card ${isExpanded ? 'expanded' : ''}">
            <div class="sp-paper-card-header" onclick="spToggleProcEditor(${proc.id})">
                <input type="text" class="sp-paper-name-input" value="${proc.name.replace(/"/g, '&quot;')}"
                    onclick="event.stopPropagation()" onblur="updateProcName(${proc.id},this.value)">
                <div class="sp-paper-tiers-preview">${miniBadges}</div>
                <div class="sp-paper-card-actions" onclick="event.stopPropagation()">
                    <button class="sp-icon-btn dup" onclick="duplicateProc(${proc.id})" title="Nhân bản">📑</button>
                    <button class="sp-icon-btn del" onclick="deleteProc(${proc.id})" title="Xóa">🗑️</button>
                </div>
                <span class="sp-expand-icon">${isExpanded ? '▲' : '▼'}</span>
            </div>
            <div class="sp-paper-card-body">
                ${tierEditor}
            </div>
        </div>`;
}

function spToggleProcEditor(procId) {
    _procExpandedId = (_procExpandedId === procId) ? null : procId;
    renderProcessingSettings();
}

// Legacy compat
function toggleProcType(procId) { spToggleProcEditor(procId); }

// Update functions
function updateProcName(procId, value) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (proc) {
        proc.name = value || 'Gia công';
        savePaperSettings();
        populatePaperDropdowns();
    }
}

function updateProcUnit(procId, unit) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc) return;
    proc.unit = unit;
    ensureProcTierUnits(proc);
    renderProcessingSettings();
    savePaperSettings();
}

function updateProcTierMin(procId, tierIdx, value) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.tiers || !proc.tiers[tierIdx]) return;
    if (tierIdx === 0) return;

    const minValue = parseInt(value) || 1;
    const prevTier = proc.tiers[tierIdx - 1];
    if (prevTier && prevTier.max !== 999999) {
        prevTier.max = minValue - 1;
        if (prevTier.max < 1) prevTier.max = 1;
    }

    renderProcessingSettings();
    savePaperSettings();
}

function updateProcTierMax(procId, tierIdx, value) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.tiers || !proc.tiers[tierIdx]) return;

    const tier = proc.tiers[tierIdx];
    if (tier.max === 999999) return;

    const maxValue = value === '' ? 999999 : parseInt(value);
    if (isNaN(maxValue) || maxValue < 1) return;

    tier.max = maxValue;
    const minQty = tierIdx === 0 ? 1 : (proc.tiers[tierIdx - 1].max + 1);
    if (tier.max < minQty) tier.max = minQty;

    renderProcessingSettings();
    savePaperSettings();
}

function updateProcTier(procId, tierIdx, field, value) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.tiers || !proc.tiers[tierIdx]) return;

    if (field === 'price') {
        const priceValue = parseInt(value) || 0;
        if (priceValue < 0) return;
        proc.tiers[tierIdx].price = priceValue;
    } else if (field === 'unit') {
        proc.tiers[tierIdx].unit = value;
        renderProcessingSettings();
    }
    savePaperSettings();
}

function addProcTier(procId) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.tiers || proc.tiers.length === 0) return;

    const lastTier = proc.tiers[proc.tiers.length - 1];
    const newMax = lastTier.max === 999999 ? 500 : lastTier.max + 200;

    proc.tiers.splice(proc.tiers.length - 1, 0, {
        max: newMax, price: lastTier.price,
        unit: lastTier.unit || proc.unit || determineDefaultUnit(proc)
    });

    renderProcessingSettings();
    savePaperSettings();
    showToast('✅ Đã thêm mốc mới');
}

function deleteProcTier(procId, tierIdx) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.tiers || proc.tiers.length <= 1) { alert('⚠️ Phải có ít nhất 1 mốc!'); return; }
    if (!confirm('🗑️ Xóa mốc này?')) return;

    const isLast = proc.tiers[tierIdx].max === 999999;
    proc.tiers.splice(tierIdx, 1);
    if (isLast && proc.tiers.length > 0) proc.tiers[proc.tiers.length - 1].max = 999999;

    renderProcessingSettings();
    savePaperSettings();
    showToast('🗑️ Đã xóa mốc');
}

function addFirstProcTier(procId) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc) return;

    const selectedUnit = proc.unit || determineDefaultUnit(proc);
    proc.unit = selectedUnit;
    proc.tiers = [{ max: 999999, price: selectedUnit === 'per_lot' ? 10000 : 1000, unit: selectedUnit }];
    proc.fixedTiers = null;

    renderProcessingSettings();
    savePaperSettings();
    showToast('✅ Đã thêm mốc đầu tiên');
}

// Add/Delete/Duplicate
function addProcType() {
    const newId = Math.max(...PAPER_SETTINGS.processing.map(p => p.id), 0) + 1;
    PAPER_SETTINGS.processing.push({ id: newId, name: 'Gia công mới' });
    _procExpandedId = newId;
    renderProcessingSettings();
    savePaperSettings();
    showToast('✅ Đã thêm gia công mới');
}

function deleteProc(procId) {
    if (!confirm('🗑️ Xóa gia công này?')) return;
    const index = PAPER_SETTINGS.processing.findIndex(p => p.id === procId);
    if (index > -1) {
        PAPER_SETTINGS.processing.splice(index, 1);
        if (_procExpandedId === procId) _procExpandedId = null;
        renderProcessingSettings();
        savePaperSettings();
        populatePaperDropdowns();
        showToast('🗑️ Đã xóa gia công');
    }
}

function duplicateProc(procId) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc) return;

    const newId = Math.max(...PAPER_SETTINGS.processing.map(p => p.id), 0) + 1;
    PAPER_SETTINGS.processing.push({
        id: newId,
        name: proc.name + ' (copy)',
        unit: proc.unit || null,
        tiers: proc.tiers ? JSON.parse(JSON.stringify(proc.tiers)) : null,
        fixedTiers: null
    });

    renderProcessingSettings();
    savePaperSettings();
    populatePaperDropdowns();
    showToast('📑 Đã sao chép gia công');
}

// Legacy compat
function renderProcUnitToggleInline() { return ''; }
function updateProcFixedTierMin() { }
function updateProcFixedTierMax() { }
function updateProcFixedTier() { }
function addProcFixedTier() { }
function deleteProcFixedTier() { }
