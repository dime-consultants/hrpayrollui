import { useParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { DataTable } from "../components/Table.jsx";
import { Badge, Card, StatCard, Alert } from "../components/ui.jsx";
import { useFetch } from "../lib/useFetch.js";
import { endpoints } from "../lib/api.js";
import { formatDate, formatMoney, shortId } from "../lib/format.js";
import { loanStatusVariant } from "../lib/statusVariants.js";
import "./LoanRequests.css";

export default function LoanBatchDetail() {
  const { id } = useParams();
  const {
    data: batch,
    loading,
    error,
  } = useFetch(() => endpoints.loanBatch(id), [id]);
  const {
    data: reqData,
    loading: reqLoading,
    error: reqError,
  } = useFetch(
    () =>
      batch?.upload
        ? endpoints.loanUploadRequests(batch.upload)
        : Promise.resolve([]),
    [batch?.upload],
  );

  const requests = Array.isArray(reqData) ? reqData : reqData?.results || [];
  const requestsLoaded = Array.isArray(reqData) || Array.isArray(reqData?.results);

  // Tally directly off the fetched requests so every card and the flagged
  // count in the section header are derived from the same numbers and
  // always add up to the total — the batch's own counter fields
  // (eligible_count etc.) are only refreshed at specific points in the
  // dispatch pipeline and can drift out of sync with live request statuses.
  const tally = requests.reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.status === "eligible") acc.eligible += 1;
      else if (r.status === "ineligible") acc.ineligible += 1;
      else if (r.status === "success") acc.successful += 1;
      else if (r.status === "failed") acc.failed += 1;
      else acc.pending += 1; // queued, eligibility_checking, processing, skipped
      return acc;
    },
    { total: 0, eligible: 0, ineligible: 0, successful: 0, failed: 0, pending: 0 },
  );

  const totalRequests   = requestsLoaded ? tally.total      : (batch?.total_requests   ?? 0);
  const eligibleCount   = requestsLoaded ? tally.eligible   : (batch?.eligible_count   ?? 0);
  const ineligibleCount = requestsLoaded ? tally.ineligible : (batch?.ineligible_count ?? 0);
  const successfulCount = requestsLoaded ? tally.successful : (batch?.successful_count ?? 0);
  const failedCount     = requestsLoaded ? tally.failed     : (batch?.failed_count     ?? 0);
  const pendingCount    = requestsLoaded ? tally.pending    : (batch?.skipped_count    ?? 0);
  const flaggedCount    = ineligibleCount + failedCount;

  const columns = [
    { key: "row", header: "#", render: (r) => r.row_number || "—" },
    {
      key: "employee",
      header: "Employee",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.employee_name || "—"}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
            {r.phone_number}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Requested",
      render: (r) => formatMoney(r.requested_amount),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={loanStatusVariant(r.status)}>{r.status}</Badge>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => r.ineligibility_reason || r.failure_reason || "—",
    },
  ];

  return (
    <div>
      <Link to="/loan-batches" className="loan-back-link">
        ← Back to loan batches
      </Link>

      <PageHeader
        title={
          loading
            ? "Loading…"
            : batch?.organization_name || `Batch #${shortId(id)}`
        }
        subtitle={
          batch?.date_created
            ? `Created ${formatDate(batch.date_created)}`
            : "Loan request batch details"
        }
        actions={
          batch?.upload && (
            <Link to={`/loan-requests/${batch.upload}`} className="loan-link">
              View upload
            </Link>
          )
        }
      />

      {error && (
        <div className="loan-msg">
          <Alert>{error?.message || String(error)}</Alert>
        </div>
      )}

      <div className="loan-stats-grid">
        <StatCard label="Status">
          <Badge variant={loanStatusVariant(batch?.status)}>
            {batch?.status || "—"}
          </Badge>
        </StatCard>
        <StatCard label="Total requests" value={totalRequests} />
        <StatCard
          label="Total amount"
          value={formatMoney(batch?.total_amount)}
        />
        <StatCard
          label="Successful amount"
          value={formatMoney(batch?.successful_amount)}
        />
      </div>

      <div className="loan-stats-grid loan-stats-grid-5">
        <StatCard label="Eligible" value={eligibleCount} />
        <StatCard label="Ineligible" value={ineligibleCount} />
        <StatCard label="Successful" value={successfulCount} />
        <StatCard label="Failed" value={failedCount} />
        <StatCard label="Pending" value={pendingCount} />
      </div>

      <Card className="p-0">
        <div className="loan-section-header">
          <h3>Loan requests</h3>
          <Badge variant={flaggedCount > 0 ? "red" : "green"}>
            {flaggedCount} flagged
          </Badge>
        </div>
        <DataTable
          columns={columns}
          rows={requests}
          loading={reqLoading}
          error={reqError}
          empty="No loan requests in this batch."
        />
      </Card>
    </div>
  );
}
