import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date as a short, human-readable string. */
export function formatDate(value: string | number | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Generate a URL-safe referral code. */
export function makeReferralCode(seed: string) {
  return seed.replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase() +
    Math.random().toString(36).slice(2, 6);
}

/** Safe JSON parse that never throws. */
export function safeJson<T>(input: string, fallback: T): T {
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}
