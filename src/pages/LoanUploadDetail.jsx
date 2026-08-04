import { useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Card, StatCard, Alert } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatDate, formatMoney, shortId } from "../lib/format.js"
import { loanStatusVariant } from "../lib/statusVariants.js"
import "./LoanRequests.css"

const POLLING_STATUSES = new Set(["approval_pending", "processing"])

export default function LoanUploadDetail() {
  const { id } = useParams()
  const { data: upload, loading, error, refetch } = useFetch(() => endpoints.loanUpload(id), [id])
  const { data: reqData, loading: reqLoading, error: reqError, refetch: refetchRequests } = useFetch(
    () => endpoints.loanUploadRequests(id),
    [id],
  )

  const requests = Array.isArray(reqData) ? reqData : reqData?.results || []

  useEffect(() => {
    if (!upload || !POLLING_STATUSES.has(upload.status)) return
    const timer = setInterval(() => {
      refetch()
      refetchRequests()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 5000)
    return () => clearInterval(timer)
  }, [upload?.status, refetch, refetchRequests])

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
    { key: "limit", header: "Accessible limit", render: (r) => r.accessible_loan_limit != null ? formatMoney(r.accessible_loan_limit) : "—" },
    { key: "status", header: "Status", render: (r) => <Badge variant={loanStatusVariant(r.status)}>{r.status}</Badge> },
    { key: "reason", header: "Reason", render: (r) => r.ineligibility_reason || r.failure_reason || "—" },
  ]

  return (
    <div>
      <Link to="/loan-requests" className="loan-back-link">← Back to loan requests</Link>

      <PageHeader
        title={loading ? "Loading…" : upload?.original_filename || `Upload #${shortId(id)}`}
        subtitle={upload?.loan_period ? `Loan period ${formatDate(upload.loan_period)}` : "Loan request upload details"}
      />

      {error && <div className="loan-msg"><Alert>{error?.message || String(error)}</Alert></div>}

      <div className="loan-stats-grid">
        <StatCard label="Status">
          <Badge variant={loanStatusVariant(upload?.status)}>{upload?.status || "—"}</Badge>
        </StatCard>
        <StatCard label="Total rows" value={upload?.total_rows ?? 0} />
        <StatCard label="Eligible" value={upload?.eligible_rows ?? 0} />
        <StatCard label="Ineligible" value={upload?.ineligible_rows ?? 0} />
      </div>

      {Array.isArray(upload?.error_log) && upload.error_log.length > 0 && (
        <Card className="loan-section">
          <div className="loan-section-header"><h3>Upload errors</h3></div>
          <div style={{ padding: "1rem 1.25rem" }}>
            {upload.error_log.map((e, i) => (
              <p key={i} style={{ fontSize: "0.8125rem", color: "var(--gray-700)", margin: "0.25rem 0" }}>
                Row {e.row ?? "—"}: {Array.isArray(e.messages) ? e.messages.join(" · ") : (e.messages || e.error || "Unknown error")}
              </p>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-0">
        <div className="loan-section-header">
          <h3>Loan requests</h3>
        </div>
        <DataTable columns={columns} rows={requests} loading={reqLoading} error={reqError} empty="No loan requests parsed for this upload yet." />
      </Card>
    </div>
  )
}
