import PageHeader from "../components/PageHeader.jsx"
import { Card, CardHeader, Alert, Spinner, StatusBadge } from "../components/ui.jsx"
import { endpoints } from "../lib/api.js"
import { useFetch } from "../lib/useFetch.js"
import "./Organization.css"

function Row({ label, value }) {
  return (
    <div className="org-row">
      <dt className="org-row-label">{label}</dt>
      <dd className="org-row-value">{value ?? "—"}</dd>
    </div>
  )
}

export default function Organization() {
  const { data, loading, error } = useFetch(() => endpoints.myOrganization(), [])

  return (
    <div>
      <PageHeader title="Organization" subtitle="Your organization profile as mirrored from the LMS." />

      {error && <Alert>{error.message}</Alert>}

      {loading ? (
        <div className="org-loader"><Spinner className="h-8 w-8" /></div>
      ) : data ? (
        <Card>
          <CardHeader
            title={data.name}
            subtitle={data.code ? `Code: ${data.code}` : undefined}
            action={<StatusBadge status={data.is_active ? "active" : "inactive"} />}
          />
          <dl className="org-dl">
            <Row label="Name"         value={data.name} />
            <Row label="Code"         value={data.code} />
            {/* <Row label="LMS ID"       value={data.lms_id} /> */}
            <Row label="Email"        value={data.email} />
            <Row label="Phone"        value={data.phone_number} />
            <Row label="Contact"      value={data.contact_name} />
            <Row label="Active"       value={data.is_active ? "Yes" : "No"} />
          </dl>
        </Card>
      ) : null}
    </div>
  )
}

