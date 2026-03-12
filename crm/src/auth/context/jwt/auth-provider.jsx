import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import { JWT_STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession, isValidToken } from './utils';
import { getUserById } from '../../user-store';
import { hasPermission as checkPerm, getUserPermissions } from '../../permissions';

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        // Decode user from local JWT token payload
        const parts = accessToken.split('.');
        const payload = JSON.parse(decodeURIComponent(atob(parts[1]).split('').map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join('')));

        // Lấy thông tin mới nhất từ user-store (bao gồm permissions)
        const storedUser = getUserById(payload.sub);

        const user = {
          id: payload.sub,
          email: payload.email,
          displayName: storedUser?.displayName || payload.displayName || 'NetPrint User',
          role: storedUser?.role || payload.role || 'staff',
          department: storedUser?.department || payload.department || '',
          permissions: storedUser?.permissions || [],
        };

        setState({ user: { ...user, accessToken }, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  // Helper: kiểm tra quyền
  const hasPermission = useCallback(
    (permission) => checkPerm(state.user, permission),
    [state.user]
  );

  const memoizedValue = useMemo(
    () => ({
      user: state.user ? { ...state.user, role: state.user?.role ?? 'staff' } : null,
      checkUserSession,
      hasPermission,
      permissions: state.user ? getUserPermissions(state.user) : [],
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, hasPermission, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}

