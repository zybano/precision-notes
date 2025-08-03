import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {format} from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add the formatDate utility function
export function formatDate(date: string | Date): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "PPP"); // "Jan 1, 2021"
}
