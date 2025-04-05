import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format an amount to a currency string
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
