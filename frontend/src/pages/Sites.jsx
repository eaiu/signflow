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

export default function Sites() {
  const [sites, setSites] = useState([])
  const [plugins, setPlugins] = useState([])
  const [form, setForm] = useState({ name: '', url: '', enabled: true, plugin_key: '' })
  const [adminToken, setAdminToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [status, setStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setActionError('')
    Promise.all([apiGet('/sites'), apiGet('/plugins')])
      .then(([siteData, pluginData]) => {
        setSites(siteData)
        setPlugins(pluginData || [])
      })
      .catch(err => setError(err?.message || 'Failed to load sites'))
      .finally(() => setLoading(false))
  }, [])

  function validateForm(values) {
    const next = {}
    if (!values.name.trim()) next.name = 'Name is required'
    if (!values.url.trim()) next.url = 'URL is required'
    else if (!/^https?:\/\//i.test(values.url.trim())) next.url = 'URL must start with http(s)://'
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
      setForm({ name: '', url: '', enabled: true, plugin_key: '' })
      setFormErrors({})
      setStatus('Site created')
    } catch (err) {
      setActionError(err?.message || 'Failed to create site')
    }
  }

  async function handleDelete(siteId) {
    if (!adminToken.trim()) {
      setActionError('Admin token required to delete a site')
      return
    }
    setActionError('')
    setStatus('')
    try {
      await apiDelete(`/sites/${siteId}`, adminToken)
      setSites(prev => prev.filter(site => site.id !== siteId))
      setStatus('Site deleted')
    } catch (err) {
      if (err?.status === 401) {
        setActionError('Admin token invalid')
      } else if (err?.status === 403) {
        setActionError('Admin token not configured')
      } else {
        setActionError(err?.message || 'Failed to delete site')
      }
    }
  }

  return (
    <Layout title="Sites" actions={
      <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">Add site</button>
    }>
      {actionError && (
        <div className="mb-4">
          <ErrorState title="Action failed" description={actionError} />
        </div>
      )}
      {status && (
        <div className="mb-4">
          <StatusBanner title="Sites" description={status} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card title="Configured Sites" subtitle="Manage sign-in targets">
          {loading ? (
            <LoadingCard label="Loading sites" />
          ) : error ? (
            <ErrorState title="Failed to load sites" description={error} />
          ) : (
            <div className="space-y-4">
              {sites.length === 0 ? (
                <EmptyState
                  title="No sites yet"
                  description="Create your first sign-in target to get started."
                />
              ) : (
                sites.map(site => (
                  <div key={site.id} className="rounded-lg border border-line p-4">
                    <Link to={`/sites/${site.id}`} className="block hover:text-ink">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{site.name}</p>
                          <p className="text-sm text-muted">{site.url}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs ${site.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {site.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </Link>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted">
                      <span>Plugin: {site.plugin_key || 'None'}</span>
                      <button className="text-rose-600 hover:text-rose-700" onClick={() => handleDelete(site.id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        <Card title="Create Site" subtitle="Quick add">
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                placeholder="Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
              <FormError message={formErrors.name} />
            </div>
            <div className="space-y-2">
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                placeholder="https://example.com"
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                required
              />
              <FormError message={formErrors.url} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Plugin</label>
              <select
                className="w-full rounded-lg border border-line px-3 py-2"
                value={form.plugin_key}
                onChange={e => setForm({ ...form, plugin_key: e.target.value })}
              >
                <option value="">No plugin</option>
                {plugins.map(plugin => (
                  <option key={plugin.key} value={plugin.key}>{plugin.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm({ ...form, enabled: e.target.checked })}
              />
              Enabled
            </label>
            <button className="w-full rounded-full bg-ink px-4 py-2 text-sm text-white">Create</button>
          </form>
          <div className="mt-6 space-y-2 text-sm">
            <label className="text-xs uppercase tracking-wide text-muted">Admin token (for delete)</label>
            <input
              className="w-full rounded-lg border border-line px-3 py-2"
              type="password"
              value={adminToken}
              onChange={e => setAdminToken(e.target.value)}
              placeholder="Admin token"
            />
          </div>
        </Card>
      </div>
    </Layout>
  )
}
