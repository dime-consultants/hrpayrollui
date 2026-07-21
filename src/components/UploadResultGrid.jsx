import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatMoney, formatDate } from "../lib/format.js"
import { Spinner } from "./ui.jsx"
import "./UploadResultGrid.css"

const STATUS_CLASS = {
  queued:     "ugrid-s-queued",
  processing: "ugrid-s-processing",
  success:    "ugrid-s-success",
  failed:     "ugrid-s-failed",
  skipped:    "ugrid-s-skipped",
}

export default function UploadResultGrid({ upload, onClose }) {
  const { data, loading, error } = useFetch(
    () => endpoints.uploadDeductions(upload.id),
    [upload.id],
  )

  const rows    = Array.isArray(data) ? data : (data?.results ?? [])
  const total   = data?.count ?? rows.length
  const errors  = Array.isArray(upload.error_log) ? upload.error_log : []

  return (
    <div className="ugrid-wrap">
      <div className="ugrid-bar">
        <div className="ugrid-bar-left">
          <span className="ugrid-filename">{upload.original_filename}</span>
          <span className="ugrid-pill ugrid-pill-ok">{upload.processed_rows ?? rows.length} rows parsed</span>
          {errors.length > 0 && (
            <span className="ugrid-pill ugrid-pill-err">{errors.length} errors</span>
          )}
        </div>
        <button className="ugrid-close" onClick={onClose} aria-label="Dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="ugrid-state"><Spinner /></div>
      )}

      {!loading && error && (
        <div className="ugrid-state ugrid-state-err">Could not load rows: {error.message}</div>
      )}

      {!loading && !error && (
        <>
          {rows.length > 0 && (
            <div className="ugrid-scroll">
              <table className="ugrid-table">
                <thead>
                  <tr>
                    <th className="ugrid-col-num">#</th>
                    <th>Employee Name</th>
                    <th>Employee ID</th>
                    <th>Phone</th>
                    <th className="ugrid-col-amount">Amount</th>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id}>
                      <td className="ugrid-col-num">{row.row_number || i + 1}</td>
                      <td>{row.employee_name || "—"}</td>
                      <td className="ugrid-mono">{row.employee_id || "—"}</td>
                      <td className="ugrid-mono">{row.phone_number}</td>
                      <td className="ugrid-col-amount ugrid-mono">{formatMoney(row.amount)}</td>
                      <td>{formatDate(row.deduction_date)}</td>
                      <td>{row.reference || "—"}</td>
                      <td>
                        <span className={`ugrid-status ${STATUS_CLASS[row.status] ?? ""}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {total > rows.length && (
                <p className="ugrid-more">Showing {rows.length} of {total} rows</p>
              )}
            </div>
          )}

          {rows.length === 0 && errors.length === 0 && (
            <div className="ugrid-state">No rows found for this upload.</div>
          )}

          {errors.length > 0 && (
            <div className="ugrid-errors">
              <p className="ugrid-errors-title">
                {errors.length} row{errors.length !== 1 ? "s" : ""} skipped due to validation errors
              </p>
              <div className="ugrid-scroll ugrid-errors-scroll">
                <table className="ugrid-table ugrid-table-err">
                  <thead>
                    <tr>
                      <th className="ugrid-col-num">Row</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((e, i) => (
                      <tr key={i}>
                        <td className="ugrid-col-num">{e.row ?? "—"}</td>
                        <td className="ugrid-err-msg">
                          {Array.isArray(e.messages) ? e.messages.join(" · ") : (e.messages || e.error || "Unknown error")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
