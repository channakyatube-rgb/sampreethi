import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToHash from "@/components/ScrollToHash";
import Index from "./pages/Index.tsx";
import Catalogues from "./pages/Catalogues.tsx";
import Gallery from "./pages/Gallery.tsx";
import About from "./pages/About.tsx";
import AdminCatalogues from "./pages/AdminCatalogues.tsx";
import AdminGallery from "./pages/AdminGallery.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/catalogues" element={<Catalogues />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/admin/catalogues" element={<AdminCatalogues />} />
          <Route path="/admin/gallery" element={<AdminGallery />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
