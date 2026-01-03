import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getRoles, createRole, updateRole, deleteRole } from "../../api/roleApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./RoleManagement.css";

export default function RoleManagement() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  const [qName, setQName] = useState("");

  // modal / form
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", description: "" });
  const [error, setError] = useState("");

  // delete confirm
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null, name: "", saving: false, error: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getRoles({ page, limit: size, filters: { ...(qName ? { name: qName } : {}) } });
      const payload = res ?? {};
      const items = payload.items ?? payload.data?.items ?? payload.data ?? [];
      const t = payload.total ?? payload.data?.total ?? (Array.isArray(items) ? items.length : 0);
      setRoles(items || []);
      setTotal(Number(t) || 0);
    } catch (e) {
      console.warn("load roles failed", e);
      setRoles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, qName]);

  const openCreate = () => {
    setForm({ id: null, name: "", description: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (r) => {
    setForm({ id: r.id ?? r._id, name: r.name || "", description: r.description || "" });
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!form.name || !form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await updateRole(form.id, { name: form.name.trim(), description: form.description || "" });
      } else {
        await createRole({ name: form.name.trim(), description: form.description || "" });
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r) => {
    const id = r.id ?? r._id;
    if (!id) return;
    setConfirmDel({ open: true, id, name: r.name || "", saving: false, error: "" });
  };

  const closeDeleteConfirm = () => setConfirmDel((c) => ({ ...c, open: false, saving: false, error: "" }));

  const doDeleteConfirm = async () => {
    if (!confirmDel.id) return;
    try {
      setConfirmDel((c) => ({ ...c, saving: true, error: "" }));
      await deleteRole(confirmDel.id);
      closeDeleteConfirm();
      if (roles.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (err) {
      setConfirmDel((c) => ({ ...c, saving: false, error: err?.message || "Delete failed" }));
    }
  };

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Role Management</h2>
            <p>
              <a href="/">Home</a> <i className="ti-angle-double-right"></i> Role Management
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group role-search-group">
                <input
                  className="form-control role-search-input"
                  placeholder="Search name..."
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(1);
                      load();
                    }
                  }}
                />
                <span className="input-group-btn">
                  <button
                    type="button"
                    className="btn theme-btn role-search-btn"
                    onClick={() => { setPage(1); load(); }}
                  >
                    <i className="ti-search"></i>
                  </button>
                </span>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <a className="btn btn-default mrg-5" href="/permissions">Manage Permissions</a>
              <button className="btn theme-btn" onClick={openCreate}>+ New Role</button>
            </div>
          </div>

          <div className="panel panel-default">
            <div className="panel-body">
              {loading ? (
                <div>Loading...</div>
              ) : (
                <>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th className="role-id-column">#</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th className="role-actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.length === 0 ? (
                        <tr><td colSpan={4} className="text-center">No roles found.</td></tr>
                      ) : roles.map((r, idx) => (
                        <tr key={r.id ?? r._id ?? idx}>
                          <td>{(page - 1) * size + idx + 1}</td>
                          <td>{r.name}</td>
                          <td className="role-description-cell">
                            {r.description || "-"}
                          </td>
                          <td className="role-actions-column">
                            <a
                              className="btn btn-sm btn-default role-permissions-btn"
                              href={`/roles-permissions?roleId=${r.id ?? r._id}`}
                            >
                              Permissions
                            </a>
                            <button
                              className="btn btn-sm btn-default role-edit-btn"
                              onClick={() => openEdit(r)}
                            >
                              Edit
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="utf_flexbox_area padd-0 text-center">
                    <div className="role-pagination-container">
                      <ul className="pagination custom-pagination">
                        <li className={`page-item prev${page === 1 ? " disabled" : ""}`}>
                          <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>«</button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => (
                          <li key={i+1} className={`page-item${page === i+1 ? " active" : ""}`}>
                            <button className="page-link" onClick={() => setPage(i+1)} disabled={page === i+1}>{i+1}</button>
                          </li>
                        ))}
                        <li className={`page-item next${page === totalPages ? " disabled" : ""}`}>
                          <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>»</button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Delete Confirm Modal */}
      {confirmDel.open && (
        <div className="modal role-delete-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Role</h5>
                <button type="button" className="btn-close" onClick={closeDeleteConfirm} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete role "{confirmDel.name}"? This action cannot be undone.</p>
                {confirmDel.error && <div className="alert alert-danger role-delete-modal-error">{confirmDel.error}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={closeDeleteConfirm} disabled={confirmDel.saving}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={doDeleteConfirm} disabled={confirmDel.saving}>
                  {confirmDel.saving ? "Deleting..." : "DELETE"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal role-form-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <form onSubmit={handleSave} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{form.id ? "Edit Role" : "Create Role"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn theme-btn" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}