import { lazy, Suspense, memo, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TooltipProvider as InteractiveTooltipProvider } from "@/components/tooltips";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { TelegramProvider, DeepLinkHandler } from "@/contexts/TelegramContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { RewardNotificationProvider } from "@/contexts/RewardNotificationContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AnnouncementProvider } from "@/contexts/AnnouncementContext";
import { GuestModeProvider } from "@/contexts/GuestModeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { MainLayout } from "@/components/MainLayout";
import { GlobalAudioProvider } from "@/components/GlobalAudioProvider";
import { LoadingScreen } from "@/components/UnifiedSplashScreen";
import { PageTransition } from "@/components/PageTransition";
// InitializationGuard removed - handled by UnifiedSplashScreen
import { ProfileSetupGuard } from "@/components/profile/ProfileSetupGuard";
import { NavigationProvider } from "@/components/NavigationProvider";
import { lazyWithRetry } from "@/lib/performance";
import { LibrarySkeleton } from "@/components/skeletons/LibrarySkeleton";
import { SettingsSkeleton } from "@/components/skeletons/SettingsSkeleton";
import { ProjectsSkeleton } from "@/components/skeletons/ProjectsSkeleton";

// Sentry is initialized in main.tsx (avoid double init)

// Helper to add loading skeleton to lazy loaded components
function withLoadingFallback<P extends object>(
  Component: React.ComponentType<P>,
  SkeletonComponent: React.ComponentType
): React.ComponentType<P> {
  return function WithLoadingFallback(props: P) {
    return (
      <Suspense fallback={<SkeletonComponent />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Wrapper to use ProfileSetupGuard with Outlet
function ProfileSetupGuardWrapper({ children }: { children: React.ReactNode }) {
  return <ProfileSetupGuard>{children}</ProfileSetupGuard>;
}

// Wrapper for page transitions with location-based key
function RouteWithTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <PageTransition key={location.pathname} variant="fade" duration={0.2}>
      {children}
    </PageTransition>
  );
}

// Redirect component for /generate routes - redirects to home with state
function GenerateRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Forward all search params to home page
    const params = searchParams.toString();
    navigate(params ? `/?${params}` : '/', { replace: true });
  }, [navigate, searchParams]);

  return null;
}
// Lazy load pages - prioritize critical paths with retry
const Index = lazyWithRetry(() => import("./pages/Index"));
const Auth = lazyWithRetry(() => import("./pages/Auth")); // Critical: auth flow
// Generate page removed - redirect functionality moved to Index.tsx
const Library = lazyWithRetry(() =>
  import("./pages/Library")
    .then(m => ({ default: withLoadingFallback(m.default, LibrarySkeleton) }))
); // Critical: main navigation

