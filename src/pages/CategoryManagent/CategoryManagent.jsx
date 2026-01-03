import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../../api/categoryApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./CategoryManagent.css";

export default function CategoryManagement() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
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

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCategories({ name: qName || undefined, page, size });
      // support multiple response shapes
      const payload = res ?? {};
      const items = payload.items ?? payload.data?.items ?? payload.data ?? [];
      const t = payload.total ?? payload.data?.total ?? (Array.isArray(items) ? items.length : 0);
      setCategories(items || []);
      setTotal(Number(t) || 0);
    } catch (e) {
      console.warn("load categories failed", e);
      setCategories([]);
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

  const openEdit = (c) => {
    setForm({ id: c.id ?? c._id, name: c.name || "", description: c.description || "" });
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
        await updateCategory(form.id, { name: form.name.trim(), description: form.description || "" });
      } else {
        await createCategory({ name: form.name.trim(), description: form.description || "" });
      }
      setShowModal(false);
      // reload current page (keep page)
      await load();
    } catch (err) {
      setError(err?.message || (err?.response?.data?.message) || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    const id = c.id ?? c._id;
    if (!id) return;
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await deleteCategory(id);
      // If last item on page deleted and page >1, go to previous page
      if (categories.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (err) {
      alert(err?.message || "Delete failed");
    }
  };

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Category Management</h2>
            <p>
              <a href="/">Home</a> <i className="ti-angle-double-right"></i> Category Management
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group cm-inputGroup">
                <input
                  className="form-control cm-searchInput"
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
                    className="btn theme-btn cm-searchBtn"
                    aria-label="Search"
                    onClick={() => { setPage(1); load(); }}
                  >
                    <i className="ti-search"></i>
                  </button>
                </span>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <button className="btn theme-btn" onClick={openCreate}>+ New Category</button>
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
                        <th className="cm-colIndex">#</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th className="cm-colActions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.length === 0 ? (
                        <tr><td colSpan={4} className="text-center">No categories found.</td></tr>
                      ) : categories.map((c, idx) => (
                        <tr key={c.id ?? c._id ?? idx}>
                          <td>{(page - 1) * size + idx + 1}</td>
                          <td>{c.name}</td>
                          <td className="cm-descCell">
                            {c.description || "-"}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-default me-2" onClick={() => openEdit(c)}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* pagination */}
                  <div className="utf_flexbox_area padd-0 text-center">
                    <div className="cm-paginationCenter">
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

      {/* Simple modal (React-controlled) */}
      {showModal && (
        <div className="modal cm-modalBackdrop">
          <div className="modal-dialog modal-md">
            <form onSubmit={handleSave} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{form.id ? "Edit Category" : "Create Category"}</h5>
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
                    rows={6}
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
