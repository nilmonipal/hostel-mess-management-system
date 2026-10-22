import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, legacyApi } from '../services/api.js'

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function MealExtensions() {
  const [payments, setPayments] = useState([])
  const [extensions, setExtensions] = useState([])
  const [paymentId, setPaymentId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setIsLoading(true)
      setError('')
      try {
        const [paymentResult, extensionResult] = await Promise.allSettled([
          api.get('/payments/history', { signal: controller.signal }),
          legacyApi.get('/api/meal-extensions/mine', { signal: controller.signal }),
        ])
        if (paymentResult.status === 'fulfilled') {
          setPayments(
            (paymentResult.value.data.payments || []).filter((payment) => payment.status === 'paid'),
          )
        }
        if (extensionResult.status === 'fulfilled') {
          setExtensions(extensionResult.value.data.mealExtensions || [])
        }
        if (paymentResult.status === 'rejected') {
          throw paymentResult.reason
        }
        if (extensionResult.status === 'rejected') {
          throw extensionResult.reason
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            requestError.response?.data?.message ||
              'Unable to load meal extension data. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [refreshKey])

  async function submitRequest(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSubmitting(true)

    try {
      const { data } = await legacyApi.post('/api/meal-extensions', {
        paymentId,
        fromDate,
        toDate,
        reason: reason.trim(),
      })
      if (!data.mealExtension) {
        throw new Error('The server did not return the created extension request.')
      }
      setNotice('Your extension request was submitted. You can track its status below.')
      setPaymentId('')
      setFromDate('')
      setToDate('')
      setReason('')
      setRefreshKey((key) => key + 1)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to submit the extension request.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <div className="mb-6">
        <Link className="text-sm font-semibold text-[#a20d24] hover:underline" to="/student/dashboard">
          ← Dashboard
        </Link>
        <p className="mt-5 text-sm font-semibold text-[#a20d24]">Meal plan support</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Meal extensions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Request extra meal days and track submitted requests.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <form
          className="grid gap-4 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"
          onSubmit={submitRequest}
        >
          <h2 className="font-bold text-slate-900">New extension request</h2>
          <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            Select a paid meal plan and a date range that contains meal records you have used.
          </p>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Paid meal plan
            <select
              className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              onChange={(event) => setPaymentId(event.target.value)}
              required
              value={paymentId}
            >
              <option value="">Select a paid plan</option>
              {payments.map((payment) => (
                <option key={payment._id} value={payment._id}>
                  {payment.mealType} · {payment.numberOfMeals} days · {formatDate(payment.startDate)}
                </option>
              ))}
            </select>
            {!isLoading && payments.length === 0 && (
              <span className="text-xs text-slate-500">
                No paid meal plans are available. Payment status is verified by the server.
              </span>
            )}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              From
              <input
                className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                required
                type="date"
                value={fromDate}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              To
              <input
                className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                required
                type="date"
                value={toDate}
              />
            </label>
          </div>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Reason
            <textarea
              className="min-h-28 rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              maxLength="500"
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why you need the extension"
              required
              value={reason}
            />
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          {notice && <p className="text-sm text-emerald-800" role="status">{notice}</p>}
          <button
            className="rounded-lg bg-[#a20d24] px-4 py-3 font-semibold text-white hover:bg-[#85091c] disabled:opacity-60"
            disabled={isLoading || isSubmitting || payments.length === 0}
            type="submit"
          >
            {isSubmitting ? 'Submitting…' : 'Submit extension request'}
          </button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Request status</h2>
              <p className="mt-1 text-xs text-slate-500">Statuses from your account</p>
            </div>
            <button
              className="text-sm font-semibold text-[#a20d24] hover:underline"
              onClick={() => setRefreshKey((key) => key + 1)}
              type="button"
            >
              Refresh
            </button>
          </div>
          {isLoading ? (
            <p className="p-5 text-sm text-slate-500" role="status">Loading extension requests…</p>
          ) : error && extensions.length === 0 ? (
            <p className="p-5 text-sm text-red-700" role="alert">{error}</p>
          ) : extensions.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No extension requests yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {extensions.map((extension) => (
                <article className="space-y-2 p-5" key={extension._id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800">
                      {formatDate(extension.fromDate)} – {formatDate(extension.toDate)}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        extension.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : extension.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {extension.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{extension.reason}</p>
                  <p className="text-xs text-slate-500">
                    {extension.numberOfDays} day{extension.numberOfDays === 1 ? '' : 's'} · Requested {formatDate(extension.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default MealExtensions
