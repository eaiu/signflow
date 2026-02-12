import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { apiGet, createLogStream } from '../api/client'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [streaming, setStreaming] = useState(true)

  useEffect(() => {
    apiGet('/logs?limit=50').then(setLogs).catch(console.error)
  }, [])

  useEffect(() => {
    if (!streaming) return
    const close = createLogStream(null, payload => {
      setLogs(prev => [...prev, payload])
    })
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
      <Card title="Live Logs" subtitle="Streaming updates from scheduler">
        <div className="space-y-3">
          {logs.length === 0 && <p className="text-sm text-muted">No log entries yet.</p>}
          {logs.map(log => (
            <div key={`${log.id}-${log.created_at}`} className="rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{log.message}</p>
                <span className="text-xs text-muted">{log.level}</span>
              </div>
              <p className="text-xs text-muted">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  )
}
