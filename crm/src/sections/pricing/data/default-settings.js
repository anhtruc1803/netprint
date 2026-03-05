// ===== DEFAULT SETTINGS - TÍNH GIÁ IN =====
// Ported from app.js PAPER_SETTINGS, CATALOGUE_SETTINGS

const STORAGE_KEY = 'netprint_paper_settings';
const CAT_STORAGE_KEY = 'netprint_catalogue_settings';

export const DEFAULT_PAPER_SETTINGS = {
    printSizes: [],
    paperPricing: [],
    printOptions: [
        { id: 1, name: 'In 1 mặt', tiers: [{ max: 500, price: 2000 }, { max: 999999, price: 1800 }] },
        { id: 2, name: 'In 2 mặt', tiers: [{ max: 500, price: 3500 }, { max: 999999, price: 3000 }] },
    ],
    laminationPricing: [],
    laminations: [
        { id: 1, name: 'Không cán', tiers: [{ max: 999999, price: 0 }] },
        { id: 2, name: 'Cán bóng 1 mặt', tiers: [{ max: 499, price: 600 }], pricePerM2: 2500 },
        { id: 3, name: 'Cán bóng 2 mặt', tiers: [{ max: 499, price: 1200 }], pricePerM2: 5000 },
        { id: 4, name: 'Cán mờ 1 mặt', tiers: [{ max: 499, price: 700 }], pricePerM2: 2700 },
        { id: 5, name: 'Cán mờ 2 mặt', tiers: [{ max: 499, price: 1400 }], pricePerM2: 5400 },
    ],
    processing: [
        { id: 1, name: 'Cắt thành phẩm', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        { id: 2, name: 'Bế demi', tiers: [{ max: 100, price: 2000 }, { max: 200, price: 1500 }, { max: 300, price: 1000 }, { max: 999999, price: 1000 }] },
        { id: 5, name: 'Bế đứt', tiers: [{ max: 100, price: 2000 }, { max: 200, price: 1500 }, { max: 300, price: 1000 }, { max: 999999, price: 1000 }] },
        { id: 3, name: 'Bế + Cấn', tiers: [{ max: 100, price: 3000 }, { max: 200, price: 2800 }, { max: 300, price: 2500 }, { max: 999999, price: 2500 }] },
        { id: 6, name: 'Cấn thành phẩm', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        { id: 4, name: 'Cấn răng cưa', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        { id: 7, name: 'Đục lỗ', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        { id: 8, name: 'Rọc demi', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        { id: 9, name: 'Bo góc', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
    ],
    customerTypes: [
        { id: 1, name: 'Đại lí cấp 1', profit: 15 },
        { id: 2, name: 'Đại lí cấp 2', profit: 25 },
        { id: 3, name: 'Khách lẻ', profit: 40 },
        { id: 4, name: 'Hàng gấp', profit: 60 },
    ],
};

export const DEFAULT_CATALOGUE_SETTINGS = {
    papers: [
        { id: 1, name: 'C120', price: 600 }, { id: 2, name: 'C150', price: 700 },
        { id: 3, name: 'C200', price: 1000 }, { id: 4, name: 'C250', price: 1400 },
        { id: 5, name: 'C300', price: 1700 }, { id: 6, name: 'I 250', price: 1150 },
        { id: 7, name: 'I 300', price: 1550 }, { id: 8, name: 'FO 80', price: 380 },
        { id: 9, name: 'FO 100', price: 420 }, { id: 10, name: 'FO 120', price: 600 },
        { id: 11, name: 'FO 150', price: 900 }, { id: 12, name: 'FO 250', price: 1800 },
        { id: 13, name: 'FO 300', price: 2200 }, { id: 14, name: 'D 300', price: 1300 },
        { id: 15, name: 'Kraft trắng 100', price: 1000 }, { id: 16, name: 'Kraft trắng 150', price: 1500 },
        { id: 17, name: 'Kraft trắng 250 - NGA', price: 2400 },
        { id: 18, name: 'B300', price: 2500 },
        { id: 19, name: 'Econo White 120', price: 2000 }, { id: 20, name: 'Econo White 150', price: 2500 },
        { id: 21, name: 'Econo White 190', price: 3000 }, { id: 22, name: 'Econo White 250', price: 4000 },
        { id: 23, name: 'Econo White 300', price: 5000 },
    ],
    printPrice: 4000,
    laminations: [
        { id: 1, name: 'Không cán màng', tiers: [{ max: 999999, price: 0 }] },
        { id: 2, name: 'Cán màng bóng 1 mặt', tiers: [{ max: 100, price: 2000 }, { max: 500, price: 1500 }, { max: 999999, price: 1000 }] },
        { id: 3, name: 'Cán màng bóng 2 mặt', tiers: [{ max: 100, price: 4000 }, { max: 500, price: 3000 }, { max: 999999, price: 2000 }] },
        { id: 4, name: 'Cán màng mờ 1 mặt', tiers: [{ max: 100, price: 2200 }, { max: 500, price: 1700 }, { max: 999999, price: 1200 }] },
        { id: 5, name: 'Cán màng mờ 2 mặt', tiers: [{ max: 100, price: 4400 }, { max: 500, price: 3400 }, { max: 999999, price: 2400 }] },
        { id: 6, name: 'Cán màng keo bóng 1 mặt', tiers: [{ max: 100, price: 2500 }, { max: 500, price: 2000 }, { max: 999999, price: 1500 }] },
        { id: 7, name: 'Cán màng keo mờ 2 mặt', tiers: [{ max: 100, price: 5000 }, { max: 500, price: 4000 }, { max: 999999, price: 3000 }] },
    ],
    bindings: [
        { id: 1, name: 'Ghim giữa', tiers: [{ max: 100, price: 500 }, { max: 500, price: 300 }, { max: 999999, price: 200 }] },
        { id: 2, name: 'Keo gáy', tiers: [{ max: 100, price: 3000 }, { max: 500, price: 2000 }, { max: 999999, price: 1500 }] },
        { id: 3, name: 'Lò xo', tiers: [{ max: 100, price: 5000 }, { max: 500, price: 4000 }, { max: 999999, price: 3000 }] },
    ],
    customerTypes: [
        { id: 1, name: 'Đại lí', profit: 25 },
        { id: 2, name: 'Khách lẻ', profit: 45 },
        { id: 3, name: 'Hàng gấp', profit: 65 },
    ],
};

/**
 * Load settings từ localStorage, merge với defaults
 */
export function loadPaperSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return { ...DEFAULT_PAPER_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Error loading paper settings:', e);
    }
    return { ...DEFAULT_PAPER_SETTINGS };
}

export function savePaperSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Error saving paper settings:', e);
    }
}

export function loadCatalogueSettings() {
    try {
        const saved = localStorage.getItem(CAT_STORAGE_KEY);
        if (saved) {
            return { ...DEFAULT_CATALOGUE_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Error loading catalogue settings:', e);
    }
    return { ...DEFAULT_CATALOGUE_SETTINGS };
}

export function saveCatalogueSettings(settings) {
    try {
        localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Error saving catalogue settings:', e);
    }
}
