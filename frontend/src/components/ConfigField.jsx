import FormError from './FormError'
import { t } from '../i18n'

export default function ConfigField({ field, value, onChange, error }) {
  const id = `plugin-config-${field.key}`

  if (field.field_type === 'select') {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>
        <select
          id={id}
          className="w-full rounded-lg border border-line px-3 py-2"
          value={value || ''}
          onChange={e => onChange(field.key, e.target.value)}
        >
          <option value="">{t('common.selectPlaceholder')}</option>
          {(field.options || []).map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {field.description && <p className="text-xs text-muted">{field.description}</p>}
        <FormError message={error} />
      </div>
    )
  }

  if (field.field_type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={e => onChange(field.key, e.target.checked)}
        />
        <label className="text-sm" htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>
      <input
        id={id}
        className="w-full rounded-lg border border-line px-3 py-2"
        placeholder={field.placeholder || ''}
        value={value || ''}
        onChange={e => onChange(field.key, e.target.value)}
      />
      {field.description && <p className="text-xs text-muted">{field.description}</p>}
      <FormError message={error} />
    </div>
  )
}
