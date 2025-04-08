// Bot related constants
export const BOT_COMMANDS = {
  START: '/start',
  BALANCE: '💰 Balance',
  INVITE: '👥 Invite',
  STATISTICS: '📊 Statistics',
  WITHDRAW: '💸 Withdraw',
  ACCOUNT_DETAILS: '📝 Account Details',
  CLAIM: '🎁 Claim ₦1000 now',
  JOINED: 'Joined'
};

export const REQUIRED_GROUPS = [
  'naijavalueofficial',
  'naijavaluecommunity'
];

export const SUPPORT_CHANNEL = 'naijavaluesupport';
export const NEWS_CHANNEL = 'naijavaluecommunity';

// Financial constants
export const CURRENCY = '₦';
export const CLAIM_BONUS_AMOUNT = 1000;
export const REFERRAL_BONUS_AMOUNT = 5000;
export const MIN_WITHDRAWAL_AMOUNT = 20000;
export const MAX_WITHDRAWAL_AMOUNT = 100000;
export const CLAIM_COOLDOWN_MINUTES = 1;

// Statistics (presets for display)
export const DEFAULT_STATS = {
  TOTAL_USERS: 15463,
  TOTAL_PAYOUTS: 14198900
};

// Withdrawal restrictions
export const WITHDRAWAL_DAYS = [6, 0]; // 6 = Saturday, 0 = Sunday

// Admin website routes
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  WITHDRAWAL_REQUESTS: '/withdrawal-requests',
  ALL_USERS: '/all-users'
};

// Session expiration time (24 hours)
export const SESSION_EXPIRATION_HOURS = 24;
