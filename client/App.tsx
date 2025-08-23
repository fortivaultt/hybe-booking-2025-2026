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
import CompanyInfoPage from "./pages/CompanyInfo";
import CompanyArtistPage from "./pages/CompanyArtist";
import CompanyBusinessPage from "./pages/CompanyBusiness";
import CompanyEthicalPage from "./pages/CompanyEthical";
import IrEsgPage from "./pages/IrEsg";
import IrStructurePage from "./pages/IrStructure";
import IrAnnouncePage from "./pages/IrAnnounce";
import IrOfficialPage from "./pages/IrOfficial";
import IrFinancePage from "./pages/IrFinance";
import IrSharePage from "./pages/IrShare";
import IrEventPage from "./pages/IrEvent";
import IrArchivePage from "./pages/IrArchive";
import NewsAnnouncementsPage from "./pages/NewsAnnouncements";
import NewsNewsPage from "./pages/NewsNews";
import NewsNoticePage from "./pages/NewsNotice";
import CareerCrewPage from "./pages/CareerCrew";
import KorMainPage from "./pages/KorMain";
import ChnMainPage from "./pages/ChnMain";
import JpnMainPage from "./pages/JpnMain";
import EngCookiePage from "./pages/EngCookie";
import EngRelatedSitePage from "./pages/EngRelatedSite";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/corporate" element={<CorporateIndex />} />
          <Route path="/success" element={<Success />} />

          {/* Company Pages */}
          <Route path="/company/info" element={<CompanyInfoPage />} />
          <Route path="/company/artist" element={<CompanyArtistPage />} />
          <Route path="/company/business" element={<CompanyBusinessPage />} />
          <Route path="/company/ethical" element={<CompanyEthicalPage />} />

          {/* IR Pages */}
          <Route path="/ir/esg" element={<IrEsgPage />} />
          <Route path="/ir/structure" element={<IrStructurePage />} />
          <Route path="/ir/announce" element={<IrAnnouncePage />} />
          <Route path="/ir/official" element={<IrOfficialPage />} />
          <Route path="/ir/finance" element={<IrFinancePage />} />
          <Route path="/ir/share" element={<IrSharePage />} />
          <Route path="/ir/event" element={<IrEventPage />} />
          <Route path="/ir/archive" element={<IrArchivePage />} />

          {/* Newsroom Pages */}
          <Route path="/news/announcements" element={<NewsAnnouncementsPage />} />
          <Route path="/news/news" element={<NewsNewsPage />} />
          <Route path="/news/notice" element={<NewsNoticePage />} />

          {/* Career Pages */}
          <Route path="/career/crew" element={<CareerCrewPage />} />

          {/* Language Pages */}
          <Route path="/kor/main" element={<KorMainPage />} />
          <Route path="/chn/main" element={<ChnMainPage />} />
          <Route path="/jpn/main" element={<JpnMainPage />} />

          {/* Footer Pages */}
          <Route path="/eng/cookie" element={<EngCookiePage />} />
          <Route path="/eng/related/site" element={<EngRelatedSitePage />} />


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
