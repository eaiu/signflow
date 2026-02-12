import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import StatusBanner from '../components/StatusBanner'
import { apiGet, createLogStream } from '../api/client'

const LEVEL_STYLE = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-slate-200 bg-white text-slate-700',
  debug: 'border-slate-200 bg-slate-50 text-slate-600'
}

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [streaming, setStreaming] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [streamError, setStreamError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setStreamError('')
    apiGet('/logs?limit=80')
      .then(setLogs)
      .catch(err => setError(err?.message || 'Failed to load logs'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!streaming) return
    const close = createLogStream(
      null,
      payload => {
        setLogs(prev => [...prev.slice(-80), payload])
      },
      () => {
        setStreamError('Live stream disconnected')
      }
    )
    return () => close()
  }, [streaming])

  return (
    <Layout title="Logs" actions={
      <button
        className="rounded-full border border-line px-4 py-2 text-sm"
        onClick={() => setStreaming(prev => !prev)}
      >
        {streaming ? 'Pause stream' : 'Resume stream'}
      </button>
    }>
      {streamError && (
        <div className="mb-4">
          <ErrorState title="Stream stopped" description={streamError} />
        </div>
      )}
      <Card title="Live Logs" subtitle="Streaming updates from scheduler">
        <div className="space-y-3">
          {loading ? (
            <LoadingCard label="Loading logs" />
          ) : error ? (
            <ErrorState title="Failed to load logs" description={error} />
          ) : logs.length === 0 ? (
            <EmptyState title="No log entries yet" description="Run a site to see its activity here." />
          ) : (
            logs.map(log => (
              <div key={`${log.id}-${log.created_at}`} className={`rounded-lg border p-3 ${LEVEL_STYLE[log.level] || LEVEL_STYLE.info}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{log.message}</p>
                    {log.event && <p className="text-xs text-muted">{log.event}</p>}
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted">{log.level}</span>
                </div>
                {log.payload && (
                  <div className="mt-2 rounded-md bg-white/70 px-2 py-1 text-xs text-slate-600">
                    {typeof log.payload === "string" ? log.payload : JSON.stringify(log.payload, null, 2)}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted">{new Date(log.created_at).toLocaleString()}</p>
                {log.level === 'error' && log.payload?.error && (
                  <StatusBanner title="Error" description={log.payload.error} tone="error" />
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </Layout>
  )
}
