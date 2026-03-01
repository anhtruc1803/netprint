// ===== PRINT PRICING SETTINGS - MULTI-SIZE SUPPORT =====
// Hỗ trợ giá in riêng cho từng khổ giấy

// Cấu hình khổ giấy mặc định
const DEFAULT_PRINT_SIZES = [
    { id: 'A3', name: 'Khổ A3 (325×430)', width: 325, height: 430 },
    { id: '330x430', name: 'Khổ 330×430', width: 330, height: 430 },
    { id: '330x480', name: 'Khổ 330×480', width: 330, height: 480 },
    { id: '330x650', name: 'Khổ 330×650 (Lớn)', width: 330, height: 650, isLargeFormat: true },
    { id: '430x650', name: 'Khổ 430×650 (Lớn)', width: 430, height: 650, isLargeFormat: true },
    { id: '350x500', name: 'Khổ 350×500 (Lớn)', width: 350, height: 500, isLargeFormat: true },
    { id: '500x700', name: 'Khổ 500×700 (Lớn)', width: 500, height: 700, isLargeFormat: true }
];

// Giá in mặc định cho khổ nhỏ
const DEFAULT_PRINT_TIERS = [
    { max: 2, price: 3000 },
    { max: 500, price: 2000 },
    { max: 999999, price: 1900 }
];

// Giá in mặc định cho khổ lớn (>48cm)
const DEFAULT_LARGE_FORMAT_PRINT_TIERS = [
    { max: 2, price: 5000 },
    { max: 100, price: 3500 },
    { max: 500, price: 3000 },
    { max: 999999, price: 2800 }
];

// Khởi tạo cấu trúc giá in theo khổ giấy - đồng bộ với printSizes
function initPrintPricingBySize() {
    let hasChanges = false;

    if (!PAPER_SETTINGS.printPricingBySize) {
        PAPER_SETTINGS.printPricingBySize = {};
        hasChanges = true;
    }

    // Đồng bộ với các khổ giấy thực tế từ printSizes
    if (PAPER_SETTINGS.printSizes && PAPER_SETTINGS.printSizes.length > 0) {
        // 🧹 XÓA các khổ không có trong printSizes thực tế
        const validSizeKeys = PAPER_SETTINGS.printSizes.map(s => `${s.w}x${s.h}`);
        Object.keys(PAPER_SETTINGS.printPricingBySize).forEach(key => {
            if (!validSizeKeys.includes(key)) {
                console.log(`🗑️ Xóa khổ giá in không hợp lệ: ${key}`);
                delete PAPER_SETTINGS.printPricingBySize[key];
                hasChanges = true;
            }
        });

        // Thêm các khổ mới nếu chưa có
        PAPER_SETTINGS.printSizes.forEach(size => {
            const sizeKey = `${size.w}x${size.h}`;
            const isLargeFormat = size.w > 480 || size.h > 480;

            if (!PAPER_SETTINGS.printPricingBySize[sizeKey]) {
                PAPER_SETTINGS.printPricingBySize[sizeKey] = {
                    sizeInfo: {
                        id: sizeKey,
                        name: `Khổ ${size.w}×${size.h}${isLargeFormat ? ' (Lớn)' : ''} mm`,
                        width: size.w,
                        height: size.h,
                        isLargeFormat: isLargeFormat,
                        printSizeId: size.id
                    },
                    oneSide: {
                        name: 'In 1 mặt',
                        tiers: isLargeFormat ?
                            JSON.parse(JSON.stringify(DEFAULT_LARGE_FORMAT_PRINT_TIERS)) :
                            JSON.parse(JSON.stringify(DEFAULT_PRINT_TIERS))
                    }
                };
                hasChanges = true;
            }
        });
    } else if (Object.keys(PAPER_SETTINGS.printPricingBySize).length === 0) {
        // Fallback: nếu chưa có printSizes và chưa có pricing, tạo khổ mặc định A3
        const defaultSize = { id: 'A3', name: 'Khổ A3 (325×430 mm)', width: 325, height: 430 };
        PAPER_SETTINGS.printPricingBySize[defaultSize.id] = {
            sizeInfo: defaultSize,
            oneSide: {
                name: 'In 1 mặt',
                tiers: JSON.parse(JSON.stringify(DEFAULT_PRINT_TIERS))
            }
        };
        hasChanges = true;
    }

    // Chỉ save khi có thay đổi thực sự
    if (hasChanges) {
        savePaperSettings();
    }
}

