// ===== PROCESSING SETTINGS - CLEAN REBUILD =====

function ensureProcTierUnits(proc) {
    if (!proc) return;

    const hasAnyTierUnit = !!(proc.tiers && proc.tiers.some(t => !!t.unit));

    // If legacy "unit per proc" was per_lot, prefer fixedTiers as source (only when tiers don't already have per-tier units)
    if (proc.unit === 'per_lot' && !hasAnyTierUnit && proc.fixedTiers && proc.fixedTiers.length > 0) {
        proc.tiers = proc.fixedTiers.map(ft => ({
            max: ft.max,
            price: ft.fixed,
            unit: 'per_lot'
        }));
        return;
    }

    // Migrate legacy fixedTiers -> tiers (unit per_lot)
    if ((!proc.tiers || proc.tiers.length === 0) && proc.fixedTiers && proc.fixedTiers.length > 0) {
        proc.tiers = proc.fixedTiers.map(ft => ({
            max: ft.max,
            price: ft.fixed,
            unit: 'per_lot'
        }));
    }

    // Ensure every tier has a unit (default from legacy proc.unit or name heuristics)
    const fallbackUnit = proc.unit || determineDefaultUnit(proc);
    if (proc.tiers && proc.tiers.length > 0) {
        proc.tiers.forEach(t => {
            if (!t.unit) t.unit = fallbackUnit;
        });
    }
}

function renderProcUnitToggleInline(procId, tierIdx, currentUnit) {
    return `
        <div class="proc-unit-toggle proc-unit-toggle--inline" onclick="event.stopPropagation()">
            <button type="button" 
                class="proc-unit-btn ${currentUnit === 'per_lot' ? 'active' : ''}"
                onclick="updateProcTier(${procId}, ${tierIdx}, 'unit', 'per_lot')">
                Lô
            </button>
            <button type="button" 
                class="proc-unit-btn ${currentUnit === 'per_item' ? 'active' : ''}"
                onclick="updateProcTier(${procId}, ${tierIdx}, 'unit', 'per_item')">
                SP
            </button>
            <button type="button" 
                class="proc-unit-btn ${currentUnit === 'per_sheet' ? 'active' : ''}"
                onclick="updateProcTier(${procId}, ${tierIdx}, 'unit', 'per_sheet')">
                Tờ
            </button>
        </div>
    `;
}

// Render toàn bộ giao diện gia công
function renderProcessingSettings() {
    const container = document.getElementById('processingContainer');
    if (!container) return;

    // 🔹 GHI NHỚ TRẠNG THÁI MỞ/ĐÓNG TRƯỚC KHI RENDER
    const expandedProcs = new Set();
    PAPER_SETTINGS.processing.forEach(proc => {
        const procTiers = document.getElementById(`proc-tiers-${proc.id}`);
        if (procTiers && procTiers.style.display !== 'none') {
            expandedProcs.add(proc.id);
        }
    });

    let html = '';

    PAPER_SETTINGS.processing.forEach((proc, procIdx) => {
        const isProcExpanded = expandedProcs.has(proc.id);

        // Ensure backward compatibility + unit per tier
        ensureProcTierUnits(proc);
        
        // Kiểm tra xem đã có mốc nào chưa (phải có ít nhất 1 mốc)
        const hasTiers = (proc.tiers && proc.tiers.length > 0);

        html += `
            <div class="proc-type-block">
                <!-- Header loại gia công -->
                <div class="proc-type-header" onclick="toggleProcType(${proc.id})">
                    <span class="collapse-icon-small" id="collapse-icon-proc-${proc.id}">${isProcExpanded ? '▼' : '▶'}</span>
                    <input type="text" value="${proc.name}" placeholder="Tên gia công" 
                        onclick="event.stopPropagation()"
                        onfocus="event.stopPropagation()"
                        onblur="updateProcName(${proc.id}, this.value)"
                        onchange="updateProcName(${proc.id}, this.value)">
                    <div class="proc-type-actions" onclick="event.stopPropagation()">
                        <button class="btn-duplicate" onclick="event.stopPropagation(); duplicateProc(${proc.id})">📑</button>
                        <button class="btn-delete" onclick="event.stopPropagation(); deleteProc(${proc.id})">×</button>
                    </div>
                </div>

                <!-- Tiers Container -->
                <div class="proc-tiers-container" id="proc-tiers-${proc.id}" style="display: ${isProcExpanded ? 'block' : 'none'};">
                    ${!hasTiers ? `
                        <!-- Chưa có mốc - Chỉ hiển thị nút thêm mốc đầu tiên -->
                        <div class="proc-empty-state">
                            <p style="color: #666; margin-bottom: 16px; font-size: 14px;">Chưa có mốc giá. Vui lòng thêm mốc đầu tiên:</p>
                            <button class="btn-add-tier-full" onclick="addFirstProcTier(${proc.id})">+ Thêm mốc đầu tiên</button>
                        </div>
                    ` : `
                        <!-- Đã có mốc - Hiển thị tiers (đơn vị theo từng mốc) -->
                        ${renderTieredPricing(proc)}
                    `}
                </div>
            </div>
        `;
    });

    // Add button
    html += `
        <button class="btn-add-proc-full" onclick="addProcType()">+ Thêm gia công</button>
    `;

    container.innerHTML = html;
}

