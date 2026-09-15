import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { DataTable } from "../components/Table.jsx";
import {
  Badge,
  Button,
  Card,
  Alert,
  Modal,
  Input,
  Spinner,
} from "../components/ui.jsx";
import UploadResultGrid from "../components/UploadResultGrid.jsx";
import { useFetch } from "../lib/useFetch.js";
import { api, endpoints } from "../lib/api.js";
import { formatDate, formatMoney, formatNumber } from "../lib/format.js";
import "./Uploads.css";

function UploadCloudIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function statusVariant(status) {
  const s = (status || "").toLowerCase();
  if (s === "processed" || s === "completed" || s === "success" || s === "done")
    return "green";
  if (s === "approved") return "green";
  if (s === "failed" || s === "error") return "red";
  if (s === "processing" || s === "pending") return "amber";
  if (s === "approval_pending") return "blue";
  return "slate";
}

// Raw codes stored on PayrollUpload.status (apps/payroll/models.py STATUS_CHOICES)
const STATUS_LABELS = {
  approval_pending: "Approval Pending",
  approved: "Approved",
  pending: "Pending",
  processing: "Processing",
  done: "Completed",
  failed: "Failed",
  partial: "Partially Processed",
};

function statusLabel(status) {
  if (!status) return "Approval Pending";
  return STATUS_LABELS[status] || status;
}

// The template file itself comes from the backend, but phone numbers in the
// example rows arrive as plain numeric-looking strings. Excel will happily
// mangle those (scientific notation, dropped leading digits) unless the
// column is forced to Text. Post-process the downloaded file client-side so
// column A reads '254712486391 and is formatted as Text.
async function forcePhoneColumnToText(blob) {
  const XLSX = await import("xlsx");
  const buffer = await blob.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet["!ref"]) return blob;

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
    const cell = worksheet[cellRef];
    if (!cell || cell.v == null || cell.v === "") continue;
    const digits = String(cell.v).replace(/^'/, "");
    cell.v = `'${digits}`;
    cell.t = "s";
    cell.z = "@";
    delete cell.w;
  }

  const outBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([outBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function currentPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function UpIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function ReceiptIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8M16 12H8M12 16H8" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function LayersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  return (
    <Card className="card-body">
      <div className="stat-card-row">
        <span className={`stat-card-icon-wrap tone-${tone}`}>
          <Icon />
        </span>
        <div>
          <p className="stat-card-label">{label}</p>
          <p className="stat-card-value">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function Uploads() {
  const { data, loading, error, refetch } = useFetch("/api/v1/uploads/");
  const [appliedPeriod, setAppliedPeriod] = useState(currentPeriod());
  const [period, setPeriod] = useState(currentPeriod());
  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useFetch(
    () => endpoints.dashboard({ period: appliedPeriod }),
    [appliedPeriod],
  );
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const uploads = Array.isArray(data) ? data : data?.results || [];

  async function handleDownloadTemplate() {
    setDownloading(true);
    try {
      const blob = await endpoints.downloadTemplate();
      const outBlob = await forcePhoneColumnToText(blob);
      const url = URL.createObjectURL(outBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payroll_upload_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMsg({
        variant: "error",
        text: err.message || "Could not download template.",
      });
    } finally {
      setDownloading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("payroll_period", `${period}-01`);
      const result = await api.postForm("/api/v1/uploads/", body);
      setMsg({
        variant: "success",
        text: `Uploaded "${file.name}" successfully.`,
      });
      setUploadResult(result);
      setFile(null);
      refetch();
    } catch (err) {
      setMsg({ variant: "error", text: err.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await endpoints.deleteUpload(deleteTarget.id);
      setMsg({
        variant: "success",
        text: `"${deleteTarget.original_filename || deleteTarget.file || "Upload"}" deleted.`,
      });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setMsg({ variant: "error", text: err.message || "Delete failed." });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (u) => <span className="upload-id">#{u.id}</span>,
    },
    {
      key: "file",
      header: "File",
      render: (u) => (
        <span className="upload-file-label">
          {u.file_name || u.original_filename || u.file || "—"}
        </span>
      ),
    },
    { key: "rows", header: "Rows", render: (u) => u.total_rows ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <Badge variant={statusVariant(u.status)}>{statusLabel(u.status)}</Badge>
      ),
    },
    {
      key: "date",
      header: "Uploaded",
      render: (u) => formatDate(u.date_created),
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <button
          className="upload-delete-btn"
          title={
            u.status === "processing"
              ? "Cannot delete while processing"
              : "Delete upload"
          }
          disabled={u.status === "processing"}
          onClick={() => setDeleteTarget(u)}
          aria-label="Delete upload"
        >
          <TrashIcon />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payroll Uploads"
        subtitle={
          summary
            ? `${summary.organization} — period ${summary.period}`
            : "Import payroll spreadsheets for processing."
        }
        actions={
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedPeriod(period);
            }}
            className="dashboard-period-form"
          >
            <Input
              label="Period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        }
      />

      {summaryError && <Alert>{summaryError.message}</Alert>}

      {summaryLoading ? (
        <div className="dashboard-loader">
          <Spinner className="h-8 w-8" />
        </div>
      ) : summary ? (
        <div className="dashboard-stats upload-summary-stats">
          <StatCard
            icon={UpIcon}
            label="Total Uploads"
            value={formatNumber(summary.total_uploads)}
            tone="blue"
          />
          <StatCard
            icon={ReceiptIcon}
            label="Total Deductions"
            value={formatNumber(summary.total_deductions)}
            tone="slate"
          />
          <StatCard
            icon={WalletIcon}
            label="Total Amount"
            value={formatMoney(summary.total_amount)}
            tone="blue"
          />
          <StatCard
            icon={TrendIcon}
            label="Successful Amount"
            value={formatMoney(summary.successful_amount)}
            tone="green"
          />
          <StatCard
            icon={LayersIcon}
            label="Pending Batches"
            value={formatNumber(summary.pending_batches)}
            tone="amber"
          />
          <StatCard
            icon={AlertIcon}
            label="Failed Deductions"
            value={formatNumber(summary.failed_deductions)}
            tone="red"
          />
        </div>
      ) : null}

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
            <div className="upload-dropzone-icon">
              <UploadCloudIcon />
            </div>
            {file ? (
              <p className="upload-file-name">{file.name}</p>
            ) : (
              <p className="upload-dropzone-primary">
                Click or drag to select a file
              </p>
            )}
            <p className="upload-dropzone-secondary">
              CSV, XLS or XLSX — up to 50 MB
            </p>
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
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
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
        <DataTable
          columns={columns}
          rows={uploads}
          loading={loading}
          error={error}
          empty="No uploads yet."
        />
      </Card>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete upload"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
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
          <strong>
            {deleteTarget?.original_filename ||
              deleteTarget?.file ||
              "this upload"}
          </strong>
          ? This will also remove the file and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
