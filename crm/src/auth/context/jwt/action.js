import { setSession } from './utils';
import { JWT_STORAGE_KEY } from './constant';
import { authenticateUser } from '../../user-store';

// ----------------------------------------------------------------------

// Simple JWT token generator (for local use only)
function generateLocalToken(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role || 'staff',
    department: user.department || '',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  }));
  return `${header}.${payload}.local-signature`;
}

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    const result = authenticateUser(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
    const accessToken = generateLocalToken(result.user);
    setSession(accessToken);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, password, firstName, lastName }) => {
  try {
    throw new Error('Tính năng đăng ký đã bị tắt. Liên hệ admin để được cấp tài khoản.');
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
