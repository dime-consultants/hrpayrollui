export function formatMoney(amount, currency = "KES") {
  const n = Number(amount)
  if (Number.isNaN(n)) return `${currency} 0.00`
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatNumber(n) {
  const v = Number(n)
  if (Number.isNaN(v)) return "0"
  return v.toLocaleString()
}

export function formatDate(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export function formatDateTime(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Normalize either a DRF paginated response ({results: []}) or a bare array.
export function asList(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export function shortId(id) {
  if (!id) return "-"
  return String(id).slice(0, 8)
}
