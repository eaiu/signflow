export default function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-soft">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
    </div>
  )
}
