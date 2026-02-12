import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { apiGet, apiPost } from '../api/client'

export default function Sites() {
  const [sites, setSites] = useState([])
  const [form, setForm] = useState({ name: '', url: '', enabled: true })

  useEffect(() => {
    apiGet('/sites').then(setSites).catch(console.error)
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    const site = await apiPost('/sites', form)
    setSites(prev => [...prev, site])
    setForm({ name: '', url: '', enabled: true })
  }

  return (
    <Layout title="Sites" actions={
      <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">Add site</button>
    }>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card title="Configured Sites" subtitle="Manage sign-in targets">
          <div className="space-y-4">
            {sites.length === 0 && <p className="text-sm text-muted">No sites yet.</p>}
            {sites.map(site => (
              <Link key={site.id} to={`/sites/${site.id}`} className="block rounded-lg border border-line p-4 hover:border-ink">
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
            ))}
          </div>
        </Card>

        <Card title="Create Site" subtitle="Quick add">
          <form className="space-y-4" onSubmit={handleCreate}>
            <input
              className="w-full rounded-lg border border-line px-3 py-2"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="w-full rounded-lg border border-line px-3 py-2"
              placeholder="https://example.com"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              required
            />
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
        </Card>
      </div>
    </Layout>
  )
}
