export default function LoadingCard({ label = 'Loading' }) {
  return (
    <div className="rounded-lg border border-line p-4 text-sm text-muted">
      {label}...
    </div>
  )
}
