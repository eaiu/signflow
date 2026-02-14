import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import FormError from '../components/FormError'
import StatusBanner from '../components/StatusBanner'
import { apiDelete, apiGet, apiPost } from '../api/client'
import { t } from '../i18n'

export default function Sites() {
  const [sites, setSites] = useState([])
  const [plugins, setPlugins] = useState([])
  const [ccStatus, setCcStatus] = useState(null)
  const [form, setForm] = useState({ name: '', url: '', enabled: true, plugin_key: '', cookiecloud_uuid: '', cookie_domain: '' })
  const [adminToken, setAdminToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [status, setStatus] = useState('')
  const [domainTouched, setDomainTouched] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    setActionError('')
    Promise.all([apiGet('/sites'), apiGet('/plugins'), apiGet('/cookiecloud/status')])
      .then(([siteData, pluginData, ccData]) => {
        setSites(siteData)
        setPlugins(pluginData || [])
        setCcStatus(ccData)
      })
      .catch(err => setError(err?.message || t('sites.loadFailed')))
      .finally(() => setLoading(false))
  }, [])

  // Smart Matching Logic
  useEffect(() => {
    if (!domainTouched && form.url && ccStatus?.uuids) {
      try {
        const hostname = new URL(form.url).hostname.toLowerCase()
        let bestMatch = ''
        let maxLength = 0
        
        // Find best domain match across all UUIDs
        Object.values(ccStatus.uuids).forEach(entry => {
          (entry.domains || []).forEach(d => {
            const domain = d.domain.toLowerCase()
            if (hostname === domain || hostname.endsWith('.' + domain)) {
              if (domain.length > maxLength) {
                maxLength = domain.length
                bestMatch = domain
              }
            }
          })
        })
        
        if (bestMatch) {
          setForm(prev => ({ ...prev, cookie_domain: bestMatch }))
        }
      } catch (e) {
        // invalid url, ignore
      }
    }
  }, [form.url, ccStatus, domainTouched])

  function validateForm(values) {
    const next = {}
    if (!values.name.trim()) next.name = t('sites.nameRequired')
    if (!values.url.trim()) next.url = t('sites.urlRequired')
    else if (!/^https?:\/\//i.test(values.url.trim())) next.url = t('sites.urlInvalid')
    return next
  }

  async function handleCreate(e) {
    e.preventDefault()
    const nextErrors = validateForm(form)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setActionError('')
    try {
      const site = await apiPost('/sites', form)
      setSites(prev => [...prev, site])
      setForm({ name: '', url: '', enabled: true, plugin_key: '', cookiecloud_uuid: '', cookie_domain: '' })
      setDomainTouched(false)
      setFormErrors({})
      setStatus(t('sites.created'))
    } catch (err) {
      setActionError(err?.message || t('sites.createFailed'))
    }
  }

  async function handleDelete(siteId) {
    if (!adminToken.trim()) {
      setActionError(t('sites.deleteTokenRequired'))
      return
    }
    setActionError('')
    setStatus('')
    try {
      await apiDelete(`/sites/${siteId}`, adminToken)
      setSites(prev => prev.filter(site => site.id !== siteId))
      setStatus(t('sites.deleted'))
    } catch (err) {
      if (err?.status === 401) {
        setActionError(t('sites.adminTokenInvalid'))
      } else if (err?.status === 403) {
        setActionError(t('sites.adminTokenNotConfigured'))
      } else {
        setActionError(err?.message || t('sites.deleteFailed'))
      }
    }
  }

  const availableUuids = ccStatus?.uuids ? Object.keys(ccStatus.uuids) : []
  const availableDomains = (form.cookiecloud_uuid && ccStatus?.uuids?.[form.cookiecloud_uuid]?.domains) || []

  return (
    <Layout title={t('sites.title')} actions={
      <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">{t('sites.add')}</button>
    }>
      {actionError && (
        <div className="mb-4">
          <ErrorState title={t('sites.actionFailed')} description={actionError} />
        </div>
      )}
      {status && (
        <div className="mb-4">
          <StatusBanner title={t('sites.title')} description={status} />
        </div>
      )}
      <div className=\"grid gap-6 lg:grid-cols-[2fr,1fr]\">
        <Card title={t('sites.listTitle')} subtitle={t('sites.listSubtitle')}>
          {loading ? (
            <LoadingCard label={t('sites.loading')} />
          ) : error ? (
            <ErrorState title={t('sites.loadFailed')} description={error} />
          ) : (
            <div className=\"space-y-4\">
              {sites.length === 0 ? (
                <EmptyState
                  title={t('sites.emptyTitle')}
                  description={t('sites.emptyDesc')}
                />
              ) : (
                sites.map(site => (
                  <div key={site.id} className=\"rounded-lg border border-line p-4\">
                    <Link to={`/sites/${site.id}`} className=\"block hover:text-ink\">
                      <div className=\"flex items-center justify-between\">
                        <div>
                          <p className=\"font-medium\">{site.name}</p>
                          <p className=\"text-sm text-muted\">{site.url}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs ${site.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {site.enabled ? t('sites.enabled') : t('sites.disabled')}
                        </span>
                      </div>
                    </Link>
                    <div className=\"mt-3 flex items-center justify-between text-xs text-muted\">
                      <span>{t('sites.plugin')}: {site.plugin_key || t('sites.noPlugin')}</span>
                      <button className=\"text-rose-600 hover:text-rose-700\" onClick={() => handleDelete(site.id)}>{t('sites.delete')}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        <Card title={t('sites.createTitle')} subtitle={t('sites.createSubtitle')}>
          <form className=\"space-y-4\" onSubmit={handleCreate}>
            <div className=\"space-y-2\">
              <input
                className=\"w-full rounded-lg border border-line px-3 py-2\"
                placeholder={t('sites.namePlaceholder')}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
              <FormError message={formErrors.name} />
            </div>
            <div className=\"space-y-2\">
              <input
                className=\"w-full rounded-lg border border-line px-3 py-2\"
                placeholder={t('sites.urlPlaceholder')}
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                required
              />
              <FormError message={formErrors.url} />
            </div>
            
            <div className=\"space-y-2\">
              <label className=\"text-sm font-medium\">{t('sites.cookiecloudUuidLabel')}</label>
              <select
                className=\"w-full rounded-lg border border-line px-3 py-2\"
                value={form.cookiecloud_uuid}
                onChange={e => setForm({ ...form, cookiecloud_uuid: e.target.value })}
              >
                <option value=\"\">{t('common.none')}</option>
                {availableUuids.map(uuid => (
                  <option key={uuid} value={uuid}>{uuid}</option>
                ))}
              </select>
            </div>

            <div className=\"space-y-2\">
              <label className=\"text-sm font-medium\">{t('sites.cookieDomainLabel')}</label>
              <div className=\"relative\">
                <input
                  className=\"w-full rounded-lg border border-line px-3 py-2\"
                  placeholder={t('sites.cookieDomainPlaceholder')}
                  value={form.cookie_domain}
                  onChange={e => {
                    setForm({ ...form, cookie_domain: e.target.value });
                    setDomainTouched(true);
                  }}
                  list=\"available-domains\"
                />
                <datalist id=\"available-domains\">
                  {availableDomains.map(d => (
                    <option key={d.domain} value={d.domain}>{d.domain} ({d.cookie_count})</option>
                  ))}
                </datalist>
              </div>
            </div>

            <div className=\"space-y-2\">
              <label className=\"text-sm font-medium\">{t('sites.pluginLabel')}</label>
              <select
                className=\"w-full rounded-lg border border-line px-3 py-2\"
                value={form.plugin_key}
                onChange={e => setForm({ ...form, plugin_key: e.target.value })}
              >
                <option value=\"\">{t('sites.pluginEmpty')}</option>
                {plugins.map(plugin => (
                  <option key={plugin.key} value={plugin.key}>{plugin.name}</option>
                ))}
              </select>
            </div>
            <label className=\"flex items-center gap-2 text-sm text-muted\">
              <input
                type=\"checkbox\"
                checked={form.enabled}
                onChange={e => setForm({ ...form, enabled: e.target.checked })}
              />
              {t('sites.enabledLabel')}
            </label>
            <button className=\"w-full rounded-full bg-ink px-4 py-2 text-sm text-white\">{t('sites.create')}</button>
          </form>
          <div className=\"mt-6 space-y-2 text-sm\">
            <label className=\"text-xs uppercase tracking-wide text-muted\">{t('sites.adminTokenLabel')}</label>
            <input
              className=\"w-full rounded-lg border border-line px-3 py-2\"
              type=\"password\"
              value={adminToken}
              onChange={e => setAdminToken(e.target.value)}
              placeholder={t('sites.adminTokenPlaceholder')}
            />
          </div>
        </Card>
      </div>
    </Layout>
  )
}
