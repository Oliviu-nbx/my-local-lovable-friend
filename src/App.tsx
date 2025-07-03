import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CommandPaletteProvider } from "@/contexts/CommandPaletteContext";
import Index from "./pages/Index";
import Files from "./pages/Files";
import Editor from "./pages/Editor";
import Terminal from "./pages/Terminal";
import Model from "./pages/Model";
import Settings from "./pages/Settings";
import Development from "./pages/Development";
import Projects from "./pages/Projects";
import Workspace from "./pages/Workspace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CommandPaletteProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/files" element={<Files />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/terminal" element={<Terminal />} />
            <Route path="/model" element={<Model />} />
            <Route path="/development" element={<Development />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CommandPaletteProvider>
  </QueryClientProvider>
);

export default App;
