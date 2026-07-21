import { useState } from "react"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Button, Card, Alert, Modal } from "../components/ui.jsx"
import UploadResultGrid from "../components/UploadResultGrid.jsx"
import { useFetch } from "../lib/useFetch.js"
import { api, endpoints } from "../lib/api.js"
import { formatDate } from "../lib/format.js"
import "./Uploads.css"

function UploadCloudIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function statusVariant(status) {
  const s = (status || "").toLowerCase()
  if (s === "processed" || s === "completed" || s === "success" || s === "done") return "green"
  if (s === "approved") return "green"
  if (s === "failed" || s === "error") return "red"
  if (s === "processing" || s === "pending") return "amber"
  if (s === "approval_pending") return "blue"
  return "slate"
}

function currentPeriod() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export default function Uploads() {
  const { data, loading, error, refetch } = useFetch("/uploads/")
  const [file, setFile] = useState(null)
  const [period, setPeriod] = useState(currentPeriod())
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const uploads = Array.isArray(data) ? data : data?.results || []

  async function handleDownloadTemplate() {
    setDownloading(true)
    try {
      const blob = await endpoints.downloadTemplate()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "payroll_upload_template.xlsx"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setMsg({ variant: "error", text: err.message || "Could not download template." })
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
      body.append("payroll_period", `${period}-01`)
      const result = await api.postForm("/uploads/", body)
      setMsg({ variant: "success", text: `Uploaded "${file.name}" successfully.` })
      setUploadResult(result)
      setFile(null)
      refetch()
    } catch (err) {
      setMsg({ variant: "error", text: err.message || "Upload failed." })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await endpoints.deleteUpload(deleteTarget.id)
      setMsg({ variant: "success", text: `"${deleteTarget.original_filename || deleteTarget.file || "Upload"}" deleted.` })
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setMsg({ variant: "error", text: err.message || "Delete failed." })
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: "id",   header: "ID",       render: (u) => <span className="upload-id">#{u.id}</span> },
    { key: "file", header: "File",     render: (u) => <span className="upload-file-label">{u.file_name || u.original_filename || u.file || "—"}</span> },
    { key: "rows", header: "Rows",     render: (u) => u.row_count ?? u.records_count ?? "—" },
    { key: "status", header: "Status", render: (u) => <Badge variant={statusVariant(u.status)}>{u.status || "uploaded"}</Badge> },
    { key: "date", header: "Uploaded", render: (u) => formatDate(u.created_at || u.uploaded_at) },
    {
      key: "actions", header: "",
      render: (u) => (
        <button
          className="upload-delete-btn"
          title={u.status === "processing" ? "Cannot delete while processing" : "Delete upload"}
          disabled={u.status === "processing"}
          onClick={() => setDeleteTarget(u)}
          aria-label="Delete upload"
        >
          <TrashIcon />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Payroll Uploads" subtitle="Import payroll spreadsheets for processing." />

      <Card className="upload-card">
        <form onSubmit={handleUpload}>
          {msg && <Alert variant={msg.variant}>{msg.text}</Alert>}
          <div className="upload-period">
            <label htmlFor="payroll-period">Payroll period</label>
            <input
              id="payroll-period"
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
            <p className="upload-dropzone-secondary">CSV, XLS or XLSX — up to 50 MB</p>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="upload-actions">
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
              {downloading ? "Downloading…" : "Download template"}
            </button>
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? "Uploading…" : "Upload file"}
            </Button>
          </div>
        </form>
      </Card>

      {uploadResult && (
        <UploadResultGrid
          upload={uploadResult}
          onClose={() => setUploadResult(null)}
        />
      )}

      <Card className="p-0">
        <DataTable columns={columns} rows={uploads} loading={loading} error={error} empty="No uploads yet." />
      </Card>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete upload"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete{" "}
          <strong>{deleteTarget?.original_filename || deleteTarget?.file || "this upload"}</strong>?
          This will also remove the file and cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
