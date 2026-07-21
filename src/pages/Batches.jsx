import { useState } from "react"
import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Button, Card, Field, Input, Modal, Alert } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatDate, formatMoney } from "../lib/format.js"
import { batchStatusVariant } from "../lib/statusVariants.js"
import "./Batches.css"

export default function Batches() {
  const { data, loading, error, refetch } = useFetch(() => endpoints.batches(), [])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [form, setForm] = useState({ name: "", period_start: "", period_end: "" })

  const batches = Array.isArray(data) ? data : data?.results || []

  function update(key, value) { setForm((f) => ({ ...f, [key]: value })) }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setFormError("")
    try {
      await endpoints.approveBatch
      const { api } = await import("../lib/api.js")
      await api.post("/batches/", form)
      setOpen(false)
      setForm({ name: "", period_start: "", period_end: "" })
      refetch()
    } catch (err) {
      setFormError(err.message || "Could not create batch.")
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: "organization",
      header: "Organisation",
      render: (b) => (
        <Link to={`/batches/${b.id}`} className="batch-link">
          {b.organization_name || b.name || `Batch #${b.id}`}
        </Link>
      ),
    },
    {
      key: "period",
      header: "Period",
      render: (b) => b.period_start ? `${formatDate(b.period_start)} – ${formatDate(b.period_end)}` : "—",
    },
    { key: "records", header: "Records", render: (b) => b.record_count ?? b.records_count ?? "—" },
    { key: "total",   header: "Net total", render: (b) => formatMoney(b.total_net ?? b.net_total) },
    { key: "status",  header: "Status", render: (b) => <Badge variant={batchStatusVariant(b.status)}>{b.status || "draft"}</Badge> },
    { key: "created", header: "Created", render: (b) => formatDate(b.created_at) },
  ]

  return (
    <div>
      <PageHeader
        title="Payroll Batches"
        subtitle="Group and process payroll runs by pay period."
        actions={<Button onClick={() => setOpen(true)}>New batch</Button>}
      />

      <Card className="p-0">
        <DataTable columns={columns} rows={batches} loading={loading} error={error} empty="No payroll batches yet." />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New payroll batch"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-batch-form" disabled={saving}>
              {saving ? "Saving…" : "Create batch"}
            </Button>
          </>
        }
      >
        <form id="create-batch-form" onSubmit={handleCreate} className="batches-form">
          {formError && <Alert>{formError}</Alert>}
          <Field label="Batch name" required>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="e.g. June 2026 Payroll" />
          </Field>
          <div className="batches-form-grid">
            <Field label="Period start" required>
              <Input type="date" value={form.period_start} onChange={(e) => update("period_start", e.target.value)} required />
            </Field>
            <Field label="Period end" required>
              <Input type="date" value={form.period_end} onChange={(e) => update("period_end", e.target.value)} required />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  )
}
