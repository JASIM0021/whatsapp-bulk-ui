import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { useAuth } from './contexts/AuthContext'
import { LandingLayout } from './components/landing/LandingLayout'
import { HomePage } from './components/landing/HomePage'
import { LoginPage } from './components/auth/LoginPage'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsConditions } from './pages/TermsConditions'
import { RefundPolicy } from './pages/RefundPolicy'
import { SubscriptionPage } from './pages/SubscriptionPage'
import { DevDocsPage } from './pages/DevDocsPage'
import { AdminPanel } from './pages/AdminPanel'
import { PaymentSuccess, PaymentFailure } from './pages/PaymentResult'
import { BotSetupPage } from './pages/BotSetupPage'
import { BotDetectionPage } from './pages/BotDetectionPage'
import { SecurityPage } from './pages/SecurityPage'
import { ContactPage } from './pages/ContactPage'
import { AboutPage } from './pages/AboutPage'
import { EmailPage } from './pages/EmailPage'
import { WebsiteChatbotSetupPage } from './pages/WebsiteChatbotSetupPage'
import { WebsiteChatbotLeadsPage } from './pages/WebsiteChatbotLeadsPage'
import { WebsiteChatbotEmbedPage } from './pages/WebsiteChatbotEmbedPage'
import { DashboardPage } from './pages/DashboardPage'
import { SessionsPage } from './pages/SessionsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  // If already logged in and visiting login, redirect to app
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://nexbotix.todayintech.in/api/website-chatbot/script?apikey=bsk_9db5bdcaf9b80908495b62d7c42223d4';
    s.async = true;
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, []);
  return (
    <Routes>
      {/* Public landing pages */}
      <Route path="/" element={<LandingLayout><HomePage /></LandingLayout>} />
      <Route path="/privacy" element={<LandingLayout><PrivacyPolicy /></LandingLayout>} />
      <Route path="/terms" element={<LandingLayout><TermsConditions /></LandingLayout>} />
      <Route path="/refund" element={<LandingLayout><RefundPolicy /></LandingLayout>} />
      <Route path="/docs" element={<LandingLayout><DevDocsPage /></LandingLayout>} />
      <Route path="/contact" element={<LandingLayout><ContactPage /></LandingLayout>} />
      <Route path="/about" element={<LandingLayout><AboutPage /></LandingLayout>} />

      {/* Login / Signup */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Payment result pages (accessible without auth - user returns from PayU) */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failure" element={<PaymentFailure />} />

      {/* Protected routes */}
      <Route path="/subscription" element={
        <ProtectedRoute><SubscriptionPage /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute><AdminPanel /></ProtectedRoute>
      } />
      <Route path="/bot" element={
        <ProtectedRoute><BotSetupPage /></ProtectedRoute>
      } />
      <Route path="/bot/detection" element={
        <ProtectedRoute><BotDetectionPage /></ProtectedRoute>
      } />
      <Route path="/security" element={
        <ProtectedRoute><SecurityPage /></ProtectedRoute>
      } />
      <Route path="/sessions" element={
        <ProtectedRoute><SessionsPage /></ProtectedRoute>
      } />
      <Route path="/email" element={
        <ProtectedRoute>
          <AppProvider>
            <EmailPage />
          </AppProvider>
        </ProtectedRoute>
      } />
      <Route path="/website-chatbot" element={
        <ProtectedRoute><WebsiteChatbotSetupPage /></ProtectedRoute>
      } />
      <Route path="/website-chatbot/leads" element={
        <ProtectedRoute><WebsiteChatbotLeadsPage /></ProtectedRoute>
      } />
      <Route path="/website-chatbot/embed" element={
        <ProtectedRoute><WebsiteChatbotEmbedPage /></ProtectedRoute>
      } />
      <Route path="/app" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/whatsapp" element={
        <ProtectedRoute>
          <AppProvider>
            <App />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
