import React from "react";
import NotFound from "../pages/NotFound/NotFound";
import { useAuth } from "../auth/useAuth";

/**
 * RBAC Protected Route cho schema:
 * users - user_roles - roles
 * roles - role_permissions - permissions
 */
export default function ProtectedRoute({
    children,
    requireRoles = [],        // yêu cầu user phải có role nào đó
    requirePermissions = [],  // yêu cầu permission
    requireAllRoles = false,  // true = cần tất cả role
    requireAllPermissions = true,
}) {
    const { user, loading } = useAuth() ?? { user: null, loading: false };

    if (loading) return null;
    
    if (!user) {
        return <NotFound />;
    }

    const userRoles = user.roles ?? [];
    const userPermissions = user.permissions ?? [];

    // Check Roles
    if (requireRoles.length > 0) {
        const hasAllRoles = requireRoles.every((role) => userRoles.includes(role));
        const hasAnyRole = requireRoles.some((role) => userRoles.includes(role));
        const allowed = requireAllRoles ? hasAllRoles : hasAnyRole;

        if (!allowed) return <NotFound />;
    }

    // Check Permissions
    if (requirePermissions.length > 0) {
        const hasAll = requirePermissions.every((p) => userPermissions.includes(p));
        const hasAny = requirePermissions.some((p) => userPermissions.includes(p));
        const allowed = requireAllPermissions ? hasAll : hasAny;

        if (!allowed) return <NotFound />;
    }

    return children;
}
