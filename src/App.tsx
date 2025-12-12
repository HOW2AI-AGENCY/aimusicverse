import { lazy, Suspense, memo } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipProvider as InteractiveTooltipProvider } from "@/components/tooltips";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { TelegramProvider, DeepLinkHandler } from "@/contexts/TelegramContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { MainLayout } from "@/components/MainLayout";
import { GlobalAudioProvider } from "@/components/GlobalAudioProvider";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { InitializationGuard } from "@/components/InitializationGuard";
import { ProfileSetupGuard } from "@/components/profile/ProfileSetupGuard";

// Wrapper to use ProfileSetupGuard with Outlet
function ProfileSetupGuardWrapper({ children }: { children: React.ReactNode }) {
  return <ProfileSetupGuard>{children}</ProfileSetupGuard>;
}
// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Studio = lazy(() => import("./pages/Studio"));
const StemStudio = lazy(() => import("./pages/StemStudio"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const Settings = lazy(() => import("./pages/Settings"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Generate = lazy(() => import("./pages/Generate"));
const Library = lazy(() => import("./pages/Library"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Artists = lazy(() => import("./pages/Artists"));
// Actors removed - unified with Artists page
const Playlists = lazy(() => import("./pages/Playlists"));
const Blog = lazy(() => import("./pages/Blog"));
const Community = lazy(() => import("./pages/Community"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Analytics = lazy(() => import(/* webpackChunkName: "analytics" */ "./pages/Analytics"));
const AdminDashboard = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/AdminDashboard"));
const Templates = lazy(() => import("./pages/Templates"));
const MusicGraph = lazy(() => import("./pages/MusicGraph"));
const CreativeTools = lazy(() => import("./pages/CreativeTools"));
const ProfessionalStudio = lazy(() => import("./pages/ProfessionalStudio"));
const GuitarStudio = lazy(() => import("./pages/GuitarStudio"));
const MusicLab = lazy(() => import("./pages/MusicLab"));

const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BuyCredits = lazy(() => import("./pages/payments/BuyCredits"));
const Subscription = lazy(() => import("./pages/payments/Subscription"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));


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
          <InitializationGuard>
            <GuestModeProvider>
              <GlobalAudioProvider>
                <NotificationProvider>
                  <GamificationProvider>
                    <TooltipProvider>
                      <Sonner />
                    <BrowserRouter>
                      <InteractiveTooltipProvider>
                        <DeepLinkHandler />
                      <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />

                  {/* Routes with BottomNavigation */}
                <Route element={
                  <ProtectedRoute>
                    <ProfileSetupGuardWrapper>
                      <MainLayout />
                    </ProfileSetupGuardWrapper>
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Index />} />
                  <Route path="/studio" element={<Studio />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:userId" element={<PublicProfilePage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/generate" element={<Generate />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/actors" element={<Navigate to="/artists?tab=community" replace />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/community" element={<Community />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/music-graph" element={<MusicGraph />} />
                <Route path="/creative-tools" element={<CreativeTools />} />
                <Route path="/professional-studio" element={<ProfessionalStudio />} />
                <Route path="/guitar-studio" element={<GuitarStudio />} />
                <Route path="/music-lab" element={<MusicLab />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/shop" element={<Pricing />} />
                <Route path="/buy-credits" element={<BuyCredits />} />
                <Route path="/subscription" element={<Subscription />} />
                </Route>

                {/* Routes without BottomNavigation */}
                <Route path="/studio/:trackId" element={
                  <ProtectedRoute>
                    <StemStudio />
                  </ProtectedRoute>
                } />

                {/* Error route */}
                <Route path="/error" element={<ErrorPage />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                      </Routes>
                      </Suspense>
                      </InteractiveTooltipProvider>
                    </BrowserRouter>
                  </TooltipProvider>
                </GamificationProvider>
              </NotificationProvider>
            </GlobalAudioProvider>
            </GuestModeProvider>
          </InitializationGuard>
        </TelegramProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </ErrorBoundaryWrapper>
);

export default App;
