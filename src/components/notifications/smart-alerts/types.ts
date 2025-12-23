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
}

export interface AlertCondition {
  id: string;
  check: () => boolean | Promise<boolean>;
  createAlert: () => SmartAlert;
  cooldownMs: number;
  priority: number;
}

export const ALERT_COOLDOWNS: Record<string, number> = {
  'generation-error': 5 * 60 * 1000, // 5 минут
  'no-projects': 7 * 24 * 60 * 60 * 1000, // 7 дней
  'profile-incomplete': 3 * 24 * 60 * 60 * 1000, // 3 дня
  'no-artists': 5 * 24 * 60 * 60 * 1000, // 5 дней
  'stems-ready': 1 * 24 * 60 * 60 * 1000, // 1 день
  'welcome-back': 3 * 24 * 60 * 60 * 1000, // 3 дня
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
export const MAX_ALERTS_ON_PAGE_LOAD = 1;
