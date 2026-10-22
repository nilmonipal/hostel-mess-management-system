import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StudentIcon from '../components/StudentIcon.jsx'
import { legacyApi } from '../services/api.js'

const mealTypes = ['breakfast', 'lunch', 'dinner']

function getDateKey(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function StatusBadge({ used }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        used ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
      }`}
    >
      {used ? 'Consumed' : 'Available'}
    </span>
  )
}

function MetricCard({ title, value, detail, icon, loading }) {
  return (
    <article className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-[#a20d24]">
          <StudentIcon name={icon} />
        </span>
      </div>
      {loading ? (
        <div aria-label={`Loading ${title}`} className="mt-4 h-8 w-20 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
      )}
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  )
}

function QuickAction({ to, title, detail, icon }) {
  return (
    <Link
      className="group flex items-center gap-3 rounded-2xl border border-amber-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
      to={to}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-[#a20d24]">
        <StudentIcon name={icon} />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
      <StudentIcon className="size-4 text-slate-400 transition group-hover:translate-x-1" name="arrow" />
    </Link>
  )
}

function readStoredUser() {
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function StudentDashboard() {
  const [todayMeals, setTodayMeals] = useState([])
  const [history, setHistory] = useState([])
  const [extensions, setExtensions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      setIsLoading(true)
      const today = new Date()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const historyEnd = new Date(today)
      historyEnd.setDate(historyEnd.getDate() + 365)

      const results = await Promise.allSettled([
        legacyApi.get('/api/meal-usage/today', { signal: controller.signal }),
        legacyApi.get('/api/meal-usage/history', {
          params: {
            startDate: getDateKey(monthStart),
            endDate: getDateKey(historyEnd),
          },
          signal: controller.signal,
        }),
        legacyApi.get('/api/meal-extensions/mine', { signal: controller.signal }),
      ])

      if (controller.signal.aborted) return
      const nextErrors = {}
      if (results[0].status === 'fulfilled') {
        setTodayMeals(results[0].value.data.mealUsage || [])
      } else {
        nextErrors.today = results[0].reason.response?.data?.message || 'Today’s meals could not be loaded.'
      }
      if (results[1].status === 'fulfilled') {
        setHistory(results[1].value.data.mealUsage || [])
      } else {
        nextErrors.history = results[1].reason.response?.data?.message || 'Meal history could not be loaded.'
      }
      if (results[2].status === 'fulfilled') {
        setExtensions(results[2].value.data.mealExtensions || [])
      } else {
        nextErrors.extensions =
          results[2].reason.response?.data?.message || 'Extension statuses could not be loaded.'
      }
      setErrors(nextErrors)
      setIsLoading(false)
    }

    loadDashboard()
    return () => controller.abort()
  }, [])

  const todayKey = getDateKey(new Date())
  const mealsByType = new Map(todayMeals.map((meal) => [meal.mealType, meal]))
  const monthMealCount = history.filter(
    (meal) => meal.used && getDateKey(meal.mealDate).slice(0, 7) === todayKey.slice(0, 7),
  ).length
  const remainingDays = new Set(
    history
      .filter((meal) => meal.entitled && getDateKey(meal.mealDate) >= todayKey)
      .map((meal) => getDateKey(meal.mealDate)),
  ).size
  const activeMeals = [
    ...new Set(todayMeals.filter((meal) => meal.entitled).map((meal) => meal.mealType)),
  ]
  const activePlan =
    activeMeals.length === 3
      ? 'Full day'
      : activeMeals.length
        ? activeMeals.map((meal) => `${meal[0].toUpperCase()}${meal.slice(1)}`).join(', ')
        : errors.today
          ? 'Unavailable'
          : 'No active plan'
  const pendingExtensions = extensions.filter((extension) => extension.status === 'pending').length
  const recentMeals = [...history]
    .sort((a, b) => new Date(b.mealDate) - new Date(a.mealDate))
    .slice(0, 5)
  const user = readStoredUser()
  const displayName = user?.name || user?.username || 'Student'

  return (
    <div className="space-y-7">
      <section className="rounded-2xl bg-gradient-to-r from-[#a20d24] to-[#7d1027] p-6 text-white shadow-md sm:p-8">
        <p className="text-sm font-medium text-amber-100">Welcome back,</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{displayName}</h1>
        <p className="mt-2 text-sm text-white/85">
          Here’s your mess overview for{' '}
          {new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date())}.
        </p>
      </section>

      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <p className="font-semibold">Some dashboard details could not be loaded.</p>
          {Object.entries(errors).map(([name, message]) => (
            <p className="mt-1" key={name}>{message}</p>
          ))}
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Today’s meal status</h2>
          <p className="mt-1 text-sm text-slate-500">Your meal availability for today.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {mealTypes.map((type) => {
            const meal = mealsByType.get(type)
            return (
              <article className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm" key={type}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold capitalize text-slate-900">{type}</h3>
                  <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-amber-50 text-xl">
                    {type === 'breakfast' ? '☀' : type === 'lunch' ? '🍽' : '☾'}
                  </span>
                </div>
                {isLoading ? (
                  <div className="mt-4 h-6 w-24 animate-pulse rounded bg-slate-100" />
                ) : errors.today ? (
                  <p className="mt-4 text-sm text-slate-500">Status unavailable</p>
                ) : meal?.entitled ? (
                  <div className="mt-4">
                    <StatusBadge used={meal.used} />
                    <p className="mt-2 text-xs text-slate-500">
                      {meal.used ? 'Meal recorded as consumed' : 'Ready to use today'}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    {todayMeals.length ? 'Not included in today’s plan' : 'No meal record for today'}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard detail="Today’s meal entitlements" icon="payment" loading={isLoading} title="Active meal plan" value={activePlan} />
        <MetricCard detail="Entitled days from today onward" icon="history" loading={isLoading} title="Remaining days" value={errors.history ? 'Unavailable' : remainingDays} />
        <MetricCard detail="Consumed meals this month" icon="dashboard" loading={isLoading} title="Monthly meal count" value={errors.history ? 'Unavailable' : monthMealCount} />
        <MetricCard detail={errors.extensions ? 'Extension statuses unavailable' : 'Awaiting review'} icon="extension" loading={isLoading} title="Pending extensions" value={errors.extensions ? '—' : pendingExtensions} />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">Common mess account tasks.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction detail="Choose meals and pay securely" icon="payment" title="Payments" to="/student/payments/new" />
          <QuickAction detail="Generate today’s meal QR" icon="qr" title="Meal QR code" to="/student/qr-code" />
          <QuickAction detail="Filter meals by date and status" icon="history" title="Meal usage" to="/student/meal-usage" />
          <QuickAction detail="Submit and track requests" icon="extension" title="Meal extensions" to="/student/extensions" />
          <QuickAction detail="Review orders and payment status" icon="payment" title="Payment history" to="/student/payment-history" />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Recent meals</h2>
            <p className="mt-1 text-xs text-slate-500">Latest meal usage records</p>
          </div>
          <Link className="text-sm font-semibold text-[#a20d24] hover:underline" to="/student/meal-usage">
            View all
          </Link>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-slate-500" role="status">Loading recent meals…</p>
        ) : errors.history ? (
          <p className="p-5 text-sm text-slate-500">Recent meals are unavailable.</p>
        ) : recentMeals.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No meal records found for this period.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentMeals.map((meal) => (
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" key={meal.mealUsageId || meal._id}>
                <div>
                  <p className="font-medium capitalize text-slate-800">{meal.mealType}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(meal.mealDate))}
                  </p>
                </div>
                <StatusBadge used={meal.used} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default StudentDashboard
