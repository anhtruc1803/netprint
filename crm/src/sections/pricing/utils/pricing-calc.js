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
 */
export function calculateProcessingCost(proc, qty, sheets) {
    if (!proc) return 0;

    // Legacy: fixedTiers
    if ((!proc.tiers || proc.tiers.length === 0) && proc.fixedTiers && proc.fixedTiers.length > 0) {
        const sorted = [...proc.fixedTiers].sort((a, b) => a.max - b.max);
        const ft = sorted.find(t => qty <= t.max) || sorted[sorted.length - 1];
        return ft ? ft.fixed : 0;
    }

    if (!proc.tiers || proc.tiers.length === 0 || !qty || qty <= 0) return 0;

    const tiersHaveUnit = proc.tiers.some(t => !!t.unit);
    if (proc.unit === 'per_lot' && !tiersHaveUnit && proc.fixedTiers && proc.fixedTiers.length > 0) {
        const sorted = [...proc.fixedTiers].sort((a, b) => a.max - b.max);
        const ft = sorted.find(t => qty <= t.max) || sorted[sorted.length - 1];
        return ft ? ft.fixed : 0;
    }

    const selectedTier = findTierWithMin(proc.tiers, qty);
    if (!selectedTier) return 0;

    const unit = selectedTier.unit || proc.unit || 'per_item';

    if (unit === 'per_lot') return Math.round(selectedTier.price || 0);
    if (unit === 'per_sheet') return sheets > 0 ? Math.round(sheets * (selectedTier.price || 0)) : 0;
    return Math.round(qty * (selectedTier.price || 0)); // per_item
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
 */
export function getPrintPriceBySize(settings, sizeKey, sheets, isTwoSided = false) {
    const pricingBySize = settings.printPricingBySize;
    if (!pricingBySize || !pricingBySize[sizeKey]) {
        // Fallback: dùng printOptions cũ
        const option = settings.printOptions?.find(p => p.id === (isTwoSided ? 2 : 1));
        return option ? findTierPrice(option.tiers || [], sheets) : 0;
    }

    const sizeData = pricingBySize[sizeKey];

    if (isTwoSided) {
        // In 2 mặt: ưu tiên tiers riêng, nếu không có thì x2 giá 1 mặt
        if (sizeData.twoSide?.tiers?.length > 0) {
            return findTierPrice(sizeData.twoSide.tiers, sheets);
        }
        // Fallback: x2 giá 1 mặt, tìm mốc bằng sheets*2
        const oneSidePrice = findTierPrice(sizeData.oneSide?.tiers || [], sheets * 2);
        return oneSidePrice * 2;
    }

    return findTierPrice(sizeData.oneSide?.tiers || [], sheets);
}

/**
 * Tính giá cán màng theo cấu trúc mới (laminationPricing)
 */
export function calculateLaminationCost(settings, printSizeId, lamId, sheets, paperW, paperH) {
    if (!lamId || lamId <= 0) return 0;
    if (!settings.laminationPricing || settings.laminationPricing.length === 0) {
        // Fallback: cấu trúc laminations cũ
        const lam = settings.laminations?.find(l => l.id === lamId);
        if (!lam) return 0;
        if (lam.pricePerM2 && sheets >= 500) {
            const area = (paperW * paperH) / 1000000; // mm² → m²
            return Math.round(sheets * area * lam.pricePerM2);
        }
        return Math.round(sheets * findTierPrice(lam.tiers || [], sheets));
    }

    // Cấu trúc mới
    const pricing = settings.laminationPricing.find(
        lp => lp.printSizeId === printSizeId && lp.lamId === lamId
    );
    if (!pricing || !pricing.tiers) return 0;

    const tier = findTierWithMin(pricing.tiers, sheets);
    if (!tier) return 0;

    const unit = tier.unit || 'per_sheet';
    if (unit === 'per_m2') {
        const area = (paperW * paperH) / 1000000;
        return Math.round(sheets * area * tier.price);
    }
    if (unit === 'per_lot') {
        return Math.round(tier.price);
    }
    return Math.round(sheets * tier.price); // per_sheet
}

/**
 * Tính giá hoàn chỉnh cho In Nhanh
 */
export function calculatePaperPricing({
    prodW, prodH, qty, paperTypeId, printSideId, lamId, custId,
    extraCosts = 0, selectedProcIds = [], spacing = 0, marginH = 5, marginV = 5,
    waste = 0, allowRotation = false, customPaperPrice = null, settings
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

    // 4. Giá in
    const sizeKey = `${printSheetW}x${printSheetH}`;
    const printPricePerSheet = getPrintPriceBySize(settings, sizeKey, sheets, isTwoSided);
    const printCost = Math.round(sheets * printPricePerSheet);

    // 5. Giá cán màng
    const printSizeId = paper ? paper.printSizeId : null;
    const lamCost = printSizeId
        ? calculateLaminationCost(settings, printSizeId, lamId, sheets, paper?.w || 0, paper?.h || 0)
        : 0;

    // 6. Giá gia công
    let procCost = 0;
    const procDetails = [];
    selectedProcIds.forEach(procId => {
        const proc = settings.processing.find(p => p.id === procId);
        if (proc) {
            const cost = calculateProcessingCost(proc, qty, sheets);
            procCost += cost;
            procDetails.push({ name: proc.name, cost });
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
        printCost, printPricePerSheet,
        lamCost,
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
