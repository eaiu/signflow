import { Link, NavLink, useNavigate } from 'react-router-dom'
import { clearApiToken } from '../api/auth'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/sites', label: 'Sites' },
  { to: '/logs', label: 'Logs' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/settings', label: 'Settings' }
]

export default function Layout({ title, children, actions }) {
  const navigate = useNavigate()

  function handleLogout() {
    clearApiToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-shell text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">SignFlow</Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-4 text-sm text-muted">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-1 transition ${isActive ? 'bg-ink text-white' : 'hover:text-ink'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              className="rounded-full border border-line px-3 py-1 text-xs text-muted"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Minimalist console</p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  )
}
