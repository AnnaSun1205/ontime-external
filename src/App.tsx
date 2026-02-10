import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthRedirector } from "@/components/auth/AuthRedirector";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import AuthCallback from "./pages/AuthCallback";
import AppLayout from "./pages/app/AppLayout";
import CalendarTab from "./pages/app/CalendarTab";
import InboxTab from "./pages/app/InboxTab";
import ListingsTab from "./pages/app/ListingsTab";
import SettingsTab from "./pages/app/SettingsTab";
import NetworkingRoadmap from "./pages/app/NetworkingRoadmap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthRedirector />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<CalendarTab />} />
            <Route path="listings" element={<ListingsTab />} />
            <Route path="inbox" element={<InboxTab />} />
            <Route path="settings" element={<SettingsTab />} />
            <Route path="roadmap" element={<NetworkingRoadmap />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
