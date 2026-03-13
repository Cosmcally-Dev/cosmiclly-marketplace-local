import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteAnnouncer } from "./components/RouteAnnouncer";
import { PageLoader } from "./components/ui/page-loader";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { CookieConsent } from "./components/CookieConsent";

// Lazy-loaded page components
const AdvisorProfile = React.lazy(() => import("./pages/AdvisorProfile"));
const AdvisorsListing = React.lazy(() => import("./pages/AdvisorsListing"));
const Horoscope = React.lazy(() => import("./pages/Horoscope"));
const DailyOracle = React.lazy(() => import("./pages/DailyOracle"));
const Articles = React.lazy(() => import("./pages/Articles"));
const Support = React.lazy(() => import("./pages/Support"));
const Chat = React.lazy(() => import("./pages/Chat"));
const VoiceCall = React.lazy(() => import("./pages/VoiceCall"));
const VideoCall = React.lazy(() => import("./pages/VideoCall"));
const AddCredit = React.lazy(() => import("./pages/AddCredit"));
const AddCreditSuccess = React.lazy(() => import("./pages/AddCreditSuccess"));
const Settings = React.lazy(() => import("./pages/Settings"));
const AdvisorPortal = React.lazy(() => import("./pages/AdvisorPortal"));
const AdvisorCall = React.lazy(() => import("./pages/AdvisorCall"));
const Profile = React.lazy(() => import("./pages/Profile"));
const TestGuide = React.lazy(() => import("./pages/TestGuide"));
const Activity = React.lazy(() => import("./pages/Activity"));
const AdvisorActivity = React.lazy(() => import("./pages/AdvisorActivity"));
const AdminPanel = React.lazy(() => import("./pages/admin/AdminPanel"));
const ComingSoon = React.lazy(() => import("./pages/ComingSoon"));
const TwinChat = React.lazy(() => import("./pages/TwinChat"));
const TwinVoiceCall = React.lazy(() => import("./pages/TwinVoiceCall"));
const ContactUs = React.lazy(() => import("./pages/ContactUs"));
const BecomeAdvisor = React.lazy(() => import("./pages/BecomeAdvisor"));
const HowWeVerify = React.lazy(() => import("./pages/HowWeVerify"));
const Transactions = React.lazy(() => import("./pages/Transactions"));
const Favorites = React.lazy(() => import("./pages/Favorites"));
const AboutUs = React.lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = React.lazy(() => import("./pages/CookiePolicy"));
const SessionTranscript = React.lazy(() => import("./pages/SessionTranscript"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none"
          >
            Skip to content
          </a>
          <RouteAnnouncer />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <div id="main-content">
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/advisors" element={<AdvisorsListing />} />
              <Route path="/advisor/:id" element={<AdvisorProfile />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/call/:id" element={<VoiceCall />} />
              <Route path="/video/:id" element={<VideoCall />} />
              <Route path="/horoscope" element={<Horoscope />} />
              <Route path="/daily-oracle" element={<DailyOracle />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/support" element={<Support />} />
              <Route path="/add-credit" element={<AddCredit />} />
              <Route path="/add-credit/success" element={<AddCreditSuccess />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/advisor-portal" element={<AdvisorPortal />} />
              <Route path="/advisor-call" element={<AdvisorCall />} />
              <Route path="/advisor-call/:sessionId" element={<AdvisorCall />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/transcript/:sessionId" element={<SessionTranscript />} />
              <Route path="/advisor-activity" element={<AdvisorActivity />} />
              <Route path="/test-guide" element={<TestGuide />} />
              <Route path="/admin" element={<AdminPanel />} />
              {/* Legal / content pages */}
              <Route path="/about" element={<AboutUs />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/payment-methods" element={<ComingSoon />} />
              <Route path="/advisor/:id/ai" element={<TwinChat />} />
              <Route path="/advisor/:id/ai-voice" element={<TwinVoiceCall />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/become-advisor" element={<BecomeAdvisor />} />
              <Route path="/how-we-verify" element={<HowWeVerify />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
              </div>
              <CookieConsent />
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
