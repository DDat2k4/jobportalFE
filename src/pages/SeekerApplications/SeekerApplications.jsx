import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getApplications, updateApplicationStatus } from "../../api/applicationApi";
import { getJobDetail } from "../../api/jobApi";
import { getUserId } from "../../utils/jwt";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./SeekerApplications.css";

const PAGE_SIZE = 10;
const FINAL_STATUSES = ["HIRED", "REJECTED", "CANCELED"];
const STATUSES = ["PENDING", "APPROVED", "INTERVIEW", "HIRED", "REJECTED", "CANCELED"];
// Map status -> label color class
const STATUS_TO_LABEL = {
  PENDING: "label-warning",
  APPROVED: "label-info",
  INTERVIEW: "label-primary",
  HIRED: "label-success",
  REJECTED: "label-danger",
  CANCELED: "label-default",
};
const getStatusLabelClass = (st) => `label ${STATUS_TO_LABEL[st] || "label-default"}`;

export default function SeekerApplications() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  // cache job titles by jobId
  const [jobTitleCache, setJobTitleCache] = useState({});

  const [toast, setToast] = useState({ show: false, text: "" });
  const toastTimerRef = useRef(null);

  // Confirm-cancel modal state
  const [confirmCancel, setConfirmCancel] = useState({
    open: false,
    appId: null,
    title: "",
    status: "",
    saving: false,
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / size)), [total, size]);
  const uid = getUserId();

  const showToast = (text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, text });
    toastTimerRef.current = setTimeout(() => setToast({ show: false, text: "" }), 2500);
  };
  useEffect(() => () => toastTimerRef.current && clearTimeout(toastTimerRef.current), []);

  const loadData = async () => {
    if (!uid) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    try {
      const res = await getApplications({
        page,
        size,
        userId: uid,
        ...(status ? { status } : {}),
        sortBy: "id",
        asc: false,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, size, status]);

  // After items load, fetch missing job titles by jobId
  useEffect(() => {
    const ids = Array.from(
      new Set(
        (items || [])
          .map((app) => app.jobId ?? app.job?.id)
          .filter((id) => typeof id === "number" || (typeof id === "string" && id !== ""))
      )
    );
    const missing = ids.filter((id) => !jobTitleCache[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const detail = await getJobDetail(id);
              const title = detail?.title ?? detail?.name ?? `Job #${id}`;
              return { id, title };
            } catch {
              return { id, title: `Job #${id}` };
            }
          })
        );
        if (!cancelled && results.length) {
          setJobTitleCache((prev) => {
            const next = { ...prev };
            results.forEach(({ id, title }) => { next[id] = title; });
            return next;
          });
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [items, jobTitleCache]);

  const canCancel = (st) => !FINAL_STATUSES.includes(st || "PENDING");

  // Open confirmation modal (English)
  const openCancelConfirm = (appId, title, currentStatus) => {
    if (!canCancel(currentStatus)) {
      showToast("Cannot cancel this application.");
      return;
    }
    setConfirmCancel({ open: true, appId, title, status: currentStatus, saving: false });
  };

  const closeCancelConfirm = () =>
    setConfirmCancel({ open: false, appId: null, title: "", status: "", saving: false });

  const doCancelConfirmed = async () => {
    const { appId } = confirmCancel;
    if (!appId) return;
    setConfirmCancel((c) => ({ ...c, saving: true }));
    try {
      await updateApplicationStatus(appId, { newStatus: "CANCELED" });
      setItems((prev) => prev.map((it) => (it.id === appId ? { ...it, status: "CANCELED" } : it)));
      showToast("Application canceled.");
      closeCancelConfirm();
    } catch (e) {
      showToast(e?.message || "Cancel failed");
      setConfirmCancel((c) => ({ ...c, saving: false }));
    }
  };

  return (
    <>
      <Header />

      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>My Applications</h2>
            <p>
              <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> My Applications
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {/* Filters */}
          <div className="search-form">
            <form className="row seeker-apps-search-form" onSubmit={(e) => e.preventDefault()}>
              <div className="col-md-6">
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-control"
                  value={size}
                  onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
                >
                  {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="widget-boxed">
            <div className="widget-boxed-header">
              <h4><i className="ti-briefcase padd-r-10"></i>{loading ? "Loading..." : `${total} applications`}</h4>
            </div>
            <div className="widget-boxed-body">
              <div className="table-responsive">
                <table className="table table-lg">
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Status</th>
                      <th>Feedback</th>
                      <th className="seeker-apps-action-column">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && !loading && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">No applications found.</td>
                      </tr>
                    )}
                    {items.map((app) => {
                      const appId = app.id ?? app.applicationId ?? "";
                      const jobId = app.jobId ?? app.job?.id ?? "";
                      const jobTitle = jobTitleCache[jobId] ?? app.job?.title ?? app.jobTitle ?? (jobId ? `Job #${jobId}` : "-");
                      const statusVal = app.status ?? "PENDING";
                      const feedback = app.feedback ?? "";
                      const isCancelable = canCancel(statusVal);
                      const cancelBtnClass = isCancelable ? "btn theme-btn btn-sm" : "btn btn-default btn-sm";
                      const cancelBtnStyle = isCancelable ? {} : { opacity: 0.5, cursor: "not-allowed" };

                      return (
                        <tr key={appId}>
                          <td>{jobId ? <a href={`/job-detail/${jobId}`}>{jobTitle}</a> : jobTitle}</td>
                          <td>
                            <span className={`${getStatusLabelClass(statusVal)} seeker-apps-status-label`}>{statusVal}</span>
                          </td>
                          <td>{feedback ? <span title={feedback}>{feedback}</span> : <em className="text-muted">—</em>}</td>
                          <td>
                            <button
                              type="button"
                              className={cancelBtnClass}
                              style={cancelBtnStyle}
                              disabled={!isCancelable}
                              onClick={() => openCancelConfirm(appId, jobTitle, statusVal)}
                              title="Cancel application"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="utf_flexbox_area padd-0 text-center">
                <div className="seeker-apps-pagination-container">
                  <ul className="pagination custom-pagination">
                    <li className={`page-item prev${page === 1 ? " disabled" : ""}`}>
                      <button
                        className="page-link"
                        aria-label="Previous"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
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
                      <button
                        className="page-link"
                        aria-label="Next"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || totalPages === 0}
                      >
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

      {toast.show && (
        <div className="jp-toast-container">
          <div className="jp-toast jp-toast-success">{toast.text}</div>
        </div>
      )}
      {confirmCancel.open && (
        <div className="modal seeker-apps-cancel-modal">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Cancellation</h5>
                <button type="button" className="btn-close" onClick={closeCancelConfirm} />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel your application{confirmCancel.title ? ` for "${confirmCancel.title}"` : ""}?</p>
                <p>This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={closeCancelConfirm} disabled={confirmCancel.saving}>No</button>
                <button type="button" className="btn btn-danger" onClick={doCancelConfirmed} disabled={confirmCancel.saving}>
                  {confirmCancel.saving ? "Cancelling..." : "Yes, cancel application"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}