import { useState } from "react"
import { Link } from "react-router-dom"
import PageHeader from "../components/PageHeader.jsx"
import { Card, Spinner, Alert, Input, Button } from "../components/ui.jsx"
import { endpoints } from "../lib/api.js"
import { useFetch } from "../lib/useFetch.js"
import { formatMoney, formatNumber } from "../lib/format.js"
import "./Dashboard.css"

function UpIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
}
function ReceiptIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8M16 12H8M12 16H8"/></svg>
}
function WalletIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/></svg>
}
function TrendIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}
function LayersIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
}
function AlertIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
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
  )
}

function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

export default function Dashboard() {
  const [period, setPeriod] = useState(currentPeriod())
  const [appliedPeriod, setAppliedPeriod] = useState(currentPeriod())
  const { data, loading, error } = useFetch(
    () => endpoints.dashboard({ period: appliedPeriod }),
    [appliedPeriod],
  )

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={data ? `${data.organization} — period ${data.period}` : "Payroll overview"}
        actions={
          <form
            onSubmit={(e) => { e.preventDefault(); setAppliedPeriod(period) }}
            className="dashboard-period-form"
          >
            <Input label="Period" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            <Button type="submit" variant="secondary">Apply</Button>
          </form>
        }
      />

      {error && <Alert>{error.message}</Alert>}

      {loading ? (
        <div className="dashboard-loader"><Spinner className="h-8 w-8" /></div>
      ) : data ? (
        <div>
          <div className="dashboard-stats">
            <StatCard icon={UpIcon}      label="Total Uploads"     value={formatNumber(data.total_uploads)}    tone="blue" />
            <StatCard icon={ReceiptIcon} label="Total Deductions"  value={formatNumber(data.total_deductions)} tone="slate" />
            <StatCard icon={WalletIcon}  label="Total Amount"      value={formatMoney(data.total_amount)}      tone="blue" />
            <StatCard icon={TrendIcon}   label="Successful Amount" value={formatMoney(data.successful_amount)} tone="green" />
            <StatCard icon={LayersIcon}  label="Pending Batches"   value={formatNumber(data.pending_batches)}  tone="amber" />
            <StatCard icon={AlertIcon}   label="Failed Deductions" value={formatNumber(data.failed_deductions)} tone="red" />
          </div>

          <Card>
            <div className="card-body dashboard-quick-actions">
              <h3>Quick actions</h3>
              <p>Jump into the most common payroll tasks.</p>
              <div className="dashboard-action-buttons">
                <Button as={Link} to="/uploads"    variant="primary">Upload payroll</Button>
                <Button as={Link} to="/batches"    variant="secondary">Review batches</Button>
                <Button as={Link} to="/deductions" variant="secondary">View deductions</Button>
                <Button as={Link} to="/records"    variant="secondary">Repayment records</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
