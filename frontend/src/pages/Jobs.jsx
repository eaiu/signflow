import Layout from '../components/Layout'
import Card from '../components/Card'

export default function Jobs() {
  return (
    <Layout title="Jobs" actions={
      <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">New job</button>
    }>
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <Card title="Scheduled Jobs" subtitle="Scheduler (APScheduler)">
          <div className="space-y-4">
            <div className="rounded-lg border border-line p-4">
              <p className="font-medium">Heartbeat every 60s</p>
              <p className="text-sm text-muted">Managed by backend scheduler stub.</p>
            </div>
            <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              Add cron + site mapping in backend.
            </div>
          </div>
        </Card>

        <Card title="Queue" subtitle="Latest queued runs">
          <div className="space-y-3">
            <div className="rounded-lg border border-line p-3">
              <p className="text-sm font-medium">No queued runs</p>
              <p className="text-xs text-muted">Trigger a run from Sites.</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
