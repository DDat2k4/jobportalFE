import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getSkills, createSkill, updateSkill, deleteSkill } from "../../api/skillApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./SkillManagement.css";

export default function SkillManagement() {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  const [qName, setQName] = useState("");

  // modal / form
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: null, name: "", type: "" });
  // update form to include new fields
  // const [form, setForm] = useState({ 
  //   id: null, 
  //   name: "", 
  //   type: "",
  //   normalizedName: "",
  //   difficulty: 1,
  //   aliases: [],
  //   description: ""
  // });

  const [error, setError] = useState("");

  // delete confirm
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null, name: "", saving: false, error: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getSkills({ name: qName || undefined, page, size });
      const payload = res ?? {};
      const items = payload.items ?? [];
      const t = Number(payload.total ?? (Array.isArray(items) ? items.length : 0));
      setSkills(items || []);
      setTotal(Number(t) || 0);
    } catch (e) {
      console.warn("load skills failed", e);
      setSkills([]);
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
    setForm({ id: null, name: "", type: "" });
    // updated:
    setForm({ 
      id: null, 
      name: "", 
      type: "",
      normalizedName: "",
      difficulty: 1,
      aliases: [],
      description: ""
    });
    setError("");
    setShowModal(true);
  };

  const openEdit = (s) => {
    setForm({ id: s.id ?? s._id, name: s.name || "", type: s.type || "" });
    // updated:
    setForm({ 
      id: s.id ?? s._id, 
      name: s.name || "", 
      type: s.type || "",
      normalizedName: s.normalizedName || "",
      difficulty: s.difficulty ?? 1,
      aliases: (Array.isArray(s.aliases) ? s.aliases : []),
      description: s.description || ""
    });
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
      const payload = { name: form.name.trim(), type: form.type || "" };
      if (form.id) {
        await updateSkill(form.id, payload);
      } else {
        await createSkill(payload);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    const id = s.id ?? s._id;
    if (!id) return;
    setConfirmDel({ open: true, id, name: s.name || "", saving: false, error: "" });
  };

  const closeDeleteConfirm = () => setConfirmDel((c) => ({ ...c, open: false, saving: false, error: "" }));

  const doDeleteConfirm = async () => {
    if (!confirmDel.id) return;
    try {
      setConfirmDel((c) => ({ ...c, saving: true, error: "" }));
      await deleteSkill(confirmDel.id);
      closeDeleteConfirm();
      // if last item on page removed, go to previous page
      if (skills.length === 1 && page > 1) setPage((p) => p - 1);
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
            <h2>Skill Management</h2>
            <p>
              <a href="/">Home</a> <i className="ti-angle-double-right"></i> Skill Management
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group skill-search-group">
                <input
                  className="form-control skill-search-input"
                  placeholder="Search by name..."
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
                    className="btn theme-btn skill-search-btn"
                    onClick={() => { setPage(1); load(); }}
                  >
                    <i className="ti-search"></i>
                  </button>
                </span>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <button className="btn theme-btn" onClick={openCreate}>+ New Skill</button>
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
                        <th className="skill-id-column">#</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Difficulty</th>
                        <th>Description</th>
                        <th>Created At</th>
                        <th className="skill-actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skills.length === 0 ? (
                        <tr><td colSpan={7} className="text-center">No skills found.</td></tr>
                      ) : skills.map((s, idx) => (
                        <tr key={s.id ?? s._id ?? idx}>
                          <td>{(page - 1) * size + idx + 1}</td>
                          <td>{s.name}</td>
                          <td className="skill-type-cell">{s.type || "-"}</td>
                          <td>
                            {s.difficulty === 1 ? "Easy" : s.difficulty === 2 ? "Medium" : s.difficulty === 3 ? "Hard" : "-"}
                          </td>
                          <td className="skill-description-cell">
                            {s.description || "-"}
                          </td>
                          <td className="skill-created-cell">{s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}</td>
                          <td className="skill-actions-column">
                            <button className="btn btn-sm btn-default skill-edit-btn" onClick={() => openEdit(s)}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="utf_flexbox_area padd-0 text-center">
                    <div className="skill-pagination-container">
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
        <div className="modal skill-delete-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Skill</h5>
                <button type="button" className="btn-close" onClick={closeDeleteConfirm} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete skill "{confirmDel.name}"? This action cannot be undone.</p>
                {confirmDel.error && <div className="alert alert-danger skill-delete-modal-error">{confirmDel.error}</div>}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal skill-form-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <form onSubmit={handleSave} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{form.id ? "Edit Skill" : "Create Skill"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <input className="form-control" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Normalized Name</label>
                  <input className="form-control" placeholder="e.g., spring boot, reactjs" value={form.normalizedName} onChange={(e) => setForm((f) => ({ ...f, normalizedName: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Difficulty</label>
                  <select className="form-control" value={form.difficulty ?? 1} onChange={(e) => setForm((f) => ({ ...f, difficulty: Number(e.target.value) }))}>
                    <option value={1}>Easy</option>
                    <option value={2}>Medium</option>
                    <option value={3}>Hard</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Aliases (comma-separated)</label>
                  <input 
                    className="form-control" 
                    placeholder="e.g., js, react, spa" 
                    value={Array.isArray(form.aliases) ? form.aliases.join(", ") : ""} 
                    onChange={(e) => setForm((f) => ({ 
                      ...f, 
                      aliases: e.target.value.split(",").map((a) => a.trim()).filter(Boolean)
                    }))} 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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
