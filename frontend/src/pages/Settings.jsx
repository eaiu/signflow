import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import FormError from '../components/FormError'
import StatusBanner from '../components/StatusBanner'
import { apiGet, apiPost } from '../api/client'

export default function Settings() {
  const [config, setConfig] = useState(null)
  const [profile, setProfile] = useState('default')
  const [syncResult, setSyncResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    setLoading(true)
    setError('')
    setActionError('')
    apiGet('/config')
      .then(setConfig)
      .catch(err => setError(err?.message || 'Failed to load config'))
      .finally(() => setLoading(false))
  }, [])

  function validateProfile() {
    const next = {}
    if (!profile.trim()) next.profile = 'Profile is required'
    return next
  }

  async function syncCookieCloud() {
    const nextErrors = validateProfile()
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSyncResult(null)
    setActionError('')
    try {
      const result = await apiPost(`/cookiecloud/sync?profile=${encodeURIComponent(profile.trim())}`, {})
      setSyncResult(result)
      setFormErrors({})
    } catch (err) {
      setActionError(err?.message || 'Sync failed')
      setSyncResult({ message: err?.message || 'Sync failed' })
    }
  }

  return (
    <Layout title="Settings">
      {actionError && (
        <div className="mb-4">
          <ErrorState title="Action failed" description={actionError} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card title="Environment" subtitle="Masked configuration">
          {loading ? (
            <LoadingCard label="Loading configuration" />
          ) : error ? (
            <ErrorState title="Failed to load configuration" description={error} />
          ) : config ? (
            <div className="space-y-2 text-sm">
              {Object.entries(config).length === 0 ? (
                <EmptyState title="No config available" description="Set environment variables to see them here." />
              ) : (
                Object.entries(config).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                    <span className="text-muted">{key}</span>
                    <span className="font-medium">{String(value) || '-'}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <EmptyState title="No config" description="Config was not returned." />
          )}
        </Card>

        <Card title="CookieCloud" subtitle="Manual sync">
          <div className="space-y-3">
            <div className="space-y-2">
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                placeholder="Profile name"
                value={profile}
                onChange={e => setProfile(e.target.value)}
              />
              <FormError message={formErrors.profile} />
            </div>
            <button onClick={syncCookieCloud} className="w-full rounded-full bg-ink px-4 py-2 text-sm text-white">Sync cookies</button>
            {syncResult && (
              <StatusBanner title="CookieCloud" description={syncResult.message} />
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
