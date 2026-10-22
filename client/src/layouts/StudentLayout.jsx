import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/IGNTU_logo.png'
import StudentIcon from '../components/StudentIcon.jsx'

const navigation = [
  { label: 'Dashboard', to: '/student/dashboard', icon: 'dashboard' },
  { label: 'Meal usage', to: '/student/meal-usage', icon: 'history' },
  { label: 'Payments', to: '/student/payments/new', icon: 'payment' },
  { label: 'Payment history', to: '/student/payment-history', icon: 'payment' },
  { label: 'Meal QR code', to: '/student/qr-code', icon: 'qr' },
  { label: 'Extensions', to: '/student/extensions', icon: 'extension' },
]

function getStoredUser() {
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function StudentLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = getStoredUser()
  const token = window.localStorage.getItem('token')

  if (!token) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  const displayName = user?.name || user?.username || 'Student'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  function signOut() {
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[#fffaf0] text-slate-800">
      {isSidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-amber-200 bg-[#ffed9e] transition-transform duration-200 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link
          className="flex h-20 items-center gap-3 border-b border-amber-300 px-5"
          onClick={() => setIsSidebarOpen(false)}
          to="/student/dashboard"
        >
          <img alt="IGNTU logo" className="size-11 rounded-lg object-cover" src={logo} />
          <span className="text-sm font-bold leading-tight text-[#721326]">
            IGNTU Mess Portal
            <span className="mt-1 block text-xs font-medium text-slate-600">
              Student workspace
            </span>
          </span>
        </Link>

        <nav aria-label="Student navigation" className="flex-1 space-y-2 px-3 py-6">
          {navigation.map(({ label, to, icon }) => (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#a20d24] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-amber-200'
                }`
              }
              key={to}
              onClick={() => setIsSidebarOpen(false)}
              to={to}
            >
              <StudentIcon name={icon} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-amber-300 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#a20d24] text-sm font-bold text-white">
              {initials || <StudentIcon name="user" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{displayName}</span>
              <span className="block truncate text-xs text-slate-500">
                {user?.email || 'Student account'}
              </span>
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
              aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
              className="rounded-lg p-2 text-slate-700 hover:bg-amber-50 lg:hidden"
              onClick={() => setIsSidebarOpen((open) => !open)}
              type="button"
            >
              <StudentIcon name={isSidebarOpen ? 'close' : 'menu'} />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-900 sm:text-base">Student Dashboard</p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Hostel Mess Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role || 'student'}</p>
            </div>
            <span className="hidden size-10 place-items-center rounded-full bg-[#a20d24] text-sm font-bold text-white sm:grid">
              {initials || <StudentIcon name="user" />}
            </span>
            <div className="relative">
              <button
                aria-expanded={isNotificationsOpen}
                aria-label="Notifications"
                className={`relative rounded-xl p-2.5 transition ${
                  isNotificationsOpen
                    ? 'bg-amber-100 text-[#a20d24]'
                    : 'text-slate-600 hover:bg-amber-50'
                }`}
                onClick={() => setIsNotificationsOpen((open) => !open)}
                type="button"
              >
                <StudentIcon name="bell" />
              </button>
              {isNotificationsOpen && (
                <div className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-amber-100 bg-white p-4 shadow-xl">
                  <p className="font-semibold text-slate-900">Notifications</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Notifications are not available yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StudentLayout
