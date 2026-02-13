import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiGet } from '../api/client'
import { getApiToken, setApiToken } from '../api/auth'
import StatusBanner from '../components/StatusBanner'
import { t } from '../i18n'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.from?.pathname || '/'
  const [token, setToken] = useState(getApiToken())
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (getApiToken()) {
      setStatus('checking')
      apiGet('/health')
        .then(() => navigate(destination))
        .catch(() => {
          setStatus('error')
          setMessage(t('auth.existingTokenInvalid'))
          setApiToken('')
          setToken('')
        })
    }
  }, [navigate, destination])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token.trim()) {
      setStatus('error')
      setMessage(t('auth.tokenRequired'))
      return
    }
    setStatus('checking')
    setMessage('')
    setApiToken(token.trim())
    try {
      await apiGet('/health')
      navigate(destination)
    } catch (err) {
      setStatus('error')
      setMessage(err?.message || t('auth.invalidToken'))
      setApiToken('')
      setToken('')
    }
  }

  return (
    <div className="min-h-screen bg-shell text-ink">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full space-y-6 rounded-2xl border border-line bg-white p-8 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{t('app.brand')}</p>
            <h1 className="text-2xl font-semibold">{t('auth.welcome')}</h1>
            <p className="mt-2 text-sm text-muted">{t('auth.subtitle')}</p>
          </div>

          {status === 'checking' && (
            <StatusBanner title={t('auth.verifying')} description={t('auth.checking')} />
          )}
          {status === 'error' && (
            <StatusBanner title={t('auth.failed')} description={message} tone="error" />
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted">{t('auth.tokenLabel')}</label>
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                type="password"
                placeholder={t('auth.tokenPlaceholder')}
                value={token}
                onChange={e => setToken(e.target.value)}
                required
              />
            </div>
            <button
              className="w-full rounded-full bg-ink px-4 py-2 text-sm text-white"
              disabled={status === 'checking'}
            >
              {status === 'checking' ? t('auth.verifyingButton') : t('auth.signIn')}
            </button>
          </form>

          <p className="text-xs text-muted">{t('auth.tokenStored')}</p>
        </div>
      </div>
    </div>
  )
}
