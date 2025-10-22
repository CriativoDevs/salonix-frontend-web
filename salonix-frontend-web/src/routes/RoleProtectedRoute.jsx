import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStaff } from '../hooks/useStaff';
import { useTenant } from '../hooks/useTenant';
import { useMemo } from 'react';

function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { slug } = useTenant();
  console.log('[RoleProtectedRoute] Tenant slug:', slug);
  const { staff, loading: staffLoading, error: staffError } = useStaff({ slug });
  console.log('[RoleProtectedRoute] Staff hook result:', { staff, loading: staffLoading, error: staffError });

  const currentUserRole = useMemo(() => {
    if (!user) {
      console.log('[RoleProtectedRoute] No user data');
      return null;
    }
    
    // Se não há dados de staff (tenant 'default' ou erro), usar fallback baseado no usuário
    if (!Array.isArray(staff) || staff.length === 0) {
      console.log('[RoleProtectedRoute] No staff data, using user-based fallback');
      
      // Fallback: assumir que usuários específicos têm roles específicas
      const email = typeof user.email === 'string' ? user.email.toLowerCase() : null;
      const username = typeof user.username === 'string' ? user.username.toLowerCase() : null;
      
      // Admin users get owner role
      if (email === 'admin@demo.local' || username === 'admin') {
        console.log('[RoleProtectedRoute] Admin user detected, assigning owner role');
        return 'owner';
      }
      
      // Manager users get manager role
      if (email?.includes('manager') || username?.includes('manager')) {
        console.log('[RoleProtectedRoute] Manager user detected, assigning manager role');
        return 'manager';
      }
      
      // Pro users get manager role (for demo purposes)
      if (email?.includes('pro_') || username?.includes('pro_')) {
        console.log('[RoleProtectedRoute] Pro user detected, assigning manager role');
        return 'manager';
      }
      
      // Default to collaborator for other authenticated users
      console.log('[RoleProtectedRoute] Default user, assigning collaborator role');
      return 'collaborator';
    }
    
    const email = typeof user.email === 'string' ? user.email.toLowerCase() : null;
    const username = typeof user.username === 'string' ? user.username.toLowerCase() : null;
    
    console.log('[RoleProtectedRoute] User data:', { email, username });
    console.log('[RoleProtectedRoute] Staff array:', staff);
    
    const match = staff.find((member) => {
      const memberEmail = typeof member.email === 'string' ? member.email.toLowerCase() : null;
      const memberUsername = typeof member.username === 'string' ? member.username.toLowerCase() : null;
      
      return (
        (email && memberEmail === email) ||
        (username && memberUsername === username)
      );
    });
    
    console.log('[RoleProtectedRoute] Match found:', match);
    return match?.role || null;
  }, [staff, user]);

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
      isAllowed: currentUserRole && allowedRoles.includes(currentUserRole)
    });
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleProtectedRoute;