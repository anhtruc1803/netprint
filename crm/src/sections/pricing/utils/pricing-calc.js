// ===== NETPRINT - PRICING CALCULATION UTILITIES =====
// Ported from app.js to React-compatible pure functions

/**
 * Tính dàn in - Tìm cách sắp xếp tối ưu nhất cho sản phẩm trên khổ giấy
 * @param {number} prodW - Chiều rộng sản phẩm (mm)
 * @param {number} prodH - Chiều cao sản phẩm (mm)
 * @param {number} stockW - Chiều rộng khổ giấy (mm)
 * @param {number} stockH - Chiều cao khổ giấy (mm)
 * @param {number} bleed - Tràn màu (mm)
 * @param {object|number} margin - Lề (mm) hoặc object {top, bottom, left, right}
 * @param {number} spacing - Khoảng cách SP (mm)
 * @param {boolean} allowRotation - Cho phép xoay SP
 * @returns {{ cols, rows, total, rotated, mixed, rotatedCols?, rotatedRows?, normalCols?, normalRows? }}
 */
export function calculateImposition(prodW, prodH, stockW, stockH, bleed = 0, margin = 5, spacing = 0, allowRotation = true) {
    bleed = bleed || 0;
    spacing = spacing || 0;

    let marginTop, marginBottom, marginLeft, marginRight;
    if (typeof margin === 'object' && margin !== null) {
        marginTop = margin.top || 0;
        marginBottom = margin.bottom || 0;
        marginLeft = margin.left || 0;
        marginRight = margin.right || 0;
    } else {
        marginTop = marginBottom = marginLeft = marginRight = margin || 0;
    }

    const itemW = prodW + (bleed * 2);
    const itemH = prodH + (bleed * 2);

    const printableW = Math.max(0, stockW - marginLeft - marginRight);
    const printableH = Math.max(0, stockH - marginTop - marginBottom);

    if (itemW <= 0 || itemH <= 0 || printableW <= 0 || printableH <= 0) {
        return { cols: 0, rows: 0, total: 0, rotated: false };
    }

    function calculateMaxCount(itemSize, printableSize) {
        if (itemSize <= 0) return 0;
        if (spacing === 0) return Math.ceil(printableSize / itemSize);
        const maxCount = Math.floor((printableSize + spacing) / (itemSize + spacing));
        const actualSize = maxCount * itemSize + (maxCount > 0 ? (maxCount - 1) * spacing : 0);
        if (actualSize > printableSize && maxCount > 0) return maxCount - 1;
        return Math.max(0, maxCount);
    }

    function isValidLayout(cols, rows, useItemW, useItemH) {
        if (cols <= 0 || rows <= 0) return false;
        const actualW = cols * useItemW + (cols > 1 ? (cols - 1) * spacing : 0);
        const actualH = rows * useItemH + (rows > 1 ? (rows - 1) * spacing : 0);
        return actualW <= printableW + 2 && actualH <= printableH + 2;
    }

    let bestOption = { cols: 0, rows: 0, total: 0, rotated: false };

    // Cách 1: Không xoay
    const cols1 = calculateMaxCount(itemW, printableW);
    const rows1 = calculateMaxCount(itemH, printableH);
    if (isValidLayout(cols1, rows1, itemW, itemH) && cols1 * rows1 > bestOption.total) {
        bestOption = { cols: cols1, rows: rows1, total: cols1 * rows1, rotated: false };
    }

    // Cách 2: Xoay 90°
    if (allowRotation) {
        const cols2 = calculateMaxCount(itemH, printableW);
        const rows2 = calculateMaxCount(itemW, printableH);
        if (isValidLayout(cols2, rows2, itemH, itemW) && cols2 * rows2 > bestOption.total) {
            bestOption = { cols: cols2, rows: rows2, total: cols2 * rows2, rotated: true };
        }
    }

    // Cách 3: Brute force tất cả tổ hợp
    const maxColsN = calculateMaxCount(itemW, printableW);
    const maxRowsN = calculateMaxCount(itemH, printableH);
    for (let c = 1; c <= maxColsN; c++) {
        for (let r = 1; r <= maxRowsN; r++) {
            if (isValidLayout(c, r, itemW, itemH) && c * r > bestOption.total) {
                bestOption = { cols: c, rows: r, total: c * r, rotated: false };
            }
        }
    }

    if (allowRotation) {
        const maxColsR = calculateMaxCount(itemH, printableW);
        const maxRowsR = calculateMaxCount(itemW, printableH);
        for (let c = 1; c <= maxColsR; c++) {
            for (let r = 1; r <= maxRowsR; r++) {
                if (isValidLayout(c, r, itemH, itemW) && c * r > bestOption.total) {
                    bestOption = { cols: c, rows: r, total: c * r, rotated: true };
                }
            }
        }

        // Cách 4: Dàn hỗn hợp (mix xoay + không xoay)
        for (let rN = 1; rN <= maxRowsN; rN++) {
            for (let cN = 1; cN <= maxColsN; cN++) {
                const nW = cN * itemW + (cN > 1 ? (cN - 1) * spacing : 0);
                const nH = rN * itemH + (rN > 1 ? (rN - 1) * spacing : 0);
                if (nW > printableW || nH > printableH) continue;
                const remainH = printableH - nH - spacing;
                if (remainH < itemW) continue;
                const mColsR = calculateMaxCount(itemH, printableW);
                const mRowsR = calculateMaxCount(itemW, remainH);
                for (let rR = 1; rR <= mRowsR; rR++) {
                    for (let cR = 1; cR <= mColsR; cR++) {
                        const rW2 = cR * itemH + (cR > 1 ? (cR - 1) * spacing : 0);
                        const rH2 = rR * itemW + (rR > 1 ? (rR - 1) * spacing : 0);
                        if (rW2 <= printableW && rH2 <= remainH) {
                            const total = (cN * rN) + (cR * rR);
                            if (total > bestOption.total) {
                                bestOption = { cols: cN, rows: rN, total, rotated: false, mixed: true, rotatedCols: cR, rotatedRows: rR };
                            }
                        }
                    }
                }
            }
        }
    }

    return bestOption;
}

