import PageHeader from "../components/PageHeader.jsx";
import { DataTable } from "../components/Table.jsx";
import { Badge, Card } from "../components/ui.jsx";
import { useFetch } from "../lib/useFetch.js";
import { formatMoney, shortId } from "../lib/format.js";
import { batchStatusVariant } from "../lib/statusVariants.js";
import "./Records.css";

export default function LoanRequests() {
  const { data, loading, error } = useFetch("/api/v1/loan-requests/");
  const requests = Array.isArray(data) ? data : data?.results || [];

  const columns = [
    {
      key: "employee",
      header: "Employee",
      render: (r) => (
        <span className="record-employee">
          {r.employee_name ||
            r.employee?.name ||
            r.employee ||
            `#${r.employee_id ?? r.id}`}
        </span>
      ),
    },
    { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount_requested ?? r.amount) },
    {
      key: "id",
      header: "Reference",
      render: (r) => `#${shortId(r.id)}`,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={batchStatusVariant(r.status)}>
          {r.status || "pending"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Loan Requests"
        subtitle="Employee loan requests awaiting review."
      />
      <Card className="p-0">
        <DataTable
          columns={columns}
          rows={requests}
          loading={loading}
          error={error}
          empty="No loan requests found."
        />
      </Card>
    </div>
  );
}