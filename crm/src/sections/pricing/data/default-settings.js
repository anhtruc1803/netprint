// ===== DEFAULT SETTINGS - TÍNH GIÁ IN =====
// Dữ liệu cài đặt mặc định — được nhúng trực tiếp vào code
// Ưu tiên: File JSON trên ổ cứng > localStorage > Code defaults

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'netprint_paper_settings';
const CAT_STORAGE_KEY = 'netprint_catalogue_settings';

// ====== FILE-BASED SYNC API ======

/**
 * Đọc tất cả settings từ file JSON trên server
 */
async function loadFromServer() {
    try {
        const res = await fetch('/api/settings');
        if (res.ok) {
            const data = await res.json();
            return data;
        }
    } catch (e) {
        console.warn('[Settings] Server không khả dụng, dùng localStorage');
    }
    return null;
}

/**
 * Lưu tất cả settings vào file JSON trên server
 */
async function saveToServer(allSettings) {
    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allSettings),
        });
        console.log('[Settings] ✅ Đã lưu vào file trên ổ cứng');
    } catch (e) {
        console.warn('[Settings] Không thể lưu vào server:', e);
    }
}

/**
 * Đọc tất cả settings từ server và đồng bộ vào localStorage
 */
async function syncFromServer() {
    const serverData = await loadFromServer();
    if (serverData && Object.keys(serverData).length > 0) {
        // Sync từng key vào localStorage
        Object.entries(serverData).forEach(([key, value]) => {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
        console.log('[Settings] ✅ Đã đồng bộ từ file server');
        return true;
    }
    return false;
}

/**
 * Lưu tất cả settings hiện tại lên server
 */
async function syncToServer() {
    const allSettings = {};
    const keys = [STORAGE_KEY, CAT_STORAGE_KEY, 'netprint_label_settings', 'netprint_user_profile', 'netprint_users'];
    keys.forEach((key) => {
        const val = localStorage.getItem(key);
        if (val) allSettings[key] = val;
    });
    await saveToServer(allSettings);
}

// ====== DEFAULT DATA ======

export const DEFAULT_PAPER_SETTINGS = {
    printSizes: [
        { id: 1772729506415, name: '325 x 430 mm', w: 325, h: 430 },
        { id: 1772756827137, name: '330 x 430 mm', w: 330, h: 430 },
        { id: 1772889362898, name: '330 x 480 mm', w: 330, h: 480 },
        { id: 1772889441647, name: '330 x 350 mm', w: 330, h: 350 },
        { id: 1772942053499, name: '330 x 610 mm', w: 330, h: 610 },
    ],
    paperPricing: [
        {
            printSizeId: 1772729506415,
            papers: [
                { id: 1772942592967, name: 'C 120', tiers: [{ max: 50, price: 600 }, { max: 999999, price: 500 }] },
                { id: 1772942592968, name: 'C 150', tiers: [{ max: 50, price: 750 }, { max: 999999, price: 650 }] },
                { id: 1772942592969, name: 'C 200', tiers: [{ max: 50, price: 1000 }, { max: 999999, price: 850 }] },
                { id: 1772942592970, name: 'C 250', tiers: [{ max: 50, price: 1400 }, { max: 999999, price: 1200 }] },
                { id: 1772942592971, name: 'C 300', tiers: [{ max: 50, price: 1700 }, { max: 999999, price: 1400 }] },
                { id: 1772942592972, name: 'FO 80', tiers: [{ max: 50, price: 380 }, { max: 999999, price: 350 }] },
                { id: 1772942592973, name: 'FO 100', tiers: [{ max: 50, price: 450 }, { max: 999999, price: 420 }] },
                { id: 1772942592974, name: 'FO 120', tiers: [{ max: 50, price: 560 }, { max: 999999, price: 530 }] },
                { id: 1772942592975, name: 'FO 150', tiers: [{ max: 50, price: 850 }, { max: 999999, price: 820 }] },
                { id: 1772942592976, name: 'FO 250', tiers: [{ max: 50, price: 1450 }, { max: 999999, price: 1350 }] },
                { id: 1772942592977, name: 'FO 300', tiers: [{ max: 50, price: 1800 }, { max: 999999, price: 1500 }] },
                { id: 1772942592978, name: 'I 250', tiers: [{ max: 50, price: 1200 }, { max: 999999, price: 1000 }] },
                { id: 1772942592979, name: 'I 300', tiers: [{ max: 50, price: 1550 }, { max: 999999, price: 1300 }] },
                { id: 1772942592980, name: 'D 300', tiers: [{ max: 50, price: 1300 }, { max: 999999, price: 1100 }] },
                { id: 1772942592981, name: 'B 300', tiers: [{ max: 50, price: 2500 }, { max: 999999, price: 2100 }] },
                { id: 1772942592982, name: 'Kraft trắng 100', tiers: [{ max: 50, price: 1000 }, { max: 999999, price: 850 }] },
                { id: 1772942592983, name: 'Kraft trắng 150', tiers: [{ max: 50, price: 1500 }, { max: 999999, price: 1250 }] },
                { id: 1772942592984, name: 'Kraft trắng 250 - NGÀ', tiers: [{ max: 50, price: 2400 }, { max: 999999, price: 2000 }] },
            ],
        },
        {
            printSizeId: 1772756827137,
            papers: [
                { id: 1772803296113, name: 'Decal giấy', tiers: [{ max: 50, price: 2300 }, { max: 999999, price: 2100 }] },
                { id: 1772810887032, name: 'Decal nhựa sữa', tiers: [{ max: 50, price: 3500 }, { max: 999999, price: 3200 }] },
                { id: 1772944297901, name: 'Decal nhựa Trong', tiers: [{ max: 500, price: 1000 }, { max: 999999, price: 800 }] },
                { id: 1772944299506, name: 'Giấy mới', tiers: [{ max: 500, price: 1000 }, { max: 999999, price: 800 }] },
            ],
        },
        { printSizeId: 1772889362898, papers: [] },
        { printSizeId: 1772889441647, papers: [] },
        { printSizeId: 1772942053499, papers: [] },
    ],
    printOptions: [
        { id: 1, name: 'In 1 mặt', tiers: [{ max: 5, price: 5000 }, { max: 500, price: 2000 }, { max: 999999, price: 1800 }] },
        { id: 2, name: 'In 2 mặt', tiers: [{ max: 500, price: 3500 }, { max: 999999, price: 3000 }] },
    ],
    laminationPricing: [
        { printSizeId: 1772729506415, lamId: 1772757410745, unit: 'per_sheet', tiers: [{ max: 5, price: 5000, unit: 'per_lot' }, { max: 500, price: 650, unit: 'per_sheet' }, { max: 999999, price: 2500, unit: 'per_m2' }] },
        { printSizeId: 1772729506415, lamId: 1772757440393, unit: 'per_sheet', tiers: [{ max: 5, price: 6000, unit: 'per_lot' }, { max: 500, price: 700, unit: 'per_sheet' }, { max: 999999, price: 2700, unit: 'per_m2' }] },
        { printSizeId: 1772756827137, lamId: 1772757410745, unit: 'per_sheet', tiers: [{ max: 5, price: 5000, unit: 'per_lot' }, { max: 500, price: 650, unit: 'per_sheet' }, { max: 999999, price: 2500, unit: 'per_m2' }] },
        { printSizeId: 1772756827137, lamId: 1772757440393, unit: 'per_sheet', tiers: [{ max: 5, price: 6000, unit: 'per_lot' }, { max: 500, price: 700, unit: 'per_sheet' }, { max: 999999, price: 2700, unit: 'per_m2' }] },
        { printSizeId: 1772889362898, lamId: 1772757410745, unit: 'per_sheet', tiers: [{ max: 5, price: 6000, unit: 'per_lot' }, { max: 500, price: 800, unit: 'per_sheet' }, { max: 999999, price: 2500, unit: 'per_m2' }] },
        { printSizeId: 1772889362898, lamId: 1772757440393, unit: 'per_sheet', tiers: [{ max: 5, price: 7000, unit: 'per_lot' }, { max: 500, price: 850, unit: 'per_sheet' }, { max: 999999, price: 2700, unit: 'per_m2' }] },
        { printSizeId: 1772889441647, lamId: 1772757410745, unit: 'per_sheet', tiers: [{ max: 5, price: 5000, unit: 'per_lot' }, { max: 500, price: 600, unit: 'per_sheet' }, { max: 999999, price: 2500, unit: 'per_m2' }] },
        { printSizeId: 1772889441647, lamId: 1772757440393, unit: 'per_sheet', tiers: [{ max: 5, price: 5500, unit: 'per_lot' }, { max: 500, price: 650, unit: 'per_sheet' }, { max: 999999, price: 2700, unit: 'per_m2' }] },
    ],
    laminations: [
        { id: 1, name: 'Không cán', tiers: [{ max: 999999, price: 0 }] },
        { id: 1772757410745, name: 'Cán màng bóng ', unit: 'per_sheet', tiers: [{ max: 499, price: 0 }], pricePerM2: 0 },
        { id: 1772757440393, name: 'Cán màng mờ ', unit: 'per_sheet', tiers: [{ max: 499, price: 0 }], pricePerM2: 0 },
    ],
    processing: [
        { id: 1, name: 'Cắt thành phẩm', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 500, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }], unit: 'per_sheet' },
        { id: 2, name: 'Bế demi', tiers: [{ max: 100, price: 2000 }, { max: 200, price: 1500 }, { max: 300, price: 1000 }, { max: 999999, price: 1000 }] },
        { id: 5, name: 'Bế đứt', tiers: [{ max: 100, price: 2000 }, { max: 200, price: 1500 }, { max: 300, price: 1000 }, { max: 999999, price: 1000 }] },
        { id: 3, name: 'Bế + Cấn', tiers: [{ max: 100, price: 3000 }, { max: 200, price: 2800 }, { max: 300, price: 2500 }, { max: 999999, price: 2500 }] },
        { id: 6, name: 'Cấn thành phẩm', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        { id: 4, name: 'Cấn răng cưa', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        { id: 7, name: 'Đục lỗ', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
        { id: 9, name: 'Bo góc', tiers: [{ max: 100, price: 100 }, { max: 200, price: 100 }, { max: 300, price: 100 }, { max: 999999, price: 100 }], fixedTiers: [{ max: 100, fixed: 10000 }, { max: 200, fixed: 20000 }, { max: 300, fixed: 30000 }] },
    ],
    customerTypes: [
        { id: 2, name: 'Đại Lí', profit: 30 },
        { id: 3, name: 'Khách Hàng ', profit: 50 },
        { id: 4, name: 'Hàng Gấp', profit: 100 },
    ],
    printPricingBySize: [
        { printSizeId: 1772729506415, tiers: [{ max: 5, price: 5000 }, { max: 500, price: 2000 }, { max: 999999, price: 1800 }] },
        { printSizeId: 1772756827137, tiers: [{ max: 5, price: 5000 }, { max: 500, price: 2000 }, { max: 999999, price: 1800 }] },
        { printSizeId: 1772889362898, tiers: [{ max: 5, price: 7000 }, { max: 500, price: 2200 }, { max: 999999, price: 2000 }] },
        { printSizeId: 1772889441647, tiers: [{ max: 5, price: 4000 }, { max: 500, price: 1800 }, { max: 999999, price: 1600 }] },
    ],
};

export const DEFAULT_CATALOGUE_SETTINGS = {
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
        { id: 1, name: 'Ghim giữa', tiers: [{ max: 10, price: 3000, unit: 'per_item', pricePerPage: 150 }, { max: 50, price: 1500, pricePerPage: 100 }, { max: 100, price: 1000, unit: 'per_item', pricePerPage: 100 }, { max: 200, price: 800, pricePerPage: 50 }, { max: 999999, price: 500, pricePerPage: 50 }], pricePerPage: 100 },
        { id: 2, name: 'Keo gáy', tiers: [{ max: 999999, price: 1500 }] },
        { id: 3, name: 'Lò xo', tiers: [{ max: 999999, price: 3000 }] },
    ],
    customerTypes: [
        { id: 1, name: 'Đại lí', profit: 25 },
        { id: 2, name: 'Khách lẻ', profit: 45 },
        { id: 3, name: 'Hàng gấp', profit: 65 },
    ],
};

// ====== LOAD / SAVE FUNCTIONS ======

/**
 * Load settings từ localStorage, merge với defaults
 * Sanitize data: loại bỏ null/undefined trong các mảng
 */
export function loadPaperSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            const merged = { ...DEFAULT_PAPER_SETTINGS, ...parsed };
            // Sanitize: filter null/undefined from all array fields
            const arrayKeys = ['printSizes', 'paperPricing', 'printOptions', 'laminations', 'processing', 'customerTypes', 'laminationPricing', 'printPricingBySize'];
            arrayKeys.forEach(key => {
                if (Array.isArray(merged[key])) {
                    merged[key] = merged[key].filter(Boolean);
                }
            });
            // Also sanitize nested arrays (papers inside paperPricing)
            if (Array.isArray(merged.paperPricing)) {
                merged.paperPricing = merged.paperPricing.map(pp => {
                    if (!pp) return null;
                    return { ...pp, papers: Array.isArray(pp.papers) ? pp.papers.filter(Boolean) : [] };
                }).filter(Boolean);
            }
            return merged;
        }
    } catch (e) {
        console.error('Error loading paper settings:', e);
    }
    return { ...DEFAULT_PAPER_SETTINGS };
}

