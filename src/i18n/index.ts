import { create } from 'zustand'
import { useEffect } from 'react'
import { en, type MessageKey } from './en'
import { ar } from './ar'
import type { Lang } from '../lib/types'

export type { MessageKey }
const dictionaries: Record<Lang, Record<MessageKey, string>> = { en, ar }

const PREF_KEY = 'psl.prefs'

interface Prefs {
  lang: Lang
  guidanceOpen: boolean
  setLang: (l: Lang) => void
  setGuidanceOpen: (v: boolean) => void
}

function readPrefs(): { lang: Lang; guidanceOpen: boolean } {
  try {
    const raw = JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}')
    return { lang: raw.lang === 'ar' ? 'ar' : 'en', guidanceOpen: raw.guidanceOpen !== false }
  } catch {
    return { lang: 'en', guidanceOpen: true }
  }
}

function writePrefs(p: { lang: Lang; guidanceOpen: boolean }) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable */
  }
}

/** Lightweight UI preferences — stored in LocalStorage, separate from project data. */
export const usePrefs = create<Prefs>((set, get) => ({
  ...(typeof localStorage !== 'undefined' ? readPrefs() : { lang: 'en' as Lang, guidanceOpen: true }),
  setLang: (lang) => {
    set({ lang })
    writePrefs({ lang, guidanceOpen: get().guidanceOpen })
  },
  setGuidanceOpen: (guidanceOpen) => {
    set({ guidanceOpen })
    writePrefs({ lang: get().lang, guidanceOpen })
  },
}))

export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  let s = dictionaries[lang][key] ?? en[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}

export type TFn = (key: MessageKey, vars?: Record<string, string | number>) => string

export function useT() {
  const lang = usePrefs((s) => s.lang)
  const t: TFn = (key, vars) => translate(lang, key, vars)
  return { t, lang, dir: lang === 'ar' ? ('rtl' as const) : ('ltr' as const) }
}

/** Keeps <html lang/dir> in sync so the whole document renders correctly in RTL. */
export function useDocumentDirection() {
  const lang = usePrefs((s) => s.lang)
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])
}

export function formatDate(iso: string, lang: Lang): string {
  if (!iso) return ''
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric', numberingSystem: 'latn' } as Intl.DateTimeFormatOptions)
}
