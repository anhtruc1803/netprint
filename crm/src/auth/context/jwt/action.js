import { setSession } from './utils';
import { authenticateUser } from '../../user-store';

// ----------------------------------------------------------------------

// Unicode-safe base64 encode (supports Vietnamese & other non-Latin1 chars)
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Simple JWT token generator (for local use only)
function generateLocalToken(user) {
  const header = utf8ToBase64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = utf8ToBase64(JSON.stringify({
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
