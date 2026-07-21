import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Button, Card, StatCard, Alert } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { api } from "../lib/api.js"
import { formatDate, formatMoney } from "../lib/format.js"
import { batchStatusVariant } from "../lib/statusVariants.js"
import "./BatchDetail.css"

export default function BatchDetail() {
  const { id } = useParams()
  const { data: batch, loading, error, refetch } = useFetch(`/batches/${id}/`)
  const { data: recordData, loading: recLoading, error: recError, refetch: refetchRecords } = useFetch(`/records/?batch=${id}`)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const records = Array.isArray(recordData) ? recordData : recordData?.results || []

  async function runAction(action) {
    setBusy(true)
    setMsg(null)
    try {
      await api.post(`/batches/${id}/${action}/`, {})
      setMsg({ variant: "success", text: `Batch ${action} completed.` })
      refetch()
      refetchRecords()
    } catch (err) {
      setMsg({ variant: "error", text: err.message || `Could not ${action} batch.` })
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (r) => (
        <span style={{ fontWeight: 500, color: "var(--gray-900)" }}>
          {r.employee_name || r.employee?.name || r.employee || `#${r.employee_id ?? r.id}`}
        </span>
      ),
    },
    { key: "gross",      header: "Gross",      render: (r) => formatMoney(r.gross_pay ?? r.gross) },
    { key: "deductions", header: "Deductions", render: (r) => formatMoney(r.total_deductions ?? r.deductions) },
    { key: "net",        header: "Net",        render: (r) => <span style={{ fontWeight: 500 }}>{formatMoney(r.net_pay ?? r.net)}</span> },
    { key: "status",     header: "Status",     render: (r) => <Badge variant={batchStatusVariant(r.status)}>{r.status || "pending"}</Badge> },
  ]

  const status = (batch?.status || "").toLowerCase()

  return (
    <div>
      <Link to="/batches" className="batch-back-link">← Back to batches</Link>

      <PageHeader
        title={loading ? "Loading…" : batch?.name || `Batch #${id}`}
        subtitle={
          batch?.period_start
            ? `Pay period ${formatDate(batch.period_start)} – ${formatDate(batch.period_end)}`
            : "Payroll batch details"
        }
        actions={
          <div className="batch-header-actions">
            {(status === "draft" || status === "pending") && (
              <Button onClick={() => runAction("process")} disabled={busy}>
                {busy ? "Working…" : "Process"}
              </Button>
            )}
            {(status === "processing" || status === "pending" || status === "processed") && (
              <Button variant="secondary" onClick={() => runAction("approve")} disabled={busy}>
                Approve
              </Button>
            )}
          </div>
        }
      />

      {msg && <div className="batch-msg"><Alert variant={msg.variant}>{msg.text}</Alert></div>}

      <div className="batch-stats-grid">
        <StatCard label="Status">
          <Badge variant={batchStatusVariant(batch?.status)}>{batch?.status || "—"}</Badge>
        </StatCard>
        <StatCard label="Records"    value={records.length || batch?.record_count || 0} />
        <StatCard label="Gross total" value={formatMoney(batch?.total_gross ?? batch?.gross_total)} />
        <StatCard label="Net total"   value={formatMoney(batch?.total_net ?? batch?.net_total)} />
      </div>

      {error && <div className="batch-msg"><Alert>{error?.message || String(error)}</Alert></div>}

      <Card className="p-0">
        <div className="batch-records-header">
          <h3>Payroll records</h3>
        </div>
        <DataTable columns={columns} rows={records} loading={recLoading} error={recError} empty="No records in this batch." />
      </Card>
    </div>
  )
}
