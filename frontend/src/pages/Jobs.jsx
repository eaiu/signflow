import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import { apiGet } from '../api/client'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [jobData, runData] = await Promise.all([
          apiGet('/jobs'),
          apiGet('/runs')
        ])
        setJobs(jobData)
        setRuns(runData.filter(run => run.status === 'queued').slice(0, 5))
      } catch (err) {
        setError(err?.message || 'Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Layout title="Jobs">
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <Card title="Scheduled Jobs" subtitle="Scheduler (APScheduler)">
          <div className="space-y-4">
            {loading ? (
              <LoadingCard label="Loading jobs" />
            ) : error ? (
              <ErrorState title="Failed to load jobs" description={error} />
            ) : jobs.length === 0 ? (
              <EmptyState
                title="No jobs registered"
                description="Add cron expressions in site notes to schedule runs."
              />
            ) : (
              jobs.map(job => (
                <div key={job.id} className="rounded-lg border border-line p-4">
                  <p className="font-medium">{job.name}</p>
                  <p className="text-sm text-muted">Next run: {job.next_run_time || 'n/a'}</p>
                </div>
              ))
            )}
            <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              Use notes like: <span className="font-mono">cron: */30 * * * *</span> to map a site to a schedule.
            </div>
          </div>
        </Card>

        <Card title="Queue" subtitle="Latest queued runs">
          <div className="space-y-3">
            {loading ? (
              <LoadingCard label="Loading queue" />
            ) : error ? (
              <ErrorState title="Queue unavailable" description={error} />
            ) : runs.length === 0 ? (
              <EmptyState
                title="No queued runs"
                description="Trigger a run from Sites to populate the queue."
              />
            ) : (
              runs.map(run => (
                <div key={run.id} className="rounded-lg border border-line p-3">
                  <p className="text-sm font-medium">Run #{run.id}</p>
                  <p className="text-xs text-muted">Site #{run.site_id}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
