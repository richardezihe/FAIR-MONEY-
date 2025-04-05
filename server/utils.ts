import crypto from 'crypto';
import { SESSION_EXPIRATION_HOURS, WITHDRAWAL_DAYS } from '@shared/constants';

// Generate a random token for sessions
export function generateToken(length = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

// Check if the current date is a weekend (Saturday or Sunday)
export function isWeekend(): boolean {
  const dayOfWeek = new Date().getDay();
  return WITHDRAWAL_DAYS.includes(dayOfWeek);
}

// Format a date object to a readable string
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format an amount to a currency string
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

// Get the expiration date for a session
export function getSessionExpirationDate(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRATION_HOURS);
  return expiresAt;
}

// Check if a date is in the past
export function isPast(date: Date): boolean {
  return date < new Date();
}

// Get time elapsed in minutes between two dates
export function getMinutesBetweenDates(start: Date, end: Date): number {
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

// Get a user-friendly elapsed time string
export function getElapsedTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

// Generate a unique referral link
export function generateReferralLink(telegramId: string, botUsername: string): string {
  return `https://t.me/${botUsername}?start=ref_${telegramId}`;
}

// Extract referrer ID from start command
export function extractReferrerId(startCommand: string): string | null {
  const match = startCommand.match(/^\/start ref_(.+)$/);
  return match ? match[1] : null;
}

// Format time in 12-hour format with AM/PM
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
