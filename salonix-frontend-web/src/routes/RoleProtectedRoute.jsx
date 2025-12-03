import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStaff } from '../hooks/useStaff';
import { useTenant } from '../hooks/useTenant';
import { useMemo } from 'react';

function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { slug } = useTenant();
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

    // Se não há dados de staff ou houve erro (403/429/etc.), usar fallback
    if (
      staffError ||
      forbidden ||
      !Array.isArray(staff) ||
      staff.length === 0
    ) {
      console.log(
        '[RoleProtectedRoute] No staff data, using user-based fallback'
      );

      // Fallback: assumir que usuários específicos têm roles específicas
      const email =
        typeof user.email === 'string' ? user.email.toLowerCase() : null;
      const username =
        typeof user.username === 'string' ? user.username.toLowerCase() : null;

      // Admin users get owner role
      if (email === 'admin@demo.local' || username === 'admin') {
        console.log(
          '[RoleProtectedRoute] Admin user detected, assigning owner role'
        );
        return 'owner';
      }

      // Manager users get manager role
      if (email?.includes('manager') || username?.includes('manager')) {
        console.log(
          '[RoleProtectedRoute] Manager user detected, assigning manager role'
        );
        return 'manager';
      }

      // Pro users get manager role (for demo purposes)
      if (email?.includes('pro_') || username?.includes('pro_')) {
        console.log(
          '[RoleProtectedRoute] Pro user detected, assigning manager role'
        );
        return 'manager';
      }

      // Ambiente dev: permitir acesso de owner quando staff API bloqueia ou erro
      if (staffError || forbidden) {
        console.log(
          '[RoleProtectedRoute] Staff API forbidden; granting owner role in dev fallback'
        );
        return 'owner';
      }
      console.log(
        '[RoleProtectedRoute] Default user, assigning collaborator role'
      );
      return 'collaborator';
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
    return match?.role || null;
  }, [staff, user, forbidden, staffError]);

  if (isLoading || staffLoading) {
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
