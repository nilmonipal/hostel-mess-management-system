import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/IGNTU_logo.png'
import StudentIcon from '../components/StudentIcon.jsx'

const adminNavigation = [
  { label: 'Overview', to: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Students', to: '/admin/students', icon: 'user' },
  { label: 'Transactions', to: '/admin/transactions', icon: 'payment' },
  { label: 'QR scanner', to: '/admin/qr-scanner', icon: 'qr' },
  { label: 'Extensions', to: '/admin/extensions', icon: 'extension' },
  { label: 'Reports', to: '/admin/reports', icon: 'history' },
]

function readUser() {
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = readUser()

  if (!window.localStorage.getItem('token')) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }
  if (user?.role !== 'admin') {
    return <Navigate replace to="/student/dashboard" />
  }

  function signOut() {
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[#fffaf0] text-slate-800">
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-amber-200 bg-[#ffed9e] transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link
          className="flex h-20 items-center gap-3 border-b border-amber-300 px-5"
          onClick={() => setSidebarOpen(false)}
          to="/admin/dashboard"
        >
          <img alt="IGNTU logo" className="size-11 rounded-lg object-cover" src={logo} />
          <span className="text-sm font-bold leading-tight text-[#721326]">
            IGNTU Mess Portal
            <span className="mt-1 block text-xs font-medium text-slate-600">Admin workspace</span>
          </span>
        </Link>
        <nav aria-label="Admin navigation" className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
          {adminNavigation.map(({ label, to, icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#a20d24] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-amber-200'
                }`
              }
              key={to}
              onClick={() => setSidebarOpen(false)}
              to={to}
            >
              <StudentIcon name={icon} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-amber-300 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#a20d24] text-sm font-bold text-white">
              {(user?.name || user?.username || 'A').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {user?.name || user?.username || 'Administrator'}
              </span>
              <span className="block truncate text-xs text-slate-500">Administrator</span>
            </span>
            <button
              aria-label="Sign out"
              className="rounded-lg p-2 text-slate-500 hover:bg-amber-100 hover:text-[#a20d24]"
              onClick={signOut}
              type="button"
            >
              <StudentIcon name="logout" />
            </button>
          </div>
        </div>
      </aside>
      <div className="min-h-dvh lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-amber-100 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              className="rounded-lg p-2 text-slate-700 hover:bg-amber-50 lg:hidden"
              onClick={() => setSidebarOpen((open) => !open)}
              type="button"
            >
              <StudentIcon name={sidebarOpen ? 'close' : 'menu'} />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-900 sm:text-base">Admin Dashboard</p>
              <p className="hidden text-xs text-slate-500 sm:block">Hostel Mess Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-[#811226]">
            <span className="size-2 rounded-full bg-emerald-500" />
            Admin access
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
