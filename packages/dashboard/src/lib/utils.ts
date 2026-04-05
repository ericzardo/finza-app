import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function getCurrencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? currency
  )
}