// Xác định đơn vị mặc định dựa trên tên và cấu trúc hiện tại
function determineDefaultUnit(proc) {
    // Chỉ coi fixedTiers là per_lot khi KHÔNG có tiers (tránh nhầm dữ liệu cũ có cả 2)
    if ((!proc.tiers || proc.tiers.length === 0) && proc.fixedTiers && proc.fixedTiers.length > 0) {
        return 'per_lot';
    }
    // Nếu tên chứa "Bế" → per_sheet (theo tờ in)
    if (proc.name.includes('Bế')) {
        return 'per_sheet';
    }
    // Mặc định → per_item (theo sản phẩm)
    return 'per_item';
}

// Render Tiered Pricing (đơn vị theo từng mốc)
function renderTieredPricing(proc) {
    if (!proc.tiers || proc.tiers.length === 0) {
        const fallbackUnit = proc.unit || determineDefaultUnit(proc);
        proc.tiers = [{ max: 999999, price: fallbackUnit === 'per_lot' ? 10000 : 1000, unit: fallbackUnit }];
    }

    return `
        <div class="proc-tiered-pricing">
            ${proc.tiers.map((tier, tierIdx) => {
                const minQty = tierIdx === 0 ? 1 : (proc.tiers[tierIdx - 1].max + 1);
                const isLastTier = tier.max === 999999;
                const isFirstTier = tierIdx === 0;
                const currentUnit = tier.unit || proc.unit || determineDefaultUnit(proc);
                const opSymbol = currentUnit === 'per_lot' ? '→' : '×';
                const pricePlaceholder = currentUnit === 'per_lot' ? 'Giá lô' : 'Giá';
                return `
                    <div class="proc-tier-row" onclick="event.stopPropagation()">
                        <div class="proc-tier-qty">
                            <input type="number" 
                                class="tier-min-input" 
                                value="${minQty}" 
                                ${isFirstTier ? 'readonly' : ''}
                                placeholder="Min" 
                                onclick="event.stopPropagation()"
                                onfocus="event.stopPropagation()"
                                onblur="updateProcTierMin(${proc.id}, ${tierIdx}, this.value)"
                                onchange="updateProcTierMin(${proc.id}, ${tierIdx}, this.value)">
                            <span class="proc-tier-sep">-</span>
                            <input type="number" 
                                class="tier-max-input ${isLastTier ? 'tier-infinity' : ''}" 
                                value="${isLastTier ? '' : tier.max}" 
                                placeholder="${isLastTier ? '∞' : 'Max'}"
                                ${isLastTier ? 'readonly' : ''}
                                onclick="event.stopPropagation()"
                                onfocus="event.stopPropagation()"
                                onblur="updateProcTierMax(${proc.id}, ${tierIdx}, this.value)"
                                onchange="updateProcTierMax(${proc.id}, ${tierIdx}, this.value)">
                        </div>
                        <span class="proc-tier-op">${opSymbol}</span>
                        <div class="proc-tier-price-group">
                            <input type="number" 
                                class="tier-price-input"
                                value="${tier.price}" 
                                placeholder="${pricePlaceholder}" 
                                min="0"
                                step="1"
                                onclick="event.stopPropagation()"
                                onfocus="event.stopPropagation()"
                                onblur="updateProcTier(${proc.id}, ${tierIdx}, 'price', this.value)"
                                onchange="updateProcTier(${proc.id}, ${tierIdx}, 'price', this.value)">
                            ${renderProcUnitToggleInline(proc.id, tierIdx, currentUnit)}
                        </div>
                        ${proc.tiers.length > 1 ? `
                            <button type="button" 
                                class="btn-tier-del" 
                                onclick="event.stopPropagation(); deleteProcTier(${proc.id}, ${tierIdx})" 
                                title="Xóa mốc">×</button>
                        ` : '<span class="tier-placeholder"></span>'}
                    </div>
                `;
            }).join('')}
            <button class="btn-add-tier-full" onclick="addProcTier(${proc.id})">+ Thêm mốc</button>
        </div>
    `;
}

