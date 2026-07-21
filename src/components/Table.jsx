import "./Table.css"
import { Spinner, EmptyState } from "./ui.jsx"

export function DataTable({ columns, rows, loading, error, empty, keyField = "id", onRowClick }) {
  if (loading) {
    return (
      <div className="table-loader">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="table-loader">
        <p style={{ color: "var(--gray-500)", fontSize: "0.875rem" }}>
          {error?.message || String(error)}
        </p>
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      typeof empty === "string"
        ? <EmptyState title={empty} description="There is nothing to show here yet." />
        : empty || <EmptyState title="No records found" description="There is nothing to show here yet." />
    )
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.align === "right" ? "align-right" : ""}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row[keyField] ?? idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "clickable" : ""}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.align === "right" ? "align-right" : ""}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { DataTable as Table }
