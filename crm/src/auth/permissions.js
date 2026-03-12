/**
 * HỆ THỐNG PHÂN QUYỀN - NetPrint CRM
 * 
 * Mỗi user có: role ('admin' | 'staff') + permissions (mảng string)
 * Admin: có TẤT CẢ quyền, không cần kiểm tra
 * Staff: chỉ có quyền được cấp trong mảng permissions
 */

// ====== DANH SÁCH QUYỀN ======

export const PERMISSIONS = {
    // Tính giá
    PRICING_VIEW: 'pricing.view',
    PRICING_DETAIL: 'pricing.detail',       // Xem chi tiết giá vốn, lợi nhuận
    PRICING_HISTORY_ALL: 'pricing.history_all', // Xem lịch sử tính giá tất cả nhân viên
    PRICING_SETTINGS: 'pricing.settings',   // Cài đặt bảng giá

    // Đơn hàng
    ORDERS_VIEW: 'orders.view',
    ORDERS_CREATE: 'orders.create',
    ORDERS_EDIT: 'orders.edit',

    // Khách hàng
    CUSTOMERS_VIEW: 'customers.view',
    CUSTOMERS_EDIT: 'customers.edit',

    // Sản phẩm
    PRODUCTS_VIEW: 'products.view',
    PRODUCTS_EDIT: 'products.edit',

    // Hệ thống
    ACCOUNTS_MANAGE: 'accounts.manage',     // Quản lý tài khoản
    SETTINGS_VIEW: 'settings.view',         // Cài đặt hệ thống
};

// ====== QUYỀN MẶC ĐỊNH THEO ROLE ======

export const DEFAULT_PERMISSIONS = {
    admin: Object.values(PERMISSIONS), // Admin có tất cả quyền

    staff: [
        PERMISSIONS.PRICING_VIEW,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_CREATE,
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.PRODUCTS_VIEW,
    ],
};

// ====== NHÓM QUYỀN (để hiển thị UI) ======

export const PERMISSION_GROUPS = [
    {
        label: 'Tính giá',
        icon: 'solar:calculator-bold-duotone',
        permissions: [
            { key: PERMISSIONS.PRICING_VIEW, label: 'Xem tính giá', desc: 'Truy cập trang tính giá In nhanh & Catalogue' },
            { key: PERMISSIONS.PRICING_DETAIL, label: 'Xem chi tiết giá', desc: 'Xem giá vốn, lợi nhuận, bảng phân tích chi phí' },
            { key: PERMISSIONS.PRICING_HISTORY_ALL, label: 'Xem lịch sử tất cả', desc: 'Xem lịch sử tính giá của tất cả nhân viên' },
            { key: PERMISSIONS.PRICING_SETTINGS, label: 'Cài đặt giá', desc: 'Chỉnh sửa bảng giá, loại giấy, gia công...' },
        ],
    },
    {
        label: 'Đơn hàng',
        icon: 'solar:cart-bold-duotone',
        permissions: [
            { key: PERMISSIONS.ORDERS_VIEW, label: 'Xem đơn hàng', desc: 'Xem danh sách và chi tiết đơn hàng' },
            { key: PERMISSIONS.ORDERS_CREATE, label: 'Tạo đơn hàng', desc: 'Tạo đơn hàng mới' },
            { key: PERMISSIONS.ORDERS_EDIT, label: 'Sửa/Xóa đơn hàng', desc: 'Chỉnh sửa, cập nhật trạng thái, xóa đơn' },
        ],
    },
    {
        label: 'Khách hàng',
        icon: 'solar:users-group-rounded-bold-duotone',
        permissions: [
            { key: PERMISSIONS.CUSTOMERS_VIEW, label: 'Xem khách hàng', desc: 'Xem danh sách khách hàng' },
            { key: PERMISSIONS.CUSTOMERS_EDIT, label: 'Sửa khách hàng', desc: 'Thêm, sửa, xóa khách hàng' },
        ],
    },
    {
        label: 'Sản phẩm',
        icon: 'solar:box-bold-duotone',
        permissions: [
            { key: PERMISSIONS.PRODUCTS_VIEW, label: 'Xem sản phẩm', desc: 'Xem danh sách sản phẩm' },
            { key: PERMISSIONS.PRODUCTS_EDIT, label: 'Sửa sản phẩm', desc: 'Thêm, sửa, xóa sản phẩm' },
        ],
    },
    {
        label: 'Hệ thống',
        icon: 'solar:settings-bold-duotone',
        permissions: [
            { key: PERMISSIONS.ACCOUNTS_MANAGE, label: 'Quản lý tài khoản', desc: 'Tạo/sửa/xóa tài khoản nhân viên' },
            { key: PERMISSIONS.SETTINGS_VIEW, label: 'Cài đặt hệ thống', desc: 'Truy cập cài đặt hệ thống' },
        ],
    },
];

// ====== HELPER FUNCTIONS ======

/**
 * Kiểm tra user có quyền cụ thể không
 * Admin luôn có tất cả quyền
 */
export function hasPermission(user, permission) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const perms = user.permissions || DEFAULT_PERMISSIONS.staff;
    return perms.includes(permission);
}

/**
 * Lấy danh sách quyền của user
 */
export function getUserPermissions(user) {
    if (!user) return [];
    if (user.role === 'admin') return Object.values(PERMISSIONS);
    return user.permissions || DEFAULT_PERMISSIONS.staff;
}
