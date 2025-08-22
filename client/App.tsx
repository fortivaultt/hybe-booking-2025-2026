import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CorporateIndex from "./pages/CorporateIndex";
import Success from "./pages/Success";
import NotFound from "./pages/NotFound";
import OtpPage from "./pages/OtpPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/corporate" element={<CorporateIndex />} />
          <Route path="/success" element={<Success />} />
          <Route path="/otp" element={<OtpPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Prevent creating multiple roots during HMR
const container = document.getElementById("root")!;
let root = (globalThis as any).__reactRoot;

if (!root) {
  root = createRoot(container);
  (globalThis as any).__reactRoot = root;
}

root.render(<App />);
