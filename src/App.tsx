import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

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
const Settings = React.lazy(() => import("./pages/Settings"));
const AdvisorPortal = React.lazy(() => import("./pages/AdvisorPortal"));
const AdvisorCall = React.lazy(() => import("./pages/AdvisorCall"));
const Profile = React.lazy(() => import("./pages/Profile"));
const TestGuide = React.lazy(() => import("./pages/TestGuide"));
const Activity = React.lazy(() => import("./pages/Activity"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
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
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/advisor-portal" element={<AdvisorPortal />} />
              <Route path="/advisor-call" element={<AdvisorCall />} />
              <Route path="/advisor-call/:sessionId" element={<AdvisorCall />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/test-guide" element={<TestGuide />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
