import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import StatusBanner from '../components/StatusBanner'
import { apiGet, apiPost } from '../api/client'

function PluginList({ plugins, activeKey, onSelect }) {
  if (plugins.length === 0) {
    return <EmptyState title="No plugins" description="No plugins found in the registry." />
  }
  return (
    <div className="space-y-3">
      {plugins.map(plugin => (
        <button
          key={plugin.key}
          type="button"
          onClick={() => onSelect(plugin.key)}
          className={`w-full rounded-lg border px-4 py-3 text-left transition ${plugin.key === activeKey ? 'border-ink bg-slate-50' : 'border-line hover:border-ink'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{plugin.name}</p>
              <p className="text-xs text-muted">{plugin.key}</p>
            </div>
            <span className="text-xs text-muted">{plugin.category || 'general'}</span>
          </div>
          {plugin.description && <p className="mt-2 text-sm text-muted">{plugin.description}</p>}
        </button>
      ))}
    </div>
  )
}

function PluginDetail({ plugin }) {
  if (!plugin) {
    return <EmptyState title="Select a plugin" description="Pick a plugin to view details and configuration schema." />
  }
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted">Key</p>
        <p className="font-medium">{plugin.key}</p>
      </div>
      <div>
        <p className="text-sm text-muted">Version</p>
        <p className="font-medium">{plugin.version || '1.0'}</p>
      </div>
      <div>
        <p className="text-sm text-muted">Category</p>
        <p className="font-medium">{plugin.category || 'general'}</p>
      </div>
      {plugin.description && (
        <div>
          <p className="text-sm text-muted">Description</p>
          <p className="text-sm">{plugin.description}</p>
        </div>
      )}
      <div>
        <p className="text-sm text-muted">Config schema</p>
        {plugin.config_schema && plugin.config_schema.length > 0 ? (
          <div className="space-y-2">
            {plugin.config_schema.map(field => (
              <div key={field.key} className="rounded-lg border border-line px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{field.label || field.key}</p>
                  <span className="text-xs text-muted">{field.field_type}</span>
                </div>
                {field.description && <p className="text-xs text-muted">{field.description}</p>}
                {field.required && <p className="text-xs text-rose-600">Required</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No config fields" description="This plugin does not require configuration." />
        )}
      </div>
    </div>
  )
}

export default function Plugins() {
  const [plugins, setPlugins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [status, setStatus] = useState('')
  const [activeKey, setActiveKey] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    apiGet('/plugins')
      .then(data => {
        setPlugins(data || [])
        if (data && data.length) {
          setActiveKey(data[0].key)
        }
      })
      .catch(err => setError(err?.message || 'Failed to load plugins'))
      .finally(() => setLoading(false))
  }, [])

  const activePlugin = useMemo(
    () => plugins.find(plugin => plugin.key === activeKey),
    [plugins, activeKey]
  )

  async function reloadPlugins() {
    setActionError('')
    setStatus('')
    try {
      const result = await apiPost('/plugins/reload', {})
      setPlugins(result.plugins || [])
      if (result.plugins && result.plugins.length) {
        setActiveKey(result.plugins[0].key)
      }
      setStatus(`Reloaded ${result.count} plugins`)
    } catch (err) {
      setActionError(err?.message || 'Failed to reload plugins')
    }
  }

  return (
    <Layout title="Plugins" actions={
      <button onClick={reloadPlugins} className="rounded-full border border-line px-4 py-2 text-sm">Reload</button>
    }>
      {actionError && (
        <div className="mb-4">
          <ErrorState title="Action failed" description={actionError} />
        </div>
      )}
      {status && (
        <div className="mb-4">
          <StatusBanner title="Plugins" description={status} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card title="Plugin Registry" subtitle="Available sign-in plugins">
          {loading ? (
            <LoadingCard label="Loading plugins" />
          ) : error ? (
            <ErrorState title="Failed to load" description={error} />
          ) : (
            <PluginList plugins={plugins} activeKey={activeKey} onSelect={setActiveKey} />
          )}
        </Card>
        <Card title="Plugin Details" subtitle="Metadata and schema">
          <PluginDetail plugin={activePlugin} />
        </Card>
      </div>
    </Layout>
  )
}
