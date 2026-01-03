import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getPermissions, createPermission, updatePermission, deletePermission } from "../../api/permissionApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./PermissionManagement.css";

export default function PermissionManagement() {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);
  const [q, setQ] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, code: "", description: "" });
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null, code: "", saving: false, error: "" });
  const load = async () => {
    setLoading(true);
    try {
      const res = await getPermissions({ page, limit: size, filters: { ...(q ? { keyword: q } : {}) } });
      const payload = res ?? {};
      const items = payload.items ?? payload.data?.items ?? payload.data ?? [];
      const t = payload.total ?? payload.data?.total ?? (Array.isArray(items) ? items.length : 0);
      setPermissions(items || []);
      setTotal(Number(t) || 0);
    } catch (e) {
      console.warn("load permissions failed", e);
      setPermissions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, q]);

  const openCreate = () => {
    setForm({ id: null, code: "", description: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({ id: p.id ?? p._id, code: p.code || "", description: p.description || "" });
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!form.code || !form.code.trim()) {
      setError("Code is required");
      return;
    }
    setSaving(true);
    try {
      const payload = { code: form.code.trim(), description: form.description || "" };
      if (form.id) {
        await updatePermission(form.id, payload);
      } else {
        await createPermission(payload);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    const id = p.id ?? p._id;
    if (!id) return;
    setConfirmDel({ open: true, id, code: p.code || "", saving: false, error: "" });
  };

  const closeDeleteConfirm = () => setConfirmDel((c) => ({ ...c, open: false, saving: false, error: "" }));

  const doDeleteConfirm = async () => {
    if (!confirmDel.id) return;
    try {
      setConfirmDel((c) => ({ ...c, saving: true, error: "" }));
      await deletePermission(confirmDel.id);
      closeDeleteConfirm();
      if (permissions.length === 1 && page > 1) setPage((p) => p - 1);
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
            <h2>Permission Management</h2>
            <p>
              <a href="/">Home</a> <i className="ti-angle-double-right"></i> Permission Management
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group permission-search-group">
                <input
                  className="form-control permission-search-input"
                  placeholder="Search by code or description..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
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
                    className="btn theme-btn permission-search-btn"
                    onClick={() => { setPage(1); load(); }}
                  >
                    <i className="ti-search"></i>
                  </button>
                </span>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <a className="btn btn-default mrg-5" href="/roles">Manage Roles</a>
              <button className="btn theme-btn" onClick={openCreate}>+ New Permission</button>
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
                        <th className="permission-id-column">#</th>
                        <th>Code</th>
                        <th>Description</th>
                        <th className="permission-actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.length === 0 ? (
                        <tr><td colSpan={4} className="text-center">No permissions found.</td></tr>
                      ) : permissions.map((p, idx) => (
                        <tr key={p.id ?? p._id ?? idx}>
                          <td>{(page - 1) * size + idx + 1}</td>
                          <td><code>{p.code}</code></td>
                          <td className="permission-description-cell">
                            {p.description || "-"}
                          </td>
                          <td className="permission-actions-column">
                            <button
                              className="btn btn-sm btn-default permission-edit-btn"
                              onClick={() => openEdit(p)}
                            >
                              Edit
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="utf_flexbox_area padd-0 text-center">
                    <div className="permission-pagination-container">
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
      {confirmDel.open && (
        <div className="modal permission-delete-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Permission</h5>
                <button type="button" className="btn-close" onClick={closeDeleteConfirm} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete permission "{confirmDel.code}"? This action cannot be undone.</p>
                {confirmDel.error && <div className="alert alert-danger permission-delete-modal-error">{confirmDel.error}</div>}
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
        <div className="modal permission-form-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <form onSubmit={handleSave} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{form.id ? "Edit Permission" : "Create Permission"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Code</label>
                  <input
                    className="form-control"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
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
