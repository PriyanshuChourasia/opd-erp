import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(firstName?: string, lastName?: string) {
  return `${(firstName ?? "?").charAt(0)}${(lastName ?? "?").charAt(0)}`.toUpperCase();
}