// Render toàn bộ giao diện giá in theo nhiều khổ
function renderPrintPricingSettings() {
    const container = document.getElementById('printPricingContainer');
    if (!container) return;

    // Khởi tạo cấu trúc mới nếu chưa có
    initPrintPricingBySize();

    // Tạo tabs cho từng khổ giấy
    const sizeIds = Object.keys(PAPER_SETTINGS.printPricingBySize);

    // Lấy tab đang active hoặc mặc định là khổ đầu tiên
    let activeTab = container.getAttribute('data-active-tab') || sizeIds[0];
    if (!PAPER_SETTINGS.printPricingBySize[activeTab]) {
        activeTab = sizeIds[0];
    }

    let html = `
        <div class="print-pricing-multi">
            <!-- Tabs cho khổ giấy -->
            <div class="print-size-tabs">
                ${sizeIds.map(sizeId => {
        const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
        const isActive = sizeId === activeTab;
        const isLarge = sizeData.sizeInfo?.isLargeFormat;
        return `
                        <button class="print-size-tab ${isActive ? 'active' : ''} ${isLarge ? 'large-format' : ''}" 
                            data-size-id="${sizeId}"
                            onclick="switchPrintSizeTab('${sizeId}')">
                            ${isLarge ? '📐 ' : ''}${sizeData.sizeInfo?.name || sizeId}
                        </button>
                    `;
    }).join('')}
            </div>
            
            <!-- Nội dung tab -->
            ${sizeIds.map(sizeId => {
        const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
        const isActive = sizeId === activeTab;
        const printOneSide = sizeData.oneSide;
        const printTwoSide = sizeData.twoSide || { name: 'In 2 mặt', tiers: [] };
        const isLarge = sizeData.sizeInfo?.isLargeFormat;

        return `
                    <div class="print-size-content ${isActive ? 'active' : ''}" data-size="${sizeId}">
                        <div class="print-pricing-block ${isLarge ? 'large-format-block' : ''}">
                            <!-- Size Info Header -->
                            <div class="size-info-header">
                                <span class="size-dimensions">
                                    ${sizeData.sizeInfo?.width || '?'} × ${sizeData.sizeInfo?.height || '?'} mm
                                    ${isLarge ? '<span class="large-format-badge">Khổ Lớn</span>' : ''}
                                </span>
                            </div>
                            
                            <!-- ===== IN 1 MẶT ===== -->
                            <div class="print-pricing-header">
                                <div class="print-info">
                                    <span class="print-icon">🖨️</span>
                                    <span class="print-name-disabled">${printOneSide?.name || 'In 1 mặt'}</span>
                                    <span class="auto-badge">đ/tờ</span>
                                </div>
                            </div>

                            <!-- Tiers In 1 mặt -->
                            <div class="print-tiers-container">
                                ${(printOneSide?.tiers || []).map((tier, tierIdx) => {
            const tiers = printOneSide?.tiers || [];
            const minQty = tierIdx === 0 ? 1 : (tiers[tierIdx - 1].max + 1);
            const isLastTier = tier.max === 999999;
            const isFirstTier = tierIdx === 0;
            return `
                                        <div class="tier-row">
                                            <input type="number" 
                                                class="tier-min-input" 
                                                value="${minQty}" 
                                                ${isFirstTier ? 'readonly' : ''}
                                                placeholder="Min" 
                                                onblur="updatePrintTierMin('${sizeId}', ${tierIdx}, this.value)"
                                                onchange="updatePrintTierMin('${sizeId}', ${tierIdx}, this.value)">
                                            <span class="tier-separator">-</span>
                                            <input type="number" 
                                                class="tier-max-input ${isLastTier ? 'tier-infinity' : ''}" 
                                                value="${isLastTier ? '' : tier.max}" 
                                                placeholder="${isLastTier ? '∞' : 'Max'}"
                                                ${isLastTier ? 'readonly' : ''}
                                                onblur="updatePrintTierMax('${sizeId}', ${tierIdx}, this.value)"
                                                onchange="updatePrintTierMax('${sizeId}', ${tierIdx}, this.value)">
                                            <span class="tier-separator">×</span>
                                            <input type="number" 
                                                class="tier-price-input"
                                                value="${tier.price}" 
                                                placeholder="Giá" 
                                                min="0"
                                                step="1"
                                                onblur="updatePrintTierPrice('${sizeId}', ${tierIdx}, this.value)"
                                                onchange="updatePrintTierPrice('${sizeId}', ${tierIdx}, this.value)">
                                            <span class="tier-unit">đ/tờ</span>
                                            ${tiers.length > 1 ? `
                                                <button type="button" 
                                                    class="btn-tier-del" 
                                                    onclick="deletePrintTierBySize('${sizeId}', ${tierIdx})" 
                                                    title="Xóa mốc">×</button>
                                            ` : '<span class="tier-placeholder"></span>'}
                                        </div>
                                    `;
        }).join('')}
                                <button class="btn-add-tier-full" onclick="addPrintTierBySize('${sizeId}')">+ Thêm mốc</button>
                            </div>

                            <!-- ===== IN 2 MẶT ===== -->
                            <div class="print-pricing-header print-2side-header">
                                <div class="print-info">
                                    <span class="print-icon">📄</span>
                                    <span class="print-name-disabled">In 2 mặt</span>
                                    <span class="auto-badge two-side">đ/tờ</span>
                                </div>
                            </div>

                            <!-- Tiers In 2 mặt -->
                            <div class="print-tiers-container">
                                ${(() => {
                // Đảm bảo có tiers hợp lệ
                const twoSideTiers = printTwoSide?.tiers?.length > 0 ? printTwoSide.tiers : [{ max: 999999, price: 0 }];
                return twoSideTiers.map((tier, tierIdx) => {
                    const minQty = tierIdx === 0 ? 1 : (twoSideTiers[tierIdx - 1]?.max + 1 || 1);
                    const isLastTier = tier.max === 999999;
                    const isFirstTier = tierIdx === 0;
                    return `
                                        <div class="tier-row tier-2side">
                                            <input type="number" 
                                                class="tier-min-input" 
                                                value="${minQty}" 
                                                ${isFirstTier ? 'readonly' : ''}
                                                placeholder="Min" 
                                                onblur="updatePrint2SideTierMin('${sizeId}', ${tierIdx}, this.value)"
                                                onchange="updatePrint2SideTierMin('${sizeId}', ${tierIdx}, this.value)">
                                            <span class="tier-separator">-</span>
                                            <input type="number" 
                                                class="tier-max-input ${isLastTier ? 'tier-infinity' : ''}" 
                                                value="${isLastTier ? '' : tier.max}" 
                                                placeholder="${isLastTier ? '∞' : 'Max'}"
                                                ${isLastTier ? 'readonly' : ''}
                                                onblur="updatePrint2SideTierMax('${sizeId}', ${tierIdx}, this.value)"
                                                onchange="updatePrint2SideTierMax('${sizeId}', ${tierIdx}, this.value)">
                                            <span class="tier-separator">×</span>
                                            <input type="number" 
                                                class="tier-price-input"
                                                value="${tier.price}" 
                                                placeholder="Giá" 
                                                min="0"
                                                step="1"
                                                onblur="updatePrint2SideTierPrice('${sizeId}', ${tierIdx}, this.value)"
                                                onchange="updatePrint2SideTierPrice('${sizeId}', ${tierIdx}, this.value)">
                                            <span class="tier-unit">đ/tờ</span>
                                            ${twoSideTiers.length > 1 ? `
                                                <button type="button" 
                                                    class="btn-tier-del" 
                                                    onclick="deletePrint2SideTierBySize('${sizeId}', ${tierIdx})" 
                                                    title="Xóa mốc">×</button>
                                            ` : '<span class="tier-placeholder"></span>'}
                                        </div>
                                    `;
                }).join('');
            })()}
                                <button class="btn-add-tier-full btn-2side" onclick="addPrint2SideTierBySize('${sizeId}')">+ Thêm mốc</button>
                            </div>

                            <!-- Hint -->
                            <div class="print-hint">
                                💡 <strong>Lưu ý:</strong> Nếu giá in 2 mặt = 0 thì sẽ tự động tính theo công thức: số tờ 2 mặt × 2 = số tờ 1 mặt tương đương
                            </div>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    container.innerHTML = html;
}

