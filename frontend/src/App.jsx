import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Sites from './pages/Sites'
import SiteDetail from './pages/SiteDetail'
import Logs from './pages/Logs'
import Jobs from './pages/Jobs'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/sites" element={<Sites />} />
      <Route path="/sites/:id" element={<SiteDetail />} />
      <Route path="/logs" element={<Logs />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}
