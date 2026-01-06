import type { FeatureKey } from './FeatureDescriptions';

export type AlertType = 'error' | 'warning' | 'info' | 'success' | 'onboarding';

export type AlertIllustration = 
  | 'server-busy' 
  | 'empty-projects' 
  | 'profile-setup' 
  | 'stems-ready' 
  | 'artist-create'
  | 'reward'
  | 'welcome-back';

export interface AlertAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface SmartAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  icon?: React.ReactNode;
  illustration?: AlertIllustration;
  actions?: AlertAction[];
  dismissible?: boolean;
  autoHide?: number; // ms
  priority?: number;
  soundEffect?: boolean;
  featureKey?: FeatureKey; // For "Learn More" button
}

export interface AlertCondition {
  id: string;
  check: () => boolean | Promise<boolean>;
  createAlert: () => SmartAlert;
  cooldownMs: number;
  priority: number;
}

// Anti-spam constants
export const MIN_ALERT_INTERVAL = 30 * 1000; // 30 seconds between any alerts
export const MAX_ALERTS_PER_SESSION = 3; // Max 3 alerts per session
export const MAX_ALERTS_ON_PAGE_LOAD = 1;

// Routes where alerts should not appear
export const QUIET_ROUTES = ['/studio-v2', '/generate', '/onboarding'];

export const ALERT_COOLDOWNS: Record<string, number> = {
  'generation-error': 5 * 60 * 1000, // 5 minutes
  'no-projects': 7 * 24 * 60 * 60 * 1000, // 7 days
  'profile-incomplete': 3 * 24 * 60 * 60 * 1000, // 3 days
  'no-artists': 5 * 24 * 60 * 60 * 1000, // 5 days
  'stems-ready': 1 * 24 * 60 * 60 * 1000, // 1 day
  'welcome-back': 3 * 24 * 60 * 60 * 1000, // 3 days
};

export const ALERT_PRIORITIES: Record<string, number> = {
  'generation-error': 100,
  'achievement': 90,
  'stems-ready': 70,
  'profile-incomplete': 50,
  'no-projects': 40,
  'no-artists': 30,
  'welcome-back': 20,
};

export const STORAGE_KEY = 'smart_alerts_shown';
export const SESSION_KEY = 'smart_alerts_session';
export const LAST_ALERT_KEY = 'smart_alerts_last_time';
