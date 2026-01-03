import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { searchUsers, getUserById, updateUser, deleteUser, activateUser, deactivateUser, lockUser, unlockUser } from "../../api/userApi";
import { getRoles } from "../../api/roleApi";
import { getUserRoles, replaceUserRoles } from "../../api/userRoleApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./UserManagement.css";

export default function UserManagement() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  const [q, setQ] = useState("");
  const [role, setRole] = useState(""); // "", "EMPLOYER", "JOB_SEEKER", "ADMIN"
  const [status, setStatus] = useState(""); // "", "1"(ACTIVE), "0"(INACTIVE), "3"(LOCKED)
  // lock role via URL ?role=
  const [lockedRole, setLockedRole] = useState(false);

  // Manage Roles modal state
  const [manageOpen, setManageOpen] = useState(false);
  const [manageUser, setManageUser] = useState(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [allRoles, setAllRoles] = useState([]);
  const [assignedRoleIds, setAssignedRoleIds] = useState(new Set());
  const [savingRoles, setSavingRoles] = useState(false);
  const [manageErr, setManageErr] = useState("");

  // Edit Account modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [editForm, setEditForm] = useState({ id: null, username: "", email: "", active: true, newPassword: "" });

  // Confirm modal (Lock/Delete)
  const [confirmState, setConfirmState] = useState({
    open: false,
    type: null, // 'lock' | 'delete'
    user: null,
    hours: "1",
    saving: false,
    error: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const activeParam = status === "" ? undefined : Number(status);
      const rolesParam = role ? [role] : undefined;
      const query = q ? { name: q, email: q, username: q } : {};
      const res = await searchUsers({
        page,
        size,
        active: activeParam,
        roles: rolesParam,
        sortBy: "id",
        asc: false,
        ...query,
      });
      const items = res?.items ?? [];
      const t = Number(res?.total ?? (Array.isArray(items) ? items.length : 0));
      setUsers(items);
      setTotal(t);
    } catch (e) {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, role, status]);

  const onSearch = () => {
    setPage(1);
    load();
  };

  const renderRole = (u) => {
    // direct single role fields first
    if (u.role || u.roleName || u.type) {
      const val = u.role || u.roleName || u.type;
      return String(val).toUpperCase().replace(/_/g, " ");
    }
    // array of roles (can be strings or objects)
    if (Array.isArray(u.roles) && u.roles.length) {
      const labels = u.roles
        .map((it) => {
          if (typeof it === "string") return it; // e.g., "ADMIN"
          if (it && typeof it === "object") return it.code || it.name || "";
          return "";
        })
        .filter((s) => !!s && String(s).trim().length > 0)
        .map((s) => String(s).toUpperCase().replace(/_/g, " "));
      if (labels.length) return labels.join(", ");
    }
    // authorities fallback
    if (Array.isArray(u.authorities) && u.authorities.length) {
      const labels = u.authorities
        .map((a) => String(a || "").replace(/^ROLE_/, ""))
        .filter((s) => !!s && s.trim().length > 0)
        .map((s) => s.toUpperCase().replace(/_/g, " "));
      if (labels.length) return labels.join(", ");
    }
    return "-";
  };
  const renderStatus = (u) => {
    if (typeof u.active === "number") {
      if (u.active === 1) return "ACTIVE";
      if (u.active === 0) return "INACTIVE";
      if (u.active === 3) return "LOCKED";
    }
    const boolActive =
      typeof u.active === "boolean" ? u.active :
      typeof u.enabled === "boolean" ? u.enabled :
      undefined;
    if (boolActive !== undefined) return boolActive ? "ACTIVE" : "INACTIVE";
    // string/number fallback
    const s = u.status ?? u.state ?? "";
    if (typeof s === "number") return s === 1 ? "ACTIVE" : s === 3 ? "LOCKED" : "INACTIVE";
    if (typeof s === "string" && s) return s.toUpperCase();
    return "-";
  };

  const openManageRoles = async (u) => {
    setManageUser(u);
    setManageErr("");
    setManageOpen(true);
    setRolesLoading(true);
    try {
      const [roleBox, userRoles] = await Promise.all([
        getRoles({ page: 1, limit: 1000 }),
        getUserRoles(u.id ?? u._id),
      ]);
      const list = roleBox?.items ?? [];
      setAllRoles(list);
      const ids = new Set((userRoles || []).map((r) => r.id ?? r._id).filter(Boolean));
      setAssignedRoleIds(ids);
    } catch (e) {
      setManageErr(e?.message || "Failed to load roles");
      setAllRoles([]);
      setAssignedRoleIds(new Set());
    } finally {
      setRolesLoading(false);
    }
  };

  const closeManageRoles = () => {
    setManageOpen(false);
    setManageUser(null);
    setAllRoles([]);
    setAssignedRoleIds(new Set());
    setManageErr("");
    setSavingRoles(false);
  };

  const toggleAssigned = (roleId) => {
    setAssignedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const saveRoles = async () => {
    if (!manageUser) return;
    setSavingRoles(true);
    setManageErr("");
    try {
      await replaceUserRoles(manageUser.id ?? manageUser._id, Array.from(assignedRoleIds));
      closeManageRoles();
      await load();
    } catch (e) {
      setManageErr(e?.message || "Failed to save roles");
    } finally {
      setSavingRoles(false);
    }
  };

  // Open Edit Account modal
  const openEditAccount = async (u) => {
    const id = u.id ?? u._id;
    setEditErr("");
    try {
      const data = await getUserById(id);
      const src = data?.data ?? data ?? u;
      setEditForm({
        id,
        username: src.username || "",
        email: src.email || "",
        active: (typeof src.active === "number" ? src.active === 1 : true),
        newPassword: "",
      });
    } catch {
      setEditForm({
        id,
        username: u.username || "",
        email: u.email || "",
        active: (typeof u.active === "number" ? u.active === 1 : true),
        newPassword: "",
      });
    } finally {
      setEditOpen(true);
    }
  };
  const closeEditAccount = () => {
    setEditOpen(false);
    setEditSaving(false);
    setEditErr("");
    setEditForm({ id: null, username: "", email: "", active: true, newPassword: "" });
  };
  const saveEditAccount = async (e) => {
    e?.preventDefault?.();
    if (!editForm.id) return;
    setEditErr("");
    setEditSaving(true);
    try {
      await updateUser(editForm.id, {
        email: editForm.email?.trim(),
        passwordHash: editForm.newPassword ? editForm.newPassword : undefined,
        active: !!editForm.active,
      });
      closeEditAccount();
      await load();
    } catch (err) {
      setEditErr(err?.message || "Update failed");
      setEditSaving(false);
    }
  };

  const changeUserStatus = async (u, action) => {
    const id = u.id ?? u._id;
    try {
      if (action === "activate") {
        await activateUser(id);
      } else if (action === "deactivate") {
        await deactivateUser(id);
      } else if (action === "unlock") {
        await unlockUser(id);
      } else if (action === "lock") {
        // open popup instead of inline
        openLockConfirm(u);
        return;
      }
      await load();
    } catch (err) {
      alert(err?.message || "Change status failed");
    }
  };

  // Open Lock confirm modal
  const openLockConfirm = (u) => {
    setConfirmState({
      open: true,
      type: "lock",
      user: u,
      hours: "1",
      saving: false,
      error: "",
    });
  };

  // Open Delete confirm modal
  const openDeleteConfirm = (u) => {
    setConfirmState({
      open: true,
      type: "delete",
      user: u,
      hours: "",
      saving: false,
      error: "",
    });
  };

  // For backward compatibility with existing callsite
  const confirmDeleteUser = (u) => openDeleteConfirm(u);

  const closeConfirm = () =>
    setConfirmState((c) => ({ ...c, open: false, saving: false, error: "" }));

  const doConfirm = async () => {
    setConfirmState((c) => ({ ...c, saving: true, error: "" }));
    const { type, user, hours } = confirmState;
    const id = user?.id ?? user?._id;
    try {
      if (type === "delete") {
        await deleteUser(id);
        closeConfirm();
        // If last item on page removed, go back a page; otherwise reload
        if (users.length === 1 && page > 1) setPage((p) => p - 1);
        else await load();
      } else if (type === "lock") {
        const h = Number(hours);
        const until =
          Number.isFinite(h) && h > 0
            ? new Date(Date.now() + h * 60 * 60 * 1000).toISOString()
            : undefined; // backend default if empty/invalid
        await lockUser(id, until);
        closeConfirm();
        await load();
      }
    } catch (err) {
      setConfirmState((c) => ({ ...c, saving: false, error: err?.message || "Action failed" }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const preset = (qs.get("role") || "").toUpperCase();
      if (["EMPLOYER", "JOB_SEEKER", "ADMIN"].includes(preset)) {
        setRole(preset);
        setLockedRole(true);
        setPage(1);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleLabel = useMemo(() => {
    switch (role) {
      case "EMPLOYER": return "Employers";
      case "JOB_SEEKER": return "Job Seekers";
      case "ADMIN": return "Admins";
      default: return "Users";
    }
  }, [role]);

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>{lockedRole ? `${roleLabel} Management` : "User Management"}</h2>
            <p>
              <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> {lockedRole ? `${roleLabel} Management` : "User Management"}
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row mb-3">
            <div className="col-md-7">
              <div className="input-group user-search-group">
                <input
                  className="form-control user-search-input"
                  placeholder="Search name/email..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                  }}
                />
                <span className="input-group-btn">
                  <button
                    type="button"
                    className="btn theme-btn user-search-btn"
                    onClick={onSearch}
                  >
                    <i className="ti-search"></i>
                  </button>
                </span>
              </div>
            </div>
            <div className="col-md-5 text-end">
              {!lockedRole ? (
                <select
                  className="form-control user-role-select"
                  value={role}
                  onChange={(e) => { setRole(e.target.value); setPage(1); }}
                >
                  <option value="">All Roles</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="JOB_SEEKER">Job Seeker</option>
                  <option value="ADMIN">Admin</option>
                </select>
              ) : (
                <span className="label label-default user-role-locked-label">
                  {roleLabel}
                </span>
              )}
              <select
                className="form-control user-status-select"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
                <option value="3">Locked</option>
              </select>
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
                        <th className="user-id-column">#</th>
                        <th className="user-name-column">Name</th>
                        <th className="user-email-column">Email</th>
                        <th className="user-role-column">Role</th>
                        <th className="user-status-column">Status</th>
                        <th className="user-actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan={6} className="text-center">No users found.</td></tr>
                      ) : users.map((u, idx) => {
                        const id = u.id ?? u._id ?? idx;
                        const name = u.fullName ?? u.name ?? u.username ?? "-";
                        const email = u.email ?? u.mail ?? "-";
                        return (
                          <tr key={id}>
                            <td>{(page - 1) * size + idx + 1}</td>
                            <td>{name}</td>
                            <td className="user-email-cell">
                              {email}
                            </td>
                            <td>{renderRole(u)}</td>
                            <td>{renderStatus(u)}</td>
                            <td className="user-actions-column">
                              <div className="btn-group user-status-dropdown">
                                <button type="button" className="btn btn-sm btn-default dropdown-toggle" data-bs-toggle="dropdown">Set Status</button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  <li><button className="dropdown-item" onClick={() => changeUserStatus(u, "activate")}>Active</button></li>
                                  <li><button className="dropdown-item" onClick={() => changeUserStatus(u, "deactivate")}>Inactive</button></li>
                                  <li><button className="dropdown-item" onClick={() => openLockConfirm(u)}>Lock…</button></li>
                                  <li><button className="dropdown-item" onClick={() => changeUserStatus(u, "unlock")}>Unlock</button></li>
                                </ul>
                              </div>
                              <a
                                className="btn btn-sm btn-default user-edit-profile-btn"
                                href={`/edit-user-profile/${id}`}
                              >
                                Edit Profile
                              </a>
                              <button
                                type="button"
                                className="btn btn-sm btn-default user-edit-account-btn"
                                onClick={() => openEditAccount(u)}
                              >
                                Edit Account
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-default user-manage-roles-btn"
                                onClick={() => openManageRoles(u)}
                              >
                                Manage Roles
                              </button>
                              <button type="button" className="btn btn-sm btn-danger" onClick={() => confirmDeleteUser(u)}>Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="utf_flexbox_area padd-0 text-center">
                    <div className="user-pagination-container">
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

      {/* Edit Account Modal */}
      {editOpen && (
        <div className="modal user-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <form className="modal-content" onSubmit={saveEditAccount}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Account</h5>
                <button type="button" className="btn-close" onClick={closeEditAccount} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input className="form-control" value={editForm.username} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password (optional)</label>
                  <input type="password" className="form-control" value={editForm.newPassword} onChange={(e) => setEditForm((f) => ({ ...f, newPassword: e.target.value }))} />
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="accActive" checked={!!editForm.active} onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))} />
                  <label className="form-check-label" htmlFor="accActive">Active</label>
                </div>
                {editErr && <div className="alert alert-danger user-modal-error">{editErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={closeEditAccount} disabled={editSaving}>Cancel</button>
                <button type="submit" className="btn theme-btn" disabled={editSaving}>{editSaving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Roles Modal */}
      {manageOpen && (
        <div className="modal user-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Manage Roles {manageUser?.fullName ? `— ${manageUser.fullName}` : ""}</h5>
                <button type="button" className="btn-close" onClick={closeManageRoles} />
              </div>
              <div className="modal-body">
                {rolesLoading ? (
                  <div>Loading...</div>
                ) : allRoles.length === 0 ? (
                  <div className="alert alert-info">No roles available.</div>
                ) : (
                  <div className="user-roles-list">
                    {allRoles.map((r) => {
                      const rid = r.id ?? r._id;
                      return (
                        <label key={rid} className="user-roles-list-item">
                          <input
                            type="checkbox"
                            checked={assignedRoleIds.has(rid)}
                            onChange={() => toggleAssigned(rid)}
                          />
                          <span><strong>{r.name || "-"}</strong></span>
                          {r.description && <small className="user-roles-list-desc">— {r.description}</small>}
                        </label>
                      );
                    })}
                  </div>
                )}
                {manageErr && <div className="alert alert-danger user-modal-error">{manageErr}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={closeManageRoles} disabled={savingRoles}>Cancel</button>
                <button type="button" className="btn theme-btn" onClick={saveRoles} disabled={savingRoles || rolesLoading || !manageUser}>
                  {savingRoles ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal for Lock/Delete */}
      {confirmState.open && (
        <div className="modal user-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {confirmState.type === "delete" ? "Delete User" : "Lock User"}
                </h5>
                <button type="button" className="btn-close" onClick={closeConfirm} />
              </div>
              <div className="modal-body">
                {confirmState.type === "delete" ? (
                  <p>
                    Are you sure you want to delete this user? This action cannot be undone.
                  </p>
                ) : (
                  <>
                    <p>Lock duration in hours. Leave empty to use server default.</p>
                    <input
                      type="number"
                      min="1"
                      placeholder="Hours"
                      className="form-control"
                      value={confirmState.hours}
                      onChange={(e) => setConfirmState((c) => ({ ...c, hours: e.target.value }))}
                    />
                  </>
                )}
                {confirmState.error && (
                  <div className="alert alert-danger user-modal-error">
                    {confirmState.error}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={closeConfirm} disabled={confirmState.saving}>
                  Cancel
                </button>
                {confirmState.type === "delete" ? (
                  <button type="button" className="btn btn-danger" onClick={doConfirm} disabled={confirmState.saving}>
                    {confirmState.saving ? "Deleting..." : "DELETE"}
                  </button>
                ) : (
                  <button type="button" className="btn theme-btn" onClick={doConfirm} disabled={confirmState.saving}>
                    {confirmState.saving ? "Locking..." : "LOCK"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}