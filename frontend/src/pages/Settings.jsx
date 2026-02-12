import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import FormError from '../components/FormError'
import StatusBanner from '../components/StatusBanner'
import { apiGet, apiPatch, apiPost } from '../api/client'

export default function Settings() {
  const [config, setConfig] = useState(null)
  const [profile, setProfile] = useState('default')
  const [syncResult, setSyncResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [adminToken, setAdminToken] = useState('')
  const [uiSettings, setUiSettings] = useState({ theme: 'system', timezone: 'Asia/Shanghai', notifications: { enabled: true, level: 'info' } })
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setActionError('')
    apiGet('/config')
      .then(data => {
        setConfig(data)
        if (data?.ui_settings) {
          setUiSettings(data.ui_settings)
        }
      })
      .catch(err => setError(err?.message || 'Failed to load config'))
      .finally(() => setLoading(false))
  }, [])

  function validateProfile() {
    const next = {}
    if (!profile.trim()) next.profile = 'Profile is required'
    return next
  }

  function validateSettings() {
    const next = {}
    if (!uiSettings.theme) next.theme = 'Theme is required'
    if (!uiSettings.timezone) next.timezone = 'Timezone is required'
    if (!adminToken.trim()) next.adminToken = 'Admin token is required to save settings'
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

  async function saveSettings() {
    const nextErrors = validateSettings()
    setFormErrors(prev => ({ ...prev, ...nextErrors }))
    if (Object.keys(nextErrors).length) return
    setSaveStatus('')
    setActionError('')
    try {
      const result = await apiPatch('/config', uiSettings, adminToken)
      setUiSettings(result.settings)
      setSaveStatus('Settings saved')
      setFormErrors({})
    } catch (err) {
      if (err?.status === 403) {
        setActionError('Admin token is not configured on the server')
      } else if (err?.status === 401) {
        setActionError('Admin token invalid')
      } else {
        setActionError(err?.message || 'Failed to save settings')
      }
    }
  }

  return (
    <Layout title="Settings">
      {actionError && (
        <div className="mb-4">
          <ErrorState title="Action failed" description={actionError} />
        </div>
      )}
      {saveStatus && (
        <div className="mb-4">
          <StatusBanner title="Settings" description={saveStatus} />
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
                  key !== 'plugins' && key !== 'ui_settings' ? (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                      <span className="text-muted">{key}</span>
                      <span className="font-medium">{String(value) || '-'}</span>
                    </div>
                  ) : null
                ))
              )}
            </div>
          ) : (
            <EmptyState title="No config" description="Config was not returned." />
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Console Settings" subtitle="UI preferences">
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <label className="text-sm font-medium">Theme</label>
                <select
                  className="w-full rounded-lg border border-line px-3 py-2"
                  value={uiSettings.theme}
                  onChange={e => setUiSettings(prev => ({ ...prev, theme: e.target.value }))}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <FormError message={formErrors.theme} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <input
                  className="w-full rounded-lg border border-line px-3 py-2"
                  value={uiSettings.timezone}
                  onChange={e => setUiSettings(prev => ({ ...prev, timezone: e.target.value }))}
                />
                <FormError message={formErrors.timezone} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notifications level</label>
                <select
                  className="w-full rounded-lg border border-line px-3 py-2"
                  value={uiSettings.notifications?.level || 'info'}
                  onChange={e => setUiSettings(prev => ({ ...prev, notifications: { ...prev.notifications, level: e.target.value } }))}
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={uiSettings.notifications?.enabled ?? true}
                  onChange={e => setUiSettings(prev => ({ ...prev, notifications: { ...prev.notifications, enabled: e.target.checked } }))}
                />
                Enable notifications
              </label>
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin token</label>
                <input
                  className="w-full rounded-lg border border-line px-3 py-2"
                  type="password"
                  value={adminToken}
                  onChange={e => setAdminToken(e.target.value)}
                  placeholder="Required to save"
                />
                <FormError message={formErrors.adminToken} />
              </div>
              <button onClick={saveSettings} className="w-full rounded-full bg-ink px-4 py-2 text-sm text-white">Save settings</button>
            </div>
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
                <StatusBanner title="CookieCloud" description={syncResult.message} tone={syncResult.ok ? 'info' : 'error'} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