// Toggle expand/collapse
function toggleProcType(procId) {
    const tiersEl = document.getElementById(`proc-tiers-${procId}`);
    const iconEl = document.getElementById(`collapse-icon-proc-${procId}`);
    if (tiersEl) {
        const isExpanded = tiersEl.style.display !== 'none';
        tiersEl.style.display = isExpanded ? 'none' : 'block';
        iconEl.textContent = isExpanded ? '▶' : '▼';
    }
}

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

    // Legacy helper: set default unit (does not force-sync tiers anymore)
    proc.unit = unit;
    ensureProcTierUnits(proc);

    renderProcessingSettings();
    savePaperSettings();
}

// Fixed Tier functions (per_lot)
function updateProcFixedTierMin(procId, tierIdx, value) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.fixedTiers || !proc.fixedTiers[tierIdx]) return;

    if (tierIdx === 0) {
        renderProcessingSettings();
        return;
    }

    const minValue = parseInt(value) || 1;
    const prevTier = proc.fixedTiers[tierIdx - 1];
    if (prevTier) {
        prevTier.max = minValue - 1;
        if (prevTier.max < 1) prevTier.max = 1;
    }

    renderProcessingSettings();
    savePaperSettings();
}

function updateProcFixedTierMax(procId, tierIdx, value) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.fixedTiers || !proc.fixedTiers[tierIdx]) return;

    const tier = proc.fixedTiers[tierIdx];
    const isLastTier = tierIdx === proc.fixedTiers.length - 1;

    if (isLastTier) {
        renderProcessingSettings();
        return;
    }

    const maxValue = value === '' ? 999999 : parseInt(value);
    if (isNaN(maxValue) || maxValue < 1) {
        renderProcessingSettings();
        return;
    }

    tier.max = maxValue;
    const minQty = tierIdx === 0 ? 1 : (proc.fixedTiers[tierIdx - 1].max + 1);
    if (tier.max < minQty) {
        tier.max = minQty;
    }

    renderProcessingSettings();
    savePaperSettings();
}

function updateProcFixedTier(procId, tierIdx, field, value) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.fixedTiers || !proc.fixedTiers[tierIdx]) return;

    if (field === 'fixed') {
        const fixedValue = parseInt(value) || 0;
        if (fixedValue < 0) {
            renderProcessingSettings();
            return;
        }
        proc.fixedTiers[tierIdx].fixed = fixedValue;
    }

    savePaperSettings();
}

function addProcFixedTier(procId) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.fixedTiers || proc.fixedTiers.length === 0) return;

    const lastTier = proc.fixedTiers[proc.fixedTiers.length - 1];
    const newMax = lastTier.max === 999999 ? 500 : lastTier.max + 200;

    proc.fixedTiers.push({
        max: newMax,
        fixed: lastTier.fixed
    });

    renderProcessingSettings();
    savePaperSettings();
}

function deleteProcFixedTier(procId, tierIdx) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.fixedTiers || proc.fixedTiers.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 mốc!');
        return;
    }

    if (!confirm('🗑️ Xóa mốc này?')) return;

    proc.fixedTiers.splice(tierIdx, 1);
    renderProcessingSettings();
    savePaperSettings();
    showToast('🗑️ Đã xóa mốc');
}

