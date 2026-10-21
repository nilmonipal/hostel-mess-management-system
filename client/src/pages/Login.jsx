import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'
import FormInput from '../components/FormInput.jsx'
import { api } from '../services/api.js'

function Login() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      const form = new FormData(event.currentTarget)
      const { data } = await api.post('/auth/login', {
        phone: form.get('phone'),
        password: form.get('password'),
      })

      window.localStorage.setItem('token', data.Token)
      window.localStorage.setItem('user', JSON.stringify(data.User))
      setSuccess(`Signed in successfully. Welcome, ${data.User.username}.`)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to sign in. Check your connection and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Login to your account</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sign in to access your hostel mess account.
      </p>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <FormInput
          autoComplete="tel"
          id="phone"
          label="Registered phone number"
          maxLength={10}
          minLength={10}
          pattern="[0-9]{10}"
          placeholder="Enter your registered phone number"
          required
        />
        <FormInput
          autoComplete="current-password"
          id="password"
          label="Password"
          placeholder="Enter your password"
          required
          type="password"
        />
        {error && (
          <p aria-live="polite" className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p aria-live="polite" className="text-sm text-emerald-800" role="status">
            {success}
          </p>
        )}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New to IGNTU Mess?{' '}
        <Link className="font-semibold text-emerald-800 hover:underline" to="/signup">
          Create an account
        </Link>
      </p>
    </div>
  )
}

export default Login
