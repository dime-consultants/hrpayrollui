import { useState } from "react";
import { Navigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
} from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { endpoints } from "../lib/api.js";
import { useFetch } from "../lib/useFetch.js";
import { formatDateTime } from "../lib/format.js";
import "./Advertisements.css";

const emptyForm = {
  parent: "",
  title: "",
  description: "",
  starts_at: "",
  location: "",
  price_label: "",
  is_active: true,
  image: null,
};

function inputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function AdvertisementForm({
  form,
  parentPosts,
  editing,
  saving,
  error,
  onChange,
  onSubmit,
}) {
  return (
    <form
      id="advertisement-form"
      onSubmit={onSubmit}
      className="advertisement-form"
    >
      {error && <Alert>{error}</Alert>}
      <div className="advertisement-form-grid">
        <Field label="Post title" required>
          <Input
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            required
            placeholder="e.g. Annual HR Conference"
          />
        </Field>
        <Field label="Date and time" required>
          <Input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => onChange("starts_at", e.target.value)}
            required
          />
        </Field>
      </div>
      <Field label="Description" required>
        <textarea
          className="advertisement-textarea"
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          required
          maxLength={500}
          rows={4}
          placeholder="Share the important details with your team."
        />
      </Field>
      <div className="advertisement-form-grid">
        <Field label="Location">
          <Input
            value={form.location}
            onChange={(e) => onChange("location", e.target.value)}
            placeholder="Venue or online"
          />
        </Field>
        <Field label="Price or call to action">
          <Input
            value={form.price_label}
            onChange={(e) => onChange("price_label", e.target.value)}
            placeholder="FREE or Starting KES 2,500"
          />
        </Field>
      </div>
      <Field label="Parent post (optional)">
        <select
          className="advertisement-select"
          value={form.parent}
          onChange={(e) => onChange("parent", e.target.value)}
        >
          <option value="">Standalone post</option>
          {parentPosts.map((post) => (
            <option key={post.id} value={post.id}>
              {post.title}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label={editing ? "Replace image (optional)" : "Post image"}
        required={!editing}
      >
        <input
          className="advertisement-file"
          type="file"
          accept="image/*"
          required={!editing}
          onChange={(e) => onChange("image", e.target.files?.[0] || null)}
        />
      </Field>
      <label className="advertisement-checkbox">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => onChange("is_active", e.target.checked)}
        />
        <span>Visible on user dashboards</span>
      </label>
    </form>
  );
}

export default function Advertisements() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch(
    () => endpoints.advertisements(true),
    [],
  );
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [msg, setMsg] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  if (!user?.is_superuser) return <Navigate to="/dashboard" replace />;

  const posts = Array.isArray(data) ? data : data?.results || [];
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  function openCreate(parentId = "") {
    setEditing(null);
    setForm({ ...emptyForm, parent: parentId });
    setFormError("");
    setOpen(true);
  }

  function openEdit(post) {
    setEditing(post);
    setForm({
      parent: post.parent || "",
      title: post.title,
      description: post.description,
      starts_at: inputDate(post.starts_at),
      location: post.location || "",
      price_label: post.price_label || "",
      is_active: post.is_active,
      image: null,
    });
    setFormError("");
    setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const body = new FormData();
    body.append("title", form.title);
    if (form.parent) body.append("parent", form.parent);
    body.append("description", form.description);
    body.append("starts_at", new Date(form.starts_at).toISOString());
    body.append("location", form.location);
    body.append("price_label", form.price_label);
    body.append("is_active", String(form.is_active));
    if (form.image) body.append("image", form.image);
    try {
      if (editing) await endpoints.updateAdvertisement(editing.id, body);
      else await endpoints.createAdvertisement(body);
      setOpen(false);
      setMsg({
        variant: "success",
        text: editing ? "Advertisement updated." : "Advertisement published.",
      });
      refetch();
    } catch (err) {
      setFormError(err.message || "Could not save advertisement.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await endpoints.deleteAdvertisement(deleteTarget.id);
      setDeleteTarget(null);
      setMsg({ variant: "success", text: "Advertisement deleted." });
      refetch();
    } catch (err) {
      setMsg({
        variant: "error",
        text: err.message || "Could not delete advertisement.",
      });
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Advertisements"
        subtitle="Publish announcements and events to every dashboard."
        actions={<Button onClick={openCreate}>Create post</Button>}
      />
      {msg && <Alert variant={msg.variant}>{msg.text}</Alert>}
      <Card className="advertisement-management-intro">
        <div>
          <p className="eyebrow">SUPER ADMIN CONTROL</p>
          <h2>Dashboard announcements</h2>
          <p>
            Keep the team informed with polished, image-led posts that appear on
            the dashboard.
          </p>
        </div>
        <strong>{posts.length} total posts</strong>
      </Card>
      {error && <Alert>{error.message}</Alert>}
      <div className="advertisement-admin-grid">
        {loading ? (
          <p>Loading advertisements...</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="advertisement-admin-card">
              <img src={post.image_url} alt={post.title} />
              <div className="advertisement-admin-card-body">
                <div className="advertisement-admin-card-topline">
                  <Badge variant={post.is_active ? "green" : "slate"}>
                    {post.is_active ? "Visible" : "Hidden"}
                  </Badge>
                  <span>{formatDateTime(post.starts_at)}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.description}</p>
                <div className="advertisement-admin-actions">
                  {!post.parent && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openCreate(post.id)}
                    >
                      Add subpost
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(post)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget(post)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
      {!loading && !posts.length && (
        <div className="advertisement-empty">
          No posts yet. Create the first dashboard announcement.
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit advertisement" : "Create advertisement"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="advertisement-form" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Publish post"}
            </Button>
          </>
        }
      >
        <AdvertisementForm
          form={form}
          parentPosts={posts.filter(
            (post) => post.id !== editing?.id && !post.parent,
          )}
          editing={editing}
          saving={saving}
          error={formError}
          onChange={update}
          onSubmit={save}
        />
      </Modal>
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete advertisement"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove}>
              Delete post
            </Button>
          </>
        }
      >
        <p>
          Delete <strong>{deleteTarget?.title}</strong>? This removes it from
          every dashboard.
        </p>
      </Modal>
    </div>
  );
}
