import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AppProviders } from './components/providers/AppProviders'
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/auth'
import { DashboardLayout, AuthLayout } from './components/layout'
import { ErrorBoundary, PageLoading } from './components/ui'
import { RouteErrorBoundary } from './components/ui/RouteErrorBoundary'

// Lazy load pages for better performance and code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const OAuthSuccessPage = lazy(() => import('./pages/OAuthSuccessPage').then(m => ({ default: m.OAuthSuccessPage })))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const ResumeUploadPage = lazy(() => import('./pages/ResumeUploadPage').then(m => ({ default: m.ResumeUploadPage })))
const ResumeListPage = lazy(() => import('./pages/ResumeListPage').then(m => ({ default: m.ResumeListPage })))
const ResumeAnalysisPage = lazy(() => import('./pages/ResumeAnalysisPage').then(m => ({ default: m.ResumeAnalysisPage })))
const ResumeComparisonPage = lazy(() => import('./pages/ResumeComparisonPage').then(m => ({ default: m.ResumeComparisonPage })))
const CoverLetterPage = lazy(() => import('./pages/CoverLetterPage').then(m => ({ default: m.CoverLetterPage })))
const CoverLetterListPage = lazy(() => import('./pages/CoverLetterListPage').then(m => ({ default: m.CoverLetterListPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const CoverLetterAnalyticsPage = lazy(() => import('./pages/CoverLetterAnalyticsPage').then(m => ({ default: m.CoverLetterAnalyticsPage })))

// Component to handle catch-all route with auth-aware redirect
const NavigateWithAuth = () => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return null // Will be handled by loading states
  }
  
  // Redirect authenticated users to dashboard, others to landing
  return <Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />
}

function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <Router>
                <div className="App">
                  <Suspense fallback={<PageLoading message="Loading page..." />}>
                  <Routes>
              {/* Landing/Public Routes */}
              <Route path="/" element={<LandingPage />} />

              {/* Auth Routes */}
              <Route path="/" element={<AuthLayout />}>
                <Route 
                  path="login" 
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="register" 
                  element={
                    <PublicRoute>
                      <RegisterPage />
                    </PublicRoute>
                  } 
                />
                {/* 🟡 OAuth integration - OAuth success handler */}
                <Route 
                  path="oauth-success" 
                  element={
                    <PublicRoute>
                      <OAuthSuccessPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="verify-email" 
                  element={
                    <PublicRoute>
                      <VerifyEmailPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="forgot-password" 
                  element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="reset-password" 
                  element={
                    <PublicRoute>
                      <ResetPasswordPage />
                    </PublicRoute>
                  } 
                />
              </Route>

              {/* Protected Dashboard Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="dashboard layout">
                      <DashboardLayout />
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<RouteErrorBoundary routeName="dashboard"><DashboardPage /></RouteErrorBoundary>} />
                <Route path="profile" element={<RouteErrorBoundary routeName="profile"><ProfilePage /></RouteErrorBoundary>} />
                <Route path="resumes" element={<RouteErrorBoundary routeName="resume list"><ResumeListPage /></RouteErrorBoundary>} />
                <Route path="resumes/upload" element={<RouteErrorBoundary routeName="resume upload"><ResumeUploadPage /></RouteErrorBoundary>} />
                <Route path="resumes/compare" element={<RouteErrorBoundary routeName="resume comparison"><ResumeComparisonPage /></RouteErrorBoundary>} />
                <Route path="resumes/:id" element={<RouteErrorBoundary routeName="resume analysis"><ResumeAnalysisPage /></RouteErrorBoundary>} />
                <Route path="resumes/:id/analysis/:analysisId" element={<RouteErrorBoundary routeName="resume analysis"><ResumeAnalysisPage /></RouteErrorBoundary>} />
                <Route path="cover-letters" element={<RouteErrorBoundary routeName="cover letter list"><CoverLetterListPage /></RouteErrorBoundary>} />
                <Route path="cover-letters/new" element={<RouteErrorBoundary routeName="cover letter editor"><CoverLetterPage /></RouteErrorBoundary>} />
                <Route path="cover-letters/analytics" element={<RouteErrorBoundary routeName="cover letter analytics"><CoverLetterAnalyticsPage /></RouteErrorBoundary>} />
                <Route path="cover-letters/:id" element={<RouteErrorBoundary routeName="cover letter editor"><CoverLetterPage /></RouteErrorBoundary>} />
              </Route>

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <RouteErrorBoundary routeName="admin panel">
                      <DashboardLayout />
                    </RouteErrorBoundary>
                  </AdminRoute>
                }
              >
                <Route index element={<RouteErrorBoundary routeName="admin page"><AdminPage /></RouteErrorBoundary>} />
              </Route>

                {/* Catch all route - redirects based on auth status */}
                <Route path="*" element={<NavigateWithAuth />} />
              </Routes>
                  </Suspense>
                </div>
              </Router>
      </AppProviders>
    </ErrorBoundary>
  )
}

export default App