export function savePaperSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        // Dispatch event so calculators auto-refresh
        window.dispatchEvent(new CustomEvent('netprint-settings-changed', { detail: { type: 'paper', settings } }));
        // Sync lên file server (chạy nền, không chờ)
        syncToServer();
    } catch (e) {
        console.error('Error saving paper settings:', e);
    }
}

export function loadCatalogueSettings() {
    try {
        const saved = localStorage.getItem(CAT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            delete parsed.papers;
            const merged = { ...DEFAULT_CATALOGUE_SETTINGS, ...parsed };
            // Sanitize: filter null/undefined from all array fields
            const arrayKeys = ['laminations', 'bindings', 'customerTypes'];
            arrayKeys.forEach(key => {
                if (Array.isArray(merged[key])) {
                    merged[key] = merged[key].filter(Boolean);
                }
            });
            return merged;
        }
    } catch (e) {
        console.error('Error loading catalogue settings:', e);
    }
    return { ...DEFAULT_CATALOGUE_SETTINGS };
}

export function saveCatalogueSettings(settings) {
    try {
        localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('netprint-settings-changed', { detail: { type: 'catalogue', settings } }));
        // Sync lên file server
        syncToServer();
    } catch (e) {
        console.error('Error saving catalogue settings:', e);
    }
}

