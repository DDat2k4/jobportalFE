import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getIndustries, createIndustry, updateIndustry, deleteIndustry, getAllIndustries } from "../../api/industryApi";
import { getCareerRoles, createCareerRole, updateCareerRole, deleteCareerRole } from "../../api/careerRoleApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./IndustryManagement.css";

export default function IndustryManagement() {
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  const [qName, setQName] = useState("");

  // Industry modal / form
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [savingIndustry, setSavingIndustry] = useState(false);
  const [industryForm, setIndustryForm] = useState({ id: null, name: "", description: "" });
  const [industryError, setIndustryError] = useState("");

  // Career Role management modal
  const [showCareerRoleModal, setShowCareerRoleModal] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [careerRoles, setCareerRoles] = useState([]);
  const [careerRolesLoading, setCareerRolesLoading] = useState(false);
  const [careerRolePage, setCareerRolePage] = useState(1);
  const [careerRoleTotal, setCareerRoleTotal] = useState(0);
  const careerRoleTotalPages = useMemo(() => Math.max(1, Math.ceil(careerRoleTotal / 10)), [careerRoleTotal]);

  // Career Role form modal
  const [showCareerRoleForm, setShowCareerRoleForm] = useState(false);
  const [savingCareerRole, setSavingCareerRole] = useState(false);
  const [careerRoleForm, setCareerRoleForm] = useState({ id: null, name: "", description: "" });
  const [careerRoleError, setCareerRoleError] = useState("");

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("Confirm Delete");

  // Load industries
  const loadIndustries = async () => {
    setLoading(true);
    try {
      const res = await getIndustries({ name: qName || undefined, page, size });
      const payload = res ?? {};
      const items = payload.items ?? payload.data?.items ?? payload.data ?? [];
      const t = payload.total ?? payload.data?.total ?? (Array.isArray(items) ? items.length : 0);
      setIndustries(items || []);
      setTotal(Number(t) || 0);
    } catch (e) {
      console.warn("load industries failed", e);
      setIndustries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndustries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, qName]);

  // Industry CRUD
  const openCreateIndustry = () => {
    setIndustryForm({ id: null, name: "", description: "" });
    setIndustryError("");
    setShowIndustryModal(true);
  };

  const openEditIndustry = (industry) => {
    setIndustryForm({ id: industry.id ?? industry._id, name: industry.name || "", description: industry.description || "" });
    setIndustryError("");
    setShowIndustryModal(true);
  };

  const handleSaveIndustry = async (e) => {
    e?.preventDefault?.();
    setIndustryError("");
    if (!industryForm.name || !industryForm.name.trim()) {
      setIndustryError("Name is required");
      return;
    }
    setSavingIndustry(true);
    try {
      if (industryForm.id) {
        await updateIndustry(industryForm.id, { name: industryForm.name.trim(), description: industryForm.description || "" });
      } else {
        await createIndustry({ name: industryForm.name.trim(), description: industryForm.description || "" });
      }
      setShowIndustryModal(false);
      await loadIndustries();
    } catch (err) {
      setIndustryError(err?.message || (err?.response?.data?.message) || "Save failed");
    } finally {
      setSavingIndustry(false);
    }
  };

  const handleDeleteIndustry = (industry) => {
    const id = industry.id ?? industry._id;
    if (!id) return;
    setConfirmTitle("Delete Industry");
    setConfirmMessage(`Are you sure you want to delete industry "${industry.name}"? This will also affect related career roles.`);
    setConfirmAction(() => async () => {
      try {
        await deleteIndustry(id);
        if (industries.length === 1 && page > 1) setPage((p) => p - 1);
        else await loadIndustries();
        setShowConfirmModal(false);
      } catch (err) {
        alert(err?.message || "Delete failed");
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  // Career Role management
  const loadCareerRoles = async (industryId) => {
    setCareerRolesLoading(true);
    try {
      const res = await getCareerRoles({ industryId, page: careerRolePage, size: 8 });
      const payload = res ?? {};
      const items = payload.items ?? payload.data?.items ?? payload.data ?? [];
      const t = payload.total ?? payload.data?.total ?? (Array.isArray(items) ? items.length : 0);
      setCareerRoles(items || []);
      setCareerRoleTotal(Number(t) || 0);
    } catch (e) {
      console.warn("load career roles failed", e);
      setCareerRoles([]);
      setCareerRoleTotal(0);
    } finally {
      setCareerRolesLoading(false);
    }
  };

  const openManageCareerRoles = (industry) => {
    setSelectedIndustry(industry);
    setCareerRolePage(1);
    setShowCareerRoleModal(true);
    loadCareerRoles(industry.id);
  };

  useEffect(() => {
    if (selectedIndustry && showCareerRoleModal) {
      loadCareerRoles(selectedIndustry.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerRolePage]);

  // Career Role CRUD
  const openCreateCareerRole = () => {
    setCareerRoleForm({ id: null, name: "", description: "" });
    setCareerRoleError("");
    setShowCareerRoleForm(true);
  };

  const openEditCareerRole = (careerRole) => {
    setCareerRoleForm({ id: careerRole.id ?? careerRole._id, name: careerRole.name || "", description: careerRole.description || "" });
    setCareerRoleError("");
    setShowCareerRoleForm(true);
  };

  const handleSaveCareerRole = async (e) => {
    e?.preventDefault?.();
    setCareerRoleError("");
    if (!careerRoleForm.name || !careerRoleForm.name.trim()) {
      setCareerRoleError("Name is required");
      return;
    }
    setSavingCareerRole(true);
    try {
      const payload = { 
        name: careerRoleForm.name.trim(), 
        industryId: selectedIndustry.id,
        description: careerRoleForm.description || "" 
      };
      if (careerRoleForm.id) {
        await updateCareerRole(careerRoleForm.id, payload);
      } else {
        await createCareerRole(payload);
      }
      setShowCareerRoleForm(false);
      await loadCareerRoles(selectedIndustry.id);
    } catch (err) {
      setCareerRoleError(err?.message || (err?.response?.data?.message) || "Save failed");
    } finally {
      setSavingCareerRole(false);
    }
  };

  const handleDeleteCareerRole = (careerRole) => {
    const id = careerRole.id ?? careerRole._id;
    if (!id) return;
    setConfirmTitle("Delete Career Role");
    setConfirmMessage(`Are you sure you want to delete career role "${careerRole.name}"?`);
    setConfirmAction(() => async () => {
      try {
        await deleteCareerRole(id);
        if (careerRoles.length === 1 && careerRolePage > 1) setCareerRolePage((p) => p - 1);
        else await loadCareerRoles(selectedIndustry.id);
        setShowConfirmModal(false);
      } catch (err) {
        alert(err?.message || "Delete failed");
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Industry Management</h2>
            <p>
              <a href="/">Home</a> <i className="ti-angle-double-right"></i> Industry Management
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group im-inputGroup">
                <input
                  className="form-control im-searchInput"
                  placeholder="Search industry name..."
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(1);
                      loadIndustries();
                    }
                  }}
                />
                <span className="input-group-btn">
                  <button
                    type="button"
                    className="btn theme-btn im-searchBtn"
                    aria-label="Search"
                    onClick={() => { setPage(1); loadIndustries(); }}
                  >
                    <i className="ti-search"></i>
                  </button>
                </span>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <button className="btn theme-btn" onClick={openCreateIndustry}>+ New Industry</button>
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
                        <th className="im-colIndex">#</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th className="im-colActions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {industries.length === 0 ? (
                        <tr><td colSpan={4} className="text-center">No industries found.</td></tr>
                      ) : industries.map((industry, idx) => (
                        <tr key={industry.id ?? industry._id ?? idx}>
                          <td>{(page - 1) * size + idx + 1}</td>
                          <td>{industry.name}</td>
                          <td className="im-descCell">
                            {industry.description || "-"}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-info me-2" onClick={() => openManageCareerRoles(industry)}>
                              <i className="ti-briefcase"></i> Career Roles
                            </button>
                            <button className="btn btn-sm btn-default me-2" onClick={() => openEditIndustry(industry)}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteIndustry(industry)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* pagination */}
                  <div className="utf_flexbox_area padd-0 text-center">
                    <div className="im-paginationCenter">
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

                  {/* Confirmation Modal */}
                  {showConfirmModal && (
                    <div className="modal im-modalBackdrop" style={{zIndex: 1070}}>
                      <div className="modal-dialog modal-sm">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">{confirmTitle}</h5>
                            <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)} />
                          </div>
                          <div className="modal-body">
                            <p>{confirmMessage}</p>
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-default" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button type="button" className="btn btn-danger" onClick={confirmAction}>Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Industry modal */}
      {showIndustryModal && (
        <div className="modal im-modalBackdrop">
          <div className="modal-dialog modal-md">
            <form onSubmit={handleSaveIndustry} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{industryForm.id ? "Edit Industry" : "Create Industry"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowIndustryModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={industryForm.name}
                    onChange={(e) => setIndustryForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    value={industryForm.description}
                    onChange={(e) => setIndustryForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                {industryError && <div className="alert alert-danger">{industryError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowIndustryModal(false)} disabled={savingIndustry}>Cancel</button>
                <button type="submit" className="btn theme-btn" disabled={savingIndustry}>{savingIndustry ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Career Role Management Modal */}
      {showCareerRoleModal && selectedIndustry && (
        <div className="modal im-modalBackdrop">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Career Roles - {selectedIndustry.name}</h3>
                <button type="button" className="btn-close" onClick={() => setShowCareerRoleModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3 text-end">
                  <button className="btn btn-sm theme-btn" onClick={openCreateCareerRole}>+ Add Career Role</button>
                </div>
                {careerRolesLoading ? (
                  <div>Loading career roles...</div>
                ) : (
                  <>
                    <table className="table table-striped table-sm">
                      <thead>
                        <tr>
                          <th style={{width: '50px'}}>#</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th style={{width: '150px'}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {careerRoles.length === 0 ? (
                          <tr><td colSpan={4} className="text-center">No career roles found for this industry.</td></tr>
                        ) : careerRoles.map((cr, idx) => (
                          <tr key={cr.id ?? cr._id ?? idx}>
                            <td>{(careerRolePage - 1) * 10 + idx + 1}</td>
                            <td>{cr.name}</td>
                            <td className="im-descCell">{cr.description || "-"}</td>
                            <td>
                              <button className="btn btn-sm btn-default me-1" onClick={() => openEditCareerRole(cr)}>Edit</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteCareerRole(cr)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Career Role Pagination */}
                    {careerRoleTotalPages > 1 && (
                      <div className="utf_flexbox_area padd-0 text-center">
                        <div className="im-paginationCenter">
                          <ul className="pagination pagination-sm custom-pagination">
                            <li className={`page-item prev${careerRolePage === 1 ? " disabled" : ""}`}>
                              <button className="page-link" onClick={() => setCareerRolePage((p) => Math.max(1, p - 1))} disabled={careerRolePage === 1}>«</button>
                            </li>
                            {Array.from({ length: careerRoleTotalPages }, (_, i) => (
                              <li key={i+1} className={`page-item${careerRolePage === i+1 ? " active" : ""}`}>
                                <button className="page-link" onClick={() => setCareerRolePage(i+1)} disabled={careerRolePage === i+1}>{i+1}</button>
                              </li>
                            ))}
                            <li className={`page-item next${careerRolePage === careerRoleTotalPages ? " disabled" : ""}`}>
                              <button className="page-link" onClick={() => setCareerRolePage((p) => Math.min(careerRoleTotalPages, p + 1))} disabled={careerRolePage === careerRoleTotalPages}>»</button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Career Role Form Modal */}
      {showCareerRoleForm && selectedIndustry && (
        <div className="modal im-modalBackdrop" style={{zIndex: 1060}}>
          <div className="modal-dialog modal-md">
            <form onSubmit={handleSaveCareerRole} className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{careerRoleForm.id ? "Edit Career Role" : "Create Career Role"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCareerRoleForm(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Industry</label>
                  <input
                    className="form-control"
                    value={selectedIndustry.name}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={careerRoleForm.name}
                    onChange={(e) => setCareerRoleForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={careerRoleForm.description}
                    onChange={(e) => setCareerRoleForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                {careerRoleError && <div className="alert alert-danger">{careerRoleError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowCareerRoleForm(false)} disabled={savingCareerRole}>Cancel</button>
                <button type="submit" className="btn theme-btn" disabled={savingCareerRole}>{savingCareerRole ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
