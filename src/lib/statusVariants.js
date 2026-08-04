export function batchStatusVariant(status) {
  const s = (status || "").toLowerCase()
  if (s === "approved" || s === "paid" || s === "completed" || s === "complete" || s === "success") return "green"
  if (s === "rejected" || s === "failed") return "red"
  if (s === "processing" || s === "pending" || s === "draft" || s === "dispatching") return "amber"
  return "slate"
}

// Statuses used by apps/loans (LoanRequestUpload, LoanRequest, LoanRequestBatch)
export function loanStatusVariant(status) {
  const s = (status || "").toLowerCase()
  if (["done", "complete", "success", "eligible", "approved"].includes(s)) return "green"
  if (["failed", "ineligible"].includes(s)) return "red"
  if (["partial"].includes(s)) return "orange"
  if (["skipped"].includes(s)) return "slate"
  if (["approval_pending", "processing", "queued", "eligibility_checking", "dispatching"].includes(s)) return "amber"
  return "slate"
}
