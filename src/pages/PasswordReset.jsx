import { useState } from "react"
import { Link } from "react-router-dom"
import AuthShell from "../components/AuthShell.jsx"
import { Button, Input, Alert } from "../components/ui.jsx"

export default function PasswordReset() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      setDone(true)
    } catch (err) {
      setError(err.message || "Unable to request password reset.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a link to reset your password."
      footer={
        <span>
          Remembered it?{" "}
          <Link to="/login">Back to sign in</Link>
        </span>
      }
    >
      {done ? (
        <Alert variant="success">
          If an account exists for that email, a reset link has been sent. Check your inbox.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Alert>{error}</Alert>
          <Input
            label="Email address"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <Button type="submit" size="lg" className="login-submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