// Chuyển tab khổ giấy
function switchPrintSizeTab(sizeId) {
    const container = document.getElementById('printPricingContainer');
    if (!container) return;

    container.setAttribute('data-active-tab', sizeId);

    // Cập nhật active tabs - dùng data-size-id để match chính xác
    container.querySelectorAll('.print-size-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.sizeId === sizeId) {
            tab.classList.add('active');
        }
    });

    // Cập nhật active content
    container.querySelectorAll('.print-size-content').forEach(content => {
        content.classList.remove('active');
        if (content.dataset.size === sizeId) {
            content.classList.add('active');
        }
    });
}

// Thêm khổ giấy mới
function addNewPrintSize() {
    const sizeId = prompt('Nhập ID khổ giấy mới (ví dụ: 40x60):');
    if (!sizeId || sizeId.trim() === '') return;

    const cleanId = sizeId.trim();

    if (PAPER_SETTINGS.printPricingBySize[cleanId]) {
        showToast('⚠️ Khổ giấy này đã tồn tại!', 'warning');
        return;
    }

    // Parse kích thước từ ID (format: WxH)
    const parts = cleanId.toLowerCase().replace('x', '×').split('×');
    let width = 0, height = 0;
    if (parts.length === 2) {
        width = parseInt(parts[0]) * 10; // input → mm
        height = parseInt(parts[1]) * 10;
    }

    // Kiểm tra có phải khổ lớn không (>48cm)
    const isLargeFormat = width > 480 || height > 480;

    PAPER_SETTINGS.printPricingBySize[cleanId] = {
        sizeInfo: {
            id: cleanId,
            name: `Khổ ${cleanId.replace('x', '×')}${isLargeFormat ? ' (Lớn)' : ''}`,
            width: width || 0,
            height: height || 0,
            isLargeFormat: isLargeFormat
        },
        oneSide: {
            name: 'In 1 mặt',
            tiers: isLargeFormat ?
                JSON.parse(JSON.stringify(DEFAULT_LARGE_FORMAT_PRINT_TIERS)) :
                JSON.parse(JSON.stringify(DEFAULT_PRINT_TIERS))
        }
    };

    savePaperSettings();
    renderPrintPricingSettings();
    switchPrintSizeTab(cleanId);
    showToast(`✅ Đã thêm khổ ${cleanId}`);
}

