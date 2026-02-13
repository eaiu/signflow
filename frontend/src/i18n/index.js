import en from './en.json'
import zh from './zh.json'

const translations = { en, zh }
const STORAGE_KEY = 'signflow_locale'
const DEFAULT_LOCALE = 'zh'

function resolveInitialLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && translations[stored]) return stored
  return DEFAULT_LOCALE
}

let activeLocale = resolveInitialLocale()

export function getLocale() {
  return activeLocale
}

export function setLocale(locale) {
  if (translations[locale]) {
    activeLocale = locale
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale)
    }
  }
}

export function t(key, params = {}) {
  const template = translations[activeLocale]?.[key]
    || translations[DEFAULT_LOCALE]?.[key]
    || key
  return template.replace(/\{(\w+)\}/g, (_, token) => {
    const value = params[token]
    return value !== undefined && value !== null ? String(value) : `{${token}}`
  })
}