// Secondary pages - standard lazy
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const Settings = lazy(() =>
  import("./pages/Settings")
    .then(m => ({ default: withLoadingFallback(m.default, SettingsSkeleton) }))
);
// Generate page removed - redirect functionality moved to Index.tsx with GenerateRedirect component
const Projects = lazy(() =>
  import("./pages/Projects")
    .then(m => ({ default: withLoadingFallback(m.default, ProjectsSkeleton) }))
);
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Artists = lazy(() => import("./pages/Artists"));
const Playlists = lazy(() => import("./pages/Playlists"));
const Blog = lazy(() => import("./pages/Blog"));
const Community = lazy(() => import("./pages/Community"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Referral = lazy(() => import("./pages/Referral"));

// Heavy pages - load on demand
const Analytics = lazy(() => import(/* webpackChunkName: "analytics" */ "./pages/Analytics"));
const AdminDashboard = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/AdminDashboard"));
const AdminLayout = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminOverview"));
const AdminEconomy = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminEconomy"));
const AdminUsers = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminUsers"));
const AdminTracks = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminTracks"));
const AdminBot = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminBot"));
const AdminTelegram = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminTelegram"));
const AdminBroadcast = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminBroadcast"));
const AdminAlerts = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminAlerts"));
const AdminTariffs = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AdminTariffs"));
const ModerationDashboard = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/ModerationDashboard"));
const AnalyticsDashboard = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/AnalyticsDashboard"));
const AdminFeedback = lazy(() => import(/* webpackChunkName: "admin" */ "./pages/admin/Feedback"));
const GenerationStatsPanel = lazy(() => import(/* webpackChunkName: "admin" */ "./components/admin/GenerationStatsPanel").then(m => ({ default: m.GenerationStatsPanel })));
const PerformanceDashboard = lazy(() => import(/* webpackChunkName: "admin" */ "./components/performance").then(m => ({ default: m.PerformanceDashboard })));
const UserBalancesPanel = lazy(() => import(/* webpackChunkName: "admin" */ "./components/admin/UserBalancesPanel").then(m => ({ default: m.UserBalancesPanel })));
const StarsPaymentsPanel = lazy(() => import(/* webpackChunkName: "admin" */ "./components/admin/StarsPaymentsPanel").then(m => ({ default: m.StarsPaymentsPanel })));
const GenerationLogsPanel = lazy(() => import(/* webpackChunkName: "admin" */ "./components/admin/GenerationLogsPanel").then(m => ({ default: m.GenerationLogsPanel })));
const DeeplinkAnalyticsPanel = lazy(() => import(/* webpackChunkName: "admin" */ "./components/admin/DeeplinkAnalyticsPanel").then(m => ({ default: m.DeeplinkAnalyticsPanel })));
const EnhancedAnalyticsPanel = lazy(() => import(/* webpackChunkName: "admin" */ "./components/admin/EnhancedAnalyticsPanel").then(m => ({ default: m.EnhancedAnalyticsPanel })));
const ModerationReportsPanel = lazy(() => import(/* webpackChunkName: "admin" */ "./components/admin/ModerationReportsPanel").then(m => ({ default: m.ModerationReportsPanel })));
const BlockedUsersPage = lazy(() => import("./pages/settings/BlockedUsersPage"));
const Templates = lazy(() => import("./pages/Templates"));
const MusicGraph = lazy(() => import("./pages/MusicGraph"));
const CreativeTools = lazy(() => import("./pages/CreativeTools"));

const GuitarStudio = lazy(() => import("./pages/GuitarStudio"));
const MusicLab = lazy(() => import("./pages/MusicLab"));
const AlbumView = lazy(() => import("./pages/AlbumView"));
const LyricsStudio = lazy(() => import("./pages/LyricsStudio"));
const ReferenceAudioDetail = lazy(() => import("./pages/ReferenceAudioDetail"));

const MobilePlayerPage = lazy(() => import("./pages/MobilePlayerPage"));

// Legacy Studio Hub - now redirects to Studio V2
// const StudioHub = lazy(() => import("./pages/Studio"));

// Studio V2 pages (isolated from existing studio)
const StudioHubPage = lazy(() => import("./pages/studio-v2/StudioHubPage"));
const UnifiedStudioPage = lazy(() => import("./pages/studio-v2/UnifiedStudioPage"));
const NewStudioProjectPage = lazy(() => import("./pages/studio-v2/NewStudioProjectPage"));

const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BuyCredits = lazy(() => import("./pages/payments/BuyCredits"));
const MobilePaymentScreen = lazy(() => import("./pages/payments/MobilePaymentScreen"));
const Subscription = lazy(() => import("./pages/payments/Subscription"));
const PaymentSuccess = lazy(() => import("./pages/payments/PaymentSuccess"));
const PaymentFail = lazy(() => import("./pages/payments/PaymentFail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));


// Optimized QueryClient configuration for faster perceived loading
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 15, // 15 minutes garbage collection (increased for better caching)
      retry: 1, // Single retry to fail fast
      refetchOnWindowFocus: false, // Prevent refetch on tab focus for faster UX
      refetchOnReconnect: 'always',
      refetchOnMount: false, // Don't refetch if data exists - critical for speed
      networkMode: 'offlineFirst', // Use cache first, then network
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
                    <RewardNotificationProvider>
                    <GamificationProvider>
                      <TooltipProvider>
                        <Sonner />
                      <BrowserRouter>
                      <NavigationProvider>
                      <InteractiveTooltipProvider>
                        <DeepLinkHandler />
                      <Suspense fallback={<LoadingScreen />}>
                      <RouteWithTransition>
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
                  <Route path="/studio" element={<Navigate to="/studio-v2" replace />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:userId" element={<PublicProfilePage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/generate" element={<GenerateRedirect />} />
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
                <Route path="/referral" element={<Referral />} />
                <Route path="/analytics" element={<Analytics />} />
                
                {/* 
                 * Modular Admin Routes with nested layout
                 * Each sub-route lazy-loads its component
                 * AdminLayout provides shared navigation and auth check
                 * TODO: Add more admin sections as needed
                 * TODO: Consider role-based access for specific routes
                 */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverview />} />
                  <Route path="overview" element={<AdminOverview />} />
                  <Route path="analytics" element={<AnalyticsDashboard />} />
                  <Route path="generation-stats" element={<GenerationStatsPanel />} />
                  <Route path="performance" element={<PerformanceDashboard />} />
                  <Route path="economy" element={<AdminEconomy />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="balances" element={<UserBalancesPanel />} />
                  <Route path="tracks" element={<AdminTracks />} />
                  <Route path="moderation" element={<ModerationDashboard />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route path="tariffs" element={<AdminTariffs />} />
                  <Route path="bot" element={<AdminBot />} />
                  <Route path="telegram" element={<AdminTelegram />} />
                  <Route path="payments" element={<StarsPaymentsPanel />} />
                  <Route path="logs" element={<GenerationLogsPanel />} />
                  <Route path="deeplinks" element={<DeeplinkAnalyticsPanel />} />
                  <Route path="alerts" element={<AdminAlerts />} />
                  <Route path="broadcast" element={<AdminBroadcast />} />
                </Route>
                
                {/* Legacy admin route redirect for backward compatibility */}
                {/* TODO: Remove after full migration verified */}
                <Route path="/settings/blocked-users" element={<BlockedUsersPage />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/music-graph" element={<MusicGraph />} />
                <Route path="/creative-tools" element={<Navigate to="/music-lab" replace />} />
                <Route path="/professional-studio" element={<Navigate to="/studio-v2" replace />} />
                <Route path="/guitar-studio" element={<GuitarStudio />} />
                <Route path="/music-lab" element={<MusicLab />} />
                <Route path="/lyrics-studio" element={<LyricsStudio />} />
                <Route path="/album/:id" element={<AlbumView />} />
                <Route path="/reference/:id" element={<ReferenceAudioDetail />} />

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
                  <Navigate to="/studio-v2" replace />
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

                {/* Payment pages */}
                <Route path="/payment" element={<MobilePaymentScreen />} />
                <Route path="/payment/buy" element={<MobilePaymentScreen />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/fail" element={<PaymentFail />} />

                {/* Error route */}
                <Route path="/error" element={<ErrorPage />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                      </Routes>
                      </RouteWithTransition>
                      </Suspense>
                        </InteractiveTooltipProvider>
                      </NavigationProvider>
                      </BrowserRouter>
                    </TooltipProvider>
                  </GamificationProvider>
                    </RewardNotificationProvider>
                    </AnnouncementProvider>
                </NotificationProvider>
                </GlobalAudioProvider>
                </GuestModeProvider>
            </AuthProvider>
          </TelegramProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </ErrorBoundaryWrapper>
);

export default App;
