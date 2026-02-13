import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import FormError from '../components/FormError'
import ConfigField from '../components/ConfigField'
import StatusBanner from '../components/StatusBanner'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import { t } from '../i18n'

export default function SiteDetail() {
  const { id } = useParams()
  const [site, setSite] = useState(null)
  const [runs, setRuns] = useState([])
  const [plugins, setPlugins] = useState([])
  const [form, setForm] = useState({ name: '', url: '', enabled: true, cookie_domain: '', cookiecloud_profile: '', plugin_key: '', plugin_config: {}, notes: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [adminToken, setAdminToken] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      setActionError('')
      try {
        const [siteData, runData, pluginData] = await Promise.all([
          apiGet(`/sites/${id}`),
          apiGet(`/runs?site_id=${id}`),
          apiGet('/plugins')
        ])
        setSite(siteData)
        setRuns(runData)
        setPlugins(pluginData || [])
        setForm({
          name: siteData.name,
          url: siteData.url,
          enabled: siteData.enabled,
          cookie_domain: siteData.cookie_domain || '',
          cookiecloud_profile: siteData.cookiecloud_profile || '',
          plugin_key: siteData.plugin_key || '',
          plugin_config: siteData.plugin_config || {},
          notes: siteData.notes || ''
        })
      } catch (err) {
        setError(err?.message || t('siteDetail.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const activePlugin = useMemo(
    () => plugins.find(plugin => plugin.key === form.plugin_key),
    [plugins, form.plugin_key]
  )

  function validateForm(values) {
    const next = {}
    if (!values.name.trim()) next.name = t('sites.nameRequired')
    if (!values.url.trim()) next.url = t('sites.urlRequired')
    else if (!/^https?:\/\//i.test(values.url.trim())) next.url = t('sites.urlInvalid')
    if (activePlugin?.config_schema) {
      activePlugin.config_schema.forEach(field => {
        if (field.required) {
          const current = values.plugin_config?.[field.key]
          const isEmpty = field.field_type === "boolean" ? current !== true : !current
          if (isEmpty) {
            next[`plugin_config.${field.key}`] = t('common.requiredField', { field: field.label || field.key })
          }
        }
      })
    }
    return next
  }

  function handlePluginConfigChange(key, value) {
    setForm(prev => ({
      ...prev,
      plugin_config: {
        ...(prev.plugin_config || {}),
        [key]: value
      }
    }))
  }

  async function saveSite(e) {
    e.preventDefault()
    const nextErrors = validateForm(form)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSaving(true)
    setActionError('')
    try {
      const updated = await apiPatch(`/sites/${id}`, form)
      setSite(updated)
      setFormErrors({})
      setStatus(t('siteDetail.saved'))
    } catch (err) {
      setActionError(err?.message || t('siteDetail.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function triggerRun() {
    setActionError('')
    try {
      const run = await apiPost('/runs', { site_id: Number(id) })
      setRuns(prev => [run, ...prev])
      setStatus(t('siteDetail.runQueued'))
    } catch (err) {
      setActionError(err?.message || t('siteDetail.triggerFailed'))
    }
  }

  async function deleteSite() {
    if (!adminToken.trim()) {
      setActionError(t('siteDetail.deleteTokenRequired'))
      return
    }
    setActionError('')
    try {
      await apiDelete(`/sites/${id}`, adminToken)
      setStatus(t('siteDetail.deleted'))
    } catch (err) {
      if (err?.status === 401) {
        setActionError(t('siteDetail.adminTokenInvalid'))
      } else if (err?.status === 403) {
        setActionError(t('siteDetail.adminTokenNotConfigured'))
      } else {
        setActionError(err?.message || t('siteDetail.deleteFailed'))
      }
    }
  }

  if (loading) {
    return (
      <Layout title={t('siteDetail.title')}>
        <LoadingCard label={t('siteDetail.loading')} />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title={t('siteDetail.title')}>
        <ErrorState title={t('siteDetail.unavailable')} description={error} />
      </Layout>
    )
  }

  if (!site) return null

  return (
    <Layout title={site.name} actions={
      <button onClick={triggerRun} className="rounded-full bg-ink px-4 py-2 text-sm text-white">{t('siteDetail.runNow')}</button>
    }>
      {actionError && (
        <div className="mb-4">
          <ErrorState title={t('siteDetail.actionFailed')} description={actionError} />
        </div>
      )}
      {status && (
        <div className="mb-4">
          <StatusBanner title={t('siteDetail.title')} description={status} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <Card title={t('siteDetail.siteDetails')} subtitle={t('siteDetail.updateConfig')}>
          <form className="space-y-4" onSubmit={saveSite}>
            <div className="grid gap-3">
              <div className="space-y-2">
                <input className="w-full rounded-lg border border-line px-3 py-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <FormError message={formErrors.name} />
              </div>
              <div className="space-y-2">
                <input className="w-full rounded-lg border border-line px-3 py-2" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
                <FormError message={formErrors.url} />
              </div>
              <input className="w-full rounded-lg border border-line px-3 py-2" placeholder={t('siteDetail.cookieDomain')} value={form.cookie_domain} onChange={e => setForm({ ...form, cookie_domain: e.target.value })} />
              <input className="w-full rounded-lg border border-line px-3 py-2" placeholder={t('siteDetail.cookiecloudProfile')} value={form.cookiecloud_profile} onChange={e => setForm({ ...form, cookiecloud_profile: e.target.value })} />
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('sites.pluginLabel')}</label>
                <select
                  className="w-full rounded-lg border border-line px-3 py-2"
                  value={form.plugin_key}
                  onChange={e => setForm({ ...form, plugin_key: e.target.value, plugin_config: {} })}
                >
                  <option value="">{t('sites.pluginEmpty')}</option>
                  {plugins.map(plugin => (
                    <option key={plugin.key} value={plugin.key}>{plugin.name}</option>
                  ))}
                </select>
              </div>
              {activePlugin?.config_schema && activePlugin.config_schema.length > 0 && (
                <div className="space-y-3 rounded-lg border border-line p-3">
                  <p className="text-sm font-medium">{t('siteDetail.pluginConfig')}</p>
                  {activePlugin.config_schema.map(field => (
                    <ConfigField
                      key={field.key}
                      field={field}
                      value={form.plugin_config?.[field.key]}
                      onChange={handlePluginConfigChange}
                      error={formErrors[`plugin_config.${field.key}`]}
                    />
                  ))}
                </div>
              )}
              <textarea className="min-h-[120px] w-full rounded-lg border border-line px-3 py-2" placeholder={t('siteDetail.notes')} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
                {t('siteDetail.enabled')}
              </label>
            </div>
            <button className="rounded-full bg-ink px-4 py-2 text-sm text-white" disabled={saving}>{t('siteDetail.save')}</button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card title={t('siteDetail.recentRuns')} subtitle={t('siteDetail.recentRunsSubtitle')}>
            <div className="space-y-3">
              {runs.length === 0 ? (
                <EmptyState
                  title={t('siteDetail.noRuns')}
                  description={t('siteDetail.noRunsDesc')}
                />
              ) : (
                runs.slice(0, 10).map(run => (
                  <div key={run.id} className="rounded-lg border border-line p-3">
                    <p className="text-sm font-medium">{t('dashboard.runLabel', { id: run.id, siteId: run.site_id })}</p>
                    <p className="text-xs text-muted">{t('siteDetail.runStatus', { status: run.status })}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title={t('siteDetail.dangerZone')} subtitle={t('siteDetail.destructive')}>
            <div className="space-y-3 text-sm">
              <p className="text-muted">{t('siteDetail.destructive')}</p>
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                type="password"
                placeholder={t('siteDetail.adminTokenPlaceholder')}
                value={adminToken}
                onChange={e => setAdminToken(e.target.value)}
              />
              <button className="w-full rounded-full bg-rose-600 px-4 py-2 text-sm text-white" onClick={deleteSite} type="button">{t('siteDetail.delete')}</button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