/**
 * Tính số tờ in cần thiết
 */
export function calculateSheetsNeeded(qty, itemsPerSheet) {
    if (itemsPerSheet <= 0) return 0;
    return Math.ceil(qty / itemsPerSheet);
}

/**
 * Tìm giá theo tier (mốc số lượng)
 */
export function findTierPrice(tiers, qty) {
    if (!tiers || tiers.length === 0) return 0;
    const sortedTiers = [...tiers].sort((a, b) => a.max - b.max);
    const tier = sortedTiers.find(t => qty <= t.max);
    return tier ? tier.price : sortedTiers[sortedTiers.length - 1].price;
}

/**
 * Tìm tier phù hợp kèm thông tin min/max
 */
export function findTierWithMin(tiers, qty) {
    if (!tiers || tiers.length === 0) return null;
    const sorted = [...tiers].sort((a, b) => a.max - b.max);
    let prevMax = 0;
    for (const tier of sorted) {
        const min = prevMax + 1;
        if (qty <= tier.max) return { ...tier, min, max: tier.max };
        prevMax = tier.max;
    }
    const last = sorted[sorted.length - 1];
    const min = sorted.length > 1 ? (sorted[sorted.length - 2].max + 1) : 1;
    return { ...last, min, max: last.max };
}

/**
 * Tính giá gia công thành phẩm
 * Hỗ trợ 3 loại: per_lot (lô), per_item (sp), per_sheet (tờ)
 * Trả về object chi tiết { cost, unit, tierPrice, tierMin, tierMax, calcQty }
 */
