import { useEffect, useState } from "react"
import PageHeader from "../components/PageHeader.jsx"
import { Button, Card, Field, Input, Alert, Badge } from "../components/ui.jsx"
import { useAuth } from "../context/AuthContext.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { roleLabel } from "../lib/format.js"
import "./Profile.css"

export default function Profile() {
  const { user, setUser } = useAuth()

  // The login response doesn't carry first/last name or the HR role, so
  // both come from separate lookups rather than the cached auth user.
  const { data: usersData } = useFetch(() => endpoints.users(), [])
  const hrUsers = Array.isArray(usersData) ? usersData : usersData?.results || []
  const currentHrUser = hrUsers.find((u) => u.email === user?.email)

  const { data: profile } = useFetch(() => endpoints.getProfile(), [])

  const [form, setForm] = useState({ first_name: "", last_name: "" })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    if (profile) setForm({ first_name: profile.first_name || "", last_name: profile.last_name || "" })
  }, [profile])

  function update(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const updated = await endpoints.updateProfile(form)
      const full_name = [updated.first_name, updated.last_name].filter(Boolean).join(" ")
      setUser({ ...user, first_name: updated.first_name, last_name: updated.last_name, full_name })
      setMsg({ variant: "success", text: "Profile updated successfully." })
    } catch (err) {
      setMsg({ variant: "error", text: err.message || "Could not update profile." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="View and update your account details." />

      <div className="profile-grid">
        <Card>
          <form onSubmit={handleSave} className="profile-form">
            {msg && <Alert variant={msg.variant}>{msg.text}</Alert>}
            <div className="profile-form-grid">
              <Field label="First name">
                <Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
              </Field>
              <Field label="Last name">
                <Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
              </Field>
            </div>
            <Field label="Email">
              <Input value={user?.email || ""} disabled />
            </Field>
            <div className="profile-form-actions">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="profile-account-card">
            <h3>Account info</h3>
            <dl className="profile-account-list">
              <div className="profile-account-row">
                <dt>Role</dt>
                <dd><Badge variant="blue">{roleLabel(currentHrUser?.role) || roleLabel(user?.role) || "HR User"}</Badge></dd>
              </div>
              <div className="profile-account-row">
                <dt>Status</dt>
                <dd><Badge variant="green">Active</Badge></dd>
              </div>
              <div className="profile-account-row">
                <dt>User ID</dt>
                <dd className="profile-account-id">#{user?.id ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>
    </div>
  )
}
