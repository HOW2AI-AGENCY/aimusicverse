/**
 * Smart Deep Links Builder
 * Creates context-aware deep links with prefilled data
 */

import { BOT_CONFIG } from '../config.ts';

interface SmartDeepLinkOptions {
  /** Base route in mini app */
  route: string;
  /** Query parameters to prefill */
  params?: Record<string, string | number | boolean>;
  /** UTM tracking params */
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  /** Entity reference for quick actions */
  entityId?: string;
  /** Entity type for routing */
  entityType?: 'track' | 'project' | 'artist' | 'playlist';
}

/**
 * Build a smart deep link with parameters
 */
export function buildSmartDeepLink(options: SmartDeepLinkOptions): string {
  const baseUrl = BOT_CONFIG.miniAppUrl;
  const params = new URLSearchParams();
  
  // Add route as startapp param for Telegram
  if (options.route && options.route !== '/') {
    const routeParam = options.route.replace(/^\//, '').replace(/\//g, '_');
    params.set('startapp', routeParam);
  }
  
  // Add entity reference
  if (options.entityType && options.entityId) {
    params.set('startapp', `${options.entityType}_${options.entityId}`);
  }
  
  // Add query params
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
  }
  
  // Add UTM params
  if (options.utm) {
    if (options.utm.source) params.set('utm_source', options.utm.source);
    if (options.utm.medium) params.set('utm_medium', options.utm.medium);
    if (options.utm.campaign) params.set('utm_campaign', options.utm.campaign);
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Predefined smart deep link builders
 */
export const SmartLinks = {
  /** Open generator with prefilled style */
  generateWithStyle: (style: string, mood?: string) => buildSmartDeepLink({
    route: '/generate',
    params: {
      style,
      ...(mood && { mood }),
    },
    utm: { source: 'telegram', medium: 'bot', campaign: 'quick_gen' }
  }),
  
  /** Open generator with prefilled prompt */
  generateWithPrompt: (prompt: string) => buildSmartDeepLink({
    route: '/generate',
    params: { prompt: encodeURIComponent(prompt) },
    utm: { source: 'telegram', medium: 'bot', campaign: 'prompt_gen' }
  }),
  
  /** Open pricing with specific plan highlighted */
  pricingWithPlan: (planId: 'pro' | 'premium') => buildSmartDeepLink({
    route: '/pricing',
    params: { highlight: planId },
    utm: { source: 'telegram', medium: 'bot', campaign: 'upsell' }
  }),
  
  /** Open payment with credit amount preselected */
  buyCredits: (amount?: number) => buildSmartDeepLink({
    route: '/payment',
    params: amount ? { amount } : { select: 'popular' },
    utm: { source: 'telegram', medium: 'bot', campaign: 'credits' }
  }),
  
  /** Open track in studio */
  studioWithTrack: (trackId: string, tab?: 'stems' | 'effects' | 'export') => buildSmartDeepLink({
    route: `/studio/${trackId}`,
    params: tab ? { tab } : {},
    utm: { source: 'telegram', medium: 'bot', campaign: 'studio' }
  }),
  
  /** Open remix flow */
  remixTrack: (trackId: string) => buildSmartDeepLink({
    route: '/generate',
    params: { remix: trackId },
    utm: { source: 'telegram', medium: 'bot', campaign: 'remix' }
  }),
  
  /** Open cover flow with reference */
  coverWithReference: (referenceUrl?: string) => buildSmartDeepLink({
    route: '/generate',
    params: referenceUrl ? { 
      mode: 'cover',
      ref: encodeURIComponent(referenceUrl) 
    } : { mode: 'cover' },
    utm: { source: 'telegram', medium: 'bot', campaign: 'cover' }
  }),
  
  /** Open extend flow */
  extendTrack: (trackId: string) => buildSmartDeepLink({
    route: '/generate',
    params: { extend: trackId },
    utm: { source: 'telegram', medium: 'bot', campaign: 'extend' }
  }),
  
  /** Open lyrics wizard */
  lyricsWizard: (genre?: string, mood?: string) => buildSmartDeepLink({
    route: '/lyrics',
    params: {
      ...(genre && { genre }),
      ...(mood && { mood }),
    },
    utm: { source: 'telegram', medium: 'bot', campaign: 'lyrics' }
  }),
  
  /** Open project with specific tab */
  projectWithTab: (projectId: string, tab?: 'tracks' | 'lyrics' | 'settings') => buildSmartDeepLink({
    route: `/projects/${projectId}`,
    params: tab ? { tab } : {},
    utm: { source: 'telegram', medium: 'bot', campaign: 'project' }
  }),
  
  /** Open profile with specific section */
  profileSection: (section?: 'tracks' | 'followers' | 'following' | 'achievements') => buildSmartDeepLink({
    route: '/profile',
    params: section ? { section } : {},
    utm: { source: 'telegram', medium: 'bot', campaign: 'profile' }
  }),
  
  /** Open analytics dashboard */
  analytics: (period?: 'day' | 'week' | 'month') => buildSmartDeepLink({
    route: '/analytics',
    params: period ? { period } : {},
    utm: { source: 'telegram', medium: 'bot', campaign: 'analytics' }
  }),
  
  /** Onboarding with specific step */
  onboardingStep: (step: number) => buildSmartDeepLink({
    route: '/onboarding',
    params: { step },
    utm: { source: 'telegram', medium: 'bot', campaign: 'onboarding' }
  }),
  
  /** Open Music Lab tool */
  musicLabTool: (tool: 'drums' | 'melody' | 'chords' | 'dj') => buildSmartDeepLink({
    route: `/music-lab/${tool}`,
    utm: { source: 'telegram', medium: 'bot', campaign: 'musiclab' }
  }),
  
  /** Referral link with code */
  referral: (referralCode: string) => buildSmartDeepLink({
    route: '/',
    params: { ref: referralCode },
    utm: { source: 'telegram', medium: 'referral', campaign: 'invite' }
  }),
  
  /** Share track link */
  shareTrack: (trackId: string) => buildSmartDeepLink({
    entityType: 'track',
    entityId: trackId,
    route: '/track',
    utm: { source: 'telegram', medium: 'share', campaign: 'track_share' }
  }),
};

/**
 * Parse startapp parameter and extract context
 */
export function parseStartAppParam(startapp: string): {
  route: string;
  entityType?: string;
  entityId?: string;
  params: Record<string, string>;
} {
  const result = {
    route: '/',
    params: {} as Record<string, string>,
  };
  
  // Check for entity_id pattern
  const entityPatterns = [
    { pattern: /^track_(.+)$/, type: 'track', route: '/track' },
    { pattern: /^project_(.+)$/, type: 'project', route: '/projects' },
    { pattern: /^artist_(.+)$/, type: 'artist', route: '/artists' },
    { pattern: /^playlist_(.+)$/, type: 'playlist', route: '/playlists' },
  ];
  
  for (const { pattern, type, route } of entityPatterns) {
    const match = startapp.match(pattern);
    if (match) {
      return {
        route: `${route}/${match[1]}`,
        entityType: type,
        entityId: match[1],
        params: {},
      };
    }
  }
  
  // Check for route patterns
  const routeMapping: Record<string, string> = {
    'generate': '/generate',
    'library': '/library',
    'projects': '/projects',
    'profile': '/profile',
    'pricing': '/pricing',
    'payment': '/payment',
    'settings': '/settings',
    'analytics': '/analytics',
    'achievements': '/achievements',
    'notifications': '/notifications',
    'onboarding': '/onboarding',
    'lyrics': '/lyrics',
  };
  
  // Handle route_param pattern (e.g., generate_rock)
  const parts = startapp.split('_');
  const baseRoute = parts[0];
  
  if (routeMapping[baseRoute]) {
    result.route = routeMapping[baseRoute];
    
    // Parse additional params
    if (parts.length > 1) {
      result.params.value = parts.slice(1).join('_');
    }
  }
  
  return result;
}

/**
 * Build Telegram bot deep link (t.me/bot?start=...)
 */
export function buildBotDeepLink(startParam: string): string {
  const botUsername = BOT_CONFIG.botUsername || 'AIMusicVerseBot';
  return `https://t.me/${botUsername}?start=${encodeURIComponent(startParam)}`;
}

/**
 * Build inline share link
 */
export function buildInlineShareLink(query?: string): string {
  const botUsername = BOT_CONFIG.botUsername || 'AIMusicVerseBot';
  return query 
    ? `https://t.me/${botUsername}?startinline=${encodeURIComponent(query)}`
    : `https://t.me/${botUsername}?startinline=`;
}

export default {
  buildSmartDeepLink,
  SmartLinks,
  parseStartAppParam,
  buildBotDeepLink,
  buildInlineShareLink,
};
