import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Navbar } from './components/Navbar'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { BookingsPage } from './pages/BookingsPage'
import { ApprovalsPage } from './pages/ApprovalsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { UsersPage } from './pages/UsersPage'

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 ml-60 p-6 lg:p-8 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes with sidebar layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute roles={['SUPER_ADMIN', 'DEPT_ADMIN']}>
                  <ApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route
              path="/users"
              element={
                <ProtectedRoute roles={['SUPER_ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
