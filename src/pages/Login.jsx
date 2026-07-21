import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import AuthShell from "../components/AuthShell.jsx"
import { Button, Input, Alert } from "../components/ui.jsx"
import { useAuth } from "../context/AuthContext.jsx"
import "./Login.css"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname || "/dashboard"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || "Unable to sign in. Please check your credentials.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Enter your credentials to access the payroll dashboard."
    >
      <form onSubmit={handleSubmit} className="login-form">
        <Alert>{error}</Alert>
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <div className="login-forgot-row">
          <Link to="/password/reset" className="login-forgot-link">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="login-submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  )
}
