import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import FormInput from '../components/FormInput.jsx'
import { api } from '../services/api.js'

function Signup() {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const password = form.get('password')

    if (password !== form.get('confirmPassword')) {
      setError('Passwords do not match.')
      setIsSubmitting(false)
      return
    }

    try {
      await api.post('/auth/register', {
        username: form.get('username'),
        email: form.get('email'),
        phone: form.get('phone'),
        password,
      })
      navigate('/login', { replace: true })
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          'Unable to create your account. Check your connection and try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
      <p className="mt-1 text-sm text-slate-600">Register to get started with IGNTU Mess.</p>
      <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
        <FormInput
          autoComplete="username"
          id="username"
          label="Username"
          placeholder="Choose a username"
          required
        />
        <FormInput
          autoComplete="email"
          id="email"
          label="Email address"
          placeholder="you@example.com"
          required
          type="email"
        />
        <FormInput
          autoComplete="tel"
          id="phone"
          label="Phone number"
          maxLength={10}
          minLength={10}
          pattern="[0-9]{10}"
          placeholder="10-digit phone number"
          required
        />
        <FormInput
          autoComplete="new-password"
          id="password"
          label="Password"
          minLength={8}
          placeholder="At least 8 characters"
          required
          type="password"
        />
        <FormInput
          autoComplete="new-password"
          id="confirmPassword"
          label="Confirm password"
          placeholder="Enter your password again"
          required
          type="password"
        />
        {error && (
          <p aria-live="polite" className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link className="font-semibold text-[#a20d24] hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default Signup
