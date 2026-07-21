import "./ui.css"

export function Button({ as: Comp = "button", variant = "primary", size = "md", className = "", ...props }) {
  const cls = `btn btn-${variant} btn-${size} ${className}`
  return <Comp className={cls} {...props} />
}

export function Card({ className = "", children }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="card-header">
      <div className="card-header-text">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({ label, required, children }) {
  return (
    <div className="field">
      {label && (
        <span className={`field-label${required ? " required" : ""}`}>{label}</span>
      )}
      {children}
    </div>
  )
}

export function Input({ label, error, className = "", id, ...props }) {
  const inputId = id || props.name
  return (
    <div className={`input-wrap ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">{label}</label>
      )}
      <input id={inputId} className="input" {...props} />
      {error && <p className="input-error">{error}</p>}
    </div>
  )
}

export function Select({ label, children, className = "", id, ...props }) {
  const selectId = id || props.name
  return (
    <div className={`input-wrap ${className}`}>
      {label && (
        <label htmlFor={selectId} className="input-label">{label}</label>
      )}
      <select id={selectId} className="select" {...props}>{children}</select>
    </div>
  )
}

const BADGE_VARIANT_MAP = {
  blue: "badge-blue",
  green: "badge-green",
  red: "badge-red",
  amber: "badge-amber",
  slate: "badge-slate",
  indigo: "badge-indigo",
  orange: "badge-orange",
}

export function Badge({ variant = "slate", children }) {
  const cls = BADGE_VARIANT_MAP[variant] || "badge-slate"
  return <span className={`badge ${cls}`}>{children}</span>
}

const STATUS_CLASS_MAP = {
  pending: "status-pending",
  queued: "status-queued",
  draft: "status-draft",
  processing: "status-processing",
  dispatching: "status-dispatching",
  approved: "status-approved",
  done: "status-done",
  complete: "status-complete",
  success: "status-success",
  partial: "status-partial",
  skipped: "status-skipped",
  claimed: "status-claimed",
  failed: "status-failed",
  active: "status-active",
  inactive: "status-inactive",
}

export function StatusBadge({ status }) {
  const key = String(status || "").toLowerCase()
  const cls = STATUS_CLASS_MAP[key] || "status-default"
  return (
    <span className={`status-badge ${cls}`}>{status || "–"}</span>
  )
}

export function Spinner({ className = "" }) {
  return (
    <span
      className={`spinner ${className.includes("h-8") ? "spinner-lg" : ""} ${className}`}
      aria-label="Loading"
    />
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {action}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="modal-backdrop">
      <div className="modal-overlay" onClick={onClose} aria-hidden="true" />
      <div className="modal-box">
        <div className="modal-head">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Alert({ variant = "error", children }) {
  if (!children) return null
  const cls = `alert alert-${variant}`
  return (
    <div className={cls} role="alert">{children}</div>
  )
}

export function StatCard({ label, value, children }) {
  return (
    <div className="stat-card">
      <p className="stat-card-label">{label}</p>
      {children ?? <p className="stat-card-value">{value ?? "—"}</p>}
    </div>
  )
}
