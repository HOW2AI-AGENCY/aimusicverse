import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TelegramProvider } from "@/contexts/TelegramContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { BottomNavigation } from "@/components/BottomNavigation";
import { GenerationProgress } from "@/components/GenerationProgress";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Studio from "./pages/Studio";
import StemStudio from "./pages/StemStudio";
import ProfilePage from "./pages/ProfilePage";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";
import Generate from "./pages/Generate";
import Library from "./pages/Library";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Artists from "./pages/Artists";
import Blog from "./pages/Blog";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <GenerationProgress />
    {children}
    <BottomNavigation />
  </>
);

const App = () => (
  <ErrorBoundaryWrapper>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TelegramProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><ProtectedLayout><Index /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/studio" element={<ProtectedRoute><ProtectedLayout><Studio /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProtectedLayout><ProfilePage /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><ProtectedLayout><Settings /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><ProtectedLayout><Tasks /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/generate" element={<ProtectedRoute><ProtectedLayout><Generate /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><ProtectedLayout><Library /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/studio/:trackId" element={<ProtectedRoute><StemStudio /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><ProtectedLayout><Projects /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><ProtectedLayout><ProjectDetail /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/artists" element={<ProtectedRoute><ProtectedLayout><Artists /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/blog" element={<ProtectedRoute><ProtectedLayout><Blog /></ProtectedLayout></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><ProtectedLayout><Analytics /></ProtectedLayout></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </TelegramProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </ErrorBoundaryWrapper>
);

export default App;
