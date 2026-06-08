"use client"

import * as React from "react"
import { translations, type Lang } from "@/lib/i18n/translations"

const STORAGE_KEY = "nebula-lang"
const DEFAULT_LANG: Lang = "en"

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // На сервере и при первом рендере используем 'en' — совпадает с разметкой,
  // чтобы не было ошибки гидрации. Затем читаем сохранённый язык.
  const [lang, setLangState] = React.useState<Lang>(DEFAULT_LANG)

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (stored && stored in translations) setLangState(stored)
  }, [])

  React.useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = translations[lang] ?? translations.en
      let str = dict[key] ?? translations.en[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
        }
      }
      return str
    },
    [lang],
  )

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  const ctx = React.useContext(I18nContext)
  if (!ctx) throw new Error("useT must be used within I18nProvider")
  return ctx
}