// Tiered Pricing functions (per_item, per_sheet)
function updateProcTierMin(procId, tierIdx, value) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.tiers || !proc.tiers[tierIdx]) return;

    if (tierIdx === 0) {
        renderProcessingSettings();
        return;
    }

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
    if (tier.max === 999999) {
        renderProcessingSettings();
        return;
    }

    const maxValue = value === '' ? 999999 : parseInt(value);
    if (isNaN(maxValue) || maxValue < 1) {
        renderProcessingSettings();
        return;
    }

    tier.max = maxValue;
    const minQty = tierIdx === 0 ? 1 : (proc.tiers[tierIdx - 1].max + 1);
    if (tier.max < minQty) {
        tier.max = minQty;
    }

    renderProcessingSettings();
    savePaperSettings();
}

function updateProcTier(procId, tierIdx, field, value) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.tiers || !proc.tiers[tierIdx]) return;

    if (field === 'price') {
        const priceValue = parseInt(value) || 0;
        if (priceValue < 0) {
            renderProcessingSettings();
            return;
        }
        proc.tiers[tierIdx].price = priceValue;
    } else if (field === 'unit') {
        proc.tiers[tierIdx].unit = value;
        // Re-render to update operator + placeholders
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
        max: newMax,
        price: lastTier.price,
        unit: lastTier.unit || proc.unit || determineDefaultUnit(proc)
    });

    renderProcessingSettings();
    savePaperSettings();
    showToast('✅ Đã thêm mốc mới');
}

function deleteProcTier(procId, tierIdx) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc || !proc.tiers || proc.tiers.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 mốc!');
        return;
    }

    if (!confirm('🗑️ Xóa mốc này?')) return;

    const deletedTier = proc.tiers[tierIdx];
    const isLastTier = deletedTier.max === 999999;

    proc.tiers.splice(tierIdx, 1);

    if (isLastTier && proc.tiers.length > 0) {
        const newLastTier = proc.tiers[proc.tiers.length - 1];
        newLastTier.max = 999999;
    }

    renderProcessingSettings();
    savePaperSettings();
    showToast('🗑️ Đã xóa mốc');
}

// Thêm mốc đầu tiên - hiển thị dialog chọn đơn vị
function addFirstProcTier(procId) {
    const proc = PAPER_SETTINGS.processing.find(p => p.id === procId);
    if (!proc) return;

    // Khởi tạo mốc đầu tiên (đơn vị theo từng mốc)
    const selectedUnit = proc.unit || determineDefaultUnit(proc);
    proc.unit = selectedUnit; // keep as default for new tiers
    proc.tiers = [{
        max: 999999,
        price: selectedUnit === 'per_lot' ? 10000 : 1000,
        unit: selectedUnit
    }];
    // Keep legacy data but not used
    proc.fixedTiers = null;

    renderProcessingSettings();
    savePaperSettings();
    showToast('✅ Đã thêm mốc đầu tiên');
}

// Add/Delete/Duplicate Processing Type
function addProcType() {
    const newId = Math.max(...PAPER_SETTINGS.processing.map(p => p.id), 0) + 1;
    PAPER_SETTINGS.processing.push({
        id: newId,
        name: 'Gia công mới'
        // Không khởi tạo unit và tiers - để người dùng chọn đơn vị khi thêm mốc đầu tiên
    });

    renderProcessingSettings();
    savePaperSettings();
    showToast('✅ Đã thêm gia công mới');
}

function deleteProc(procId) {
    if (!confirm('🗑️ Xóa gia công này?')) return;

    const index = PAPER_SETTINGS.processing.findIndex(p => p.id === procId);
    if (index > -1) {
        PAPER_SETTINGS.processing.splice(index, 1);
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
    const duplicated = {
        id: newId,
        name: proc.name + ' (copy)',
        unit: proc.unit || null,
        tiers: proc.tiers ? JSON.parse(JSON.stringify(proc.tiers)) : null,
        fixedTiers: null
    };

    PAPER_SETTINGS.processing.push(duplicated);
    renderProcessingSettings();
    savePaperSettings();
    populatePaperDropdowns();
    showToast('📑 Đã sao chép gia công');
}
