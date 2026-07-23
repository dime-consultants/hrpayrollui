import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Button, Card, StatCard, Alert } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatDate, formatMoney, shortId } from "../lib/format.js"
import { batchStatusVariant } from "../lib/statusVariants.js"
import "./BatchDetail.css"

export default function BatchDetail() {
  const { id } = useParams()
  const { data: batch, loading, error, refetch } = useFetch(() => endpoints.batch(id), [id])
  const { data: recordData, loading: recLoading, error: recError, refetch: refetchRecords } = useFetch(() => endpoints.records({ batch: id }), [id])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const records = Array.isArray(recordData) ? recordData : recordData?.results || []

  async function handleApprove() {
    setBusy(true)
    setMsg(null)
    try {
      await endpoints.approveBatch(id)
      setMsg({ variant: "success", text: "Batch approved — dispatch has started." })
      refetch()
      refetchRecords()
    } catch (err) {
      setMsg({ variant: "error", text: err.message || "Could not approve batch." })
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: "phone",  header: "Phone",     render: (r) => r.phone_number || "—" },
    { key: "sent",   header: "Sent",      render: (r) => <span style={{ fontWeight: 500 }}>{formatMoney(r.amount_sent)}</span> },
    { key: "status", header: "Status",    render: (r) => <Badge variant={batchStatusVariant(r.status)}>{r.status || "pending"}</Badge> },
    { key: "failure", header: "Failure reason", render: (r) => r.failure_reason || "—" },
  ]

  const status = (batch?.status || "").toLowerCase()

  return (
    <div>
      <Link to="/batches" className="batch-back-link">← Back to batches</Link>

      <PageHeader
        title={loading ? "Loading…" : batch?.organization_name || `Batch #${shortId(id)}`}
        subtitle={batch?.date_created ? `Created ${formatDate(batch.date_created)}` : "Repayment batch details"}
        actions={
          <div className="batch-header-actions">
            {status === "draft" && (
              <Button onClick={handleApprove} disabled={busy}>
                {busy ? "Working…" : "Approve"}
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
        <StatCard label="Records"           value={batch?.total_deductions ?? records.length ?? 0} />
        <StatCard label="Total amount"      value={formatMoney(batch?.total_amount)} />
        <StatCard label="Successful amount" value={formatMoney(batch?.successful_amount)} />
      </div>

      {error && <div className="batch-msg"><Alert>{error?.message || String(error)}</Alert></div>}

      <Card className="p-0">
        <div className="batch-records-header">
          <h3>Repayment records</h3>
        </div>
        <DataTable columns={columns} rows={records} loading={recLoading} error={recError} empty="No records in this batch." />
      </Card>
    </div>
  )
}
