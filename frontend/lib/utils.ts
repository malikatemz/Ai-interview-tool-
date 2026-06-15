import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s remaining`;
}

export function getScoreColor(score: number): string {
  if (score >= 8.5) return 'text-green-500';
  if (score >= 7.0) return 'text-blue-500';
  if (score >= 5.5) return 'text-yellow-500';
  return 'text-red-500';
}

export function getScoreBackgroundColor(score: number): string {
  if (score >= 8.5) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 7.0) return 'bg-blue-100 dark:bg-blue-900/30';
  if (score >= 5.5) return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

export function getDecisionBadge(decision: string): string {
  switch (decision) {
    case 'STRONG_HIRE':
      return 'score-strong-hire';
    case 'HIRE':
      return 'score-hire';
    case 'HOLD':
      return 'score-hold';
    case 'REJECT':
      return 'score-reject';
    default:
      return 'bg-gray-100 dark:bg-gray-800';
  }
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
