'use client'

import { StrictMode, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, StaticRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { useSetupStatus } from './hooks/useSetupStatus'

// ── Eagerly loaded (needed for first paint) ──
import { LandingLayout } from './components/landing/LandingLayout'
import { HomePage, PricingPage } from './components/landing/HomePage'
import { LoginPage } from './components/auth/LoginPage'
import { pendingPostAuthRedirect, rememberPostAuthRedirect } from './lib/postAuthRedirect'
import { WIDGET_BASE_URL } from './config/api'

// Loading spinner for lazy-loaded routes
function RouteSpinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Lazy-loaded (route-level code splitting) ──
const App = lazy(() => import('./App.tsx'))
const PrivacyPolicy = lazy(() => import('./views/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })))
const TermsConditions = lazy(() => import('./views/TermsConditions').then(m => ({ default: m.TermsConditions })))
const RefundPolicy = lazy(() => import('./views/RefundPolicy').then(m => ({ default: m.RefundPolicy })))
const SubscriptionPage = lazy(() => import('./views/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })))
const DevDocsPage = lazy(() => import('./views/DevDocsPage').then(m => ({ default: m.DevDocsPage })))
const AdminPanel = lazy(() => import('./views/AdminPanel').then(m => ({ default: m.AdminPanel })))
const PaymentSuccess = lazy(() => import('./views/PaymentResult').then(m => ({ default: m.PaymentSuccess })))
const PaymentFailure = lazy(() => import('./views/PaymentResult').then(m => ({ default: m.PaymentFailure })))
const BotSetupPage = lazy(() => import('./views/BotSetupPage').then(m => ({ default: m.BotSetupPage })))
const BotDetectionPage = lazy(() => import('./views/BotDetectionPage').then(m => ({ default: m.BotDetectionPage })))
const SecurityPage = lazy(() => import('./views/SecurityPage').then(m => ({ default: m.SecurityPage })))
const ContactPage = lazy(() => import('./views/ContactPage').then(m => ({ default: m.ContactPage })))
const AboutPage = lazy(() => import('./views/AboutPage').then(m => ({ default: m.AboutPage })))
const EmailPage = lazy(() => import('./views/EmailPage').then(m => ({ default: m.EmailPage })))
const LeadsPage = lazy(() => import('./views/LeadsPage').then(m => ({ default: m.LeadsPage })))
const WebsiteChatbotSetupPage = lazy(() => import('./views/WebsiteChatbotSetupPage').then(m => ({ default: m.WebsiteChatbotSetupPage })))
const WebsiteChatbotLeadsPage = lazy(() => import('./views/WebsiteChatbotLeadsPage').then(m => ({ default: m.WebsiteChatbotLeadsPage })))
const WebsiteChatbotEmbedPage = lazy(() => import('./views/WebsiteChatbotEmbedPage').then(m => ({ default: m.WebsiteChatbotEmbedPage })))
const DashboardPage = lazy(() => import('./views/DashboardPage').then(m => ({ default: m.DashboardPage })))
const SessionsPage = lazy(() => import('./views/SessionsPage').then(m => ({ default: m.SessionsPage })))
const CheckChatbotPage = lazy(() => import('./views/CheckChatbotPage').then(m => ({ default: m.CheckChatbotPage })))
const ChatbotDemoPage = lazy(() => import('./views/ChatbotDemoPage').then(m => ({ default: m.ChatbotDemoPage })))
// const BotOnboardingModal = lazy(() => import('./components/onboarding/BotOnboardingModal').then(m => ({ default: m.BotOnboardingModal })))
const SetupPage = lazy(() => import('./views/SetupPage').then(m => ({ default: m.SetupPage })))
const DataDeletionPage = lazy(() => import('./views/DataDeletionPage').then(m => ({ default: m.DataDeletionPage })))
const FacebookPage = lazy(() => import('./views/facebook/FacebookPage').then(m => ({ default: m.FacebookPage })))
const FacebookCallbackPage = lazy(() => import('./views/facebook/FacebookCallbackPage').then(m => ({ default: m.FacebookCallbackPage })))
const LinkedInPage = lazy(() => import('./views/linkedin/LinkedInPage').then(m => ({ default: m.LinkedInPage })))
const LinkedInApprovePage = lazy(() => import('./views/linkedin/LinkedInApprovePage').then(m => ({ default: m.LinkedInApprovePage })))
const SEOPage = lazy(() => import('./views/seo/SEOPage').then(m => ({ default: m.SEOPage })))
const SEOBlogCallbackPage = lazy(() => import('./views/seo/SEOBlogCallbackPage').then(m => ({ default: m.SEOBlogCallbackPage })))
const CampaignPage = lazy(() => import('@/views/CampaignPage').then(m => ({ default: m.CampaignPage })))
const InfluencerDashboard = lazy(() => import('@/views/influencer/InfluencerDashboard'))
const DeveloperPage = lazy(() => import('./views/DeveloperPage').then(m => ({ default: m.DeveloperPage })))
const BlogPage = lazy(() => import('./views/BlogPage'))
const BlogCategoryPage = lazy(() => import('./views/BlogPage').then(m => ({ default: m.BlogCategoryPage })))
const AgentHubPage = lazy(() => import('./views/AgentHubPage').then(m => ({ default: m.AgentHubPage })))
const AgentHubIndexPage = lazy(() => import('./views/AgentHubPage').then(m => ({ default: m.AgentHubIndexPage })))
const BlogPostPage = lazy(() => import('./views/BlogPostPage'))
const MCPOAuthApprovePage = lazy(() => import('./views/MCPOAuthApprovePage').then(m => ({ default: m.MCPOAuthApprovePage })))
const CalendarPage = lazy(() => import('./views/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })))
const PublicBookingPage = lazy(() => import('./views/calendar/PublicBookingPage').then(m => ({ default: m.PublicBookingPage })))
const PublicEmbedPage = lazy(() => import('./views/calendar/PublicEmbedPage').then(m => ({ default: m.PublicEmbedPage })))
const LifeCompanionPage = lazy(() => import('./views/life_companion/LifeCompanionPage').then(m => ({ default: m.LifeCompanionPage })))
const TradingWorkspacePage = lazy(() => import('./views/trading/TradingWorkspacePage').then(m => ({ default: m.TradingWorkspacePage })))
const FreelancerPage = lazy(() => import('./views/freelancer/FreelancerPage').then(m => ({ default: m.FreelancerPage })))
const YouTubeAgentPage = lazy(() => import('./views/youtube/YouTubeAgentPage').then(m => ({ default: m.YouTubeAgentPage })))
const AIWorkersPage = lazy(() => import('./views/agents/AIWorkersPage').then(m => ({ default: m.AIWorkersPage })))
const AgentStudioPage = lazy(() => import('./views/agents/AgentStudioPage').then(m => ({ default: m.AgentStudioPage })))
const CustomConnectorsPage = lazy(() => import('./views/connectors/CustomConnectorsPage').then(m => ({ default: m.CustomConnectorsPage })))
const WhatsappBusinessPage = lazy(() => import('./views/whatsapp_business/WhatsappBusinessPage').then(m => ({ default: m.WhatsappBusinessPage })))

function GmailCallbackRedirect() {
  const location = useLocation();
  return <Navigate to={`/calendar${location.search}`} replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // OAuth consent (/mcp-auth?…): come back here after login/signup instead of the dashboard.
    const here = location.pathname + location.search;
    rememberPostAuthRedirect(here);
    return <Navigate to="/login" replace state={here.startsWith('/mcp-auth') ? { redirect: here } : undefined} />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={pendingPostAuthRedirect() || '/app'} replace />;
  }

  return <>{children}</>;
}

function SetupGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isComplete, isLoading: setupLoading } = useSetupStatus(isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || setupLoading || !isAuthenticated) return;

    const isExemptRoute =
      location.pathname.startsWith('/setup') ||
      location.pathname.startsWith('/login') ||
      location.pathname.startsWith('/signup');

    const skipped = localStorage.getItem('botx_setup_complete') === '1';

    if (!isExemptRoute && !isComplete && !skipped) {
      navigate('/setup', { replace: true });
    }
  }, [isLoading, setupLoading, isAuthenticated, isComplete, location.pathname, navigate]);

  return null;
}

function AppRoutes() {

  useEffect(() => {
    const s = document.createElement('script');
    // Load straight from the backend: via the site's /api proxy it returns 403.
    s.src = `${WIDGET_BASE_URL}/api/website-chatbot/script?apikey=bsk_9db5bdcaf9b80908495b62d7c42223d4`;
    s.async = true;
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, []);
  return (
    <Suspense fallback={<RouteSpinner />}>
      {/* <BotOnboardingModal /> */}
      <SetupGuard />
      <Routes>
        {/* Public landing pages */}
      <Route path="/" element={<LandingLayout><HomePage /></LandingLayout>} />
      <Route path="/pricing" element={<LandingLayout><PricingPage /></LandingLayout>} />
      <Route path="/ai-agents" element={<LandingLayout><AgentHubIndexPage /></LandingLayout>} />
      <Route path="/ai-agents/:slug" element={<LandingLayout><AgentHubPage /></LandingLayout>} />
      <Route path="/privacy" element={<LandingLayout><PrivacyPolicy /></LandingLayout>} />
      <Route path="/terms" element={<LandingLayout><TermsConditions /></LandingLayout>} />
      <Route path="/refund" element={<LandingLayout><RefundPolicy /></LandingLayout>} />
      <Route path="/docs" element={<LandingLayout><DevDocsPage /></LandingLayout>} />
      <Route path="/contact" element={<LandingLayout><ContactPage /></LandingLayout>} />
      <Route path="/about" element={<LandingLayout><AboutPage /></LandingLayout>} />
      <Route path="/data-deletion" element={<LandingLayout><DataDeletionPage /></LandingLayout>} />

      {/* Public Blog Platform */}
      <Route path="/blog" element={<LandingLayout><BlogPage /></LandingLayout>} />
      <Route path="/blog/category/:category" element={<LandingLayout><BlogCategoryPage /></LandingLayout>} />
      <Route path="/blog/:slug" element={<LandingLayout><BlogPostPage /></LandingLayout>} />

      {/* Public chatbot demo tool (no auth required) */}
      <Route path="/check-chatbot" element={<CheckChatbotPage />} />
      <Route path="/demo/:id" element={<ChatbotDemoPage />} />
      <Route path="/linkedin/approve" element={<LinkedInApprovePage />} />

      {/* Login / Signup */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* Setup flow — protected, no app shell */}
      <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />

      {/* MCP OAuth Approval Flow */}
      <Route path="/mcp-auth" element={<ProtectedRoute><MCPOAuthApprovePage /></ProtectedRoute>} />

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
      <Route path="/email/gmail/callback" element={
        <ProtectedRoute>
          <GmailCallbackRedirect />
        </ProtectedRoute>
      } />
      <Route path="/leads" element={
        <ProtectedRoute>
          <AppProvider>
            <LeadsPage />
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
      <Route path="/whatsapp-business" element={
        <ProtectedRoute>
          <AppProvider>
            <WhatsappBusinessPage />
          </AppProvider>
        </ProtectedRoute>
      } />
      <Route path="/fb/redirect" element={
        <ProtectedRoute>
          <AppProvider>
            <WhatsappBusinessPage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* Facebook channel */}
      <Route path="/facebook" element={
        <ProtectedRoute>
          <AppProvider>
            <FacebookPage />
          </AppProvider>
        </ProtectedRoute>
      } />
      <Route path="/facebook/callback" element={
        <ProtectedRoute><FacebookCallbackPage /></ProtectedRoute>
      } />

      {/* LinkedIn channel */}
      <Route path="/linkedin" element={
        <ProtectedRoute>
          <AppProvider>
            <LinkedInPage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* SEO Extension */}
      <Route path="/seo" element={
        <ProtectedRoute>
          <AppProvider>
            <SEOPage />
          </AppProvider>
        </ProtectedRoute>
      } />
      <Route path="/seo/blog/callback" element={
        <ProtectedRoute><SEOBlogCallbackPage /></ProtectedRoute>
      } />

      {/* Campaigns channel */}
      <Route path="/campaigns" element={
        <ProtectedRoute>
          <AppProvider>
            <CampaignPage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* Influencer / affiliate portal */}
      <Route path="/influencer" element={
        <ProtectedRoute><InfluencerDashboard /></ProtectedRoute>
      } />

      {/* Developer Hub — API keys, REST docs, MCP docs */}
      <Route path="/developer" element={
        <ProtectedRoute><DeveloperPage /></ProtectedRoute>
      } />

      {/* Nexbot Calendar & Booking platform */}
      <Route path="/calendar" element={
        <ProtectedRoute>
          <CalendarPage />
        </ProtectedRoute>
      } />
      <Route path="/book/:username/:slug" element={<PublicBookingPage />} />
      <Route path="/embed/:username/:slug" element={<PublicEmbedPage />} />

      {/* AI Life Companion & Growth Accelerator */}
      <Route path="/life-companion" element={
        <ProtectedRoute>
          <AppProvider>
            <LifeCompanionPage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* AI Trading Workspace */}
      <Route path="/trading" element={
        <ProtectedRoute>
          <AppProvider>
            <TradingWorkspacePage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* Freelancer Automation Workspace */}
      <Route path="/freelancer" element={
        <ProtectedRoute>
          <AppProvider>
            <FreelancerPage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* YouTube Creator Agent Workspace */}
      <Route path="/youtube" element={
        <ProtectedRoute>
          <AppProvider>
            <YouTubeAgentPage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* AI Workforce Marketplace & Management */}
      <Route path="/agents" element={
        <ProtectedRoute>
          <AppProvider>
            <AIWorkersPage />
          </AppProvider>
        </ProtectedRoute>
      } />

      {/* Drag-and-Drop Flow Studio */}
      <Route path="/studio" element={
        <ProtectedRoute>
          <AgentStudioPage />
        </ProtectedRoute>
      } />
      <Route path="/studio/:id" element={
        <ProtectedRoute>
          <AgentStudioPage />
        </ProtectedRoute>
      } />

      {/* Custom Connectors & In-House AI Hub */}
      <Route path="/connectors" element={
        <ProtectedRoute>
          <AppProvider>
            <CustomConnectorsPage />
          </AppProvider>
        </ProtectedRoute>
      } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

/**
 * The whole React Router app. Next.js renders it on the server with a
 * StaticRouter at the requested path (public pages get real HTML), and the
 * browser hydrates it with a BrowserRouter so client navigation is unchanged.
 */
export default function SpaApp({ location = '/' }: { location?: string }) {
  const routes = (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
  return (
    <StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        {typeof window === 'undefined'
          ? <StaticRouter location={location}>{routes}</StaticRouter>
          : <BrowserRouter>{routes}</BrowserRouter>}
      </GoogleOAuthProvider>
    </StrictMode>
  );
}
