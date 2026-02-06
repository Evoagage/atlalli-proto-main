import { UserProfile, Location, UserRole } from '@/store/types';

/**
 * Calculates the effective role for a user at a given location.
 * If the user's role is location-dependent (manager, bartender) and they are
 * outside their assigned scope, they revert to 'subscriber' (standard).
 */
export function getEffectiveRole(session: UserProfile | null, currentLocation: Location | null): UserRole {
    if (!session) return 'anonymous';

    // Super Admin always has global access
    if (session.role === 'super_admin') return 'super_admin';

    // Non-privileged roles are not scoped
    if (!['manager', 'bartender'].includes(session.role)) {
        return session.role;
    }

    // If no scope is defined, assume standard
    if (!session.scope) return 'subscriber';

    // Global scope (though usually reserved for super_admin)
    if (session.scope.type === 'global') return session.role;

    // Scoped permissions require a location
    if (!currentLocation) return 'subscriber';

    if (session.scope.type === 'location') {
        return session.scope.id === currentLocation.id ? session.role : 'subscriber';
    }

    if (session.scope.type === 'group') {
        return session.scope.id === currentLocation.groupId ? session.role : 'subscriber';
    }

    return 'subscriber';
}

/**
 * Checks if a user has access to a specific screen/feature based on current location.
 */
export function canAccess(session: UserProfile | null, currentLocation: Location | null, permission: 'scanner' | 'manager' | 'super_admin'): boolean {
    const role = getEffectiveRole(session, currentLocation);

    if (permission === 'super_admin') return role === 'super_admin';

    // Super-admins are strictly forbidden from scanner/manager functions to avoid misuse of business data
    if (role === 'super_admin') return false;

    if (permission === 'manager') return role === 'manager';
    if (permission === 'scanner') return ['bartender', 'manager'].includes(role);

    return false;
}