// Xóa khổ giấy
function deletePrintSize(sizeId) {
    if (!confirm(`🗑️ Xóa khổ ${sizeId}? Thao tác này không thể hoàn tác.`)) return;

    delete PAPER_SETTINGS.printPricingBySize[sizeId];
    savePaperSettings();
    renderPrintPricingSettings();
    showToast(`🗑️ Đã xóa khổ ${sizeId}`);
}

// Cập nhật min của tier
function updatePrintTierMin(sizeId, tierIdx, value) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData || !sizeData.oneSide?.tiers?.[tierIdx]) return;

    const tiers = sizeData.oneSide.tiers;
    const minValue = parseInt(value) || 1;

    // Không cho phép sửa tier đầu tiên (min luôn = 1)
    if (tierIdx === 0) {
        renderPrintPricingSettings();
        return;
    }

    // Cập nhật max của tier trước đó
    const prevTier = tiers[tierIdx - 1];
    if (prevTier && prevTier.max !== 999999) {
        prevTier.max = minValue - 1;
        if (prevTier.max < 1) prevTier.max = 1;
    }

    savePaperSettings();
    renderPrintPricingSettings();
}

// Cập nhật max của tier
function updatePrintTierMax(sizeId, tierIdx, value) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData || !sizeData.oneSide?.tiers?.[tierIdx]) return;

    const tiers = sizeData.oneSide.tiers;
    const tier = tiers[tierIdx];

    // Không cho phép sửa tier cuối cùng (max luôn = 999999)
    if (tier.max === 999999) {
        renderPrintPricingSettings();
        return;
    }

    const maxValue = value === '' ? 999999 : parseInt(value);
    if (isNaN(maxValue) || maxValue < 1) {
        renderPrintPricingSettings();
        return;
    }

    tier.max = maxValue;

    // Đảm bảo max >= min
    const minQty = tierIdx === 0 ? 1 : (tiers[tierIdx - 1].max + 1);
    if (tier.max < minQty) {
        tier.max = minQty;
    }

    savePaperSettings();
    renderPrintPricingSettings();
}

// Cập nhật giá của tier
function updatePrintTierPrice(sizeId, tierIdx, value) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData || !sizeData.oneSide?.tiers?.[tierIdx]) return;

    const priceValue = parseInt(value) || 0;
    if (priceValue < 0) {
        renderPrintPricingSettings();
        return;
    }

    sizeData.oneSide.tiers[tierIdx].price = priceValue;
    savePaperSettings();
}

// Thêm mốc mới
function addPrintTierBySize(sizeId) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData || !sizeData.oneSide?.tiers?.length) return;

    const tiers = sizeData.oneSide.tiers;
    const lastTier = tiers[tiers.length - 1];
    const newMax = lastTier.max === 999999 ? 1000 : lastTier.max + 500;

    // Chèn tier mới trước tier cuối cùng
    tiers.splice(tiers.length - 1, 0, {
        max: newMax,
        price: lastTier.price
    });

    savePaperSettings();
    renderPrintPricingSettings();
    showToast('✅ Đã thêm mốc mới');
}

// Xóa mốc
function deletePrintTierBySize(sizeId, tierIdx) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData || !sizeData.oneSide?.tiers || sizeData.oneSide.tiers.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 mốc!');
        return;
    }

    if (!confirm('🗑️ Xóa mốc này?')) return;

    const tiers = sizeData.oneSide.tiers;
    const deletedTier = tiers[tierIdx];
    const isLastTier = deletedTier.max === 999999;

    tiers.splice(tierIdx, 1);

    // Nếu xóa tier cuối cùng (∞), chuyển tier trước đó thành ∞
    if (isLastTier && tiers.length > 0) {
        const newLastTier = tiers[tiers.length - 1];
        newLastTier.max = 999999;
    }

    savePaperSettings();
    renderPrintPricingSettings();
    showToast('🗑️ Đã xóa mốc');
}

// Lấy giá in theo khổ giấy và số lượng
function getPrintPriceBySize(sizeId, quantity, isDoubleSided = false) {
    const sizeData = PAPER_SETTINGS.printPricingBySize?.[sizeId];

    // Fallback to old system if new structure doesn't exist
    if (!sizeData) {
        // Tìm trong printOptions cũ
        const printOneSide = PAPER_SETTINGS.printOptions?.find(p => p.id === 1);
        if (printOneSide?.tiers) {
            const effectiveQty = isDoubleSided ? quantity * 2 : quantity;
            for (const tier of printOneSide.tiers) {
                if (effectiveQty <= tier.max) {
                    return tier.price;
                }
            }
        }
        return 2000; // Default price
    }

    const tiers = sizeData.oneSide?.tiers || [];
    const effectiveQty = isDoubleSided ? quantity * 2 : quantity;

    for (const tier of tiers) {
        if (effectiveQty <= tier.max) {
            return tier.price;
        }
    }

    // Nếu không tìm thấy, trả về giá của tier cuối cùng
    return tiers.length > 0 ? tiers[tiers.length - 1].price : 2000;
}

// ===== HÀM XỬ LÝ IN 2 MẶT =====

// Khởi tạo twoSide nếu chưa có (không save ngay - để gọi savePaperSettings sau)
function ensureTwoSideExists(sizeId, autoSave = false) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData) return null;

    if (!sizeData.twoSide) {
        sizeData.twoSide = {
            name: 'In 2 mặt',
            tiers: [{ max: 999999, price: 0 }]
        };
        // Chỉ save khi được yêu cầu cụ thể
        if (autoSave) {
            savePaperSettings();
        }
    }
    return sizeData.twoSide;
}

// Cập nhật min của tier In 2 mặt
function updatePrint2SideTierMin(sizeId, tierIdx, value) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData) return;

    const twoSide = ensureTwoSideExists(sizeId);
    if (!twoSide?.tiers?.[tierIdx]) return;

    const tiers = twoSide.tiers;
    const minValue = parseInt(value) || 1;

    if (tierIdx === 0) {
        renderPrintPricingSettings();
        return;
    }

    const prevTier = tiers[tierIdx - 1];
    if (prevTier && prevTier.max !== 999999) {
        prevTier.max = minValue - 1;
        if (prevTier.max < 1) prevTier.max = 1;
    }

    savePaperSettings();
    renderPrintPricingSettings();
}

