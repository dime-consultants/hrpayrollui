import dimeCreditLogo from "../assets/dime-credit-logo.jpeg"
import "./AuthShell.css"

const DOTS = Array.from({ length: 25 })

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">
          <img src={dimeCreditLogo} alt="Dime Credit" className="auth-brand-logo-img" />
        </div>

        <div className="auth-brand-tagline">
          <h2>Payroll checkoff &amp; repayments, all in one place.</h2>
          <p>
            Upload payroll files, review salary deductions, approve repayment batches, and track
            dispatch records across your organization.
          </p>
        </div>

        <p className="auth-brand-footer">Secure HR access for payroll administrators.</p>

        <div className="auth-brand-dots" aria-hidden="true">
          {DOTS.map((_, i) => <span key={i} />)}
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-mobile-logo">
            <img src={dimeCreditLogo} alt="Dime Credit" className="auth-mobile-logo-img" />
          </div>

          <h1 className="auth-form-title">{title}</h1>
          {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}

          {children}

          {footer && <div className="auth-form-footer">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
