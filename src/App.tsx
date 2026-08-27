import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { Spinner } from './components/ui/Spinner';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { DemoProvider } from './context/DemoContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Journey   = lazy(() => import('./pages/Journey'));
const Learn     = lazy(() => import('./pages/Learn'));
const Companion = lazy(() => import('./pages/Companion'));
const Emergency = lazy(() => import('./pages/Emergency'));
const Settings  = lazy(() => import('./pages/Settings'));
const Login     = lazy(() => import('./pages/Login'));

// ─── Loading fallback ─────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <DemoProvider>
          <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* App routes (authenticated shell) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index            element={<Dashboard />} />
              <Route path="journey"   element={<Journey />}   />
              <Route path="learn"     element={<Learn />}     />
              <Route path="companion" element={<Companion />} />
              <Route path="emergency" element={<Emergency />} />
              <Route path="settings"  element={<Settings />}  />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Suspense>
        </DemoProvider>
      </AppProvider>
    </AuthProvider>
  );
}
