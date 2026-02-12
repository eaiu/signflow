export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-line p-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-2 text-xs text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
