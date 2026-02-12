import en from './en.json'

const translations = { en }
let activeLocale = 'en'

export function setLocale(locale) {
  if (translations[locale]) {
    activeLocale = locale
  }
}

export function t(key) {
  return translations[activeLocale]?.[key] || key
}
