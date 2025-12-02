import { lazy, Suspense, memo } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { TelegramProvider, DeepLinkHandler } from "@/contexts/TelegramContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { MainLayout } from "@/components/MainLayout";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Studio = lazy(() => import("./pages/Studio"));
const StemStudio = lazy(() => import("./pages/StemStudio"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Settings = lazy(() => import("./pages/Settings"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Generate = lazy(() => import("./pages/Generate"));
const Library = lazy(() => import("./pages/Library"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Artists = lazy(() => import("./pages/Artists"));
const Blog = lazy(() => import("./pages/Blog"));
const Analytics = lazy(() => import("./pages/Analytics"));
const NotFound = lazy(() => import("./pages/NotFound"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});


const App = () => (
  <ErrorBoundaryWrapper>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TelegramProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <DeepLinkHandler />
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />

                  {/* Routes with BottomNavigation */}
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Index />} />
                  <Route path="/studio" element={<Studio />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/generate" element={<Generate />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                  <Route path="/artists" element={<Artists />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/analytics" element={<Analytics />} />
                </Route>

                {/* Routes without BottomNavigation */}
                <Route path="/studio/:trackId" element={
                  <ProtectedRoute>
                    <StemStudio />
                  </ProtectedRoute>
                } />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </TelegramProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </ErrorBoundaryWrapper>
);

export default App;
