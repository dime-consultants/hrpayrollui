import { useState } from "react"
import PageHeader from "../components/PageHeader.jsx"
import { DataTable } from "../components/Table.jsx"
import { Badge, Button, Card, Alert, Modal, Field, Input, Select } from "../components/ui.jsx"
import { useFetch } from "../lib/useFetch.js"
import { endpoints } from "../lib/api.js"
import { formatDate } from "../lib/format.js"
import { loanStatusVariant } from "../lib/statusVariants.js"
import "./CustomerRegistrations.css"

const STATUS_LABELS = {
  approval_pending: "Approval Pending",
  active: "Active",
  processing: "Processing",
  done: "Completed",
  partial: "Partially Processed",
  failed: "Failed",
}

function statusLabel(status) {
  if (!status) return "Approval Pending"
  return STATUS_LABELS[status] || status
}

const SALUTATIONS = ["Mr", "Mrs", "Ms", "Dr", "Prof"]
const GENDERS = ["Male", "Female"]
const IDENTITY_TYPES = ["National ID", "Passport"]
const WORKING_STATUSES = ["Employee", "Self Employed", "Unemployed"]

const EMPTY_FORM = {
  salutation: "Mr",
  first_name: "",
  last_name: "",
  other_name: "",
  gender: "Male",
  date_of_birth: "",
  identity_type_name: "National ID",
  identity_number: "",
  phone_number: "",
  email: "",
  address: "",
  working_status: "Employee",
  country: "KE",
  notes: "",
}

const EMPTY_FILES = {
  national_id_front: null,
  national_id_back: null,
  passport_photo: null,
  selfie_photo: null,
}

function FileChooser({ file, onChange, accept = "image/*", required }) {
  return (
    <label className="file-chooser">
      <span className="file-chooser-btn">Choose file</span>
      <span className={`file-chooser-name${file ? " has-file" : ""}`}>
        {file ? file.name : "No file chosen"}
      </span>
      <input
        type="file"
        accept={accept}
        className="file-chooser-input"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        required={required}
      />
    </label>
  )
}

function kycSummary(docs) {
  if (!Array.isArray(docs) || docs.length === 0) return "—"
  const uploaded = docs.filter((d) => d.status === "uploaded").length
  return `${uploaded}/${docs.length} uploaded`
}

