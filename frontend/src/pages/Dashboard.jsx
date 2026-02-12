import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import { apiGet, apiPost } from '../api/client'

export default function Dashboard() {
  const [stats, setStats] = useState({ sites: 0, runs: 0, logs: 0 })
  const [recentRuns, setRecentRuns] = useState([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      const [sites, runs, logs] = await Promise.all([
        apiGet('/sites'),
        apiGet('/runs'),
        apiGet('/logs?limit=20')
      ])
      setStats({ sites: sites.length, runs: runs.length, logs: logs.length })
      setRecentRuns(runs.slice(0, 5))
    }
    load().catch(console.error)
  }, [])

  async function triggerRun(siteId) {
    setCreating(true)
    try {
      await apiPost('/runs', { site_id: siteId })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Layout title="Dashboard" actions={
      <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">
        View schedule
      </button>
    }>
      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard label="Active Sites" value={stats.sites} hint="Enabled and ready" />
        <StatCard label="Runs" value={stats.runs} hint="Total sign-in runs" />
        <StatCard label="Logs" value={stats.logs} hint="Latest activity" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card title="Recent Runs" subtitle="Latest sign-in attempts">
          <div className="space-y-4">
            {recentRuns.length === 0 && (
              <p className="text-sm text-muted">No runs yet.</p>
            )}
            {recentRuns.map(run => (
              <div key={run.id} className="flex items-center justify-between border-b border-line pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium">Run #{run.id} · Site {run.site_id}</p>
                  <p className="text-sm text-muted">Status: {run.status}</p>
                </div>
                <button
                  className="rounded-full border border-line px-3 py-1 text-xs text-muted"
                  onClick={() => triggerRun(run.site_id)}
                  disabled={creating}
                >
                  Re-run
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Next scheduled" subtitle="Upcoming jobs">
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              No scheduler rules configured yet.
            </div>
            <button className="w-full rounded-full border border-line px-4 py-2 text-sm">Add schedule</button>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