export function calculateProcessingCost(proc, qty, sheets) {
    const emptyDetail = { cost: 0, unit: '', tierPrice: 0, tierMin: 0, tierMax: 0, calcQty: 0 };
    if (!proc) return emptyDetail;

    // Legacy: fixedTiers
    if ((!proc.tiers || proc.tiers.length === 0) && proc.fixedTiers && proc.fixedTiers.length > 0) {
        const sorted = [...proc.fixedTiers].sort((a, b) => a.max - b.max);
        const ft = sorted.find(t => qty <= t.max) || sorted[sorted.length - 1];
        const cost = ft ? ft.fixed : 0;
        return { cost, unit: 'per_lot', tierPrice: cost, tierMin: 0, tierMax: ft?.max || 0, calcQty: 1 };
    }

    if (!proc.tiers || proc.tiers.length === 0 || !qty || qty <= 0) return emptyDetail;

    const tiersHaveUnit = proc.tiers.some(t => !!t.unit);
    if (proc.unit === 'per_lot' && !tiersHaveUnit && proc.fixedTiers && proc.fixedTiers.length > 0) {
        const sorted = [...proc.fixedTiers].sort((a, b) => a.max - b.max);
        const ft = sorted.find(t => qty <= t.max) || sorted[sorted.length - 1];
        const cost = ft ? ft.fixed : 0;
        return { cost, unit: 'per_lot', tierPrice: cost, tierMin: 0, tierMax: ft?.max || 0, calcQty: 1 };
    }

    const selectedTier = findTierWithMin(proc.tiers, qty);
    if (!selectedTier) return emptyDetail;

    const unit = selectedTier.unit || proc.unit || 'per_item';

    if (unit === 'per_lot') {
        const cost = Math.round(selectedTier.price || 0);
        return { cost, unit, tierPrice: selectedTier.price, tierMin: selectedTier.min, tierMax: selectedTier.max, calcQty: 1 };
    }
    if (unit === 'per_sheet') {
        const cost = sheets > 0 ? Math.round(sheets * (selectedTier.price || 0)) : 0;
        return { cost, unit, tierPrice: selectedTier.price, tierMin: selectedTier.min, tierMax: selectedTier.max, calcQty: sheets };
    }
    // per_item
    const cost = Math.round(qty * (selectedTier.price || 0));
    return { cost, unit, tierPrice: selectedTier.price, tierMin: selectedTier.min, tierMax: selectedTier.max, calcQty: qty };
}

/**
 * Format tiền VND
 */
export function formatMoney(num) {
    return Math.round(num).toLocaleString('vi-VN') + 'đ';
}

/**
 * Format số với dấu phân cách hàng ngàn
 */
export function formatNumber(num) {
    return Math.round(num).toLocaleString('vi-VN');
}

/**
 * Lấy tất cả loại giấy (flatten từ settings)
 */
export function getAllPapers(settings) {
    const papers = [];
    if (!settings.paperPricing || !settings.printSizes) return papers;

    settings.paperPricing.forEach(pricing => {
        const size = settings.printSizes.find(s => s.id === pricing.printSizeId);
        if (!size) return;

        if (pricing.papers) {
            pricing.papers.forEach(paper => {
                papers.push({
                    ...paper,
                    w: size.w,
                    h: size.h,
                    printSizeId: pricing.printSizeId,
                    sizeName: `${size.w}×${size.h}`,
                });
            });
        }
    });

    return papers;
}

/**
 * Tìm giấy theo ID
 */
export function getPaperById(settings, paperId) {
    return getAllPapers(settings).find(p => p.id === paperId) || null;
}

/**
 * Lấy giá giấy theo tier
 */
export function getPaperPrice(settings, paperId, sheets) {
    const paper = getPaperById(settings, paperId);
    if (!paper || !paper.tiers) return 0;
    return findTierPrice(paper.tiers, sheets);
}

/**
 * Lấy giá in theo khổ giấy
 * Mốc giá tính theo "mặt in" (sides), không theo "tờ"
 * In 1 mặt: mặt_in = tờ × 1
 * In 2 mặt: mặt_in = tờ × 2 → tra bảng bằng mặt_in → giá/tờ = giá/mặt × 2
 * @param {object} settings
 * @param {string|number} sizeKeyOrId - sizeKey ("325x430") hoặc printSizeId
 * @param {number} sheets
 * @param {boolean} isTwoSided
 * @returns {number} giá per TỜ (đã nhân số mặt)
 */
