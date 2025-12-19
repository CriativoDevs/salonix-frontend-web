import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PlanProtectedRoute from './PlanProtectedRoute';
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
import Agenda from '../pages/Agenda';

import Customers from '../pages/Customers';
import Team from '../pages/Team';
import Reports from '../pages/Reports';
import Feedback from '../pages/Feedback';
import Settings from '../pages/Settings';
import Plans from '../pages/Plans';
import PlanCheckoutMock from '../pages/PlanCheckoutMock';
import BillingSuccess from '../pages/BillingSuccess';
import ClientEnter from '../pages/ClientEnter';
import ClientAccess from '../pages/ClientAccess';
import ClientPrivateRoute from './ClientPrivateRoute';
import ClientDashboard from '../pages/ClientDashboard';
import ClientProfile from '../pages/ClientProfile';
import ClientAppointments from '../pages/ClientAppointments';
import ClientBookingPage from '../pages/ClientBookingPage';
import RegisterCheckout from '../pages/RegisterCheckout';
import PlanOnboarding from '../pages/PlanOnboarding';
import { OpsAuthProvider } from '../contexts/OpsAuthContext';
import OpsLogin from '../pages/ops/Login';
import OpsDashboard from '../pages/ops/Dashboard';
import OpsTenantsList from '../pages/ops/TenantsList';
import OpsTenantDetail from '../pages/ops/TenantDetail';
import OpsSupport from '../pages/ops/Support';
import OpsUsers from '../pages/ops/Users';
import OpsLayout from '../layouts/OpsLayout';
import OpsPrivateRoute from './OpsPrivateRoute';

function Router() {
  return (
    <Routes>
      {/* Ops Console Routes - Isolated Scope */}
      <Route
        path="/ops/*"
        element={
          <OpsAuthProvider>
            <Routes>
              <Route path="login" element={<OpsLogin />} />
              <Route
                element={
                  <OpsPrivateRoute>
                    <OpsLayout />
                  </OpsPrivateRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<OpsDashboard />} />
                <Route path="tenants" element={<OpsTenantsList />} />
                <Route path="tenants/:id" element={<OpsTenantDetail />} />
                <Route path="support" element={<OpsSupport />} />
                <Route path="users" element={<OpsUsers />} />
              </Route>
            </Routes>
          </OpsAuthProvider>
        }
      />

      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/staff/accept" element={<StaffInviteAccept />} />
      <Route path="/client/enter" element={<ClientEnter />} />
      <Route path="/client/access" element={<ClientAccess />} />
      <Route
        path="/client/dashboard"
        element={
          <ClientPrivateRoute>
            <ClientDashboard />
          </ClientPrivateRoute>
        }
      />
      <Route
        path="/client/profile"
        element={
          <ClientPrivateRoute>
            <ClientProfile />
          </ClientPrivateRoute>
        }
      />
      <Route
        path="/client/appointments"
        element={
          <ClientPrivateRoute>
            <ClientAppointments />
          </ClientPrivateRoute>
        }
      />
      <Route
        path="/client/agendar"
        element={
          <ClientPrivateRoute>
            <ClientBookingPage />
          </ClientPrivateRoute>
        }
      />

      <Route
        path="/register/checkout"
        element={
          <PrivateRoute>
            <RegisterCheckout />
          </PrivateRoute>
        }
      />

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
        path="/agenda"
        element={
          <PrivateRoute>
            <Agenda />
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
        path="/feedback"
        element={
          <PrivateRoute>
            <RoleProtectedRoute allowedRoles={['owner']}>
              <Feedback />
            </RoleProtectedRoute>
          </PrivateRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <RoleProtectedRoute allowedRoles={['owner']}>
              <PlanProtectedRoute featureKey="enableReports">
                <Reports />
              </PlanProtectedRoute>
            </RoleProtectedRoute>
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
        path="/onboarding/plan"
        element={
          <PrivateRoute>
            <PlanOnboarding />
          </PrivateRoute>
        }
      />

      <Route
        path="/billing/success"
        element={
          <PrivateRoute>
            <BillingSuccess />
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
