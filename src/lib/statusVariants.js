export function batchStatusVariant(status) {
  const s = (status || "").toLowerCase()
  if (s === "approved" || s === "paid" || s === "completed" || s === "complete" || s === "success") return "green"
  if (s === "rejected" || s === "failed") return "red"
  if (s === "processing" || s === "pending" || s === "draft" || s === "dispatching") return "amber"
  return "slate"
}
