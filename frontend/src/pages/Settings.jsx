import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import FormError from '../components/FormError'
import StatusBanner from '../components/StatusBanner'
import { apiGet, apiPatch, apiPost } from '../api/client'
import { t } from '../i18n'

export default function Settings() {
  const [config, setConfig] = useState(null)
  const [syncResult, setSyncResult] = useState(null)
  const [ccStatus, setCcStatus] = useState(null)
  const [cookiecloudUrl, setCookiecloudUrl] = useState('')
  const [cookiecloudUuid, setCookiecloudUuid] = useState('')
  const [cookiecloudPassword, setCookiecloudPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [adminToken, setAdminToken] = useState('')
  const [uiSettings, setUiSettings] = useState({ theme: 'system', timezone: 'Asia/Shanghai', notifications: { enabled: true, level: 'info' } })
  const [saveStatus, setSaveStatus] = useState('')

  const loadData = async () => {
    try {
      const [configData, statusData] = await Promise.all([
        apiGet('/config'),
        apiGet('/cookiecloud/status')
      ])
      setConfig(configData)
      setCcStatus(statusData)
      if (configData?.ui_settings) {
        setUiSettings(configData.ui_settings)
      }
      if (configData?.cookiecloud_url) {
        setCookiecloudUrl(configData.cookiecloud_url)
      }
      if (configData?.cookiecloud_uuid) {
        setCookiecloudUuid(configData.cookiecloud_uuid)
      }
      if (configData?.cookiecloud_password) {
        setCookiecloudPassword(configData.cookiecloud_password)
      }
    } catch (err) {
      setError(err?.message || t('settings.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [])

  function validateProfile() {
    const next = {}
    if (!cookiecloudUrl.trim()) next.cookiecloudUrl = t('settings.cookiecloudUrlRequired')
    if (!cookiecloudUuid.trim()) next.cookiecloudUuid = t('settings.cookiecloudUuidRequired')
    if (!cookiecloudPassword.trim()) next.cookiecloudPassword = t('settings.cookiecloudPasswordRequired')
    return next
  }

  function validateSettings() {
    const next = {}
    if (!uiSettings.theme) next.theme = t('common.required')
    if (!uiSettings.timezone) next.timezone = t('common.required')
    if (!adminToken.trim()) next.adminToken = t('settings.adminTokenRequired')
    return next
  }

  async function syncCookieCloud() {
    const nextErrors = validateProfile()
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSyncResult(null)
    setActionError('')
    try {
      const result = await apiPost(`/cookiecloud/sync?uuid=${encodeURIComponent(cookiecloudUuid.trim())}`, {})
      setSyncResult(result)
      // Refresh status to show new domains
      const newStatus = await apiGet('/cookiecloud/status')
      setCcStatus(newStatus)
      setFormErrors({})
    } catch (err) {
      const message = err?.message || t('settings.syncFailed')
      setActionError(message)
      setSyncResult({ message })
    }
  }

  async function saveSettings() {
    const nextErrors = validateSettings()
    setFormErrors(prev => ({ ...prev, ...nextErrors }))
    if (Object.keys(nextErrors).length) return
    setSaveStatus('')
    setActionError('')
    try {
      const result = await apiPatch('/config', { ...uiSettings, cookiecloud_url: cookiecloudUrl || null, cookiecloud_uuid: cookiecloudUuid || null, cookiecloud_password: cookiecloudPassword || null }, adminToken)
      setUiSettings(result.settings)
      setSaveStatus(t('settings.saved'))
      setFormErrors({ })
    } catch (err) {
      if (err?.status === 403) {
        setActionError(t('settings.adminTokenNotConfigured'))
      } else if (err?.status === 401) {
        setActionError(t('settings.adminTokenInvalid'))
      } else {
        setActionError(err?.message || t('settings.saveFailed'))
      }
    }
  }

  return (
    <Layout title={t('settings.title')}>
      {actionError && (
        <div className=\"mb-4\">
          <ErrorState title={t('settings.actionFailed')} description={actionError} />
        </div>
      )}
      {saveStatus && (
        <div className=\"mb-4\">
          <StatusBanner title={t('settings.title')} description={saveStatus} />
        </div>
      )}
      <div className=\"grid gap-6 lg:grid-cols-[1.2fr,1fr]\">
        <div className=\"space-y-6\">
          <Card title={t('settings.environment')} subtitle={t('settings.environmentSubtitle')}>
            {loading ? (
              <LoadingCard label={t('settings.loadingConfig')} />
            ) : error ? (
              <ErrorState title={t('settings.loadFailed')} description={error} />
            ) : config ? (
              <div className=\"space-y-2 text-sm\">
                {Object.entries(config).length === 0 ? (
                  <EmptyState title={t('settings.noEnv')} description={t('settings.noEnvDesc')} />
                ) : (
                  Object.entries(config).map(([key, value]) => (
                    key !== 'plugins' && key !== 'ui_settings' ? (
                      <div key={key} className=\"flex items-center justify-between rounded-lg border border-line px-3 py-2\">
                        <span className=\"text-muted\">{key}</span>
                        <span className=\"font-medium\">{String(value) || '-'}</span>
                      </div>
                    ) : null
                  ))
                )}
              </div>
            ) : (
              <EmptyState title={t('settings.noConfig')} description={t('settings.noConfigDesc')} />
            )}
          </Card>

          <Card title={t('settings.cookiecloudStatus')} subtitle={t('settings.cookiecloudSubtitle')}>
            <div className=\"space-y-6\">
              {!ccStatus || !ccStatus.uuids || Object.keys(ccStatus.uuids).length === 0 ? (
                <EmptyState title={t('settings.noData')} description={t('settings.cookiecloudSubtitle')} />
              ) : (
                Object.entries(ccStatus.uuids).map(([uuid, info]) => (
                  <div key={uuid} className=\"space-y-3 rounded-lg border border-line p-4\">
                    <div className=\"flex items-center justify-between\">
                      <span className=\"font-bold text-ink\">{uuid}</span>
                      <span className=\"text-xs text-muted\">{t('settings.lastSync')}: {info.last_sync_at ? new Date(info.last_sync_at).toLocaleString() : '-'}</span>
                    </div>
                    <div className=\"grid grid-cols-2 gap-4 text-center text-sm\">
                      <div className=\"rounded-lg bg-slate-50 p-2\">
                        <p className=\"text-muted\">{t('settings.domains')}</p>
                        <p className=\"text-lg font-bold\">{info.domain_count || 0}</p>
                      </div>
                      <div className=\"rounded-lg bg-slate-50 p-2\">
                        <p className=\"text-muted\">{t('settings.cookies')}</p>
                        <p className=\"text-lg font-bold\">{info.cookie_count || 0}</p>
                      </div>
                    </div>
                    <div className=\"max-h-60 overflow-y-auto rounded border border-line\">
                      <table className=\"w-full text-left text-xs text-muted\">
                        <thead className=\"bg-slate-50\">
                          <tr>
                            <th className=\"p-2\">{t('settings.domains')}</th>
                            <th className=\"p-2 text-right\">{t('settings.cookies')}</th>
                          </tr>
                        </thead>
                        <tbody className=\"divide-y divide-line\">
                          {(info.domains || []).map(d => (
                            <tr key={d.domain}>
                              <td className=\"p-2\">{d.domain}</td>
                              <td className=\"p-2 text-right font-mono\">{d.cookie_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className=\"space-y-6\">
          <Card title={t('settings.console')} subtitle={t('settings.consoleSubtitle')}>
            <div className=\"space-y-4 text-sm\">
              <div className=\"space-y-2\">
                <label className=\"text-sm font-medium\">{t('settings.theme')}</label>
                <select
                  className=\"w-full rounded-lg border border-line px-3 py-2\"
                  value={uiSettings.theme}
                  onChange={e => setUiSettings(prev => ({ ...prev, theme: e.target.value }))}
                >
                  <option value=\"system\">{t('settings.themeSystem')}</option>
                  <option value=\"light\">{t('settings.themeLight')}</option>
                  <option value=\"dark\">{t('settings.themeDark')}</option>
                </select>
                <FormError message={formErrors.theme} />
              </div>
              <div className=\"space-y-2\">
                <label className=\"text-sm font-medium\">{t('settings.timezone')}</label>
                <input
                  className=\"w-full rounded-lg border border-line px-3 py-2\"
                  value={uiSettings.timezone}
                  onChange={e => setUiSettings(prev => ({ ...prev, timezone: e.target.value }))}
                />
                <FormError message={formErrors.timezone} />
              </div>
              <div className=\"space-y-2\">
                <label className=\"text-sm font-medium\">{t('settings.notifications')}</label>
                <select
                  className=\"w-full rounded-lg border border-line px-3 py-2\"
                  value={uiSettings.notifications?.level || 'info'}
                  onChange={e => setUiSettings(prev => ({ ...prev, notifications: { ...prev.notifications, level: e.target.value } }))}
                >
                  <option value=\"debug\">{t('settings.notificationsDebug')}</option>\n                  <option value=\"info\">{t('settings.notificationsInfo')}</option>
                  <option value=\"warning\">{t('settings.notificationsWarning')}</option>
                  <option value=\"error\">{t('settings.notificationsError')}</option>
                </select>
              </div>
              <label className=\"flex items-center gap-2 text-sm text-muted\">
                <input
                  type=\"checkbox\"
                  checked={uiSettings.notifications?.enabled ?? true}
                  onChange={e => setUiSettings(prev => ({ ...prev, notifications: { ...prev.notifications, enabled: e.target.checked } }))}
                />
                {t('settings.notificationsEnable')}\n              </label>
              <div className=\"space-y-2\">\n                <label className=\"text-sm font-medium\">{t('settings.adminToken')}</label>
                <input
                  className=\"w-full rounded-lg border border-line px-3 py-2\"
                  type=\"password\"
                  value={adminToken}
                  onChange={e => setAdminToken(e.target.value)}
                  placeholder={t('settings.adminTokenRequired')}\n                />
                <FormError message={formErrors.adminToken} />
              </div>
              <button onClick={saveSettings} className=\"w-full rounded-full bg-ink px-4 py-2 text-sm text-white\">{t('settings.save')}</button>
            </div>
          </Card>

          <Card title={t('settings.cookiecloud')} subtitle={t('settings.cookiecloudSubtitle')}>
            <div className=\"space-y-3\">
              <div className=\"space-y-2\">
                <input
                  className=\"w-full rounded-lg border border-line px-3 py-2\"
                  placeholder={t('settings.cookiecloudUrlPlaceholder')}
                  value={cookiecloudUrl}
                  onChange={e => setCookiecloudUrl(e.target.value)}
                />
                <FormError message={formErrors.cookiecloudUrl} />
              </div>
              <div className=\"space-y-2\">
                <input
                  className=\"w-full rounded-lg border border-line px-3 py-2\"
                  placeholder={t('settings.cookiecloudUuidPlaceholder')}
                  value={cookiecloudUuid}
                  onChange={e => setCookiecloudUuid(e.target.value)}
                />
                <FormError message={formErrors.cookiecloudUuid} />
              </div>
              <div className=\"space-y-2\">\n                <input
                  className=\"w-full rounded-lg border border-line px-3 py-2\"
                  type=\"password\"
                  placeholder={t('settings.cookiecloudPasswordPlaceholder')}
                  value={cookiecloudPassword}
                  onChange={e => setCookiecloudPassword(e.target.value)}
                />
                <FormError message={formErrors.cookiecloudPassword} />
              </div>
              <button onClick={syncCookieCloud} className=\"w-full rounded-full bg-ink px-4 py-2 text-sm text-white\">{t('settings.syncCookies')}</button>
              {syncResult && (
                <StatusBanner title={t('settings.cookiecloud')} description={syncResult.message} tone={syncResult.ok ? 'info' : 'error'} />
              )}\n            </div>
          </Card>
        </div>
      </div>
    </Layout>\n  )\n}\n"