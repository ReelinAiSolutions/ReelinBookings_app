import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime12Hour(time: string | null | undefined): string {
  if (!time) return '';
  try {
    // Handle both HH:MM and HH:MM:SS
    const parts = time.split(':');
    if (parts.length < 2) return time; // Fallback to raw string if not delimited

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) return time;

    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (e) {
    return time || '';
  }
}
