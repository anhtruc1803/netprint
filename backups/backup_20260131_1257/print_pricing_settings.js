// ===== PRINT PRICING SETTINGS - CLEAN REBUILD =====

// Render toàn bộ giao diện giá in
function renderPrintPricingSettings() {
    const container = document.getElementById('printPricingContainer');
    if (!container) return;

    // Lấy "In 1 mặt" từ printOptions
    let printOneSide = PAPER_SETTINGS.printOptions.find(p => p.id === 1);

    // Tự động khởi tạo nếu chưa có
    if (!printOneSide) {
        printOneSide = {
            id: 1,
            name: 'In 1 mặt',
            tiers: [
                { max: 500, price: 2000 },
                { max: 999999, price: 1800 }
            ]
        };
        PAPER_SETTINGS.printOptions.push(printOneSide);
        savePaperSettings();
    }

    // Đảm bảo có tiers
    if (!printOneSide.tiers || printOneSide.tiers.length === 0) {
        printOneSide.tiers = [
            { max: 500, price: 2000 },
            { max: 999999, price: 1800 }
        ];
        savePaperSettings();
    }

    let html = `
        <div class="print-pricing-block">
            <!-- Header -->
            <div class="print-pricing-header">
                <div class="print-info">
                    <span class="print-icon">🖨️</span>
                    <input type="text" value="${printOneSide.name}" 
                        disabled 
                        class="print-name-disabled"
                        title="Tên này được cố định">
                    <span class="auto-badge">Tự động</span>
                </div>
            </div>

            <!-- Tiers -->
            <div class="print-tiers-container">
                ${printOneSide.tiers.map((tier, tierIdx) => {
                    const minQty = tierIdx === 0 ? 1 : (printOneSide.tiers[tierIdx - 1].max + 1);
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
                                onfocus="event.stopPropagation()"
                                onblur="updatePrintTierMin(1, ${tierIdx}, this.value)"
                                onchange="updatePrintTierMin(1, ${tierIdx}, this.value)">
                            <span class="tier-separator">-</span>
                            <input type="number" 
                                class="tier-max-input ${isLastTier ? 'tier-infinity' : ''}" 
                                value="${isLastTier ? '' : tier.max}" 
                                placeholder="${isLastTier ? '∞' : 'Max'}"
                                ${isLastTier ? 'readonly' : ''}
                                onclick="event.stopPropagation()"
                                onfocus="event.stopPropagation()"
                                onblur="updatePrintTierMax(1, ${tierIdx}, this.value)"
                                onchange="updatePrintTierMax(1, ${tierIdx}, this.value)">
                            <span class="tier-separator">×</span>
                            <input type="number" 
                                class="tier-price-input"
                                value="${tier.price}" 
                                placeholder="Giá" 
                                min="0"
                                step="1"
                                onclick="event.stopPropagation()"
                                onfocus="event.stopPropagation()"
                                onblur="updatePrintTier(1, ${tierIdx}, 'price', this.value)"
                                onchange="updatePrintTier(1, ${tierIdx}, 'price', this.value)">
                            <span class="tier-unit">đ/tờ</span>
                            ${printOneSide.tiers.length > 1 ? `
                                <button type="button" 
                                    class="btn-tier-del" 
                                    onclick="event.stopPropagation(); deletePrintTier(1, ${tierIdx})" 
                                    title="Xóa mốc">×</button>
                            ` : '<span class="tier-placeholder"></span>'}
                        </div>
                    `;
                }).join('')}
                <button class="btn-add-tier-full" onclick="addPrintTier(1)">+ Thêm mốc</button>
            </div>

            <!-- Hint -->
            <div class="print-hint">
                💡 <strong>Lưu ý:</strong> Giá in 2 mặt tính theo quy chuẩn: tìm mốc giá theo số tờ 1 mặt tương đương (ví dụ: 300 tờ 2 mặt = 600 tờ 1 mặt)
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Cập nhật min của tier
function updatePrintTierMin(id, tierIdx, value) {
    const item = PAPER_SETTINGS.printOptions.find(p => p.id === id);
    if (!item || !item.tiers || !item.tiers[tierIdx]) return;

    const tier = item.tiers[tierIdx];
    const minValue = parseInt(value) || 1;

    // Không cho phép sửa tier đầu tiên (min luôn = 1)
    if (tierIdx === 0) {
        renderPrintPricingSettings();
        return;
    }

    // Cập nhật max của tier trước đó
    const prevTier = item.tiers[tierIdx - 1];
    if (prevTier && prevTier.max !== 999999) {
        prevTier.max = minValue - 1;
        if (prevTier.max < 1) prevTier.max = 1;
    }

    renderPrintPricingSettings();
    savePaperSettings();
    populatePaperDropdowns();
}

