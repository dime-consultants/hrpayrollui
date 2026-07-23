import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Card } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatMoney, shortId } from "../lib/format.js"
import "./Deductions.css"

export default function Deductions() {
  const { data, loading, error } = useFetch("/api/v1/deductions/")
  const { data: batchData } = useFetch(() => endpoints.batches(), [])

  const deductions = Array.isArray(data) ? data : data?.results || []
  const batches = Array.isArray(batchData) ? batchData : batchData?.results || []

  // SalaryDeduction has no direct batch link — batches are one-to-one with the
  // upload they were generated from, so join on that shared `upload` id.
  const batchIdByUpload = Object.fromEntries(batches.map((b) => [b.upload, b.id]))

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
    {
      key: "batch",
      header: "Batch",
      render: (d) => {
        const batchId = batchIdByUpload[d.upload]
        return batchId ? <Link to={`/batches/${batchId}`}>#{shortId(batchId)}</Link> : "—"
      },
    },
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
