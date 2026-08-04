import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { DataTable } from "../components/Table.jsx";
import { Badge, Button, Card } from "../components/ui.jsx";
import { useFetch } from "../lib/useFetch.js";
import { endpoints } from "../lib/api.js";
import { formatDate, formatMoney, shortId } from "../lib/format.js";
import { loanStatusVariant } from "../lib/statusVariants.js";
import "./LoanRequests.css";

export default function LoanBatches() {
  const { data, loading, error } = useFetch(() => endpoints.loanBatches(), []);
  const batches = Array.isArray(data) ? data : data?.results || [];

  const columns = [
    {
      key: "id",
      header: "Batch",
      render: (b) => (
        <Link to={`/loan-batches/${b.id}`} className="loan-link">
          #{shortId(b.id)}
        </Link>
      ),
    },
    {
      key: "organization",
      header: "Organisation",
      render: (b) => b.organization_name || "—",
    },
    {
      key: "requests",
      header: "Requests",
      render: (b) => b.total_requests ?? "—",
    },
    {
      key: "total",
      header: "Total amount",
      render: (b) => formatMoney(b.total_amount),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <Badge variant={loanStatusVariant(b.status)}>
          {b.status || "draft"}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Created",
      render: (b) => formatDate(b.date_created),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Loan Batches"
        subtitle="Batches grouping loan requests for dispatch to the LMS."
        actions={
          <Button as={Link} to="/loan-requests" variant="ghost">
            View uploads
          </Button>
        }
      />

      <Card className="p-0">
        <DataTable
          columns={columns}
          rows={batches}
          loading={loading}
          error={error}
          empty="No loan batches yet."
        />
      </Card>
    </div>
  );
}
