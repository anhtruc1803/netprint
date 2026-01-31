// ===== LAMINATION HELPER FUNCTIONS - CẤU TRÚC MỚI =====

/**
 * Lấy danh sách loại cán màng theo printSizeId
 * Trả về array với format: { id, name, tiers }
 */
function getLaminationsBySize(printSizeId) {
    if (!PAPER_SETTINGS.laminationPricing || PAPER_SETTINGS.laminationPricing.length === 0) {
        return [];
    }

    const pricing = PAPER_SETTINGS.laminationPricing.find(p => p.printSizeId === parseInt(printSizeId));
    if (!pricing || !pricing.laminations) return [];

    return pricing.laminations.map(lam => ({
        id: lam.id,
        name: lam.name,
        tiers: lam.tiers || []
    }));
}

/**
 * Lấy thông tin loại cán màng theo ID (tìm trong tất cả các khổ giấy)
 * Trả về: { id, name, tiers, printSizeId }
 */
function getLaminationById(lamId) {
    if (!PAPER_SETTINGS.laminationPricing || PAPER_SETTINGS.laminationPricing.length === 0) {
        return null;
    }

    for (const pricing of PAPER_SETTINGS.laminationPricing) {
        const lam = pricing.laminations.find(l => l.id === lamId);
        if (lam) {
            return {
                id: lam.id,
                name: lam.name,
                tiers: lam.tiers || [],
                printSizeId: pricing.printSizeId
            };
        }
    }
    return null;
}

/**
 * Lấy thông tin loại cán màng theo printSizeId và lamId
 * Trả về: { id, name, tiers }
 */
function getLaminationBySizeAndId(printSizeId, lamId) {
    const laminations = getLaminationsBySize(printSizeId);
    return laminations.find(l => l.id === lamId) || null;
}

/**
 * Tính giá cán màng dựa trên printSizeId, lamId, số lượng tờ, và kích thước tờ
 * @param {number} printSizeId - ID của khổ giấy
 * @param {number} lamId - ID của loại cán màng
 * @param {number} sheets - Số lượng tờ
 * @param {number} sheetW - Chiều rộng tờ (mm)
 * @param {number} sheetH - Chiều cao tờ (mm)
 * @returns {number} - Tổng chi phí cán màng
 */
function calculateLaminationCost(printSizeId, lamId, sheets, sheetW, sheetH) {
    const lam = getLaminationBySizeAndId(printSizeId, lamId);

    if (!lam || !lam.tiers || lam.tiers.length === 0) {
        return 0;
    }

    // Sắp xếp tiers theo max tăng dần để đảm bảo logic đúng
    const sortedTiers = [...lam.tiers].sort((a, b) => a.max - b.max);
    
    // Tìm tier phù hợp dựa trên số lượng tờ
    // Logic: Tìm tier đầu tiên mà sheets <= tier.max
    let selectedTier = null;
    for (const tier of sortedTiers) {
        if (sheets <= tier.max) {
            selectedTier = tier;
            break;
        }
    }

    // Fallback: tier cuối cùng (có max lớn nhất)
    if (!selectedTier) {
        selectedTier = sortedTiers[sortedTiers.length - 1];
    }

    // Tính giá dựa trên đơn vị
    // LƯU Ý: Giá đã được nhập sẵn cho từng loại (1 mặt hoặc 2 mặt)
    // Ví dụ: "Cán bóng 1 mặt" có giá khác "Cán bóng 2 mặt"
    // KHÔNG cần nhân thêm sideMultiplier vì đã tách riêng từng loại
    let totalCost = 0;
    switch (selectedTier.unit) {
        case 'per_sheet':
            // Giá theo tờ: số tờ × đơn giá
            totalCost = sheets * selectedTier.price;
            break;

        case 'per_lot':
            // Giá theo lô (giá cố định): không nhân với số tờ
            totalCost = selectedTier.price;
            break;

        case 'per_m2':
            // Giá theo m²: diện tích khổ giấy × số lượng × đơn giá m²
            const sheetAreaM2 = (sheetW * sheetH) / 1000000; // mm² → m²
            totalCost = sheetAreaM2 * sheets * selectedTier.price;
            break;

        default:
            totalCost = 0;
    }

    return Math.round(totalCost);
}

/**
 * Lấy giá cán màng cho 1 tờ (dùng để hiển thị)
 * @returns {string} - Mô tả giá (ví dụ: "600 đ/tờ", "2500 đ/m²")
 */
function getLaminationPriceDisplay(printSizeId, lamId, sheets) {
    const lam = getLaminationBySizeAndId(printSizeId, lamId);

    if (!lam || !lam.tiers || lam.tiers.length === 0) {
        return '0 đ';
    }

    // Tìm tier phù hợp
    let selectedTier = null;
    for (const tier of lam.tiers) {
        if (sheets <= tier.max) {
            selectedTier = tier;
            break;
        }
    }

    if (!selectedTier) {
        selectedTier = lam.tiers[lam.tiers.length - 1];
    }

    // Format giá theo đơn vị
    const priceFormatted = selectedTier.price.toLocaleString('vi-VN');
    switch (selectedTier.unit) {
        case 'per_sheet':
            return `${priceFormatted} đ/tờ`;
        case 'per_lot':
            return `${priceFormatted} đ/lô`;
        case 'per_m2':
            return `${priceFormatted} đ/m²`;
        default:
            return `${priceFormatted} đ`;
    }
}

/**
 * Lấy tất cả loại cán màng (flatten từ tất cả khổ giấy)
 * Trả về array với format: { id, name, printSizeId, sizeName, tiers }
 */
function getAllLaminations() {
    const allLaminations = [];

    if (!PAPER_SETTINGS.laminationPricing || PAPER_SETTINGS.laminationPricing.length === 0) {
        return allLaminations;
    }

    PAPER_SETTINGS.laminationPricing.forEach(pricing => {
        const size = PAPER_SETTINGS.printSizes.find(s => s.id === pricing.printSizeId);
        if (!size) return;

        pricing.laminations.forEach(lam => {
            allLaminations.push({
                id: lam.id,
                name: lam.name,
                printSizeId: size.id,
                sizeName: size.name,
                tiers: lam.tiers || []
            });
        });
    });

    return allLaminations;
}

/**
 * Helper function: Tìm giá trong tiers dựa trên số lượng
 * (Giống findTierPrice trong code giấy)
 */
function findLaminationTierPrice(tiers, quantity) {
    if (!tiers || tiers.length === 0) return 0;

    for (const tier of tiers) {
        if (quantity <= tier.max) {
            return tier.price;
        }
    }

    // Fallback: tier cuối
    return tiers[tiers.length - 1].price;
}
