import { useState } from "react"
import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Button, Card, Alert, Modal, Field, Input, Select } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatDate } from "../lib/format.js"
import { loanStatusVariant } from "../lib/statusVariants.js"
import "./Uploads.css"
import "./LoanRequests.css"

// Numbered guarantor_N_id_number / guarantor_N_phone_number column pairs —
// the backend parses however many pairs are present, so a batch isn't
// capped at the number of pairs the template ships with by default.
function guarantorColumnHeaders(count) {
  const headers = []
  for (let i = 1; i <= count; i++) {
    headers.push(`guarantor_${i}_id_number`, `guarantor_${i}_phone_number`)
  }
  return headers
}

function guarantorColumnValues(guarantors) {
  const values = []
  for (const g of guarantors) {
    values.push(g.id_number, g.phone_number)
  }
  return values
}

function markPhoneColumnsAsText(worksheet, headers) {
  headers.forEach((header, i) => {
    if (!header.includes("phone")) return
    const cell = worksheet[`${XLSX_COL(i)}2`]
    if (cell) {
      cell.t = "s"
      cell.z = "@"
    }
  })
}

function XLSX_COL(i) {
  // 0 -> A, 1 -> B, ...
  return String.fromCharCode(65 + i)
}

// The loan product the employee is requesting. Kept in one place so the
// template, the individual-request dropdown, and the batch view all agree
// on the same three options.
const PRODUCT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "pata_gadget", label: "Pata Gadget" },
  { value: "shiba_na_dime", label: "Shiba na Dime" },
]

function productLabel(value) {
  return PRODUCT_OPTIONS.find((p) => p.value === value)?.label || value || "Cash"
}

// The bundled `xlsx` build can't write real in-cell dropdown validation, so
// instead of a fake/broken dropdown we ship a second reference sheet listing
// the valid values — self-documenting without touching the parsed data
// sheet at all. (A same-sheet legend was tried and reverted: the backend
// reads the sheet's whole used range, so any legend-only row — one with no
// real loan data but a non-blank legend cell — was wrongly parsed as a
// malformed data row instead of being skipped as blank.)
function addProductOptionsSheet(XLSX, workbook) {
  const legend = XLSX.utils.aoa_to_sheet([
    ["Valid product values"],
    ...PRODUCT_OPTIONS.map((p) => [p.label]),
  ])
  legend["!cols"] = [{ wch: 24 }]
  XLSX.utils.book_append_sheet(workbook, legend, "Product Options")
}

async function downloadLoanRequestTemplate() {
  const XLSX = await import("xlsx")
  const headers = ["phone_number", "amount", "product", ...guarantorColumnHeaders(2)]
  const sampleRow = ["'254712345678", "5000", "Cash", "12345678", "'254798765432", "87654321", "'254711223344"]
  const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow])
  markPhoneColumnsAsText(worksheet, headers)
  worksheet["!cols"] = headers.map((h) => ({ wch: h.includes("guarantor") ? 22 : 18 }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Loan Requests")
  addProductOptionsSheet(XLSX, workbook)
  XLSX.writeFile(workbook, "loan_request_template.xlsx")
}

async function buildIndividualLoanFile(phoneNumber, amount, product, guarantors) {
  const XLSX = await import("xlsx")
  const headers = ["phone_number", "amount", "product", ...guarantorColumnHeaders(guarantors.length)]
  const row = [phoneNumber, amount, productLabel(product), ...guarantorColumnValues(guarantors)]
  const worksheet = XLSX.utils.aoa_to_sheet([headers, row])
  markPhoneColumnsAsText(worksheet, headers)
  worksheet["!cols"] = headers.map((h) => ({ wch: h.includes("guarantor") ? 22 : 18 }))
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
  const [indivProduct, setIndivProduct] = useState(PRODUCT_OPTIONS[0].value)
  const [indivGuarantors, setIndivGuarantors] = useState([{ id_number: "", phone_number: "" }])
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
    setIndivProduct(PRODUCT_OPTIONS[0].value)
    setIndivGuarantors([{ id_number: "", phone_number: "" }])
    setIndivError(null)
  }

  function updateGuarantor(index, field, value) {
    setIndivGuarantors((list) => list.map((g, i) => (i === index ? { ...g, [field]: value } : g)))
  }

  function addGuarantor() {
    setIndivGuarantors((list) => [...list, { id_number: "", phone_number: "" }])
  }

  function removeGuarantor(index) {
    setIndivGuarantors((list) => list.filter((_, i) => i !== index))
  }

  async function handleIndividualSubmit(e) {
    e.preventDefault()
    setIndivError(null)

    const guarantors = indivGuarantors
      .map((g) => ({ id_number: g.id_number.trim(), phone_number: g.phone_number.trim() }))
      .filter((g) => g.id_number || g.phone_number)
    if (guarantors.length === 0 || guarantors.some((g) => !g.id_number || !g.phone_number)) {
      setIndivError("Each guarantor needs both an ID number and a phone number.")
      return
    }

    setIndivSubmitting(true)
    try {
      const phone = indivPhone.trim()
      const file = await buildIndividualLoanFile(phone, indivAmount, indivProduct, guarantors)
      const body = new FormData()
      body.append("file", file)
      body.append("loan_period", `${period}-01`)
      body.append("notes", `Individual loan request — ${phone}`)
      await endpoints.createLoanUpload(body)
      setMsg({ variant: "success", text: `Loan request for ${phone} submitted successfully. Awaiting admin approval.` })
      setIndivOpen(false)
      setIndivPhone("")
      setIndivAmount("")
      setIndivProduct(PRODUCT_OPTIONS[0].value)
      setIndivGuarantors([{ id_number: "", phone_number: "" }])
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
            <p className="upload-dropzone-secondary">
              Each row needs at least one guarantor (more encouraged) — a guarantor cannot
              already be guaranteeing another active loan.
            </p>
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
          <Field label="Product" required>
            <Select value={indivProduct} onChange={(e) => setIndivProduct(e.target.value)} required>
              {PRODUCT_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </Field>
          <p className="form-hint">
            A guarantor cannot already be guaranteeing another active loan. At least one
            guarantor is required — providing more than one is encouraged.
          </p>
          {indivGuarantors.map((g, i) => (
            <div key={i} className="guarantor-row">
              <Field label={`Guarantor ${i + 1} ID number`} required>
                <Input
                  type="text"
                  placeholder="12345678"
                  value={g.id_number}
                  onChange={(e) => updateGuarantor(i, "id_number", e.target.value)}
                  required
                />
              </Field>
              <Field label={`Guarantor ${i + 1} phone number`} required>
                <Input
                  type="tel"
                  placeholder="254798765432"
                  value={g.phone_number}
                  onChange={(e) => updateGuarantor(i, "phone_number", e.target.value)}
                  required
                />
              </Field>
              {indivGuarantors.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeGuarantor(i)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={addGuarantor}>
            + Add guarantor
          </Button>
        </form>
      </Modal>
    </div>
  )
}
