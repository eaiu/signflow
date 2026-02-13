import { useState } from 'react'
import { getLocale, setLocale, t } from '../i18n'

export default function LanguageToggle() {
  const [locale, setLocal] = useState(getLocale())

  function handleChange(e) {
    const next = e.target.value
    setLocale(next)
    setLocal(next)
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
      <span>{t('language.toggleLabel')}</span>
      <select
        value={locale}
        onChange={handleChange}
        className="rounded-full border border-line bg-white px-2 py-1 text-xs text-ink"
      >
        <option value="zh">{t('language.zh')}</option>
        <option value="en">{t('language.en')}</option>
      </select>
    </label>
  )
}
