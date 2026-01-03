import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getRoles } from "../../api/roleApi";
import { getPermissions } from "../../api/permissionApi";
import {
	getRolePermissions,
	replaceRolePermissions,
} from "../../api/rolePermissionApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./RolePermissionManagement.css";

export default function RolePermissionManagement() {
	const [roles, setRoles] = useState([]);
	const [rolesLoading, setRolesLoading] = useState(false);
	const [selectedRoleId, setSelectedRoleId] = useState(null);

	const [permissions, setPermissions] = useState([]);
	const [permLoading, setPermLoading] = useState(false);

	const [assigned, setAssigned] = useState(new Set()); // permission id set for selected role
	const [assignLoading, setAssignLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	const [roleSearch, setRoleSearch] = useState("");
	const [permSearch, setPermSearch] = useState("");

	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const toastTimer = useRef(null);

	const showSuccess = (msg) => {
		setSuccess(msg);
		if (toastTimer.current) clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setSuccess(""), 2000);
	};
	useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

	// Load roles
	const loadRoles = async () => {
		setRolesLoading(true);
		setError("");
		try {
			const res = await getRoles({ page: 1, limit: 1000 });
			const items = res?.items ?? [];
			setRoles(items);
			// auto-select if none
			if (!selectedRoleId && items.length > 0) setSelectedRoleId(items[0].id ?? items[0]._id ?? null);
		} catch (e) {
			setError(e?.message || "Failed to load roles");
			setRoles([]);
		} finally {
			setRolesLoading(false);
		}
	};

	// Load all permissions
	const loadPermissions = async () => {
		setPermLoading(true);
		setError("");
		try {
			const res = await getPermissions({ page: 1, limit: 2000 });
			const items = res?.items ?? [];
			setPermissions(items);
		} catch (e) {
			setError(e?.message || "Failed to load permissions");
			setPermissions([]);
		} finally {
			setPermLoading(false);
		}
	};

	// Load assigned permissions for selected role
	const loadAssigned = async (roleId) => {
		if (!roleId) return;
		setAssignLoading(true);
		setError("");
		try {
			const list = await getRolePermissions(roleId);
			const ids = new Set((list || []).map((p) => p.id ?? p._id).filter(Boolean));
			setAssigned(ids);
		} catch (e) {
			setError(e?.message || "Failed to load role permissions");
			setAssigned(new Set());
		} finally {
			setAssignLoading(false);
		}
	};

	useEffect(() => {
		loadRoles();
		loadPermissions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (selectedRoleId) loadAssigned(selectedRoleId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedRoleId]);

	// Derived filtered lists
	const filteredRoles = useMemo(() => {
		const q = roleSearch.trim().toLowerCase();
		if (!q) return roles;
		return roles.filter((r) => `${r.name || ""}`.toLowerCase().includes(q));
	}, [roles, roleSearch]);

	const filteredPermissions = useMemo(() => {
		const q = permSearch.trim().toLowerCase();
		if (!q) return permissions;
		return permissions.filter((p) =>
			`${p.code || ""} ${p.description || ""}`.toLowerCase().includes(q)
		);
	}, [permissions, permSearch]);

	const togglePermission = (id) => {
		setAssigned((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const selectAllFiltered = () => {
		setAssigned((prev) => {
			const next = new Set(prev);
			filteredPermissions.forEach((p) => {
				const id = p.id ?? p._id;
				if (id) next.add(id);
			});
			return next;
		});
	};
	const deselectAllFiltered = () => {
		setAssigned((prev) => {
			const next = new Set(prev);
			filteredPermissions.forEach((p) => {
				const id = p.id ?? p._id;
				if (id) next.delete(id);
			});
			return next;
		});
	};

	const handleSave = async () => {
		if (!selectedRoleId) return;
		setSaving(true);
		setError("");
		try {
			await replaceRolePermissions(selectedRoleId, Array.from(assigned));
			showSuccess("Saved successfully");
		} catch (e) {
			setError(e?.message || "Save failed");
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<Header />
			<div className="page-title">
				<div className="container">
					<div className="page-caption">
						<h2>Role Permission Management</h2>
						<p>
							<a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> Role Permission Management
						</p>
					</div>
				</div>
			</div>
			{/* Quick links */}
			<div className="container role-perm-quick-links">
				<div className="text-right">
					<a className="btn btn-default btn-sm mrg-5" href="/roles">Manage Roles</a>
					<a className="btn btn-default btn-sm mrg-5" href="/permissions">Manage Permissions</a>
				</div>
			</div>
			<section className="padd-top-80 padd-bot-80">
				<div className="container">
					{error && <div className="alert alert-danger">{error}</div>}
					{success && <div className="alert alert-success">{success}</div>}

					<div className="row">
						{/* Roles sidebar */}
						<div className="col-md-4">
							<div className="panel panel-default">
								<div className="panel-heading">
									<div className="role-perm-panel-header-flex">
										<strong>Roles</strong>
										<button
											type="button"
											className="btn btn-xs btn-default"
											onClick={loadRoles}
											disabled={rolesLoading}
										>
											{rolesLoading ? "Loading..." : "Reload"}
										</button>
									</div>
								</div>
								<div className="panel-body">
									<div className="mb-2">
										<input
											className="form-control"
											placeholder="Search role..."
											value={roleSearch}
											onChange={(e) => setRoleSearch(e.target.value)}
										/>
									</div>
									<div className="role-perm-roles-list">
										{filteredRoles.length === 0 ? (
											<div className="p-2 text-center">No roles</div>
										) : filteredRoles.map((r) => {
											const id = r.id ?? r._id;
											const active = id === selectedRoleId;
											return (
												<div
													key={id}
													onClick={() => setSelectedRoleId(id)}
													className={`p-2 role-perm-role-item ${active ? "bg-info" : ""}`}
													title={r.description || ""}
												>
													<strong>{r.name}</strong>
													{r.description && <div className="role-perm-role-description">{r.description}</div>}
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>

						{/* Permissions content */}
						<div className="col-md-8">
							<div className="panel panel-default">
								<div className="panel-heading">
									<div className="role-perm-panel-header-flex">
										<strong>Permissions</strong>
										<div className="role-perm-assigned-count">
											Assigned: {assigned.size} / {permissions.length}
										</div>
									</div>
								</div>
								<div className="panel-body">
									<div className="row role-perm-search-row">
										<div className="col-sm-8">
											<input
												className="form-control"
												placeholder="Search permissions (code/description)..."
												value={permSearch}
												onChange={(e) => setPermSearch(e.target.value)}
											/>
										</div>
										<div className="col-sm-4 text-right">
											<button type="button" className="btn btn-default btn-sm mrg-5" onClick={selectAllFiltered} disabled={permLoading || assignLoading}>
												Select All (filtered)
											</button>
											<button type="button" className="btn btn-default btn-sm mrg-5" onClick={deselectAllFiltered} disabled={permLoading || assignLoading}>
												Deselect All (filtered)
											</button>
										</div>
									</div>

									{(!selectedRoleId) && <div className="alert alert-info">Select a role to manage permissions.</div>}

									<div className="role-perm-permissions-container">
										{permLoading || assignLoading ? (
											<div className="p-3">Loading...</div>
										) : filteredPermissions.length === 0 ? (
											<div className="p-3 text-center">No permissions</div>
										) : (
											<table className="table table-striped role-perm-table">
												<thead>
													<tr>
														<th className="role-perm-checkbox-column">#</th>
														<th className="role-perm-toggle-column"></th>
														<th>Code</th>
														<th>Description</th>
													</tr>
												</thead>
												<tbody>
													{filteredPermissions.map((p, idx) => {
														const id = p.id ?? p._id;
														const checked = assigned.has(id);
														return (
															<tr key={id}>
																<td>{idx + 1}</td>
																<td>
																	<input
																		type="checkbox"
																		checked={checked}
																		onChange={() => togglePermission(id)}
																		disabled={!selectedRoleId}
																		aria-label={`toggle ${p.code}`}
																	/>
																</td>
																<td><code>{p.code}</code></td>
																<td>{p.description || "-"}</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										)}
									</div>

									<div className="text-right role-perm-save-actions">
										<button
											type="button"
											className="btn theme-btn"
											onClick={handleSave}
											disabled={!selectedRoleId || saving || permLoading || assignLoading}
										>
											{saving ? "Saving..." : "Save Changes"}
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>

				</div>
			</section>

			<Footer />
		</>
	);
}
