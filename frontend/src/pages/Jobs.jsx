import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { apiGet } from '../api/client'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [runs, setRuns] = useState([])

  useEffect(() => {
    async function load() {
      const [jobData, runData] = await Promise.all([
        apiGet('/jobs'),
        apiGet('/runs')
      ])
      setJobs(jobData)
      setRuns(runData.filter(run => run.status === 'queued').slice(0, 5))
    }
    load().catch(console.error)
  }, [])

  return (
    <Layout title="Jobs">
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <Card title="Scheduled Jobs" subtitle="Scheduler (APScheduler)">
          <div className="space-y-4">
            {jobs.length === 0 && (
              <div className="rounded-lg border border-line p-4">
                <p className="font-medium">No jobs registered</p>
                <p className="text-sm text-muted">Add cron: expressions in site notes to schedule runs.</p>
              </div>
            )}
            {jobs.map(job => (
              <div key={job.id} className="rounded-lg border border-line p-4">
                <p className="font-medium">{job.name}</p>
                <p className="text-sm text-muted">Next run: {job.next_run_time || 'n/a'}</p>
              </div>
            ))}
            <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              Use notes like: <span className="font-mono">cron: */30 * * * *</span> to map a site to a schedule.
            </div>
          </div>
        </Card>

        <Card title="Queue" subtitle="Latest queued runs">
          <div className="space-y-3">
            {runs.length === 0 && (
              <div className="rounded-lg border border-line p-3">
                <p className="text-sm font-medium">No queued runs</p>
                <p className="text-xs text-muted">Trigger a run from Sites.</p>
              </div>
            )}
            {runs.map(run => (
              <div key={run.id} className="rounded-lg border border-line p-3">
                <p className="text-sm font-medium">Run #{run.id}</p>
                <p className="text-xs text-muted">Site #{run.site_id}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
