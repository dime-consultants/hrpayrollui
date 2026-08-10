import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import { Spinner } from "./components/ui.jsx";

import Login from "./pages/Login.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";
import PasswordResetConfirm from "./pages/PasswordResetConfirm.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Organization from "./pages/Organization.jsx";
import Users from "./pages/Users.jsx";
import Uploads from "./pages/Uploads.jsx";
import Deductions from "./pages/Deductions.jsx";
import Batches from "./pages/Batches.jsx";
import BatchDetail from "./pages/BatchDetail.jsx";
import Records from "./pages/Records.jsx";
import LoanRequests from "./pages/LoanRequests.jsx";
import LoanUploadDetail from "./pages/LoanUploadDetail.jsx";
import CustomerRegistrations from "./pages/CustomerRegistrations.jsx";
import LoanBatches from "./pages/LoanBatches.jsx";
import LoanBatchDetail from "./pages/LoanBatchDetail.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";

function FullPageLoader() {
  return (
    <div className="full-page-loader">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <AppLayout>{children}</AppLayout>;
}

function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/password/reset"
        element={
          <PublicOnly>
            <PasswordReset />
          </PublicOnly>
        }
      />
      <Route
        path="/password/reset/confirm"
        element={
          <PublicOnly>
            <PasswordResetConfirm />
          </PublicOnly>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/organization"
        element={
          <Protected>
            <Organization />
          </Protected>
        }
      />
      <Route
        path="/users"
        element={
          <Protected>
            <Users />
          </Protected>
        }
      />
      <Route
        path="/uploads"
        element={
          <Protected>
            <Uploads />
          </Protected>
        }
      />
      <Route
        path="/deductions"
        element={
          <Protected>
            <Deductions />
          </Protected>
        }
      />
      <Route
        path="/batches"
        element={
          <Protected>
            <Batches />
          </Protected>
        }
      />
      <Route
        path="/batches/:id"
        element={
          <Protected>
            <BatchDetail />
          </Protected>
        }
      />
      <Route
        path="/records"
        element={
          <Protected>
            <Records />
          </Protected>
        }
      />
      <Route
        path="/loan-requests"
        element={
          <Protected>
            <LoanRequests />
          </Protected>
        }
      />
      <Route
        path="/loan-requests/:id"
        element={
          <Protected>
            <LoanUploadDetail />
          </Protected>
        }
      />
      <Route
        path="/customers"
        element={
          <Protected>
            <CustomerRegistrations />
          </Protected>
        }
      />
      <Route
        path="/loan-batches"
        element={
          <Protected>
            <LoanBatches />
          </Protected>
        }
      />
      <Route
        path="/loan-batches/:id"
        element={
          <Protected>
            <LoanBatchDetail />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <Profile />
          </Protected>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
