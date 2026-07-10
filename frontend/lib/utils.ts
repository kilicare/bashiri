import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (seconds < 60) return 'sasa hivi'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}dakika iliyopita`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}masaa iliyopita`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}siku iliyopita`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}wiki iliyopita`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mwezi iliyopita`
  return `${Math.floor(seconds / 31536000)}miaka iliyopita`
}
