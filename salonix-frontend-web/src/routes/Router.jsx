import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RoleProtectedRoute from './RoleProtectedRoute';
import Dashboard from '../pages/Dashboard';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Services from '../pages/Services';
import StaffInviteAccept from '../pages/StaffInviteAccept';
import AvailableSlots from '../pages/AvailableSlots';
import Bookings from '../pages/Bookings';

import Customers from '../pages/Customers';
import Team from '../pages/Team';
// Chat e Feedback desativados até backend estar pronto
import Settings from '../pages/Settings';
import Plans from '../pages/Plans';
import PlanCheckoutMock from '../pages/PlanCheckoutMock';

function Router() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/staff/accept" element={<StaffInviteAccept />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/services"
        element={
          <PrivateRoute>
            <RoleProtectedRoute allowedRoles={['owner', 'manager']}>
              <Services />
            </RoleProtectedRoute>
          </PrivateRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <PrivateRoute>
            <Customers />
          </PrivateRoute>
        }
      />

      <Route
        path="/team"
        element={
          <PrivateRoute>
            <Team />
          </PrivateRoute>
        }
      />

      <Route
        path="/slots"
        element={
          <PrivateRoute>
            <AvailableSlots />
          </PrivateRoute>
        }
      />

      <Route
        path="/bookings"
        element={
          <PrivateRoute>
            <Bookings />
          </PrivateRoute>
        }
      />



      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <RoleProtectedRoute allowedRoles={['owner']}>
              <Settings />
            </RoleProtectedRoute>
          </PrivateRoute>
        }
      />

      <Route
        path="/plans"
        element={
          <PrivateRoute>
            <Plans />
          </PrivateRoute>
        }
      />

      <Route
        path="/checkout/mock"
        element={
          <PrivateRoute>
            <PlanCheckoutMock />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default Router;