// Cập nhật max của tier
function updatePrintTierMax(id, tierIdx, value) {
    const item = PAPER_SETTINGS.printOptions.find(p => p.id === id);
    if (!item || !item.tiers || !item.tiers[tierIdx]) return;

    const tier = item.tiers[tierIdx];
    
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

    // Cập nhật min của tier tiếp theo
    if (tierIdx < item.tiers.length - 1) {
        const nextTier = item.tiers[tierIdx + 1];
        // Không cần sửa vì min sẽ được tính tự động khi render
    }

    // Đảm bảo max >= min
    const minQty = tierIdx === 0 ? 1 : (item.tiers[tierIdx - 1].max + 1);
    if (tier.max < minQty) {
        tier.max = minQty;
    }

    renderPrintPricingSettings();
    savePaperSettings();
    populatePaperDropdowns();
}

// Cập nhật giá của tier
function updatePrintTier(id, tierIdx, field, value) {
    const item = PAPER_SETTINGS.printOptions.find(p => p.id === id);
    if (!item || !item.tiers || !item.tiers[tierIdx]) return;

    if (field === 'price') {
        const priceValue = parseInt(value) || 0;
        if (priceValue < 0) {
            renderPrintPricingSettings();
            return;
        }
        item.tiers[tierIdx].price = priceValue;
    }

    savePaperSettings();
    populatePaperDropdowns();
}

// Thêm mốc mới
function addPrintTier(id) {
    const item = PAPER_SETTINGS.printOptions.find(p => p.id === id);
    if (!item || !item.tiers || item.tiers.length === 0) return;

    const lastTier = item.tiers[item.tiers.length - 1];
    const newMax = lastTier.max === 999999 ? 1000 : lastTier.max + 500;
    
    // Chèn tier mới trước tier cuối cùng
    item.tiers.splice(item.tiers.length - 1, 0, {
        max: newMax,
        price: lastTier.price
    });

    renderPrintPricingSettings();
    savePaperSettings();
    populatePaperDropdowns();
    showToast('✅ Đã thêm mốc mới');
}

// Xóa mốc
function deletePrintTier(id, tierIdx) {
    const item = PAPER_SETTINGS.printOptions.find(p => p.id === id);
    if (!item || !item.tiers || item.tiers.length <= 1) {
        alert('⚠️ Phải có ít nhất 1 mốc!');
        return;
    }

    if (!confirm('🗑️ Xóa mốc này?')) return;

    const deletedTier = item.tiers[tierIdx];
    const isLastTier = deletedTier.max === 999999;

    item.tiers.splice(tierIdx, 1);

    // Nếu xóa tier cuối cùng (∞), chuyển tier trước đó thành ∞
    if (isLastTier && item.tiers.length > 0) {
        const newLastTier = item.tiers[item.tiers.length - 1];
        newLastTier.max = 999999;
    }

    renderPrintPricingSettings();
    savePaperSettings();
    populatePaperDropdowns();
    showToast('🗑️ Đã xóa mốc');
}
