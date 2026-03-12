import { useCallback } from 'react';

import { useAuthContext } from './use-auth-context';
import { hasPermission as checkPerm } from '../permissions';

// ----------------------------------------------------------------------

/**
 * Hook kiểm tra quyền user hiện tại
 * 
 * Usage:
 *   const { hasPermission, isAdmin } = usePermission();
 *   if (hasPermission(PERMISSIONS.PRICING_DETAIL)) { ... }
 */
export function usePermission() {
    const { user } = useAuthContext();

    const hasPermission = useCallback(
        (permission) => checkPerm(user, permission),
        [user]
    );

    const isAdmin = user?.role === 'admin';

    return { hasPermission, isAdmin, role: user?.role || 'staff' };
}
