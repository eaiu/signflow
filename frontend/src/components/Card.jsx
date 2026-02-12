export default function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-6 shadow-soft ${className}`}>
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
