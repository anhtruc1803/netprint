// ===== LAMINATION SETTINGS - CÁN MÀNG - PHIÊN BẢN MỚI =====

// Render toàn bộ giao diện cán màng
function renderLaminationSettings() {
    const container = document.getElementById('laminationContainer');
    if (!container) return;

    // 🔹 GHI NHỚ TRẠNG THÁI MỞ/ĐÓNG TRƯỚC KHI RENDER
    const expandedSizes = new Set();
    const expandedLams = new Set();

    PAPER_SETTINGS.printSizes.forEach(size => {
        const lamList = document.getElementById(`lam-types-${size.id}`);
        if (lamList && lamList.style.display !== 'none') {
            expandedSizes.add(size.id);
        }
    });

    if (PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing.forEach(pricing => {
            pricing.laminations.forEach(lam => {
                const lamTiers = document.getElementById(`lam-tiers-${lam.id}`);
                if (lamTiers && lamTiers.style.display !== 'none') {
                    expandedLams.add(lam.id);
                }
            });
        });
    }

    let html = '';

    // Render từng khổ giấy
    PAPER_SETTINGS.printSizes.forEach((size) => {
        const pricing = PAPER_SETTINGS.laminationPricing?.find(p => p.printSizeId === size.id) || {
            printSizeId: size.id,
            laminations: []
        };
        const isSizeExpanded = expandedSizes.has(size.id);

        html += `
            <div class="lam-size-card">
                <!-- Header khổ giấy -->
                <div class="lam-size-header" onclick="toggleLamSize(${size.id})">
                    <div class="lam-size-info">
                        <span class="lam-collapse-icon" id="lam-collapse-icon-${size.id}">${isSizeExpanded ? '▼' : '▶'}</span>
                        <span class="lam-size-label">${size.w} × ${size.h} mm</span>
                    </div>
                    <button class="btn-add-lam-type" onclick="event.stopPropagation(); addLaminationType(${size.id})">
                        + Thêm loại cán màng
                    </button>
                </div>
                
                <!-- Danh sách loại cán màng -->
                <div class="lam-types-list" id="lam-types-${size.id}" style="display: ${isSizeExpanded ? 'flex' : 'none'};">
                    ${pricing.laminations.map(lam => {
            const isLamExpanded = expandedLams.has(lam.id);
            return `
                        <div class="lam-type-card">
                            <!-- Header loại cán màng -->
                            <div class="lam-type-header" onclick="toggleLamType(${size.id}, ${lam.id})">
                                <span class="lam-collapse-icon-small" id="lam-collapse-icon-${lam.id}">${isLamExpanded ? '▼' : '▶'}</span>
                                <input type="text" 
                                    class="lam-type-name" 
                                    value="${lam.name}" 
                                    placeholder="Tên loại cán màng" 
                                    onclick="event.stopPropagation()"
                                    onfocus="event.stopPropagation()"
                                    onchange="updateLaminationName(${size.id}, ${lam.id}, this.value)">
                                <div class="lam-type-actions" onclick="event.stopPropagation()">
                                    <button class="btn-duplicate-lam" onclick="event.stopPropagation(); duplicateLamination(${size.id}, ${lam.id})" title="Nhân bản">📑</button>
                                    <button class="btn-delete-lam" onclick="event.stopPropagation(); deleteLamination(${size.id}, ${lam.id})" title="Xóa">×</button>
                                </div>
                            </div>
                            
                            <!-- Tiers (Mốc giá) -->
                            <div class="lam-tiers-container" id="lam-tiers-${lam.id}" style="display: ${isLamExpanded ? 'block' : 'none'};">
                                ${lam.tiers.map((tier, tierIdx) => {
                // Tính min: ưu tiên tier.min, nếu không có thì tính từ tier trước
                let minQty;
                if (tierIdx === 0) {
                    minQty = tier.min !== undefined ? tier.min : 1;
                    if (tier.min === undefined) {
                        tier.min = 1;
                    }
                } else {
                    minQty = lam.tiers[tierIdx - 1].max + 1;
                    tier.min = minQty;
                }
                const isLastTier = tier.max === 999999;
                const currentUnit = tier.unit || 'per_sheet';

                return `
                                    <div class="lam-tier-row">
                                        <div class="lam-tier-qty">
                                            <input type="number" 
                                                class="lam-tier-min" 
                                                value="${minQty}" 
                                                placeholder="Min" 
                                                min="1"
                                                onclick="event.stopPropagation()"
                                                onfocus="event.stopPropagation()"
                                                onchange="updateLamTierMin(${size.id}, ${lam.id}, ${tierIdx}, this.value)">
                                            <span class="lam-tier-sep">-</span>
                                            <input type="number" 
                                                class="lam-tier-max ${isLastTier ? 'lam-tier-infinity' : ''}" 
                                                value="${isLastTier ? '' : tier.max}" 
                                                placeholder="${isLastTier ? '∞' : 'Max'}"
                                                min="1"
                                                ${isLastTier ? 'readonly' : ''}
                                                onclick="event.stopPropagation()"
                                                onfocus="event.stopPropagation()"
                                                onchange="updateLamTierMax(${size.id}, ${lam.id}, ${tierIdx}, this.value)">
                                        </div>
                                        <div class="lam-tier-price-group">
                                            <input type="number" 
                                                class="lam-tier-price"
                                                value="${tier.price}" 
                                                placeholder="Giá" 
                                                min="0"
                                                step="1"
                                                onclick="event.stopPropagation()"
                                                onfocus="event.stopPropagation()"
                                                onchange="updateLamTier(${size.id}, ${lam.id}, ${tierIdx}, 'price', this.value)">
                                            <div class="lam-unit-toggle" onclick="event.stopPropagation()">
                                                <button type="button" 
                                                    class="lam-unit-btn ${currentUnit === 'per_sheet' ? 'active' : ''}"
                                                    onclick="updateLamTier(${size.id}, ${lam.id}, ${tierIdx}, 'unit', 'per_sheet')">
                                                    đ/tờ
                                                </button>
                                                <button type="button" 
                                                    class="lam-unit-btn ${currentUnit === 'per_m2' ? 'active' : ''}"
                                                    onclick="updateLamTier(${size.id}, ${lam.id}, ${tierIdx}, 'unit', 'per_m2')">
                                                    đ/m²
                                                </button>
                                            </div>
                                        </div>
                                        ${!isLastTier && lam.tiers.length > 1 ? `
                                            <button class="btn-delete-tier" onclick="event.stopPropagation(); deleteLamTier(${size.id}, ${lam.id}, ${tierIdx})" title="Xóa mốc">×</button>
                                        ` : '<span class="lam-tier-spacer"></span>'}
                                    </div>
                                `;
            }).join('')}
                                <button class="btn-add-tier" onclick="addLamTier(${size.id}, ${lam.id})">+ Thêm mốc</button>
                            </div>
                        </div>
                    `;
        }).join('')}
                    ${pricing.laminations.length === 0 ? '<p class="lam-empty-msg">Chưa có loại cán màng. Nhấn "+ Thêm loại cán màng"</p>' : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
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
        if (isNaN(priceVal) || priceVal < 0) {
            renderLaminationSettings();
            return;
        }
        lam.tiers[tierIdx][field] = priceVal;

        // ✨ TỰ ĐỘNG TÍNH: Cán màng 2 mặt = 1 mặt x 2
        autoSyncTwoSidedFromOneSided(pricing, lam, tierIdx);
    } else if (field === 'unit') {
        lam.tiers[tierIdx][field] = value;

        // ✨ ĐỒNG BỘ ĐƠN VỊ: Nếu là cán màng 1 mặt, đồng bộ với 2 mặt
        autoSyncTwoSidedFromOneSided(pricing, lam, tierIdx);
    }

    savePaperSettings();
    // Chỉ re-render khi change unit, không re-render khi input price (tránh mất focus)
    if (field !== 'price') {
        renderLaminationSettings();
    }
}

function updateLamTierMin(sizeId, lamId, tierIdx, value) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam || !lam.tiers[tierIdx]) return;

    const newMin = parseInt(value);
    if (isNaN(newMin) || newMin < 1) {
        renderLaminationSettings();
        return;
    }

    const tier = lam.tiers[tierIdx];
    const currentMax = tier.max === 999999 ? Infinity : tier.max;

    // Kiểm tra min phải <= max
    if (newMin > currentMax) {
        alert(`⚠️ Min phải <= Max (${currentMax === Infinity ? '∞' : currentMax})`);
        renderLaminationSettings();
        return;
    }

    // Lưu min vào tier
    tier.min = newMin;

    if (tierIdx > 0) {
        // Tự động điều chỉnh max của tier trước đó
        const prevTier = lam.tiers[tierIdx - 1];
        prevTier.max = newMin - 1;

        // Đảm bảo tier trước vẫn hợp lệ
        const prevMin = tierIdx === 1 ? (prevTier.min || 1) : (lam.tiers[tierIdx - 2].max + 1);
        if (prevTier.max < prevMin) {
            prevTier.max = prevMin;
        }
    }

    // Nếu thay đổi min làm max của tier hiện tại không hợp lệ, tự động điều chỉnh
    if (tier.max !== 999999 && tier.max < newMin) {
        tier.max = newMin + 100;
    }

    savePaperSettings();
    renderLaminationSettings();
}

function updateLamTierMax(sizeId, lamId, tierIdx, value) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam || !lam.tiers[tierIdx]) return;

    const tier = lam.tiers[tierIdx];
    if (tier.max === 999999) return; // Không cho edit tier ∞

    const newMax = parseInt(value);
    if (isNaN(newMax) || newMax < 1) {
        renderLaminationSettings();
        return;
    }

    // Tính và lưu min của tier hiện tại
    const minQty = tierIdx === 0 ? (tier.min || 1) : (lam.tiers[tierIdx - 1].max + 1);
    tier.min = minQty; // Lưu min vào tier

    // Kiểm tra max phải >= min
    if (newMax < minQty) {
        alert(`⚠️ Max phải >= Min (${minQty})`);
        renderLaminationSettings();
        return;
    }

    // Tự động điều chỉnh min của tier tiếp theo (nếu có)
    if (tierIdx < lam.tiers.length - 1) {
        const nextTier = lam.tiers[tierIdx + 1];
        const nextMin = newMax + 1;

        // Nếu tier tiếp theo không phải ∞, kiểm tra min hợp lệ
        if (nextTier.max !== 999999 && nextTier.max < nextMin) {
            nextTier.max = nextMin;
        }
    }

    tier.max = newMax;
    savePaperSettings();
    renderLaminationSettings();
}

// ===== ADD FUNCTIONS =====

function addLaminationType(sizeId) {
    if (!PAPER_SETTINGS.laminationPricing) {
        PAPER_SETTINGS.laminationPricing = [];
    }

    let pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) {
        pricing = { printSizeId: sizeId, laminations: [] };
        PAPER_SETTINGS.laminationPricing.push(pricing);
    }

    const newId = Math.max(
        ...PAPER_SETTINGS.laminationPricing.flatMap(p => p.laminations || []).map(l => l.id),
        0
    ) + 1;

    pricing.laminations.push({
        id: newId,
        name: 'Cán màng mới',
        tiers: [{ min: 1, max: 999999, price: 1000, unit: 'per_sheet' }]
    });

    renderLaminationSettings();
    savePaperSettings();
    showToast('✅ Đã thêm loại cán màng');
}

function addLamTier(sizeId, lamId) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam) return;

    const lastTier = lam.tiers[lam.tiers.length - 1];
    let newMax;

    // 🔹 TỰ ĐỘNG TÍNH TOÁN SỐ CUỐI THÔNG MINH
    if (lastTier.max === 999999) {
        // Nếu mốc cuối là ∞, thêm mốc mới trước nó
        if (lam.tiers.length === 1) {
            // Chỉ có 1 mốc (1-∞) → Thêm mốc đầu với khoảng mặc định
            newMax = 500;
        } else {
            // Có nhiều mốc → Tính khoảng cách trung bình
            const secondLastTier = lam.tiers[lam.tiers.length - 2];
            const minOfSecondLast = lam.tiers.length >= 3
                ? (lam.tiers[lam.tiers.length - 3].max + 1)
                : 1;
            const gap = secondLastTier.max - minOfSecondLast + 1;
            newMax = secondLastTier.max + gap;
        }

        // Chèn mốc mới TRƯỚC mốc ∞
        const prevTierMax = lam.tiers.length >= 2 ? lam.tiers[lam.tiers.length - 2].max : 0;
        lam.tiers.splice(lam.tiers.length - 1, 0, {
            min: prevTierMax + 1,
            max: newMax,
            price: lastTier.price,
            unit: lastTier.unit || 'per_sheet'
        });
    } else {
        // Nếu mốc cuối KHÔNG phải ∞ → Thêm mốc ∞ vào cuối
        lam.tiers.push({
            min: lastTier.max + 1,
            max: 999999,
            price: lastTier.price,
            unit: lastTier.unit || 'per_sheet'
        });
    }

    renderLaminationSettings();
    savePaperSettings();
    showToast('✅ Đã thêm mốc');
}

// ===== AUTO CALCULATE: Cán màng 2 mặt = 1 mặt x 2 =====

/**
 * Tự động tính giá cán màng 2 mặt từ giá 1 mặt
 * CÔNG THỨC: Cán màng 2 mặt = Cán màng 1 mặt × 2
 * @param {Object} pricing - Object chứa laminations của 1 khổ giấy
 * @param {Object} oneSidedLam - Lamination 1 mặt đang được chỉnh sửa
 * @param {number} tierIdx - Index của tier đang được chỉnh sửa (optional, -1 = all tiers)
 */
function autoSyncTwoSidedFromOneSided(pricing, oneSidedLam, tierIdx = -1) {
    if (!pricing || !oneSidedLam) return;
    
    // Kiểm tra nếu đây là loại cán màng 1 mặt
    const isOneSided = oneSidedLam.name.includes('1 mặt');
    if (!isOneSided) return;
    
    // Tìm tên loại cán màng 2 mặt tương ứng
    const twoSidedName = oneSidedLam.name.replace('1 mặt', '2 mặt');
    const twoSidedLam = pricing.laminations.find(l => l.name === twoSidedName);
    
    if (!twoSidedLam) {
        console.log(`⚠️ Không tìm thấy loại cán màng "${twoSidedName}" để đồng bộ`);
        return;
    }
    
    // Đồng bộ số lượng tier nếu khác nhau
    while (twoSidedLam.tiers.length < oneSidedLam.tiers.length) {
        twoSidedLam.tiers.push({ min: 1, max: 999999, price: 0, unit: 'per_sheet' });
    }
    
    // Cập nhật giá và các thuộc tính
    if (tierIdx >= 0 && tierIdx < oneSidedLam.tiers.length) {
        // Chỉ cập nhật 1 tier cụ thể
        const oneTier = oneSidedLam.tiers[tierIdx];
        if (twoSidedLam.tiers[tierIdx]) {
            twoSidedLam.tiers[tierIdx].price = oneTier.price * 2; // ✨ CÔNG THỨC: x2
            twoSidedLam.tiers[tierIdx].unit = oneTier.unit;
            twoSidedLam.tiers[tierIdx].min = oneTier.min;
            twoSidedLam.tiers[tierIdx].max = oneTier.max;
        }
    } else {
        // Cập nhật tất cả tiers
        oneSidedLam.tiers.forEach((oneTier, idx) => {
            if (twoSidedLam.tiers[idx]) {
                twoSidedLam.tiers[idx].price = oneTier.price * 2; // ✨ CÔNG THỨC: x2
                twoSidedLam.tiers[idx].unit = oneTier.unit;
                twoSidedLam.tiers[idx].min = oneTier.min;
                twoSidedLam.tiers[idx].max = oneTier.max;
            }
        });
    }
    
    console.log(`✅ Đã tự động cập nhật giá "${twoSidedName}" = "${oneSidedLam.name}" × 2`);
}

function autoCalculateTwoSidedLamination(sizeId) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;

    // Tìm tất cả loại cán màng 1 mặt
    const oneSidedLams = pricing.laminations.filter(lam =>
        lam.name.includes('1 mặt')
    );

    oneSidedLams.forEach(oneSided => {
        autoSyncTwoSidedFromOneSided(pricing, oneSided, -1); // Sync all tiers
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

    renderLaminationSettings();
    savePaperSettings();
    showToast('🗑️ Đã xóa loại cán màng');
}

function deleteLamTier(sizeId, lamId, tierIdx) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam || lam.tiers.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 mốc!');
        return;
    }

    lam.tiers.splice(tierIdx, 1);

    renderLaminationSettings();
    savePaperSettings();
    showToast('🗑️ Đã xóa mốc');
}

function duplicateLamination(sizeId, lamId) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;
    const lam = pricing.laminations.find(l => l.id === lamId);
    if (!lam) return;

    const newId = Math.max(
        ...PAPER_SETTINGS.laminationPricing.flatMap(p => p.laminations || []).map(l => l.id),
        0
    ) + 1;

    const clone = {
        id: newId,
        name: lam.name + ' (copy)',
        tiers: JSON.parse(JSON.stringify(lam.tiers))
    };

    pricing.laminations.push(clone);

    renderLaminationSettings();
    savePaperSettings();
    showToast('✅ Đã nhân bản');
}

// ===== TOGGLE FUNCTIONS =====

function toggleLamSize(sizeId) {
    const container = document.getElementById(`lam-types-${sizeId}`);
    const icon = document.getElementById(`lam-collapse-icon-${sizeId}`);
    if (!container || !icon) return;

    if (container.style.display === 'none') {
        container.style.display = 'flex';
        icon.textContent = '▼';
    } else {
        container.style.display = 'none';
        icon.textContent = '▶';
    }
}

function toggleLamType(sizeId, lamId) {
    const container = document.getElementById(`lam-tiers-${lamId}`);
    const icon = document.getElementById(`lam-collapse-icon-${lamId}`);
    if (!container || !icon) return;

    if (container.style.display === 'none') {
        container.style.display = 'block';
        icon.textContent = '▼';
    } else {
        container.style.display = 'none';
        icon.textContent = '▶';
    }
}

// ===== SYNC FUNCTION: 32.5x43 -> ALL SIZES =====
function syncAllLaminationsFromStandard() {
    // 1. Tìm Source (32.5 x 43 = 325 x 430 mm)
    // Cho phép sai số nhỏ do làm tròn
    const sourceSize = PAPER_SETTINGS.printSizes.find(s => Math.abs(s.w - 325) < 2 && Math.abs(s.h - 430) < 2);

    if (!sourceSize) {
        console.warn('❌ Không tìm thấy khổ 32.5 x 43 cm chuẩn để đồng bộ!');
        return;
    }

    // Lấy pricing của source
    const sourcePricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sourceSize.id);
    if (!sourcePricing || !sourcePricing.laminations || sourcePricing.laminations.length === 0) {
        console.warn('❌ Khổ 32.5 x 43 chưa có giá cán màng!');
        return;
    }

    const sourceArea = sourceSize.w * sourceSize.h;
    let updatedCount = 0;

    // 2. Duyệt qua tất cả các khổ giấy KHÁC
    PAPER_SETTINGS.printSizes.forEach(targetSize => {
        // Bỏ qua chính nó
        if (targetSize.id === sourceSize.id) return;

        // Tính tỷ lệ diện tích
        const targetArea = targetSize.w * targetSize.h;
        const ratio = targetArea / sourceArea;

        // Chuẩn bị update
        let targetPricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === targetSize.id);
        if (!targetPricing) {
            targetPricing = {
                printSizeId: targetSize.id,
                laminations: []
            };
            PAPER_SETTINGS.laminationPricing.push(targetPricing);
        }

        // Xóa cũ để đồng bộ mới hoàn toàn - Đảm bảo chính xác tuyệt đối theo source
        targetPricing.laminations = [];

        sourcePricing.laminations.forEach(srcLam => {
            // Clone lamination structure
            const newLam = {
                id: Date.now() + Math.random() + Math.random(), // Unique ID
                name: srcLam.name,
                tiers: []
            };

            // Clone tiers và tính giá theo tỷ lệ
            srcLam.tiers.forEach(srcTier => {
                let newPrice = srcTier.price;

                // Chỉ tăng giá nếu đơn vị là 'per_sheet' hoặc 'per_lot'
                // 'per_m2' giữ nguyên đơn giá (vì diện tích tăng sẽ tự tăng tiền)
                if (srcTier.unit !== 'per_m2' && srcTier.price > 0) {
                    newPrice = srcTier.price * ratio;
                    // Làm tròn đến hàng chục
                    newPrice = Math.round(newPrice / 10) * 10;
                }

                newLam.tiers.push({
                    min: srcTier.min,
                    max: srcTier.max,
                    price: newPrice,
                    unit: srcTier.unit || 'per_sheet'
                });
            });

            targetPricing.laminations.push(newLam);
        });

        updatedCount++;
        console.log(`✅ Synced lamination for ${targetSize.w}x${targetSize.h} (Ratio: ${ratio.toFixed(3)})`);
    });

    if (updatedCount > 0) {
        savePaperSettings();
        renderLaminationSettings();
        // showToast(`✅ Đã đồng bộ giá cán màng cho ${updatedCount} khổ giấy`);
    }
}
