import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function PaymentHistory() {
  const [payments, setPayments] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPayments() {
      setIsLoading(true)
      setError('')
      try {
        const { data } = await api.get('/payments/history', { signal: controller.signal })
        setPayments(data.payments || [])
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load payment history. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadPayments()
    return () => controller.abort()
  }, [refreshKey])

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const paymentDate = payment.createdAt
          ? new Date(payment.createdAt).toISOString().slice(0, 10)
          : ''
        return (
          (!statusFilter || payment.status === statusFilter) &&
          (!startDate || paymentDate >= startDate) &&
          (!endDate || paymentDate <= endDate)
        )
      }),
    [endDate, payments, startDate, statusFilter],
  )

  return (
    <section>
      <div className="mb-6">
        <Link className="text-sm font-semibold text-[#a20d24] hover:underline" to="/student/dashboard">
          ← Dashboard
        </Link>
        <p className="mt-5 text-sm font-semibold text-[#a20d24]">Payments</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Payment history</h1>
        <p className="mt-1 text-sm text-slate-500">
          Confirmed, pending, and failed meal orders from your account.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Status
          <select
            className="min-w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          From
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
            type="date"
            value={startDate}
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          To
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800"
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            type="date"
            value={endDate}
          />
        </label>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            setStatusFilter('')
            setStartDate('')
            setEndDate('')
          }}
          type="button"
        >
          Clear
        </button>
        <button
          className="ml-auto rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => setRefreshKey((key) => key + 1)}
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500" role="status">Loading payment history…</p>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-red-700" role="alert">{error}</p>
            <button
              className="mt-3 text-sm font-semibold text-[#a20d24] underline"
              onClick={() => setRefreshKey((key) => key + 1)}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {payments.length ? 'No payments match these filters.' : 'No payment records found.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#fff7dc] text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Days</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-5 py-4">{formatDate(payment.createdAt || payment.startDate)}</td>
                    <td className="px-5 py-4 font-medium capitalize">{payment.mealType}</td>
                    <td className="px-5 py-4">{payment.numberOfMeals}</td>
                    <td className="px-5 py-4">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      }).format(payment.totalAmount || 0)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          payment.status === 'paid' || payment.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : payment.status === 'failed'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {payment.status}
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

export default PaymentHistory
