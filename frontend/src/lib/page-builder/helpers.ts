import type { Section, SectionStyle, SpaceScale } from './types'

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}

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

export function bgCls(bg: SectionStyle['bg']): string {
  const map: Record<SectionStyle['bg'], string> = {
    white: 'bg-white',
    soft: 'bg-sacred-50',
    dark: 'bg-sacred-900',
    accent: 'bg-yoga-700',
  }
  return map[bg]
}

export function pyCls(p: SpaceScale): string {
  const map: Record<SpaceScale, string> = {
    none: 'py-0',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24',
  }
  return map[p]
}

export function mtCls(p?: SpaceScale): string {
  const map: Record<SpaceScale, string> = {
    none: 'mt-0',
    sm: 'mt-4',
    md: 'mt-8',
    lg: 'mt-12',
    xl: 'mt-16',
  }
  return p ? map[p] : 'mt-0'
}

export function mbCls(p?: SpaceScale): string {
  const map: Record<SpaceScale, string> = {
    none: 'mb-0',
    sm: 'mb-4',
    md: 'mb-8',
    lg: 'mb-12',
    xl: 'mb-16',
  }
  return p ? map[p] : 'mb-0'
}

export function radiusCls(radius?: SectionStyle['radius']): string {
  const map: Record<NonNullable<SectionStyle['radius']>, string> = {
    none: 'rounded-none',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[2rem]',
  }
  return radius ? map[radius] : 'rounded-none'
}

export function isDark(bg: SectionStyle['bg']): boolean {
  return bg === 'dark' || bg === 'accent'
}

export function parseSections(contentJson?: string | null): Section[] {
  if (!contentJson) return []
  try {
    const parsed = JSON.parse(contentJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
