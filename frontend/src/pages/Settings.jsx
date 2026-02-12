import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { apiGet, apiPost } from '../api/client'

export default function Settings() {
  const [config, setConfig] = useState(null)
  const [profile, setProfile] = useState('default')
  const [syncResult, setSyncResult] = useState(null)

  useEffect(() => {
    apiGet('/config').then(setConfig).catch(console.error)
  }, [])

  async function syncCookieCloud() {
    const result = await apiPost(`/cookiecloud/sync?profile=${encodeURIComponent(profile)}`, {})
    setSyncResult(result)
  }

  return (
    <Layout title="Settings">
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card title="Environment" subtitle="Masked configuration">
          {config ? (
            <div className="space-y-2 text-sm">
              {Object.entries(config).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                  <span className="text-muted">{key}</span>
                  <span className="font-medium">{String(value) || '-'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Loading configuration...</p>
          )}
        </Card>

        <Card title="CookieCloud" subtitle="Manual sync">
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-line px-3 py-2"
              placeholder="Profile name"
              value={profile}
              onChange={e => setProfile(e.target.value)}
            />
            <button onClick={syncCookieCloud} className="w-full rounded-full bg-ink px-4 py-2 text-sm text-white">Sync cookies</button>
            {syncResult && (
              <div className="rounded-lg border border-line p-3 text-sm text-muted">
                {syncResult.message}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