// Cập nhật max của tier In 2 mặt
function updatePrint2SideTierMax(sizeId, tierIdx, value) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData) return;

    const twoSide = ensureTwoSideExists(sizeId);
    if (!twoSide?.tiers?.[tierIdx]) return;

    const tier = twoSide.tiers[tierIdx];

    if (tier.max === 999999) {
        renderPrintPricingSettings();
        return;
    }

    const maxValue = value === '' ? 999999 : parseInt(value);
    if (isNaN(maxValue) || maxValue < 1) {
        renderPrintPricingSettings();
        return;
    }

    tier.max = maxValue;

    const minQty = tierIdx === 0 ? 1 : (twoSide.tiers[tierIdx - 1].max + 1);
    if (tier.max < minQty) {
        tier.max = minQty;
    }

    savePaperSettings();
    renderPrintPricingSettings();
}

// Cập nhật giá của tier In 2 mặt
function updatePrint2SideTierPrice(sizeId, tierIdx, value) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData) return;

    const twoSide = ensureTwoSideExists(sizeId);
    if (!twoSide?.tiers?.[tierIdx]) return;

    const priceValue = parseInt(value) || 0;
    if (priceValue < 0) {
        renderPrintPricingSettings();
        return;
    }

    twoSide.tiers[tierIdx].price = priceValue;
    savePaperSettings();
}

// Thêm mốc In 2 mặt
function addPrint2SideTierBySize(sizeId) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData) return;

    const twoSide = ensureTwoSideExists(sizeId);
    if (!twoSide?.tiers?.length) return;

    const tiers = twoSide.tiers;
    const lastTier = tiers[tiers.length - 1];
    const newMax = lastTier.max === 999999 ? 1000 : lastTier.max + 500;

    tiers.splice(tiers.length - 1, 0, {
        max: newMax,
        price: lastTier.price
    });

    savePaperSettings();
    renderPrintPricingSettings();
    showToast('✅ Đã thêm mốc In 2 mặt');
}

// Xóa mốc In 2 mặt
function deletePrint2SideTierBySize(sizeId, tierIdx) {
    const sizeData = PAPER_SETTINGS.printPricingBySize[sizeId];
    if (!sizeData?.twoSide?.tiers || sizeData.twoSide.tiers.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 mốc!');
        return;
    }

    if (!confirm('🗑️ Xóa mốc này?')) return;

    const tiers = sizeData.twoSide.tiers;
    const deletedTier = tiers[tierIdx];
    const isLastTier = deletedTier.max === 999999;

    tiers.splice(tierIdx, 1);

    if (isLastTier && tiers.length > 0) {
        const newLastTier = tiers[tiers.length - 1];
        newLastTier.max = 999999;
    }

    savePaperSettings();
    renderPrintPricingSettings();
    showToast('🗑️ Đã xóa mốc');
}

// Lấy giá In 2 mặt theo khổ giấy và số lượng
function get2SidePrintPriceBySize(sizeId, quantity) {
    const sizeData = PAPER_SETTINGS.printPricingBySize?.[sizeId];

    if (!sizeData?.twoSide?.tiers?.length) {
        // Fallback: tính theo công thức 2 mặt = 2 × 1 mặt
        return getPrintPriceBySize(sizeId, quantity * 2, false);
    }

    // Kiểm tra nếu giá = 0 thì dùng công thức mặc định
    const tiers = sizeData.twoSide.tiers;
    for (const tier of tiers) {
        if (quantity <= tier.max) {
            if (tier.price === 0) {
                // Giá = 0 → dùng công thức: tờ 2 mặt × 2 = tờ 1 mặt
                return getPrintPriceBySize(sizeId, quantity * 2, false);
            }
            return tier.price;
        }
    }

    return tiers.length > 0 ? tiers[tiers.length - 1].price : 2000;
}

// Backward compatible functions
function updatePrintTierMin_old(id, tierIdx, value) {
    updatePrintTierMin('A3', tierIdx, value);
}

function updatePrintTierMax_old(id, tierIdx, value) {
    updatePrintTierMax('A3', tierIdx, value);
}

function updatePrintTier(id, tierIdx, field, value) {
    if (field === 'price') {
        updatePrintTierPrice('A3', tierIdx, value);
    }
}

function addPrintTier(id) {
    addPrintTierBySize('A3');
}

function deletePrintTier(id, tierIdx) {
    deletePrintTierBySize('A3', tierIdx);
}

