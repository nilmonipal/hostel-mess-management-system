import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, legacyApi } from '../services/api.js'
import { loadRazorpayCheckout } from '../services/razorpay.js'

const mealOptions = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'fullday', label: 'Full day' },
]

const purchaseOptions = [
  { id: 'daily', label: 'Daily', days: 1, detail: 'One day of meals' },
  { id: 'multi-day', label: 'Multi-day', detail: 'Choose the number of days' },
  { id: 'monthly', label: 'Monthly subscription', days: 30, detail: '30 days of meals' },
]

function getStoredUser() {
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function PaymentPage() {
  const [mealType, setMealType] = useState('fullday')
  const [purchaseType, setPurchaseType] = useState('daily')
  const [customDays, setCustomDays] = useState('7')
  const [prices, setPrices] = useState([])
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [priceError, setPriceError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentState, setPaymentState] = useState('')
  const [error, setError] = useState('')
  const [verificationPayload, setVerificationPayload] = useState(null)
  const user = getStoredUser()

  useEffect(() => {
    const controller = new AbortController()

    async function loadPrices() {
      setIsLoadingPrices(true)
      setPriceError('')
      try {
        const { data } = await legacyApi.get('/api/mealPriceAndTime', {
          signal: controller.signal,
        })
        setPrices(data.data || [])
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setPriceError(
            requestError.response?.data?.message ||
              'Meal prices could not be loaded. The order summary is unavailable.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingPrices(false)
      }
    }

    loadPrices()
    return () => controller.abort()
  }, [])

  const numberOfMeals =
    purchaseType === 'daily'
      ? 1
      : purchaseType === 'monthly'
        ? 30
        : Number(customDays)

  const dailyRate = useMemo(() => {
    const matchingPrices = prices.filter((item) => item.mealType === mealType)
    if (matchingPrices.length) {
      return matchingPrices.reduce((total, item) => total + Number(item.mealPrice || 0), 0)
    }
    if (mealType === 'fullday') {
      return prices
        .filter((item) => ['breakfast', 'lunch', 'dinner'].includes(item.mealType))
        .reduce((total, item) => total + Number(item.mealPrice || 0), 0)
    }
    return null
  }, [mealType, prices])

  const totalAmount = dailyRate == null ? null : dailyRate * numberOfMeals

  async function verifyPayment(payload) {
    setPaymentState('verifying')
    setError('')
    try {
      const { data: verification } = await api.post('/verifyPayment', payload)
      if (!verification.success || verification.payment?.status !== 'paid') {
        throw new Error('The server could not confirm this payment.')
      }
      setPaymentState('confirmed')
    } catch (verificationError) {
      setPaymentState('verification-error')
      setError(
        verificationError.response?.data?.message ||
          verificationError.message ||
          'Payment could not be confirmed. Retry server verification before starting another payment.',
      )
    }
  }

  async function handleCheckout(event) {
    event.preventDefault()
    setError('')
    setPaymentState('')
    setVerificationPayload(null)
    if (!Number.isInteger(numberOfMeals) || numberOfMeals < 1) {
      setError('Choose a valid number of days.')
      return
    }
    if (isLoadingPrices || priceError || dailyRate == null || dailyRate <= 0) {
      setError(priceError || 'A valid meal price is not available for this plan.')
      return
    }

    setIsSubmitting(true)
    let orderCreated = false
    try {
      const { data: orderData } = await api.post('/createOrder', {
        mealType,
        numberOfMeals,
      })
      orderCreated = true
      if (!orderData.keyId || !orderData.order?.id || !orderData.payment?._id) {
        throw new Error('The server did not return the information required to open checkout.')
      }
      if (
        Math.round(Number(orderData.payment.totalAmount) * 100) !==
        Number(orderData.order.amount)
      ) {
        throw new Error('The order amount returned by the server does not match its payment summary.')
      }
      if (Number(orderData.payment.totalAmount) !== Number(totalAmount)) {
        throw new Error('Meal prices changed while creating your order. Check payment history before trying again.')
      }

      await loadRazorpayCheckout()
      const checkout = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency || 'INR',
        name: 'IGNTU Hostel Mess',
        description: `${mealOptions.find((option) => option.id === mealType)?.label} · ${numberOfMeals} day${numberOfMeals === 1 ? '' : 's'}`,
        order_id: orderData.order.id,
        prefill: {
          name: user?.name || user?.username || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#a20d24' },
        handler: async (checkoutResponse) => {
          const payload = {
            ...checkoutResponse,
            paymentId: orderData.payment._id,
          }
          setVerificationPayload(payload)
          await verifyPayment(payload)
        },
        modal: {
          ondismiss: () => {
            setPaymentState((state) =>
              ['verifying', 'confirmed', 'verification-error', 'failed'].includes(state)
                ? state
                : 'cancelled',
            )
          },
        },
      })
      checkout.on('payment.failed', (failure) => {
        setPaymentState('failed')
        setError(failure.error?.description || 'The payment was not completed.')
      })
      setPaymentState('checkout-open')
      checkout.open()
    } catch (checkoutError) {
      const message =
        checkoutError.response?.data?.message ||
        checkoutError.message ||
        'Unable to start checkout. Please try again.'
      setError(
        orderCreated
          ? `${message} An order may remain pending; check payment history before retrying.`
          : message,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-[#a20d24] hover:underline" to="/student/dashboard">
          ← Dashboard
        </Link>
        <p className="mt-5 text-sm font-semibold text-[#a20d24]">Meal services</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Choose your meal plan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Select meals and duration, review the server-priced order, then pay securely with Razorpay.
        </p>
      </div>

      {paymentState === 'confirmed' && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
          Payment verified by the server. Your meal entitlement has been activated.
          <Link className="ml-2 font-semibold underline" to="/student/payment-history">
            View payment history
          </Link>
        </div>
      )}
      {paymentState === 'cancelled' && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          Checkout was closed. No payment was confirmed; the order may remain pending.
        </div>
      )}
      {paymentState === 'verifying' && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          Verifying payment securely with the server…
        </div>
      )}
      {paymentState === 'verification-error' && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          Do not retry immediately. The checkout response was not confirmed by the server. Check payment history or contact the mess office.
          {verificationPayload && (
            <button
              className="mt-3 block rounded-lg bg-[#a20d24] px-4 py-2 font-semibold text-white hover:bg-[#85091c]"
              onClick={() => verifyPayment(verificationPayload)}
              type="button"
            >
              Retry server verification
            </button>
          )}
        </div>
      )}

      <form className="grid gap-6 lg:grid-cols-[1fr_340px]" onSubmit={handleCheckout}>
        <div className="space-y-6">
          <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">Select meals</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {mealOptions.map((option) => (
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    mealType === option.id
                      ? 'border-[#a20d24] bg-red-50'
                      : 'border-slate-200 hover:border-amber-300'
                  }`}
                  key={option.id}
                >
                  <input
                    checked={mealType === option.id}
                    className="accent-[#a20d24]"
                    name="mealType"
                    onChange={() => setMealType(option.id)}
                    type="radio"
                    value={option.id}
                  />
                  <span className="font-medium text-slate-800">{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">Choose duration</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {purchaseOptions.map((option) => (
                <label
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    purchaseType === option.id
                      ? 'border-[#a20d24] bg-red-50'
                      : 'border-slate-200 hover:border-amber-300'
                  }`}
                  key={option.id}
                >
                  <span className="flex items-center gap-2 font-semibold text-slate-800">
                    <input
                      checked={purchaseType === option.id}
                      className="accent-[#a20d24]"
                      name="purchaseType"
                      onChange={() => setPurchaseType(option.id)}
                      type="radio"
                      value={option.id}
                    />
                    {option.label}
                  </span>
                  <span className="mt-2 block text-xs text-slate-500">{option.detail}</span>
                </label>
              ))}
            </div>
            {purchaseType === 'multi-day' && (
              <label className="mt-4 grid max-w-xs gap-1.5 text-sm font-medium text-slate-700">
                Number of days
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2.5"
                  max="365"
                  min="2"
                  onChange={(event) => setCustomDays(event.target.value)}
                  required
                  type="number"
                  value={customDays}
                />
              </label>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-900">Payment summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Plan</dt>
              <dd className="text-right font-medium text-slate-800">
                {mealOptions.find((option) => option.id === mealType)?.label}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Duration</dt>
              <dd className="text-right font-medium text-slate-800">
                {numberOfMeals || '—'} day{numberOfMeals === 1 ? '' : 's'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Rate per day</dt>
              <dd className="font-medium text-slate-800">
                {isLoadingPrices ? 'Loading…' : dailyRate == null ? '—' : formatCurrency(dailyRate)}
              </dd>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-slate-900">Total</dt>
                <dd className="text-lg font-bold text-[#a20d24]">
                  {totalAmount == null ? '—' : formatCurrency(totalAmount)}
                </dd>
              </div>
            </div>
          </dl>
          {isLoadingPrices && <p className="mt-4 text-xs text-slate-500">Loading configured meal prices…</p>}
          {priceError && (
            <p className="mt-4 text-sm text-red-700" role="alert">{priceError}</p>
          )}
          {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
          <button
            className="mt-5 w-full rounded-lg bg-[#a20d24] px-4 py-3 font-semibold text-white transition hover:bg-[#85091c] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              isSubmitting ||
              paymentState === 'checkout-open' ||
              paymentState === 'verifying' ||
              paymentState === 'verification-error' ||
              paymentState === 'confirmed' ||
              isLoadingPrices ||
              Boolean(priceError) ||
              dailyRate == null ||
              !Number.isInteger(numberOfMeals) ||
              numberOfMeals < 1
            }
            type="submit"
          >
            {isSubmitting ? 'Starting checkout…' : 'Continue to Razorpay'}
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">
            Payment is confirmed only after server-side signature verification.
          </p>
        </aside>
      </form>
    </section>
  )
}

export default PaymentPage
