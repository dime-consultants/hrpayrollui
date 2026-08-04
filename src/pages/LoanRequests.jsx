import { useState } from "react"
import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Button, Card, Alert } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatDate } from "../lib/format.js"
import { loanStatusVariant } from "../lib/statusVariants.js"
import "./Uploads.css"
import "./LoanRequests.css"

function UploadCloudIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )
}

const STATUS_LABELS = {
  approval_pending: "Approval Pending",
  approved: "Approved",
  processing: "Processing",
  done: "Completed",
  partial: "Partially Processed",
  failed: "Failed",
}

function statusLabel(status) {
  if (!status) return "Approval Pending"
  return STATUS_LABELS[status] || status
}

function currentPeriod() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export default function LoanRequests() {
  const { data, loading, error, refetch } = useFetch(() => endpoints.loanUploads(), [])
  const [file, setFile] = useState(null)
  const [period, setPeriod] = useState(currentPeriod())
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState(null)

  const uploads = Array.isArray(data) ? data : data?.results || []

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setMsg(null)
    try {
      const body = new FormData()
      body.append("file", file)
      body.append("loan_period", `${period}-01`)
      if (notes) body.append("notes", notes)
      await endpoints.createLoanUpload(body)
      setMsg({ variant: "success", text: `Uploaded "${file.name}" successfully. Awaiting admin approval.` })
      setFile(null)
      setNotes("")
      refetch()
    } catch (err) {
      setMsg({ variant: "error", text: err.message || "Upload failed." })
    } finally {
      setUploading(false)
    }
  }

  const columns = [
    {
      key: "file",
      header: "File",
      render: (u) => (
        <Link to={`/loan-requests/${u.id}`} className="upload-file-label">
          {u.original_filename || "—"}
        </Link>
      ),
    },
    { key: "period", header: "Loan period", render: (u) => formatDate(u.loan_period) },
    { key: "rows", header: "Rows", render: (u) => u.total_rows ?? "—" },
    { key: "eligible", header: "Eligible", render: (u) => u.eligible_rows ?? "—" },
    { key: "status", header: "Status", render: (u) => <Badge variant={loanStatusVariant(u.status)}>{statusLabel(u.status)}</Badge> },
    { key: "date", header: "Uploaded", render: (u) => formatDate(u.date_created) },
  ]

  return (
    <div>
      <PageHeader
        title="Loan Requests"
        subtitle="Upload employee loan request batches for admin approval and processing."
        actions={<Button as={Link} to="/loan-batches" variant="ghost">View batches</Button>}
      />

      <Card className="upload-card">
        <form onSubmit={handleUpload}>
          {msg && <Alert variant={msg.variant}>{msg.text}</Alert>}
          <div className="upload-period">
            <label htmlFor="loan-period">Loan period</label>
            <input
              id="loan-period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              required
            />
          </div>
          <label className="upload-dropzone">
            <div className="upload-dropzone-icon"><UploadCloudIcon /></div>
            {file
              ? <p className="upload-file-name">{file.name}</p>
              : <p className="upload-dropzone-primary">Click or drag to select a file</p>
            }
            <p className="upload-dropzone-secondary">XLS or XLSX — up to 10 MB</p>
            <input
              type="file"
              accept=".xls,.xlsx"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="upload-actions">
            <input
              type="text"
              className="loan-notes-input"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? "Uploading…" : "Upload file"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <DataTable columns={columns} rows={uploads} loading={loading} error={error} empty="No loan request uploads yet." />
      </Card>
    </div>
  )
}
