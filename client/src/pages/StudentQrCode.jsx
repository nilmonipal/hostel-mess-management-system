import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api.js'

const meals = ['breakfast', 'lunch', 'dinner']

function StudentQrCode() {
  const [mealType, setMealType] = useState('lunch')
  const [qr, setQr] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateQr(event) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setQr(null)

    try {
      const { data } = await api.post('/GenerateQr', { mealType })
      setQr({
        image: data.qrImage,
        expiresAt: data.qr?.expiresAt,
      })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to generate a QR code. Verify your meal eligibility and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-[#a20d24] hover:underline" to="/student/dashboard">
          ← Dashboard
        </Link>
        <p className="mt-5 text-sm font-semibold text-[#a20d24]">Meal verification</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Your meal QR code</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate a QR for an eligible meal today. QR codes expire after 30 minutes.
        </p>
      </div>

      <div className="grid gap-6 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm sm:p-8 md:grid-cols-[1fr_280px]">
        <form className="flex flex-col gap-4" onSubmit={generateQr}>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Meal
            <select
              className="rounded-lg border border-slate-300 px-3 py-2.5 font-normal"
              onChange={(event) => setMealType(event.target.value)}
              value={mealType}
            >
              {meals.map((meal) => (
                <option className="capitalize" key={meal} value={meal}>
                  {meal[0].toUpperCase() + meal.slice(1)}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button
            className="mt-auto rounded-lg bg-[#a20d24] px-4 py-3 font-semibold text-white hover:bg-[#85091c] disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Generating…' : qr ? 'Generate a new QR' : 'Generate QR code'}
          </button>
        </form>

        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-[#fff9e9] p-4 text-center">
          {isLoading ? (
            <p className="text-sm text-slate-500" role="status">Generating your secure QR…</p>
          ) : qr?.image ? (
            <>
              <img alt={`${mealType} meal QR code`} className="size-56 rounded-lg bg-white p-2" src={qr.image} />
              <p className="mt-3 text-sm font-semibold capitalize text-slate-800">{mealType}</p>
              {qr.expiresAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Expires {new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(qr.expiresAt))}
                </p>
              )}
            </>
          ) : (
            <p className="max-w-48 text-sm text-slate-500">
              Your generated QR code will appear here.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default StudentQrCode
