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
import CompanyInfo from "./pages/CompanyInfo";
import ComingSoon from "./pages/ComingSoon";

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

          {/* Company Routes */}
          <Route path="/company/info" element={<CompanyInfo />} />
          <Route path="/company/artist" element={<ComingSoon />} />
          <Route path="/company/business" element={<ComingSoon />} />
          <Route path="/company/ethical" element={<ComingSoon />} />

          {/* Investor Relations Routes */}
          <Route path="/ir/esg" element={<ComingSoon />} />
          <Route path="/ir/structure" element={<ComingSoon />} />
          <Route path="/ir/announce" element={<ComingSoon />} />
          <Route path="/ir/official" element={<ComingSoon />} />
          <Route path="/ir/finance" element={<ComingSoon />} />
          <Route path="/ir/share" element={<ComingSoon />} />
          <Route path="/ir/event" element={<ComingSoon />} />
          <Route path="/ir/archive" element={<ComingSoon />} />

          {/* Newsroom Routes */}
          <Route path="/news/announcements" element={<ComingSoon />} />
          <Route path="/news/news" element={<ComingSoon />} />
          <Route path="/news/notice" element={<ComingSoon />} />

          {/* Career Routes */}
          <Route path="/career/crew" element={<ComingSoon />} />

          {/* Localized Routes */}
          <Route path="/kor/main" element={<ComingSoon />} />
          <Route path="/chn/main" element={<ComingSoon />} />
          <Route path="/jpn/main" element={<ComingSoon />} />

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
