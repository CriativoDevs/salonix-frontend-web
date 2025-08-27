import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Services from '../pages/Services';
import Professionals from '../pages/Professionals';
import AvailableSlots from '../pages/AvailableSlots';

function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      {/* Redirecionamento padrão */}
      <Route
        path="/services"
        element={
          <PrivateRoute>
            <Services />
          </PrivateRoute>
        }
      />
      <Route
        path="/profissionals"
        element={
          <PrivateRoute>
            <Professionals />
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
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default Router;
