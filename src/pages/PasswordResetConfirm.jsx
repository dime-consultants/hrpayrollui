import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import AuthShell from "../components/AuthShell.jsx"
import { Button, Input, Alert } from "../components/ui.jsx"

export default function PasswordResetConfirm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({
    token: params.get("token") || "",
    new_password: "",
    confirm_password: "",
  })
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match.")
      return
    }
    setSubmitting(true)
    try {
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
      subtitle="Enter the token from your email and choose a new password."
      footer={
        <span>
          <Link to="/login">Back to sign in</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Alert>{error}</Alert>
        <Input label="Reset token" name="token" required value={form.token} onChange={update("token")} />
        <Input label="New password" name="new_password" type="password" required minLength={8} value={form.new_password} onChange={update("new_password")} />
        <Input label="Confirm password" name="confirm_password" type="password" required value={form.confirm_password} onChange={update("confirm_password")} />
        <Button type="submit" size="lg" className="login-submit" disabled={submitting}>
          {submitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  )
}
