import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import StatusBanner from '../components/StatusBanner'
import { apiGet, apiPost } from '../api/client'
import { t } from '../i18n'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [siteId, setSiteId] = useState('')
  const [cron, setCron] = useState('')
  const [status, setStatus] = useState('')
  const [adminToken, setAdminToken] = useState('')

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
        setError(err?.message || t('jobs.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function validateCron() {
    setStatus('')
    setError('')
    try {
      await apiPost('/jobs/validate', { site_id: Number(siteId), cron })
      setStatus(t('jobs.cronValid'))
    } catch (err) {
      setError(err?.message || t('jobs.cronInvalid'))
    }
  }

  async function runNow() {
    setStatus('')
    setError('')
    try {
      const result = await apiPost('/jobs/run', { site_id: Number(siteId), cron }, adminToken)
      setStatus(t('jobs.runQueued', { id: result.run_id }))
    } catch (err) {
      setError(err?.message || t('jobs.runFailed'))
    }
  }

  return (
    <Layout title={t('jobs.title')}>
      {status && (
        <div className="mb-4">
          <StatusBanner title={t('jobs.statusTitle')} description={status} />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <ErrorState title={t('jobs.statusTitle')} description={error} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-6">
          <Card title={t('jobs.scheduleTitle')} subtitle={t('jobs.scheduleSubtitle')}>
            <div className="space-y-4">
              {loading ? (
                <LoadingCard label={t('jobs.loading')} />
              ) : error ? (
                <ErrorState title={t('jobs.failed')} description={error} />
              ) : jobs.length === 0 ? (
                <EmptyState
                  title={t('jobs.noJobs')}
                  description={t('jobs.noJobsDesc')}
                />
              ) : (
                jobs.map(job => (
                  <div key={job.id} className="rounded-lg border border-line p-4">
                    <p className="font-medium">{job.name}</p>
                    <p className="text-sm text-muted">{t('jobs.nextRun', { time: job.next_run_time || 'n/a' })}</p>
                  </div>
                ))
              )}
              <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">
                {t('jobs.notesTip', { example: 'cron: */30 * * * *' })}
              </div>
            </div>
          </Card>

          <Card title={t('jobs.runNow')} subtitle={t('jobs.runNowSubtitle')}>
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                placeholder={t('jobs.siteIdPlaceholder')}
                value={siteId}
                onChange={e => setSiteId(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                placeholder={t('jobs.cronPlaceholder')}
                value={cron}
                onChange={e => setCron(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="rounded-full border border-line px-4 py-2 text-sm" onClick={validateCron} type="button">{t('jobs.validate')}</button>
                <button className="rounded-full bg-ink px-4 py-2 text-sm text-white" onClick={runNow} type="button">{t('jobs.run')}</button>
              </div>
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                type="password"
                placeholder={t('jobs.adminTokenPlaceholder')}
                value={adminToken}
                onChange={e => setAdminToken(e.target.value)}
              />
            </div>
          </Card>
        </div>

        <Card title={t('jobs.queue')} subtitle={t('jobs.queueSubtitle')}>
          <div className="space-y-3">
            {loading ? (
              <LoadingCard label={t('jobs.queueLoading')} />
            ) : error ? (
              <ErrorState title={t('jobs.queueUnavailable')} description={error} />
            ) : runs.length === 0 ? (
              <EmptyState
                title={t('jobs.queueEmpty')}
                description={t('jobs.queueEmptyDesc')}
              />
            ) : (
              runs.map(run => (
                <div key={run.id} className="rounded-lg border border-line p-3">
                  <p className="text-sm font-medium">{t('dashboard.runLabel', { id: run.id, siteId: run.site_id })}</p>
                  <p className="text-xs text-muted">{t('sites.title')} #{run.site_id}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
