/**
 * DATA SEEDER - Tự động đồng bộ dữ liệu
 * 
 * Luồng hoạt động:
 * 1. App khởi động → đọc file settings.json trên ổ cứng
 * 2. Nếu file có data → đổ vào localStorage (đồng bộ mọi trình duyệt)
 * 3. Nếu file trống → dùng data mặc định trong code
 * 4. Khi anh chỉnh sửa trên app → tự lưu vào cả localStorage + file
 */

import { DEFAULT_PAPER_SETTINGS, DEFAULT_CATALOGUE_SETTINGS } from 'src/sections/pricing/data/default-settings';

// ====== DEFAULT DATA ======

const DEFAULT_USER_PROFILE = {
    id: '1',
    displayName: 'NetPrint Admin',
    email: 'admin@netprint.vn',
    photoURL: '/logo/logo-icon.png',
    phoneNumber: '',
    country: 'Vietnam',
    address: '',
    state: 'Hồ Chí Minh',
    city: '',
    zipCode: '',
    about: 'Quản trị viên hệ thống NetPrint CRM',
    role: 'admin',
    isPublic: true,
};

const DEFAULT_USERS = [
    {
        id: '1',
        email: 'admin@netprint.vn',
        password: 'Netprint@22',
        displayName: 'NetPrint Admin',
        role: 'admin',
        phoneNumber: '',
        department: 'Quản lý',
        isActive: true,
        createdAt: '2026-03-06T13:24:44.491Z',
    },
];

const DEFAULT_LABEL_SETTINGS = {
    decalTypes: [
        { id: 1, name: 'Decal bế (Tĩnh lệ)', w: 330, h: 430, price: 20000 },
        { id: 2, name: 'Decal bế', w: 330, h: 430, price: 12000 },
        { id: 3, name: 'Decal giấy', w: 330, h: 430, price: 2500 },
        { id: 4, name: 'Decal nhựa sữa', w: 330, h: 430, price: 3500 },
        { id: 5, name: 'Decal nhựa trong', w: 330, h: 430, price: 3500 },
        { id: 6, name: 'Decal si bạc', w: 330, h: 430, price: 4000 },
        { id: 7, name: 'Decal 7 màu', w: 330, h: 430, price: 4500 },
        { id: 8, name: 'Decal da bò (kraft)', w: 320, h: 420, price: 3100 },
    ],
    printOptions: [
        { id: 1, name: 'In 1 mặt', tiers: [{ max: 200, price: 3000 }, { max: 1000, price: 2500 }, { max: 999999, price: 2000 }] },
        { id: 2, name: 'In 2 mặt', tiers: [{ max: 200, price: 5000 }, { max: 1000, price: 4000 }, { max: 999999, price: 3500 }] },
    ],
    laminations: [
        { id: 1, name: 'Không cán màng', tiers: [{ max: 999999, price: 0 }] },
        { id: 2, name: 'Cán màng bóng 1 mặt', tiers: [{ max: 200, price: 80 }, { max: 1000, price: 50 }, { max: 999999, price: 30 }] },
        { id: 3, name: 'Cán màng bóng 2 mặt', tiers: [{ max: 200, price: 160 }, { max: 1000, price: 100 }, { max: 999999, price: 60 }] },
        { id: 4, name: 'Cán màng mờ 1 mặt', tiers: [{ max: 200, price: 90 }, { max: 1000, price: 60 }, { max: 999999, price: 40 }] },
        { id: 5, name: 'Cán màng mờ 2 mặt', tiers: [{ max: 200, price: 180 }, { max: 1000, price: 120 }, { max: 999999, price: 80 }] },
        { id: 6, name: 'Cán màng keo bóng 1 mặt', tiers: [{ max: 200, price: 100 }, { max: 1000, price: 70 }, { max: 999999, price: 50 }] },
        { id: 7, name: 'Cán màng keo mờ 2 mặt', tiers: [{ max: 200, price: 200 }, { max: 1000, price: 140 }, { max: 999999, price: 100 }] },
    ],
    cutTypes: [
        { id: 1, name: 'Cắt thô (tờ)', tiers: [{ max: 999999, price: 0 }] },
        { id: 2, name: 'Cắt rời', tiers: [{ max: 200, price: 100 }, { max: 1000, price: 50 }, { max: 999999, price: 30 }] },
        { id: 3, name: 'Bế kiss-cut', tiers: [{ max: 200, price: 150 }, { max: 1000, price: 80 }, { max: 999999, price: 50 }] },
        { id: 4, name: 'Bế die-cut', tiers: [{ max: 200, price: 200 }, { max: 1000, price: 100 }, { max: 999999, price: 70 }] },
    ],
    customerTypes: [
        { id: 1, name: 'Đại lí', profit: 25 },
        { id: 2, name: 'Khách lẻ', profit: 50 },
        { id: 3, name: 'Hàng gấp', profit: 70 },
    ],
};

// Tất cả các key cần đồng bộ
const ALL_SYNC_KEYS = [
    'netprint_paper_settings',
    'netprint_catalogue_settings',
    'netprint_label_settings',
    'netprint_user_profile',
    'netprint_users',
];

const CODE_DEFAULTS = {
    netprint_paper_settings: DEFAULT_PAPER_SETTINGS,
    netprint_catalogue_settings: DEFAULT_CATALOGUE_SETTINGS,
    netprint_label_settings: DEFAULT_LABEL_SETTINGS,
    netprint_user_profile: DEFAULT_USER_PROFILE,
    netprint_users: DEFAULT_USERS,
};

// ====== SEEDER LOGIC ======

/**
 * Seed data mặc định vào localStorage (chỉ cho key chưa tồn tại)
 */
function seedDefaults() {
    Object.entries(CODE_DEFAULTS).forEach(([key, defaultData]) => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(defaultData));
            console.log(`[DataSeeder] ✅ Seeded: ${key}`);
        }
    });
}

/**
 * Đồng bộ từ file server → localStorage
 */
async function syncFromServer() {
    try {
        const res = await fetch('/api/settings');
        if (!res.ok) return false;

        const serverData = await res.json();
        if (!serverData || Object.keys(serverData).length === 0) return false;

        // Đổ data từ file vào localStorage
        Object.entries(serverData).forEach(([key, value]) => {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
        console.log('[DataSeeder] ✅ Đã đồng bộ từ file server');
        return true;
    } catch (_e) {
        console.warn('[DataSeeder] Server không khả dụng');
        return false;
    }
}

/**
 * Đồng bộ localStorage → file server  
 * Gọi hàm này mỗi khi có thay đổi settings
 */
export async function syncToServer() {
    try {
        const allData = {};
        ALL_SYNC_KEYS.forEach((key) => {
            const val = localStorage.getItem(key);
            if (val) allData[key] = val;
        });

        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allData),
        });
        console.log('[DataSeeder] ✅ Đã lưu vào file trên ổ cứng');
    } catch (_e) {
        // Chạy nền, không cần báo lỗi
    }
}

/**
 * MAIN: Khởi tạo toàn bộ dữ liệu
 * 1. Thử đọc từ file server trước
 * 2. Nếu không có → seed từ code defaults
 * 3. Lưu lại toàn bộ lên file server (đảm bảo file luôn có data)
 */
export async function seedDefaultData() {
    // Bước 1: Thử sync từ file server
    const hasServerData = await syncFromServer();

    // Bước 2: Seed defaults cho các key còn thiếu
    seedDefaults();

    // Bước 3: Đảm bảo file server có copy mới nhất
    if (!hasServerData) {
        await syncToServer();
    }

    console.log('[DataSeeder] 🎉 Khởi tạo hoàn tất');
}
