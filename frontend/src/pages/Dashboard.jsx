import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import StatCard from '../components/StatCard'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import { apiGet, apiPost } from '../api/client'
import { t } from '../i18n'

export default function Dashboard() {
  const [stats, setStats] = useState({ sites: 0, runs: 0, logs: 0 })
  const [recentRuns, setRecentRuns] = useState([])
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      setActionError('')
      try {
        const [sites, runs, logs] = await Promise.all([
          apiGet('/sites'),
          apiGet('/runs'),
          apiGet('/logs?limit=20')
        ])
        setStats({ sites: sites.length, runs: runs.length, logs: logs.length })
        setRecentRuns(runs.slice(0, 5))
      } catch (err) {
        setError(err?.message || t('dashboard.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function triggerRun(siteId) {
    setCreating(true)
    setActionError('')
    try {
      await apiPost('/runs', { site_id: siteId })
    } catch (err) {
      setActionError(err?.message || t('dashboard.triggerFailed'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Layout title={t('dashboard.title')} actions={
      <button className="rounded-full bg-ink px-4 py-2 text-sm text-white">
        {t('dashboard.viewSchedule')}
      </button>
    }>
      {actionError && (
        <div className="mb-4">
          <ErrorState title={t('dashboard.actionFailed')} description={actionError} />
        </div>
      )}
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <LoadingCard label={t('dashboard.loadingStats')} />
          <LoadingCard label={t('dashboard.loadingStats')} />
          <LoadingCard label={t('dashboard.loadingStats')} />
        </div>
      ) : error ? (
        <ErrorState title={t('dashboard.unavailable')} description={error} />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <StatCard label={t('dashboard.activeSites')} value={stats.sites} hint={t('dashboard.activeSitesHint')} />
            <StatCard label={t('dashboard.runs')} value={stats.runs} hint={t('dashboard.runsHint')} />
            <StatCard label={t('dashboard.logs')} value={stats.logs} hint={t('dashboard.logsHint')} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card title={t('dashboard.recentRuns')} subtitle={t('dashboard.recentRunsSubtitle')}>
              <div className="space-y-4">
                {recentRuns.length === 0 ? (
                  <EmptyState
                    title={t('dashboard.noRuns')}
                    description={t('dashboard.noRunsDesc')}
                  />
                ) : (
                  recentRuns.map(run => (
                    <div key={run.id} className="flex items-center justify-between border-b border-line pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-medium">{t('dashboard.runLabel', { id: run.id, siteId: run.site_id })}</p>
                        <p className="text-sm text-muted">{t('dashboard.runStatus', { status: run.status })}</p>
                      </div>
                      <button
                        className="rounded-full border border-line px-3 py-1 text-xs text-muted"
                        onClick={() => triggerRun(run.site_id)}
                        disabled={creating}
                      >
                        {t('dashboard.rerun')}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card title={t('dashboard.nextScheduled')} subtitle={t('dashboard.upcomingJobs')}>
              <div className="space-y-3">
                <EmptyState
                  title={t('dashboard.noSchedulerRules')}
                  description={t('dashboard.noSchedulerRulesDesc')}
                />
                <button className="w-full rounded-full border border-line px-4 py-2 text-sm">{t('dashboard.addSchedule')}</button>
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  )
}
