import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import AuthShell from "../components/AuthShell.jsx"
import { Button, Input, Select, Alert } from "../components/ui.jsx"
import { endpoints } from "../lib/api.js"
import { useAuth } from "../context/AuthContext.jsx"

const ACCOUNT_TYPES = [
  { value: "user", label: "HR User" },
  { value: "admin", label: "HR Admin" },
  { value: "super-admin", label: "Super Admin" },
]

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    organization_id: "",
    account_type: "user",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSubmitting(true)

    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      password: form.password,
      confirm_password: form.confirm_password,
    }
    if (form.organization_id) payload.organization_id = Number(form.organization_id)

    try {
      if (form.account_type === "admin") {
        await endpoints.signupAdmin(payload)
      } else if (form.account_type === "super-admin") {
        await endpoints.signupSuperAdmin(payload)
      } else {
        await endpoints.signup(payload)
      }
      // Try to log the user straight in
      try {
        await login(form.email, form.password)
        navigate("/dashboard", { replace: true })
        return
      } catch {
        setSuccess("Account created. You can now sign in.")
      }
    } catch (err) {
      setError(err.message || "Unable to create account.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register a new HR payroll account."
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <Alert variant="success">{success}</Alert>
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" name="first_name" required value={form.first_name} onChange={update("first_name")} />
          <Input label="Last name" name="last_name" required value={form.last_name} onChange={update("last_name")} />
        </div>
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update("email")}
        />
        <Select label="Account type" name="account_type" value={form.account_type} onChange={update("account_type")}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input
          label="Organization ID"
          name="organization_id"
          type="number"
          value={form.organization_id}
          onChange={update("organization_id")}
          placeholder={form.account_type === "super-admin" ? "Required" : "Optional"}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
          />
          <Input
            label="Confirm password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirm_password}
            onChange={update("confirm_password")}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  )
}
