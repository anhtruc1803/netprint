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
        { id: 1, name: 'Không cán', unit: 'per_sheet', tiers: [{ max: 999999, price: 0 }] },
        { id: 2, name: 'Cán bóng 1 mặt', unit: 'per_sheet', tiers: [{ max: 499, price: 600 }], pricePerM2: 2500 },
        { id: 3, name: 'Cán bóng 2 mặt', unit: 'per_sheet', tiers: [{ max: 499, price: 1200 }], pricePerM2: 5000 },
        { id: 4, name: 'Cán mờ 1 mặt', unit: 'per_sheet', tiers: [{ max: 499, price: 700 }], pricePerM2: 2700 },
        { id: 5, name: 'Cán mờ 2 mặt', unit: 'per_sheet', tiers: [{ max: 499, price: 1400 }], pricePerM2: 5400 },
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
        // Dispatch event so calculators auto-refresh
        window.dispatchEvent(new CustomEvent('netprint-settings-changed', { detail: { type: 'paper', settings } }));
    } catch (e) {
        console.error('Error saving paper settings:', e);
    }
}

export function loadCatalogueSettings() {
    try {
        const saved = localStorage.getItem(CAT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Remove legacy papers — catalogue now uses shared paperSettings
            delete parsed.papers;
            return { ...DEFAULT_CATALOGUE_SETTINGS, ...parsed };
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
    } catch (e) {
        console.error('Error saving catalogue settings:', e);
    }
}

// ===== React Hook: auto-sync settings =====
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that auto-reloads paper settings whenever they change
 * Use this instead of useMemo(() => loadPaperSettings(), [])
 */
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

/**
 * Hook that auto-reloads catalogue settings whenever they change
 */
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