// ====== INIT: Đồng bộ từ server khi app khởi động ======

/**
 * Khởi tạo settings: ưu tiên file server > localStorage > code defaults
 */
export async function initSettingsFromServer() {
    const synced = await syncFromServer();
    if (synced) {
        window.dispatchEvent(new CustomEvent('netprint-settings-changed', { detail: { type: 'paper' } }));
        window.dispatchEvent(new CustomEvent('netprint-settings-changed', { detail: { type: 'catalogue' } }));
    }
}

// ====== React Hooks ======

export function usePaperSettings() {
    const [settings, setSettings] = useState(() => loadPaperSettings());

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.type === 'paper') {
                setSettings(loadPaperSettings());
            }
        };
        window.addEventListener('netprint-settings-changed', handler);
        return () => window.removeEventListener('netprint-settings-changed', handler);
    }, []);

    const reload = useCallback(() => setSettings(loadPaperSettings()), []);

    return { settings, reload };
}

export function useCatalogueSettings() {
    const [settings, setSettings] = useState(() => loadCatalogueSettings());

    useEffect(() => {
        const handler = (e) => {
            if (e.detail?.type === 'catalogue') {
                setSettings(loadCatalogueSettings());
            }
        };
        window.addEventListener('netprint-settings-changed', handler);
        return () => window.removeEventListener('netprint-settings-changed', handler);
    }, []);

    const reload = useCallback(() => setSettings(loadCatalogueSettings()), []);

    return { settings, reload };
}
