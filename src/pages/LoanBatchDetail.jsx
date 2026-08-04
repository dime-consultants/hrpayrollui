import { useParams, Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Card, StatCard, Alert } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatDate, formatMoney, shortId } from "../lib/format.js"
import { loanStatusVariant } from "../lib/statusVariants.js"
import "./LoanRequests.css"

export default function LoanBatchDetail() {
  const { id } = useParams()
  const { data: batch, loading, error } = useFetch(() => endpoints.loanBatch(id), [id])
  const { data: reqData, loading: reqLoading, error: reqError } = useFetch(
    () => (batch?.upload ? endpoints.loanUploadRequests(batch.upload) : Promise.resolve([])),
    [batch?.upload],
  )

  const requests = Array.isArray(reqData) ? reqData : reqData?.results || []

  const columns = [
    { key: "row", header: "#", render: (r) => r.row_number || "—" },
    {
      key: "employee",
      header: "Employee",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.employee_name || "—"}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>{r.phone_number}</div>
        </div>
      ),
    },
    { key: "amount", header: "Requested", render: (r) => formatMoney(r.requested_amount) },
    { key: "status", header: "Status", render: (r) => <Badge variant={loanStatusVariant(r.status)}>{r.status}</Badge> },
    { key: "reason", header: "Reason", render: (r) => r.ineligibility_reason || r.failure_reason || "—" },
  ]

  return (
    <div>
      <Link to="/loan-batches" className="loan-back-link">← Back to loan batches</Link>

      <PageHeader
        title={loading ? "Loading…" : batch?.organization_name || `Batch #${shortId(id)}`}
        subtitle={batch?.date_created ? `Created ${formatDate(batch.date_created)}` : "Loan request batch details"}
        actions={
          batch?.upload && (
            <Link to={`/loan-requests/${batch.upload}`} className="loan-link">View upload</Link>
          )
        }
      />

      {error && <div className="loan-msg"><Alert>{error?.message || String(error)}</Alert></div>}

      <div className="loan-stats-grid">
        <StatCard label="Status">
          <Badge variant={loanStatusVariant(batch?.status)}>{batch?.status || "—"}</Badge>
        </StatCard>
        <StatCard label="Total requests" value={batch?.total_requests ?? 0} />
        <StatCard label="Total amount" value={formatMoney(batch?.total_amount)} />
        <StatCard label="Successful amount" value={formatMoney(batch?.successful_amount)} />
      </div>

      <div className="loan-stats-grid">
        <StatCard label="Eligible" value={batch?.eligible_count ?? 0} />
        <StatCard label="Ineligible" value={batch?.ineligible_count ?? 0} />
        <StatCard label="Successful" value={batch?.successful_count ?? 0} />
        <StatCard label="Failed" value={batch?.failed_count ?? 0} />
      </div>

      <Card className="p-0">
        <div className="loan-section-header">
          <h3>Loan requests</h3>
        </div>
        <DataTable columns={columns} rows={requests} loading={reqLoading} error={reqError} empty="No loan requests in this batch." />
      </Card>
    </div>
  )
}
