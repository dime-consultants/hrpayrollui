import { useState } from "react"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Button, Card, Field, Input, Select, Modal, Alert } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { api } from "../lib/api.js"
import { formatDate } from "../lib/format.js"
import "./Users.css"

const ROLE_OPTIONS = [
  { value: "admin",    label: "Admin" },
  { value: "officer",  label: "HR Officer" },
  { value: "viewer",   label: "Viewer" },
]

function roleVariant(role) {
  if (role === "admin")   return "blue"
  if (role === "officer") return "indigo"
  return "slate"
}

export default function Users() {
  const { data, loading, error, refetch } = useFetch("/api/v1/users/")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", role: "viewer", password: "" })

  const users = Array.isArray(data) ? data : data?.results || []
  function update(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setFormError("")
    try {
      await api.post("/api/v1/users/", form)
      setOpen(false)
      setForm({ email: "", first_name: "", last_name: "", role: "viewer", password: "" })
      refetch()
    } catch (err) {
      setFormError(err.message || "Could not create user.")
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div>
          <p className="user-name-primary">
            {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "—"}
          </p>
          <p className="user-name-secondary">{u.email}</p>
        </div>
      ),
    },
    { key: "role",     header: "Role",   render: (u) => <Badge variant={roleVariant(u.role)}>{u.role || "viewer"}</Badge> },
    {
      key: "is_active",
      header: "Status",
      render: (u) => u.is_active
        ? <Badge variant="green">Active</Badge>
        : <Badge variant="slate">Inactive</Badge>,
    },
    { key: "date_joined", header: "Joined", render: (u) => formatDate(u.date_joined) },
  ]

  return (
    <div>
      <PageHeader
        title="HR Users"
        subtitle="Manage HR officers and administrators in your organization."
        actions={<Button onClick={() => setOpen(true)}>Add user</Button>}
      />

      <Card className="p-0">
        <DataTable columns={columns} rows={users} loading={loading} error={error} empty="No users found." />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add HR user"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-user-form" disabled={saving}>
              {saving ? "Saving…" : "Create user"}
            </Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreate} className="users-form">
          {formError && <Alert>{formError}</Alert>}
          <div className="users-form-grid">
            <Field label="First name">
              <Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
            </Field>
            <Field label="Last name">
              <Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
            </Field>
          </div>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </Field>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => update("role", e.target.value)}>
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Temporary password" required>
            <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
