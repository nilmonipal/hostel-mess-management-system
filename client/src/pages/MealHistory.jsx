import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { legacyApi } from '../services/api.js'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function MealHistory() {
  const [records, setRecords] = useState([])
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    mealType: '',
    used: '',
    entitled: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadHistory() {
      setIsLoading(true)
      setError('')
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ''),
      )

      try {
        const { data } = await legacyApi.get('/api/meal-usage/history', {
          params,
          signal: controller.signal,
        })
        setRecords(data.mealUsage || [])
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load meal usage. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadHistory()
    return () => controller.abort()
  }, [filters, requestKey])

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function clearFilters() {
    setFilters({ startDate: '', endDate: '', mealType: '', used: '', entitled: '' })
  }

  return (
    <section>
      <div className="mb-6">
        <Link className="text-sm font-semibold text-[#a20d24] hover:underline" to="/student/dashboard">
          ← Dashboard
        </Link>
        <p className="mt-5 text-sm font-semibold text-[#a20d24]">Your meals</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Meal usage history</h1>
        <p className="mt-1 text-sm text-slate-500">
          Filter your entitlements and consumption records.
        </p>
      </div>

      <form
        className="mb-5 grid gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault()
          setRequestKey((key) => key + 1)
        }}
      >
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          From
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
            max={filters.endDate || undefined}
            name="startDate"
            onChange={updateFilter}
            type="date"
            value={filters.startDate}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          To
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
            min={filters.startDate || undefined}
            name="endDate"
            onChange={updateFilter}
            type="date"
            value={filters.endDate}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Meal
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
            name="mealType"
            onChange={updateFilter}
            value={filters.mealType}
          >
            <option value="">All meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Usage
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
            name="used"
            onChange={updateFilter}
            value={filters.used}
          >
            <option value="">All</option>
            <option value="true">Consumed</option>
            <option value="false">Unused</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Entitlement
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
            name="entitled"
            onChange={updateFilter}
            value={filters.entitled}
          >
            <option value="">All</option>
            <option value="true">Entitled</option>
            <option value="false">Not entitled</option>
          </select>
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <button
            className="rounded-lg bg-[#a20d24] px-4 py-2 text-sm font-semibold text-white hover:bg-[#85091c]"
            type="submit"
          >
            Apply filters
          </button>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={clearFilters}
            type="button"
          >
            Clear
          </button>
          <button
            aria-label="Refresh meal usage"
            className="ml-auto rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => setRequestKey((key) => key + 1)}
            type="button"
          >
            Refresh
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500" role="status">Loading meal usage…</p>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-red-700" role="alert">{error}</p>
            <button
              className="mt-3 text-sm font-semibold text-[#a20d24] underline"
              onClick={() => setRequestKey((key) => key + 1)}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No meal records match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-[#fff7dc] text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Meal</th>
                  <th className="px-5 py-3 font-semibold">Entitlement</th>
                  <th className="px-5 py-3 font-semibold">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.mealUsageId || record._id}>
                    <td className="px-5 py-4">{formatDate(record.mealDate)}</td>
                    <td className="px-5 py-4 font-medium capitalize">{record.mealType}</td>
                    <td className="px-5 py-4">{record.entitled ? 'Entitled' : 'Not entitled'}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          record.used
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {record.used ? 'Consumed' : 'Unused'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default MealHistory
