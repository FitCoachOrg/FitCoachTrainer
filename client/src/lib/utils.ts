import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUtcToLocal(utcTimestamp: string | null | undefined): string {
  if (!utcTimestamp) return 'N/A';
  // Ensure the string is parsed as UTC by explicitly adding 'Z'
  const date = new Date(utcTimestamp.endsWith('Z') ? utcTimestamp : `${utcTimestamp}Z`);
  // Format: M/D H:MM AM/PM
  return date.toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function getDaysSince(utcTimestamp: string | null | undefined): number | null {
  if (!utcTimestamp) return null;
  // Ensure the string is parsed as UTC by explicitly adding 'Z'
  const now = new Date();
  const last = new Date(utcTimestamp.endsWith('Z') ? utcTimestamp : `${utcTimestamp}Z`);
  const diffTime = now.getTime() - last.getTime(); // Calculate difference directly

  // If the 'last' date is in the future, consider it 0 days since for 'last active' context.
  if (diffTime < 0) return 0;

  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getShortAgo(utcTimestamp: string | null | undefined): string {
  if (!utcTimestamp) return '';
  const now = new Date();
  const last = new Date(utcTimestamp.endsWith('Z') ? utcTimestamp : `${utcTimestamp}Z`);
  const diffMs = now.getTime() - last.getTime();
  if (diffMs < 0) return 'in future';
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}min`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}hrs`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d`;
}