export function getPrintPriceBySize(settings, sizeKeyOrId, sheets, isTwoSided = false) {
    const sides = isTwoSided ? 2 : 1;
    const totalSides = sheets * sides;

    const pricingBySize = settings.printPricingBySize;

    // New format: array of { printSizeId, tiers }
    if (Array.isArray(pricingBySize) && pricingBySize.length > 0) {
        // Try to find by printSizeId first
        let sizeData = pricingBySize.find(pp => pp.printSizeId === sizeKeyOrId);

        // If not found by ID, try to find by matching size dimensions from sizeKey
        if (!sizeData && typeof sizeKeyOrId === 'string') {
            const [w, h] = sizeKeyOrId.split('x').map(Number);
            const matchingSize = settings.printSizes?.find(s => s.w === w && s.h === h);
            if (matchingSize) {
                sizeData = pricingBySize.find(pp => pp.printSizeId === matchingSize.id);
            }
        }

        if (sizeData && sizeData.tiers && sizeData.tiers.length > 0) {
            const pricePerSide = findTierPrice(sizeData.tiers, totalSides);
            return pricePerSide * sides;
        }
    }

    // Old format: object keyed by sizeKey
    if (pricingBySize && !Array.isArray(pricingBySize) && pricingBySize[sizeKeyOrId]) {
        const sizeData = pricingBySize[sizeKeyOrId];
        if (isTwoSided) {
            if (sizeData.twoSide?.tiers?.length > 0) {
                return findTierPrice(sizeData.twoSide.tiers, sheets);
            }
            const pricePerSide = findTierPrice(sizeData.oneSide?.tiers || [], totalSides);
            return pricePerSide * sides;
        }
        return findTierPrice(sizeData.oneSide?.tiers || [], totalSides);
    }

    // Fallback: dùng printOptions (id=1 = In 1 mặt)
    const oneSideOption = settings.printOptions?.find(p => p.id === 1);
    const pricePerSide = oneSideOption ? findTierPrice(oneSideOption.tiers || [], totalSides) : 0;
    return pricePerSide * sides;
}

/**
 * Tính giá cán màng
 * Mốc tính theo "mặt cán" (tương tự giá in)
 * Cán 2 mặt: mặt_cán = tờ × 2 → tra bảng bằng mặt_cán
 *
 * @param {number} lamSides - 1 hoặc 2 (số mặt cán)
 * @returns {{ cost, unit, tierPrice, tierMin, tierMax, area, totalSides }}
 */
export function calculateLaminationCost(settings, printSizeId, lamId, sheets, paperW, paperH, lamSides = 1) {
    const emptyResult = { cost: 0, unit: '', tierPrice: 0, tierMin: 0, tierMax: 0, area: 0, totalSides: 0 };
    if (!lamId || lamId <= 0) return emptyResult;

    const lamType = settings.laminations?.find(l => l.id === lamId);
    if (!lamType) return emptyResult;
    if (lamType.id === 1) return emptyResult; // Không cán

    const area = (paperW * paperH) / 1000000; // m²
    const totalSides = sheets * lamSides; // tổng mặt cán

    // Helper: tính chi phí từ tier (dùng totalSides)
    const calcFromTier = (tier, fallbackUnit) => {
        const unit = tier.unit || fallbackUnit || 'per_sheet';
        let cost = 0;
        if (unit === 'per_m2') {
            // totalSides × diện tích × đơn giá
            cost = Math.round(totalSides * area * tier.price);
        } else if (unit === 'per_lot') {
            // giá cố định trọn lô
            cost = Math.round(tier.price);
        } else {
            // per_sheet: totalSides × đơn giá
            cost = Math.round(totalSides * tier.price);
        }
        return { cost, unit, tierPrice: tier.price, tierMin: tier.min || 1, tierMax: tier.max, area, totalSides };
    };

    // Ưu tiên: pricing theo khổ giấy cụ thể (tra mốc bằng totalSides)
    if (settings.laminationPricing && settings.laminationPricing.length > 0) {
        const pricing = settings.laminationPricing.find(
            lp => lp.printSizeId === printSizeId && lp.lamId === lamId
        );
        if (pricing && pricing.tiers && pricing.tiers.length > 0) {
            const tier = findTierWithMin(pricing.tiers, totalSides);
            if (!tier) return emptyResult;
            return calcFromTier(tier, pricing.unit || lamType.unit);
        }
    }

    // Fallback: cấu trúc laminations cũ (tra mốc bằng totalSides)
    const unit = lamType.unit || 'per_sheet';
    const tierPrice = findTierPrice(lamType.tiers || [], totalSides);

    if (unit === 'per_m2') {
        return { cost: Math.round(totalSides * area * tierPrice), unit, tierPrice, tierMin: 1, tierMax: 999999, area, totalSides };
    }
    if (unit === 'per_lot') {
        return { cost: Math.round(tierPrice), unit, tierPrice, tierMin: 1, tierMax: 999999, area, totalSides };
    }
    if (lamType.pricePerM2 && totalSides >= 500) {
        return { cost: Math.round(totalSides * area * lamType.pricePerM2), unit: 'per_m2', tierPrice: lamType.pricePerM2, tierMin: 500, tierMax: 999999, area, totalSides };
    }
    return { cost: Math.round(totalSides * tierPrice), unit, tierPrice, tierMin: 1, tierMax: 999999, area, totalSides };
}


