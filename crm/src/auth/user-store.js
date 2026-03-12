// User management store using localStorage
// Supports multiple users with roles: admin, staff

import { syncToServer } from './data-seeder';
import { DEFAULT_PERMISSIONS } from './permissions';

const USERS_STORAGE_KEY = 'netprint_users';

// Default admin account
const DEFAULT_USERS = [
    {
        id: '1',
        email: 'admin@netprint.vn',
        password: 'Netprint@22',
        displayName: 'Admin',
        role: 'admin',
        permissions: DEFAULT_PERMISSIONS.admin,
        phoneNumber: '',
        department: 'Management',
        isActive: true,
        createdAt: new Date().toISOString(),
    },
];

// Initialize users in localStorage if not exists
function initUsers() {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }
    try {
        const parsed = JSON.parse(stored);
        
        // Kiểm tra data hợp lệ — phải là array
        if (!Array.isArray(parsed) || parsed.length === 0) {
            console.warn('[UserStore] Data bị hỏng (không phải array), reset về mặc định');
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }

        // Lọc bỏ user không có email (dữ liệu bị corrupt)
        const validUsers = parsed.filter((u) => u && typeof u === 'object' && u.email);
        if (validUsers.length === 0) {
            console.warn('[UserStore] Không có user hợp lệ, reset về mặc định');
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
            return DEFAULT_USERS;
        }

        // Ensure all users have required fields
        let needsSave = validUsers.length !== parsed.length;
        const fixed = validUsers.map((u) => {
            const updated = { ...u };
            if (updated.isActive === undefined) { updated.isActive = true; needsSave = true; }
            if (!updated.role) { updated.role = 'staff'; needsSave = true; }
            if (!updated.id) { updated.id = String(Date.now()); needsSave = true; }
            if (!updated.permissions) { updated.permissions = DEFAULT_PERMISSIONS[updated.role] || DEFAULT_PERMISSIONS.staff; needsSave = true; }
            return updated;
        });
        if (needsSave) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(fixed));
        }
        return fixed;
    } catch (e) {
        console.error('[UserStore] Error parsing users, reset về mặc định:', e);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }
}

// Get all users
export function getUsers() {
    return initUsers();
}

// Get user by email
export function getUserByEmail(email) {
    if (!email) return null;
    const users = getUsers();
    return users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
}

// Get user by ID
export function getUserById(id) {
    const users = getUsers();
    return users.find((u) => u.id === id) || null;
}

// Authenticate user
export function authenticateUser(email, password) {
    const user = getUserByEmail(email);
    if (!user) {
        return { success: false, error: 'Email không tồn tại!' };
    }
    if (!user.isActive) {
        return { success: false, error: 'Tài khoản đã bị vô hiệu hóa!' };
    }
    if (user.password !== password) {
        return { success: false, error: 'Mật khẩu không đúng!' };
    }
    return { success: true, user };
}

// Create new user (admin only)
export function createUser({ email, password, displayName, role = 'staff', phoneNumber = '', department = '', permissions }) {
    const users = getUsers();

    // Check duplicate email
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email đã tồn tại!');
    }

    const newUser = {
        id: String(Date.now()),
        email,
        password,
        displayName,
        role,
        permissions: permissions || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.staff,
        phoneNumber,
        department,
        isActive: true,
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    syncToServer();
    return newUser;
}

// Update user
export function updateUser(id, data) {
    const users = getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
        throw new Error('Không tìm thấy người dùng!');
    }

    // Check duplicate email if changing email
    if (data.email && data.email !== users[index].email) {
        if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
            throw new Error('Email đã tồn tại!');
        }
    }

    users[index] = { ...users[index], ...data };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    syncToServer();
    return users[index];
}

// Delete user (cannot delete admin)
export function deleteUser(id) {
    const users = getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) {
        throw new Error('Không tìm thấy người dùng!');
    }
    if (user.role === 'admin' && users.filter((u) => u.role === 'admin').length === 1) {
        throw new Error('Không thể xóa tài khoản admin duy nhất!');
    }

    const filtered = users.filter((u) => u.id !== id);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
    syncToServer();
    return true;
}

// Toggle user active status
export function toggleUserActive(id) {
    const users = getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
        throw new Error('Không tìm thấy người dùng!');
    }
    users[index].isActive = !users[index].isActive;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    syncToServer();
    return users[index];
}
