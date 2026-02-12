import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { apiGet, apiPatch, apiPost } from '../api/client'

export default function SiteDetail() {
  const { id } = useParams()
  const [site, setSite] = useState(null)
  const [runs, setRuns] = useState([])
  const [form, setForm] = useState({ name: '', url: '', enabled: true, cookie_domain: '', cookiecloud_profile: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const siteData = await apiGet(`/sites/${id}`)
      const runData = await apiGet(`/runs?site_id=${id}`)
      setSite(siteData)
      setRuns(runData)
      setForm({
        name: siteData.name,
        url: siteData.url,
        enabled: siteData.enabled,
        cookie_domain: siteData.cookie_domain || '',
        cookiecloud_profile: siteData.cookiecloud_profile || '',
        notes: siteData.notes || ''
      })
    }
    load().catch(console.error)
  }, [id])

  async function saveSite(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await apiPatch(`/sites/${id}`, form)
      setSite(updated)
    } finally {
      setSaving(false)
    }
  }

  async function triggerRun() {
    const run = await apiPost('/runs', { site_id: Number(id) })
    setRuns(prev => [run, ...prev])
  }

  if (!site) return null

  return (
    <Layout title={site.name} actions={
      <button onClick={triggerRun} className="rounded-full bg-ink px-4 py-2 text-sm text-white">Run now</button>
    }>
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <Card title="Site Details" subtitle="Update configuration">
          <form className="space-y-4" onSubmit={saveSite}>
            <div className="grid gap-3">
              <input className="w-full rounded-lg border border-line px-3 py-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="w-full rounded-lg border border-line px-3 py-2" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
              <input className="w-full rounded-lg border border-line px-3 py-2" placeholder="Cookie domain" value={form.cookie_domain} onChange={e => setForm({ ...form, cookie_domain: e.target.value })} />
              <input className="w-full rounded-lg border border-line px-3 py-2" placeholder="CookieCloud profile" value={form.cookiecloud_profile} onChange={e => setForm({ ...form, cookiecloud_profile: e.target.value })} />
              <textarea className="min-h-[120px] w-full rounded-lg border border-line px-3 py-2" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
                Enabled
              </label>
            </div>
            <button className="rounded-full bg-ink px-4 py-2 text-sm text-white" disabled={saving}>Save</button>
          </form>
        </Card>

        <Card title="Recent Runs" subtitle="Last 10 runs">
          <div className="space-y-3">
            {runs.length === 0 && <p className="text-sm text-muted">No runs yet.</p>}
            {runs.slice(0, 10).map(run => (
              <div key={run.id} className="rounded-lg border border-line p-3">
                <p className="text-sm font-medium">Run #{run.id}</p>
                <p className="text-xs text-muted">Status: {run.status}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