export default function CustomerRegistrations() {
  const { data, loading, error, refetch } = useFetch(() => endpoints.customerRegistrations(), [])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [files, setFiles] = useState(EMPTY_FILES)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [msg, setMsg] = useState(null)

  const registrations = Array.isArray(data) ? data : data?.results || []

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updateFile(key, file) {
    setFiles((f) => ({ ...f, [key]: file }))
  }

  function closeModal() {
    if (submitting) return
    setOpen(false)
    setForm(EMPTY_FORM)
    setFiles(EMPTY_FILES)
    setFormError("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setFormError("")
    try {
      const body = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value) body.append(key, value)
      })
      if (form.identity_type_name === "Passport") {
        if (!files.passport_photo) throw new Error("Passport photo is required.")
        body.append("passport_photo", files.passport_photo)
      } else {
        if (!files.national_id_front || !files.national_id_back) {
          throw new Error("Both National ID front and back photos are required.")
        }
        body.append("national_id_front", files.national_id_front)
        body.append("national_id_back", files.national_id_back)
      }
      if (!files.selfie_photo) throw new Error("Selfie photo is required.")
      body.append("selfie_photo", files.selfie_photo)

      await endpoints.createCustomerRegistration(body)
      setMsg({ variant: "success", text: `Registration for ${form.first_name} ${form.last_name} submitted. Awaiting admin approval.` })
      setOpen(false)
      setForm(EMPTY_FORM)
      setFiles(EMPTY_FILES)
      refetch()
    } catch (err) {
      setFormError(err.message || "Could not submit registration.")
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      key: "name",
      header: "Borrower",
      render: (r) => (
        <div>
          <p className="registration-name-primary">{[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}</p>
          <p className="registration-name-secondary">{r.phone_number}</p>
        </div>
      ),
    },
    {
      key: "identity",
      header: "Identity",
      render: (r) => (
        <div>
          <p className="registration-name-primary">{r.identity_type_name}</p>
          <p className="registration-name-secondary">{r.identity_number}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <Badge variant={loanStatusVariant(r.status)}>{statusLabel(r.status)}</Badge> },
    { key: "kyc", header: "KYC Documents", render: (r) => <span className="registration-kyc-summary">{kycSummary(r.kyc_documents)}</span> },
    { key: "submitted_by", header: "Submitted by", render: (r) => r.submitted_by_name || "—" },
    { key: "date", header: "Submitted", render: (r) => formatDate(r.date_created) },
  ]

  const isNationalId = form.identity_type_name === "National ID"

  return (
    <div>
      <PageHeader
        title="Customer Registrations"
        subtitle="Register new borrowers and submit their KYC documents for admin approval."
        actions={<Button onClick={() => setOpen(true)}>Register customer</Button>}
      />

      {msg && <Alert variant={msg.variant}>{msg.text}</Alert>}

      <Card className="p-0">
        <DataTable columns={columns} rows={registrations} loading={loading} error={error} empty="No customer registrations yet." />
      </Card>

      <Modal
        open={open}
        onClose={closeModal}
        title="Register customer"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={submitting}>Cancel</Button>
            <Button type="submit" form="customer-registration-form" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit registration"}
            </Button>
          </>
        }
      >
        <form id="customer-registration-form" onSubmit={handleSubmit} className="registration-form">
          {formError && <Alert>{formError}</Alert>}

          <p className="registration-form-section-title">Personal details</p>
          <div className="registration-form-grid">
            <Field label="Salutation">
              <Select value={form.salutation} onChange={(e) => update("salutation", e.target.value)}>
                {SALUTATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Gender" required>
              <Select value={form.gender} onChange={(e) => update("gender", e.target.value)} required>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
            </Field>
            <Field label="First name" required>
              <Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} required />
            </Field>
            <Field label="Last name" required>
              <Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} required />
            </Field>
            <Field label="Other name">
              <Input value={form.other_name} onChange={(e) => update("other_name", e.target.value)} />
            </Field>
            <Field label="Date of birth" required>
              <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} required />
            </Field>
          </div>

          <p className="registration-form-section-title">Identity</p>
          <div className="registration-form-grid">
            <Field label="Identity type" required>
              <Select value={form.identity_type_name} onChange={(e) => update("identity_type_name", e.target.value)} required>
                {IDENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Identity number" required>
              <Input value={form.identity_number} onChange={(e) => update("identity_number", e.target.value)} required />
            </Field>
          </div>

          <p className="registration-form-section-title">Contact</p>
          <div className="registration-form-grid">
            <Field label="Phone number" required>
              <Input type="tel" placeholder="254712345678" value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
          </div>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </Field>

          <p className="registration-form-section-title">Employment</p>
          <div className="registration-form-grid">
            <Field label="Working status">
              <Select value={form.working_status} onChange={(e) => update("working_status", e.target.value)}>
                {WORKING_STATUSES.map((w) => <option key={w} value={w}>{w}</option>)}
              </Select>
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
            </Field>
          </div>

          <p className="registration-form-section-title">KYC documents</p>
          {isNationalId ? (
            <div className="registration-form-grid">
              <Field label="National ID — front" required>
                <FileChooser
                  file={files.national_id_front}
                  onChange={(f) => updateFile("national_id_front", f)}
                  required
                />
              </Field>
              <Field label="National ID — back" required>
                <FileChooser
                  file={files.national_id_back}
                  onChange={(f) => updateFile("national_id_back", f)}
                  required
                />
              </Field>
            </div>
          ) : (
            <Field label="Passport photo" required>
              <FileChooser
                file={files.passport_photo}
                onChange={(f) => updateFile("passport_photo", f)}
                required
              />
            </Field>
          )}
          <Field label="Selfie photo" required>
            <FileChooser
              file={files.selfie_photo}
              onChange={(f) => updateFile("selfie_photo", f)}
              required
            />
          </Field>

          <Field label="Notes">
            <Input value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Optional" />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
