import PageHeader from "../components/PageHeader.jsx";
import { DataTable } from "../components/Table.jsx";
import { Badge, Card } from "../components/ui.jsx";
import { useFetch } from "../lib/useFetch.js";
import { formatMoney, shortId } from "../lib/format.js";
import { batchStatusVariant } from "../lib/statusVariants.js";
import "./Records.css";

export default function Records() {
  const { data, loading, error } = useFetch("/api/v1/records/");
  const records = Array.isArray(data) ? data : data?.results || [];

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
    { key: "phone", header: "Phone", render: (r) => r.phone_number || "—" },
    // { key: "requested", header: "Requested", render: (r) => formatMoney(r.amount_requested) },
    { key: "sent", header: "Sent", render: (r) => formatMoney(r.amount_sent) },
    {
      key: "batch",
      header: "Batch",
      render: (r) => (r.batch ? `#${shortId(r.batch)}` : "—"),
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
        title="Repayment Records"
        subtitle="Individual repayment records dispatched to the LMS."
      />
      <Card className="p-0">
        <DataTable
          columns={columns}
          rows={records}
          loading={loading}
          error={error}
          empty="No repayment records found."
        />
      </Card>
    </div>
  );
}
