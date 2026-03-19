import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangProvider } from "@/contexts/LangContext";
import Index from "./pages/Index";
import TopUpPage from "./pages/TopUpPage";
import AccountPage from "./pages/AccountPage";
import ProfilePage from "./pages/ProfilePage";
import BuyGbPage from "./pages/BuyGbPage";
import ChangePlanPage from "./pages/ChangePlanPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import TokenLoginPage from "./pages/TokenLoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LangProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/topup" element={<TopUpPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/buy-gb" element={<BuyGbPage />} />
            <Route path="/change-plan" element={<ChangePlanPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/token-login/:token" element={<TokenLoginPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LangProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
