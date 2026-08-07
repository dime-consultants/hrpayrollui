import { useState } from "react"
import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Button, Card, Alert, Modal, Field, Input } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatDate } from "../lib/format.js"
import { loanStatusVariant } from "../lib/statusVariants.js"
import "./Uploads.css"
import "./LoanRequests.css"

async function downloadLoanRequestTemplate() {
  const XLSX = await import("xlsx")
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["phone_number", "amount"],
    ["'254712345678", "5000"],
  ])
  // Force the phone_number column to Text so Excel doesn't strip the
  // leading apostrophe or coerce the value into a number.
  worksheet["A2"].t = "s"
  worksheet["A2"].z = "@"
  worksheet["!cols"] = [{ wch: 18 }, { wch: 12 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Requests")
  XLSX.writeFile(workbook, "loan_request_template.xlsx")
}

async function buildIndividualLoanFile(phoneNumber, amount) {
  const XLSX = await import("xlsx")
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["phone_number", "amount"],
    [phoneNumber, amount],
  ])
  worksheet["A2"].t = "s"
  worksheet["A2"].z = "@"
  worksheet["!cols"] = [{ wch: 18 }, { wch: 12 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Requests")
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
  return new File([buffer], `individual_loan_request_${Date.now()}.xlsx`, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

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
  const [downloading, setDownloading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [indivOpen, setIndivOpen] = useState(false)
  const [indivPhone, setIndivPhone] = useState("")
  const [indivAmount, setIndivAmount] = useState("")
  const [indivSubmitting, setIndivSubmitting] = useState(false)
  const [indivError, setIndivError] = useState(null)

  const uploads = Array.isArray(data) ? data : data?.results || []

  async function handleDownloadTemplate() {
    setDownloading(true)
    try {
      await downloadLoanRequestTemplate()
    } catch {
      setMsg({ variant: "error", text: "Could not generate template." })
    } finally {
      setDownloading(false)
    }
  }

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

  function closeIndividualModal() {
    if (indivSubmitting) return
    setIndivOpen(false)
    setIndivPhone("")
    setIndivAmount("")
    setIndivError(null)
  }

  async function handleIndividualSubmit(e) {
    e.preventDefault()
    setIndivSubmitting(true)
    setIndivError(null)
    try {
      const phone = indivPhone.trim()
      const file = await buildIndividualLoanFile(phone, indivAmount)
      const body = new FormData()
      body.append("file", file)
      body.append("loan_period", `${period}-01`)
      body.append("notes", `Individual loan request — ${phone}`)
      await endpoints.createLoanUpload(body)
      setMsg({ variant: "success", text: `Loan request for ${phone} submitted successfully. Awaiting admin approval.` })
      setIndivOpen(false)
      setIndivPhone("")
      setIndivAmount("")
      refetch()
    } catch (err) {
      setIndivError(err.message || "Could not submit loan request.")
    } finally {
      setIndivSubmitting(false)
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
        actions={
          <>
            <Button variant="secondary" onClick={() => setIndivOpen(true)}>Individual loan request</Button>
            <Button as={Link} to="/loan-batches" variant="ghost">View batches</Button>
          </>
        }
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
            <button
              type="button"
              className="upload-template-btn"
              onClick={handleDownloadTemplate}
              disabled={downloading}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {downloading ? "Preparing…" : "Download template"}
            </button>
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? "Uploading…" : "Upload file"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <DataTable columns={columns} rows={uploads} loading={loading} error={error} empty="No loan request uploads yet." />
      </Card>

      <Modal
        open={indivOpen}
        onClose={closeIndividualModal}
        title="Individual loan request"
        footer={
          <>
            <Button variant="ghost" onClick={closeIndividualModal} disabled={indivSubmitting}>Cancel</Button>
            <Button type="submit" form="individual-loan-form" disabled={indivSubmitting}>
              {indivSubmitting ? "Submitting…" : "Submit request"}
            </Button>
          </>
        }
      >
        <form id="individual-loan-form" onSubmit={handleIndividualSubmit}>
          {indivError && <Alert variant="error">{indivError}</Alert>}
          <Field label="Phone number" required>
            <Input
              type="tel"
              name="phone_number"
              placeholder="254712345678"
              value={indivPhone}
              onChange={(e) => setIndivPhone(e.target.value)}
              required
            />
          </Field>
          <Field label="Amount" required>
            <Input
              type="number"
              name="amount"
              min="1"
              step="0.01"
              placeholder="5000"
              value={indivAmount}
              onChange={(e) => setIndivAmount(e.target.value)}
              required
            />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
