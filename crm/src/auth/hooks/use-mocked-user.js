import { useState, useCallback } from 'react';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'netprint_user_profile';

const DEFAULT_USER = {
  id: '1',
  displayName: 'NetPrint Admin',
  email: 'admin@netprint.vn',
  photoURL: '',
  phoneNumber: '',
  country: 'Vietnam',
  address: '',
  state: 'Hồ Chí Minh',
  city: '',
  zipCode: '',
  about: '',
  role: 'admin',
  isPublic: true,
};

function getStoredUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_USER, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error reading user profile:', e);
  }
  return DEFAULT_USER;
}

export function saveUserProfile(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Error saving user profile:', e);
    return false;
  }
}

export function useMockedUser() {
  const [user, setUser] = useState(getStoredUser);

  const updateUser = useCallback((data) => {
    const updated = { ...user, ...data };
    saveUserProfile(updated);
    setUser(updated);
  }, [user]);

  return { user, updateUser };
}
