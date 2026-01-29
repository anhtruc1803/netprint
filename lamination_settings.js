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
        if (lam.name.includes('1 mặt') || lam.name.toLowerCase().includes('1 mặt')) {
            const twoSidedName = lam.name.replace('1 mặt', '2 mặt').replace('1 mặt', '2 mặt');
            const twoSided = pricing.laminations.find(l => l.name === twoSidedName);
            
            if (twoSided && twoSided.tiers && twoSided.tiers[tierIdx]) {
                // Tự động cập nhật giá 2 mặt = 1 mặt x 2
                twoSided.tiers[tierIdx].price = priceVal * 2;
                twoSided.tiers[tierIdx].unit = lam.tiers[tierIdx].unit; // Đồng bộ đơn vị
            }
        }
    } else if (field === 'unit') {
        lam.tiers[tierIdx][field] = value;
        
        // ✨ ĐỒNG BỘ ĐƠN VỊ: Nếu là cán màng 1 mặt, đồng bộ với 2 mặt
        if (lam.name.includes('1 mặt') || lam.name.toLowerCase().includes('1 mặt')) {
            const twoSidedName = lam.name.replace('1 mặt', '2 mặt').replace('1 mặt', '2 mặt');
            const twoSided = pricing.laminations.find(l => l.name === twoSidedName);
            
            if (twoSided && twoSided.tiers && twoSided.tiers[tierIdx]) {
                twoSided.tiers[tierIdx].unit = value;
                // Cập nhật lại giá 2 mặt = 1 mặt x 2
                twoSided.tiers[tierIdx].price = lam.tiers[tierIdx].price * 2;
            }
        }
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

function autoCalculateTwoSidedLamination(sizeId) {
    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === sizeId);
    if (!pricing) return;

    // Tìm tất cả loại cán màng 1 mặt
    const oneSidedLams = pricing.laminations.filter(lam => 
        lam.name.includes('1 mặt') || lam.name.toLowerCase().includes('1 mặt')
    );

    oneSidedLams.forEach(oneSided => {
        // Tìm loại cán màng 2 mặt tương ứng
        const twoSidedName = oneSided.name.replace('1 mặt', '2 mặt').replace('1 mặt', '2 mặt');
        const twoSided = pricing.laminations.find(lam => lam.name === twoSidedName);

        if (twoSided && oneSided.tiers && oneSided.tiers.length > 0) {
            // Copy tiers từ 1 mặt sang 2 mặt và nhân giá x 2
            twoSided.tiers = oneSided.tiers.map(tier => ({
                min: tier.min,
                max: tier.max,
                price: tier.price * 2, // ✨ CÔNG THỨC: 2 mặt = 1 mặt x 2
                unit: tier.unit
            }));

            savePaperSettings();
        }
    });
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
