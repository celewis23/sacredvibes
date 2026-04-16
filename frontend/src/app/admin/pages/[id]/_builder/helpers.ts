import type { SectionStyle } from './types'

export function uid() { return Math.random().toString(36).slice(2, 10) }

// ── Safe content accessors ────────────────────────────────────────────────────

export function str(c: Record<string, unknown>, k: string): string {
  const v = c[k]
  return typeof v === 'string' ? v : ''
}

export function num(c: Record<string, unknown>, k: string, def = 0): number {
  const v = c[k]
  return typeof v === 'number' ? v : def
}

export function bool(c: Record<string, unknown>, k: string, def = false): boolean {
  const v = c[k]
  return typeof v === 'boolean' ? v : def
}

// ── Style mappers ─────────────────────────────────────────────────────────────

export function bgCls(bg: SectionStyle['bg']): string {
  const map: Record<string, string> = {
    dark:   'bg-sacred-900',
    soft:   'bg-sacred-50',
    accent: 'bg-yoga-700',
    white:  'bg-white',
  }
  return map[bg] ?? 'bg-white'
}

export function pyCls(p: SectionStyle['paddingY']): string {
  const map: Record<string, string> = {
    none: 'py-0',
    sm:   'py-8',
    md:   'py-12',
    lg:   'py-16',
    xl:   'py-24',
  }
  return map[p] ?? 'py-16'
}

export function isDark(bg: SectionStyle['bg']): boolean {
  return bg === 'dark' || bg === 'accent'
}
