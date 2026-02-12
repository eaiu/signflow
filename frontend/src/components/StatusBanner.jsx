export default function StatusBanner({ title, description, action, tone = 'info' }) {
  const tones = {
    info: 'border-slate-200 bg-slate-50 text-slate-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700'
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone] || tones.info}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          {description && <p className="mt-1 text-xs opacity-80">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
