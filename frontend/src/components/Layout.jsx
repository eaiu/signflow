import { Link, useLocation } from 'react-router-dom'
import { t } from '../i18n'

const NAV_ITEMS = [
  { to: '/', label: 'nav.dashboard' },
  { to: '/sites', label: 'nav.sites' },
  { to: '/jobs', label: 'nav.jobs' },
  { to: '/logs', label: 'nav.logs' },
  { to: '/settings', label: 'nav.settings' },
  { to: '/plugins', label: 'nav.plugins' }
]

export default function Layout({ title, actions, children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold text-ink">SignFlow</Link>
          <div className="flex items-center gap-4 text-sm text-muted">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={location.pathname === item.to ? 'font-medium text-ink' : 'hover:text-ink'}
              >
                {t(item.label)}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  )
}
