import { t } from '../i18n'

export default function ErrorState({ title = t('errors.somethingWrong'), description, action }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 text-xs opacity-80">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
