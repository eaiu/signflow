import { t } from '../i18n'

export default function LoadingCard({ label = t('common.loading') }) {
  return (
    <div className="rounded-lg border border-line p-4 text-sm text-muted">
      {label}...
    </div>
  )
}
