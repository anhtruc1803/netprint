import { useState, useCallback, useEffect } from 'react';

import { syncToServer } from '../data-seeder';
import { getUserById, updateUser as updateUserStore } from '../user-store';
import { useAuthContext } from './use-auth-context';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'netprint_user_profile';

const DEFAULT_USER = {
  id: '1',
  displayName: 'NetPrint User',
  email: '',
  photoURL: '/logo/logo-icon.png',
  phoneNumber: '',
  country: 'Vietnam',
  address: '',
  state: 'Hồ Chí Minh',
  city: '',
  zipCode: '',
  about: '',
  role: 'staff',
  isPublic: true,
};

// Ảnh từ mock data (api.minimals.cc) → cần block
function isMockPhoto(url) {
  if (!url) return false;
  return url.includes('api.minimals.cc') || url.includes('minimals.cc');
}

/**
 * Lấy profile user đang đăng nhập
 * Giữ ảnh riêng của user, chỉ block ảnh mock
 */
function buildUserProfile(authUser) {
  if (!authUser) return DEFAULT_USER;

  const storedUser = getUserById(authUser.id) || {};

  // Profile mở rộng per user ID (ảnh, địa chỉ...)
  let extraProfile = {};
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${authUser.id}`);
    if (saved) extraProfile = JSON.parse(saved);
  } catch (e) { /* ignore */ }

  // Fallback lên key cũ (không có _id) nếu chưa có per-user
  if (Object.keys(extraProfile).length === 0) {
    try {
      const oldSaved = localStorage.getItem(STORAGE_KEY);
      if (oldSaved) extraProfile = JSON.parse(oldSaved);
    } catch (e) { /* ignore */ }
  }

  // photoURL: giữ ảnh riêng, chỉ block mock
  let photoURL = extraProfile.photoURL || DEFAULT_USER.photoURL;
  if (isMockPhoto(photoURL)) {
    photoURL = DEFAULT_USER.photoURL;
  }

  return {
    ...DEFAULT_USER,
    phoneNumber: storedUser.phoneNumber || '',
    department: storedUser.department || '',
    ...extraProfile,
    id: authUser.id,
    email: authUser.email || storedUser.email || DEFAULT_USER.email,
    displayName: storedUser.displayName || authUser.displayName || DEFAULT_USER.displayName,
    role: authUser.role || storedUser.role || DEFAULT_USER.role,
    permissions: authUser.permissions || storedUser.permissions || [],
    photoURL,
  };
}

export function saveUserProfile(userId, data) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(data));

    const coreFields = {};
    if (data.displayName) coreFields.displayName = data.displayName;
    if (data.phoneNumber !== undefined) coreFields.phoneNumber = data.phoneNumber;
    if (data.department !== undefined) coreFields.department = data.department;
    if (Object.keys(coreFields).length > 0) {
      try { updateUserStore(userId, coreFields); } catch (e) { /* ignore */ }
    }

    syncToServer();
    return true;
  } catch (e) {
    console.error('Error saving user profile:', e);
    return false;
  }
}

export function useMockedUser() {
  const { user: authUser } = useAuthContext();
  const [user, setUser] = useState(() => buildUserProfile(authUser));

  // Khi auth user thay đổi (login/logout/switch) → cập nhật profile
  useEffect(() => {
    setUser(buildUserProfile(authUser));
  }, [authUser?.id, authUser?.role, authUser?.displayName, authUser?.email]);

  const updateUser = useCallback((data) => {
    if (!authUser?.id) return;
    const updated = { ...user, ...data };
    saveUserProfile(authUser.id, data);
    setUser(updated);
  }, [user, authUser?.id]);

  return { user, updateUser };
}
