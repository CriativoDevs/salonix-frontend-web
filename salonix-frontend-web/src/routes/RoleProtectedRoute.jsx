import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStaff } from '../hooks/useStaff';
import { useTenant } from '../hooks/useTenant';
import { useMemo } from 'react';

function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { slug, profile, loading: tenantLoading } = useTenant();
  console.log('[RoleProtectedRoute] Tenant slug:', slug);
  const {
    staff,
    loading: staffLoading,
    error: staffError,
    forbidden,
  } = useStaff({ slug });
  console.log('[RoleProtectedRoute] Staff hook result:', {
    staff,
    loading: staffLoading,
    error: staffError,
    forbidden,
  });

  const currentUserRole = useMemo(() => {
    if (!user) {
      console.log('[RoleProtectedRoute] No user data');
      return null;
    }

    // Se não há dados de staff ou houve erro (403/429/etc.), usar fallback estrito
    if (
      staffError ||
      forbidden ||
      !Array.isArray(staff) ||
      staff.length === 0
    ) {
      console.log('[RoleProtectedRoute] No staff data, using strict fallback');

      // Admin users get owner role
      const email =
        typeof user.email === 'string' ? user.email.toLowerCase() : null;
      const username =
        typeof user.username === 'string' ? user.username.toLowerCase() : null;

      if (email === 'admin@demo.local' || username === 'admin') {
        console.log(
          '[RoleProtectedRoute] Admin user detected, assigning owner role'
        );
        return 'owner';
      }

      // Fallback: considerar owner quando email do usuário coincide com o email do perfil do tenant
      const tenantOwnerEmail =
        typeof profile?.email === 'string' ? profile.email.toLowerCase() : null;
      if (email && tenantOwnerEmail && email === tenantOwnerEmail) {
        console.log(
          '[RoleProtectedRoute] Owner detected via tenant profile email'
        );
        return 'owner';
      }
      return null;
    }

    const email =
      typeof user.email === 'string' ? user.email.toLowerCase() : null;
    const username =
      typeof user.username === 'string' ? user.username.toLowerCase() : null;

    console.log('[RoleProtectedRoute] User data:', { email, username });
    console.log('[RoleProtectedRoute] Staff array:', staff);

    const match = staff.find((member) => {
      const memberEmail =
        typeof member.email === 'string' ? member.email.toLowerCase() : null;
      const memberUsername =
        typeof member.username === 'string'
          ? member.username.toLowerCase()
          : null;

      return (
        (email && memberEmail === email) ||
        (username && memberUsername === username)
      );
    });

    console.log('[RoleProtectedRoute] Match found:', match);
    if (match?.role) return match.role;

    // Sem match e sem confirmação pelo perfil do tenant: negar
    return null;
  }, [staff, user, forbidden, staffError, profile?.email]);

  if (isLoading || staffLoading || tenantLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUserRole || !allowedRoles.includes(currentUserRole)) {
    console.log('[RoleProtectedRoute] Access denied:', {
      currentUserRole,
      allowedRoles,
      hasRole: !!currentUserRole,
      isAllowed: currentUserRole && allowedRoles.includes(currentUserRole),
    });
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleProtectedRoute;
