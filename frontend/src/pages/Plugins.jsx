import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingCard from '../components/LoadingCard'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import StatusBanner from '../components/StatusBanner'
import FormError from '../components/FormError'
import { apiGet, apiPost } from '../api/client'
import { t } from '../i18n'

const DEFAULT_CODE = `from app.plugins.base import PluginResult\n\n\n\ndef run(context):\n    return PluginResult.success("Hello from custom plugin")\n`

function PluginList({ plugins, activeKey, onSelect }) {
  if (plugins.length === 0) {
    return <EmptyState title={t('plugins.noPlugins')} description={t('plugins.noPluginsDesc')} />
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
            <span className="text-xs text-muted">{plugin.category || t('common.none')}</span>
          </div>
          {plugin.description && <p className="mt-2 text-sm text-muted">{plugin.description}</p>}
        </button>
      ))}
    </div>
  )
}

function PluginDetail({ plugin }) {
  if (!plugin) {
    return <EmptyState title={t('plugins.selectTitle')} description={t('plugins.selectDesc')} />
  }
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted">{t('plugins.key')}</p>
        <p className="font-medium">{plugin.key}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('plugins.version')}</p>
        <p className="font-medium">{plugin.version || '1.0'}</p>
      </div>
      <div>
        <p className="text-sm text-muted">{t('plugins.category')}</p>
        <p className="font-medium">{plugin.category || t('common.none')}</p>
      </div>
      {plugin.description && (
        <div>
          <p className="text-sm text-muted">{t('plugins.description')}</p>
          <p className="text-sm">{plugin.description}</p>
        </div>
      )}
      <div>
        <p className="text-sm text-muted">{t('plugins.configSchema')}</p>
        {plugin.config_schema && plugin.config_schema.length > 0 ? (
          <div className="space-y-2">
            {plugin.config_schema.map(field => (
              <div key={field.key} className="rounded-lg border border-line px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{field.label || field.key}</p>
                  <span className="text-xs text-muted">{field.field_type}</span>
                </div>
                {field.description && <p className="text-xs text-muted">{field.description}</p>}
                {field.required && <p className="text-xs text-rose-600">{t('plugins.fieldRequired')}</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={t('plugins.noConfig')} description={t('plugins.noConfigDesc')} />
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
  const [editor, setEditor] = useState({ key: '', name: '', description: '', version: '1.0', category: 'custom', run_code: DEFAULT_CODE, config_schema: [], configSchemaRaw: '[]', parseError: '' })
  const [adminToken, setAdminToken] = useState('')
  const [formErrors, setFormErrors] = useState({})

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
      .catch(err => setError(err?.message || t('plugins.loadFailed')))
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
      setStatus(t('plugins.reloaded', { count: result.count }))
    } catch (err) {
      setActionError(err?.message || t('plugins.reloadFailed'))
    }
  }

  function validateEditor() {
    const next = {}
    if (!editor.key.trim()) next.key = t('plugins.keyRequired')
    if (!editor.name.trim()) next.name = t('plugins.nameRequired')
    if (!editor.run_code.trim()) next.run_code = t('plugins.runCodeRequired')
    if (!Array.isArray(editor.config_schema) || editor.parseError) next.config_schema = t('plugins.configSchemaInvalid')
    if (!adminToken.trim()) next.adminToken = t('plugins.adminTokenRequired')
    return next
  }

  async function savePlugin() {
    const nextErrors = validateEditor()
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setActionError('')
    try {
      const result = await apiPost('/plugins/custom', {
        key: editor.key.trim(),
        name: editor.name.trim(),
        description: editor.description,
        version: editor.version,
        category: editor.category,
        config_schema: editor.config_schema || [],
        run_code: editor.run_code
      }, adminToken)
      setStatus(t('plugins.saved', { name: result.plugin.name }))
      setEditor(prev => ({ ...prev, parseError: '' }))
      const updated = await apiGet('/plugins')
      setPlugins(updated || [])
      setActiveKey(result.plugin.key)
    } catch (err) {
      setActionError(err?.message || t('plugins.saveFailed'))
    }
  }

  return (
    <Layout title={t('plugins.title')} actions={
      <button onClick={reloadPlugins} className="rounded-full border border-line px-4 py-2 text-sm">{t('plugins.reload')}</button>
    }>
      {actionError && (
        <div className="mb-4">
          <ErrorState title={t('plugins.actionFailed')} description={actionError} />
        </div>
      )}
      {status && (
        <div className="mb-4">
          <StatusBanner title={t('plugins.title')} description={status} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card title={t('plugins.registryTitle')} subtitle={t('plugins.registrySubtitle')}>
          {loading ? (
            <LoadingCard label={t('plugins.loading')} />
          ) : error ? (
            <ErrorState title={t('plugins.loadFailed')} description={error} />
          ) : (
            <PluginList plugins={plugins} activeKey={activeKey} onSelect={setActiveKey} />
          )}
        </Card>
        <Card title={t('plugins.selectTitle')} subtitle={t('plugins.selectDesc')}>
          <PluginDetail plugin={activePlugin} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <Card title={t('plugins.editorTitle')} subtitle={t('plugins.editorSubtitle')}>
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-line px-3 py-2"
              placeholder={t('plugins.keyPlaceholder')}
              value={editor.key}
              onChange={e => setEditor(prev => ({ ...prev, key: e.target.value }))}
            />
            <FormError message={formErrors.key} />
            <input
              className="w-full rounded-lg border border-line px-3 py-2"
              placeholder={t('plugins.namePlaceholder')}
              value={editor.name}
              onChange={e => setEditor(prev => ({ ...prev, name: e.target.value }))}
            />
            <FormError message={formErrors.name} />
            <input
              className="w-full rounded-lg border border-line px-3 py-2"
              placeholder={t('plugins.descPlaceholder')}
              value={editor.description}
              onChange={e => setEditor(prev => ({ ...prev, description: e.target.value }))}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                placeholder={t('plugins.versionPlaceholder')}
                value={editor.version}
                onChange={e => setEditor(prev => ({ ...prev, version: e.target.value }))}
              />
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                placeholder={t('plugins.categoryPlaceholder')}
                value={editor.category}
                onChange={e => setEditor(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <textarea
              className="min-h-[200px] w-full rounded-lg border border-line px-3 py-2 font-mono text-xs"
              value={editor.run_code}
              onChange={e => setEditor(prev => ({ ...prev, run_code: e.target.value }))}
            />
            <FormError message={formErrors.run_code} />
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted">{t('plugins.configSchemaLabel')}</label>
              <textarea
                className="min-h-[120px] w-full rounded-lg border border-line px-3 py-2 font-mono text-xs"
                value={editor.configSchemaRaw || JSON.stringify(editor.config_schema || [], null, 2)}
                onChange={e => {
                  const value = e.target.value
                  try {
                    const parsed = JSON.parse(value)
                    setEditor(prev => ({ ...prev, config_schema: parsed, configSchemaRaw: value, parseError: '' }))
                  } catch {
                    setEditor(prev => ({ ...prev, configSchemaRaw: value, parseError: t('plugins.configSchemaInvalid') }))
                  }
                }}
              />
              <p className="text-xs text-muted">{t('plugins.configSchemaHint')}</p>
              {(editor.parseError || !Array.isArray(editor.config_schema)) && (
                <p className="text-xs text-rose-600">{t('plugins.configSchemaInvalid')}</p>
              )}
            </div>
            <FormError message={formErrors.config_schema} />
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted">{t('plugins.adminToken')}</label>
              <input
                className="w-full rounded-lg border border-line px-3 py-2"
                type="password"
                value={adminToken}
                onChange={e => setAdminToken(e.target.value)}
              />
              <FormError message={formErrors.adminToken} />
            </div>
            <button onClick={savePlugin} className="w-full rounded-full bg-ink px-4 py-2 text-sm text-white">{t('plugins.save')}</button>
          </div>
        </Card>
        <Card title={t('plugins.editorTips')} subtitle={t('plugins.editorTipsSubtitle')}>
          <div className="space-y-2 text-sm text-muted">
            <p>{t('plugins.editorTip1')}</p>
            <p>{t('plugins.editorTip2')}</p>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
