import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import AdvisorProfile from "./pages/AdvisorProfile";
import AdvisorsListing from "./pages/AdvisorsListing";
import Horoscope from "./pages/Horoscope";
import DailyOracle from "./pages/DailyOracle";
import Articles from "./pages/Articles";
import Support from "./pages/Support";
import Chat from "./pages/Chat";
import VoiceCall from "./pages/VoiceCall";
import AddCredit from "./pages/AddCredit";
import Settings from "./pages/Settings";
import AdvisorPortal from "./pages/AdvisorPortal";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/advisors" element={<AdvisorsListing />} />
            <Route path="/advisor/:id" element={<AdvisorProfile />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/call/:id" element={<VoiceCall />} />
            <Route path="/horoscope" element={<Horoscope />} />
            <Route path="/daily-oracle" element={<DailyOracle />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/support" element={<Support />} />
            <Route path="/add-credit" element={<AddCredit />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/advisor-portal" element={<AdvisorPortal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