/**
 * Tính giá hoàn chỉnh cho In Nhanh
 */
export function calculatePaperPricing({
    prodW, prodH, qty, paperTypeId, printSideId, lamId, custId,
    extraCosts = 0, selectedProcIds = [], spacing = 0, marginH = 5, marginV = 5,
    waste = 0, allowRotation = false, customPaperPrice = null, lamDoubleSide = false, settings
}) {
    if (prodW <= 0 || prodH <= 0 || qty <= 0) return null;

    const paper = getPaperById(settings, paperTypeId);
    const cust = settings.customerTypes.find(c => c.id === custId);
    if (!cust) return null;
    if (!paper && customPaperPrice === null) return null;

    const isTwoSided = printSideId === 2;
    const margin = { top: marginH, bottom: marginH, left: marginV, right: marginV };

    let printSheetW = 325, printSheetH = 430;
    if (paper) { printSheetW = paper.w; printSheetH = paper.h; }

    // 1. Tính dàn in
    const imposition = calculateImposition(prodW, prodH, printSheetW, printSheetH, 0, margin, spacing, allowRotation);
    if (imposition.total <= 0) return { error: 'Sản phẩm quá lớn so với khổ in!' };

    // 2. Tính số tờ
    const baseSheets = calculateSheetsNeeded(qty, imposition.total);
    const sheets = baseSheets + waste;

    // 3. Giá giấy
    let paperPricePerSheet = customPaperPrice !== null ? customPaperPrice : getPaperPrice(settings, paperTypeId, sheets);
    const paperCost = Math.round(sheets * paperPricePerSheet);

    // 4. Giá in (mốc tính theo mặt in)
    const sides = isTwoSided ? 2 : 1;
    const totalSides = sheets * sides;
    const sizeKey = `${printSheetW}x${printSheetH}`;
    const printPricePerSheet = getPrintPriceBySize(settings, sizeKey, sheets, isTwoSided);
    const printPricePerSide = printPricePerSheet / sides;
    const printCost = Math.round(sheets * printPricePerSheet);

    // 5. Giá cán màng (mốc tính theo mặt cán)
    const lamSides = lamDoubleSide ? 2 : 1;
    const printSizeId = paper ? paper.printSizeId : null;
    const lamResult = printSizeId
        ? calculateLaminationCost(settings, printSizeId, lamId, sheets, paper?.w || 0, paper?.h || 0, lamSides)
        : { cost: 0, unit: '', tierPrice: 0, tierMin: 0, tierMax: 0, area: 0, totalSides: 0 };
    const lamCost = lamResult.cost;

    // 6. Giá gia công
    let procCost = 0;
    const procDetails = [];
    selectedProcIds.forEach(procId => {
        const proc = settings.processing.find(p => p.id === procId);
        if (proc) {
            const detail = calculateProcessingCost(proc, qty, sheets);
            procCost += detail.cost;
            procDetails.push({ name: proc.name, cost: detail.cost, unit: detail.unit, tierPrice: detail.tierPrice, tierMin: detail.tierMin, tierMax: detail.tierMax, calcQty: detail.calcQty });
        }
    });

    // 7. Tổng vốn + Giá bán
    const totalCost = paperCost + printCost + lamCost + procCost + extraCosts;
    const costPerItem = totalCost / qty;
    const sellPerItem = Math.round(costPerItem * (1 + cust.profit / 100));
    const totalSell = sellPerItem * qty;
    const profit = totalSell - totalCost;

    return {
        imposition,
        sheets, baseSheets, waste,
        paperCost, paperPricePerSheet,
        printCost, printPricePerSheet, printPricePerSide,
        printSides: sides, totalPrintSides: totalSides,
        lamCost, lamDetail: lamResult,
        procCost, procDetails,
        extraCosts,
        totalCost, costPerItem,
        sellPerItem, totalSell,
        profit,
        profitPercent: cust.profit,
        qty,
        paperName: paper?.name || 'Giấy',
        printName: isTwoSided ? 'In 2 mặt' : 'In 1 mặt',
        sheetSize: `${printSheetW}×${printSheetH}`,
    };
}
