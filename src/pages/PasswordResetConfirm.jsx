import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import AuthShell from "../components/AuthShell.jsx"
import { Button, PasswordInput, Alert } from "../components/ui.jsx"
import { endpoints } from "../lib/api.js"

export default function PasswordResetConfirm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const uid = params.get("uid") || ""
  const token = params.get("token") || ""
  const [form, setForm] = useState({ new_password: "", confirm_password: "" })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!uid || !token) {
      setError("This reset link is missing its token — please request a new one.")
      return
    }
    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match.")
      return
    }
    setSubmitting(true)
    try {
      await endpoints.confirmPasswordReset({ uid, token, ...form })
      navigate("/login", { replace: true })
    } catch (err) {
      setError(err.message || "Unable to reset password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password for your account."
      footer={
        <span>
          <Link to="/login">Back to sign in</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Alert>{error}</Alert>
        <PasswordInput label="New password" name="new_password" required minLength={8} value={form.new_password} onChange={update("new_password")} />
        <PasswordInput label="Confirm password" name="confirm_password" required value={form.confirm_password} onChange={update("confirm_password")} />
        <Button type="submit" size="lg" className="login-submit" disabled={submitting}>
          {submitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  )
}
