import { lazy, Suspense, memo } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipProvider as InteractiveTooltipProvider } from "@/components/tooltips";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { TelegramProvider, DeepLinkHandler } from "@/contexts/TelegramContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AnnouncementProvider } from "@/contexts/AnnouncementContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LegacyStudioRedirect } from "@/components/studio/LegacyStudioRedirect";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { MainLayout } from "@/components/MainLayout";
import { GlobalAudioProvider } from "@/components/GlobalAudioProvider";
import { LoadingScreen } from "@/components/UnifiedSplashScreen";
// InitializationGuard removed - handled by UnifiedSplashScreen
import { ProfileSetupGuard } from "@/components/profile/ProfileSetupGuard";
import { NavigationProvider } from "@/components/NavigationProvider";
import { initSentry } from "@/lib/sentry";
import { SentryTestButton } from "@/components/dev/SentryTestButton";

// Initialize Sentry error tracking
initSentry();

// Wrapper to use ProfileSetupGuard with Outlet
function ProfileSetupGuardWrapper({ children }: { children: React.ReactNode }) {
  return <ProfileSetupGuard>{children}</ProfileSetupGuard>;
}
// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const Settings = lazy(() => import("./pages/Settings"));
const Generate = lazy(() => import("./pages/Generate"));
const Library = lazy(() => import("./pages/Library"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Artists = lazy(() => import("./pages/Artists"));
const Playlists = lazy(() => import("./pages/Playlists"));
const Blog = lazy(() => import("./pages/Blog"));
const Community = lazy(() => import("./pages/Community"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Analytics = lazy(() => import(/* webpackChunkName: "analytics" */ "./pages/Analytics"));
const AdminDashboard = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/AdminDashboard"));
const ModerationDashboard = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/ModerationDashboard"));
const AnalyticsDashboard = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AnalyticsDashboard"));
const AdminFeedback = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/Feedback"));
const BlockedUsersPage = lazy(() => import("./pages/settings/BlockedUsersPage"));
const Templates = lazy(() => import("./pages/Templates"));
const MusicGraph = lazy(() => import("./pages/MusicGraph"));
const CreativeTools = lazy(() => import("./pages/CreativeTools"));
const ProfessionalStudio = lazy(() => import("./pages/ProfessionalStudio"));
const GuitarStudio = lazy(() => import("./pages/GuitarStudio"));
const MusicLab = lazy(() => import("./pages/MusicLab"));
const AlbumView = lazy(() => import("./pages/AlbumView"));
const LyricsStudio = lazy(() => import("./pages/LyricsStudio"));
const ReferenceAudioDetail = lazy(() => import("./pages/ReferenceAudioDetail"));
const HardwareStudioDemo = lazy(() => import("./pages/HardwareStudioDemo"));
const MobilePlayerPage = lazy(() => import("./pages/MobilePlayerPage"));

// Unified Studio Hub
const StudioHub = lazy(() => import("./pages/Studio"));

// Studio V2 pages (isolated from existing studio)
const StudioHubPage = lazy(() => import("./pages/studio-v2/StudioHubPage"));
const UnifiedStudioPage = lazy(() => import("./pages/studio-v2/UnifiedStudioPage"));
const NewStudioProjectPage = lazy(() => import("./pages/studio-v2/NewStudioProjectPage"));

const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BuyCredits = lazy(() => import("./pages/payments/BuyCredits"));
const Subscription = lazy(() => import("./pages/payments/Subscription"));
const PaymentSuccess = lazy(() => import("./pages/payments/PaymentSuccess"));
const PaymentFail = lazy(() => import("./pages/payments/PaymentFail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false, // Prevent refetch on tab focus for faster UX
      refetchOnReconnect: 'always',
    },
  },
});


const App = () => (
  <ErrorBoundaryWrapper>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TelegramProvider>
            <AuthProvider>
                <GuestModeProvider>
                <GlobalAudioProvider>
                  <NotificationProvider>
                    <AnnouncementProvider>
                    <GamificationProvider>
                      <TooltipProvider>
                        <Sonner />
                      <BrowserRouter>
                      <NavigationProvider>
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
                  <Route path="/studio" element={<StudioHub />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:userId" element={<PublicProfilePage />} />
                  <Route path="/settings" element={<Settings />} />
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
                <Route path="/admin/moderation" element={<ModerationDashboard />} />
                <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                <Route path="/admin/feedback" element={<AdminFeedback />} />
                <Route path="/settings/blocked-users" element={<BlockedUsersPage />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/music-graph" element={<MusicGraph />} />
                <Route path="/creative-tools" element={<Navigate to="/music-lab" replace />} />
                <Route path="/professional-studio" element={<ProfessionalStudio />} />
                <Route path="/guitar-studio" element={<GuitarStudio />} />
                <Route path="/music-lab" element={<MusicLab />} />
                <Route path="/lyrics-studio" element={<LyricsStudio />} />
                <Route path="/album/:id" element={<AlbumView />} />
                <Route path="/reference/:id" element={<ReferenceAudioDetail />} />
                <Route path="/hardware-demo" element={<HardwareStudioDemo />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/shop" element={<Pricing />} />
                <Route path="/cloud" element={<Navigate to="/projects?tab=cloud" replace />} />
                <Route path="/buy-credits" element={<BuyCredits />} />
                <Route path="/payments/buy-credits" element={<Navigate to="/buy-credits" replace />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/payments/subscription" element={<Navigate to="/subscription" replace />} />
                </Route>

                {/* Routes without BottomNavigation */}
                {/* Redirect legacy studio to unified version */}
                <Route path="/studio/:trackId" element={
                  <LegacyStudioRedirect />
                } />

                {/* Studio V2 - isolated new studio implementation */}
                <Route path="/studio-v2" element={
                  <ProtectedRoute>
                    <StudioHubPage />
                  </ProtectedRoute>
                } />
                <Route path="/studio-v2/new" element={
                  <ProtectedRoute>
                    <NewStudioProjectPage />
                  </ProtectedRoute>
                } />
                <Route path="/studio-v2/project/:projectId" element={
                  <ProtectedRoute>
                    <UnifiedStudioPage />
                  </ProtectedRoute>
                } />
                <Route path="/studio-v2/track/:trackId" element={
                  <ProtectedRoute>
                    <UnifiedStudioPage />
                  </ProtectedRoute>
                } />

                {/* Mobile fullscreen player - deep link route */}
                <Route path="/player/:trackId" element={
                  <ProtectedRoute>
                    <MobilePlayerPage />
                  </ProtectedRoute>
                } />

                {/* Payment result pages (no auth required - redirected from Tinkoff) */}
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/fail" element={<PaymentFail />} />

                {/* Error route */}
                <Route path="/error" element={<ErrorPage />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                      </Routes>
                      </Suspense>
                        </InteractiveTooltipProvider>
                      </NavigationProvider>
                      </BrowserRouter>
                    </TooltipProvider>
                  </GamificationProvider>
                    </AnnouncementProvider>
                </NotificationProvider>
                </GlobalAudioProvider>
                </GuestModeProvider>
            </AuthProvider>
          </TelegramProvider>
        </ThemeProvider>
      </QueryClientProvider>
      <SentryTestButton />
    </ErrorBoundary>
  </ErrorBoundaryWrapper>
);

export default App;
