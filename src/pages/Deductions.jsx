import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Card } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { formatMoney } from "../lib/format.js"
import "./Deductions.css"

export default function Deductions() {
  const { data, loading, error } = useFetch("/deductions/")
  const deductions = Array.isArray(data) ? data : data?.results || []

  const columns = [
    { key: "phone",   header: "Phone",         render: (d) => d.phone_number || "—" },
    { key: "amount",  header: "Amount",         render: (d) => formatMoney(d.amount || d.deduction_amount) },
    { key: "date",    header: "Deduction Date", render: (d) => d.deduction_date || "—" },
    {
      key: "status",
      header: "Status",
      render: (d) => {
        const s = (d.status || "pending").toLowerCase()
        const v = s === "success" ? "green" : s === "failed" ? "red" : s === "skipped" ? "slate" : "amber"
        return <Badge variant={v}>{d.status || "pending"}</Badge>
      },
    },
    { key: "batch",   header: "Batch",          render: (d) => d.batch_name || d.batch?.name || `#${d.batch_id ?? d.batch ?? "—"}` },
  ]

  return (
    <div>
      <PageHeader
        title="Salary Deductions"
        subtitle="Deduction records extracted from payroll uploads."
      />
      <Card className="p-0">
        <DataTable columns={columns} rows={deductions} loading={loading} error={error} empty="No deductions found." />
      </Card>
    </div>
  )
}
