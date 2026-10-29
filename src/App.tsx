import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import MarketingHome from "./pages/MarketingHome";
import SignupLanding from "./pages/SignupLanding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="auth-loading" role="status" aria-live="polite"><span className="auth-spinner" aria-hidden="true" />Checking your session…</main>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <main className="auth-loading" role="status" aria-live="polite"><span className="auth-spinner" aria-hidden="true" />Checking your session…</main>;
  return user ? <Navigate to="/workspace" replace /> : <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MarketingHome />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/signup" element={<SignupLanding />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/workspace" element={<Index />} />
            <Route path="/signals" element={<Index />} />
            <Route path="/accounts" element={<Index />} />
            <Route path="/accounts/:accountId" element={<Index />} />
            <Route path="/opportunities" element={<Index />} />
            <Route path="/agents" element={<Index />} />
            <Route path="/workflows" element={<Index />} />
            <Route path="/analytics" element={<Index />} />
            <Route path="/integrations" element={<Index />} />
            <Route path="/settings" element={<Index />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
