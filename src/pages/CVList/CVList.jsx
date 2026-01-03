import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../auth/useAuth";
import { getUserId as getUserIdFromToken } from "../../utils/jwt";
import { getUserCvs, deleteUserCv, setDefaultUserCv } from "../../api/userCvApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./CVList.css";

const PAGE_SIZE = 8;

const CVList = () => {
    const { user } = useAuth();
    const uid = useMemo(() => {
        const id = user?.id ?? user?.userId ?? getUserIdFromToken();
        return Number(id) || 0;
    }, [user]);

    const [page, setPage] = useState(1);
    const [limit] = useState(PAGE_SIZE);
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });
    const [confirmDel, setConfirmDel] = useState({ open: false, id: null, title: "", saving: false, error: "" });

    const totalPages = Math.ceil(total / limit);

    const unwrapList = (res) => {
        const box = res?.data ?? res;
        if (Array.isArray(box)) return { items: box, total: box.length };
        const items = box?.items ?? box?.data?.items ?? [];
        const total = box?.total ?? box?.data?.total ?? items.length ?? 0;
        return { items, total };
    };

    const handleAuthError = (e) => {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
            setMsg({ type: "error", text: "Your session expired. Please login again." });
            setTimeout(() => (window.location.href = "/login"), 600);
            return true;
        }
        return false;
    };

    const load = async () => {
        if (!uid) return;
        setLoading(true);
        setMsg({ type: "", text: "" });
        try {
            const res = await getUserCvs({ page, size: limit, userId: uid, sortBy: "updatedAt", asc: false });
            const { items, total } = unwrapList(res);
            setItems(items);
            setTotal(total);
        } catch (e) {
            if (handleAuthError(e)) return;
            setItems([]);
            setTotal(0);
            setMsg({ type: "error", text: e?.message || "Load CVs failed" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [uid, page, limit]);

    const onSetDefault = async (id) => {
        try {
            await setDefaultUserCv(id);
            setMsg({ type: "success", text: "Set as default." });
            await load();
        } catch (e) {
            if (handleAuthError(e)) return;
            setMsg({ type: "error", text: e?.message || "Set default failed" });
        }
    };

    // open delete confirm popup (replaces window.confirm)
    const onDelete = (id, title = "") => {
        setConfirmDel({ open: true, id, title, saving: false, error: "" });
    };

    const closeDeleteConfirm = () => setConfirmDel((c) => ({ ...c, open: false, saving: false, error: "" }));

    const doDeleteConfirm = async () => {
        if (!confirmDel.id) return;
        try {
            setConfirmDel((c) => ({ ...c, saving: true, error: "" }));
            await deleteUserCv(confirmDel.id);
            setMsg({ type: "success", text: "Deleted." });
            closeDeleteConfirm();
            const nextCount = items.length - 1;
            if (nextCount <= 0 && page > 1) setPage((p) => p - 1);
            else await load();
        } catch (e) {
            if (handleAuthError(e)) return;
            setConfirmDel((c) => ({ ...c, saving: false, error: e?.message || "Delete failed" }));
        }
    };

    return (
        <>
            <Header />
            <div className="page-title">
                <div className="container">
                    <div className="page-caption">
                        <h2>My CVs</h2>
                        <p>
                            <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> CVs
                        </p>
                    </div>
                </div>
            </div>

            <section className="padd-top-80 padd-bot-80">
                <div className="container">
                    <div className="panel panel-default">
                        <div className="panel-heading panel-heading-flex">
                            <div className="utf_flexbox_area cvlist-header-flexbox">
                                <h4 className="cvlist-header-title">
                                    {loading ? "Loading..." : `Total: ${total}`}
                                </h4>
                            </div>
                            {msg.text ? (
                                <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-danger"}`} role="alert">
                                    {msg.text}
                                </div>
                            ) : null}
                            <div className="cvlist-header-actions">
                                <a className="btn theme-btn btn-sm" href="/create-cv">+ Create New</a>
                            </div>
                        </div>
                        <div className="panel-body">
                            {items.length === 0 ? (
                                <div className="text-center text-muted">No CVs found.</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th className="cvlist-table-number">#</th>
                                                <th>Title</th>
                                                <th>Template</th>
                                                <th>Default</th>
                                                <th>Updated</th>
                                                <th className="cvlist-table-actions">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((cv, idx) => (
                                                <tr key={cv.id}>
                                                    <td>{(page - 1) * limit + idx + 1}</td>
                                                    <td><strong>{cv.title || "Untitled CV"}</strong></td>
                                                    <td>{cv.templateCode || "DEFAULT"}</td>
                                                    <td>{cv.isDefault ? <span className="label label-success">Default</span> : <span className="label label-default">No</span>}</td>
                                                    <td><span className="text-muted">{cv.updatedAt ? new Date(cv.updatedAt).toLocaleString() : "-"}</span></td>
                                                    <td className="cvlist-table-actions">
                                                        <a className="btn btn-sm btn-default mrg-r-5" href={`/cv-preview/${cv.id}`}>Preview</a>
                                                        <a className="btn btn-sm btn-default mrg-r-5" href={`/create-cv?id=${cv.id}`}>Edit</a>
                                                        {!cv.isDefault && (
                                                            <button className="btn btn-sm btn-success mrg-r-5" onClick={() => onSetDefault(cv.id)}>
                                                                Set Default
                                                            </button>
                                                        )}
                                                        <button className="btn btn-sm btn-danger" onClick={() => onDelete(cv.id, cv.title)}>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            <div className="utf_flexbox_area padd-0 text-center">
                                <div className="cvlist-pagination-container">
                                    <ul className="pagination custom-pagination">
                                        <li className={`page-item prev${page === 1 ? " disabled" : ""}`}>
                                            <button className="page-link" aria-label="Previous" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                                                <span aria-hidden="true">«</span>
                                            </button>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <li key={i + 1} className={`page-item${page === i + 1 ? " active" : ""}`}>
                                                <button className="page-link" onClick={() => setPage(i + 1)} disabled={page === i + 1}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item next${page === totalPages || totalPages === 0 ? " disabled" : ""}`}>
                                            <button className="page-link" aria-label="Next" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
                                                <span aria-hidden="true">»</span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Delete Confirm Modal */}
            {confirmDel.open && (
                <div className="modal cvlist-delete-modal">
                    <div className="modal-dialog modal-dialog-centered modal-md">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Delete CV</h5>
                                <button type="button" className="btn-close" onClick={closeDeleteConfirm} />
                            </div>
                            <div className="modal-body">
                                <p>
                                    Are you sure you want to delete
                                    {confirmDel.title ? ` "${confirmDel.title}"` : ""}? This action cannot be undone.
                                </p>
                                {confirmDel.error && <div className="alert alert-danger cvlist-delete-modal-error">{confirmDel.error}</div>}
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
        </>
    );
};

export default CVList;