import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getApplications, updateApplicationStatus } from "../../api/applicationApi";
import { getJobDetail } from "../../api/jobApi";
// CSS
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./EmployerApplications.css";

const PAGE_SIZE = 10;
// Backend statuses + final states
const STATUSES = ["PENDING", "APPROVED", "INTERVIEW", "HIRED", "REJECTED", "CANCELED"];
// Allowed transitions (match backend)
const ALLOWED = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
  CANCELED: [],
};
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

export default function EmployerApplications() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  // cache job titles by jobId
  const [jobTitleCache, setJobTitleCache] = useState({});

  // feedback per row
  const [feedbackMap, setFeedbackMap] = useState({});

  // toast
  const [toast, setToast] = useState({ show: false, text: "" });
  const toastTimerRef = useRef(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / size)), [total, size]);

  const showToast = (text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, text });
    toastTimerRef.current = setTimeout(() => setToast({ show: false, text: "" }), 2500);
  };
  useEffect(() => () => toastTimerRef.current && clearTimeout(toastTimerRef.current), []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getApplications({
        page,
        size,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const onChangeStatus = async (appId, currentStatus, newStatus) => {
    if (!newStatus || newStatus === currentStatus) return;
    const allowed = ALLOWED[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      showToast(`Not allowed: ${currentStatus} → ${newStatus}`);
      return;
    }
    const fb = (feedbackMap[appId] || "").trim();
    if (!fb) {
      showToast("Feedback is required.");
      // try focusing feedback input
      const el = document.getElementById(`fb-${appId}`);
      if (el) el.focus();
      return;
    }
    try {
      await updateApplicationStatus(appId, { newStatus, feedback: fb });
      setItems((prev) => prev.map((it) => (it.id === appId ? { ...it, status: newStatus, feedback: fb } : it)));
      setFeedbackMap((m) => ({ ...m, [appId]: "" })); // clear after success
      showToast("Updated status.");
    } catch (e) {
      showToast(e?.message || "Update failed");
    }
  };

  return (
    <>
      <Header />

      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Applications</h2>
            <p>
              <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> Applications
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {/* Filters */}
          <div className="search-form">
            <form className="row employer-apps-search-form" onSubmit={(e) => e.preventDefault()}>
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
                      <th>CV</th>
                      <th>Status / Update</th>
                      <th className="employer-apps-action-column">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted">No applications found.</td>
                      </tr>
                    )}
                    {items.map((app) => {
                      const appId = app.id ?? app.applicationId ?? "";
                      const jobId = app.jobId ?? app.job?.id ?? "";
                      const jobTitle = jobTitleCache[jobId] ?? app.job?.title ?? app.jobTitle ?? (jobId ? `Job #${jobId}` : "-");
                      const cvId = app.cvId ?? app.cv?.id ?? "";
                      const statusVal = app.status ?? "PENDING";
                      const allowedNext = ALLOWED[statusVal] || [];
                      return (
                        <tr key={appId}>
                          <td>{jobId ? <a href={`/job-detail/${jobId}`}>{jobTitle}</a> : jobTitle}</td>
                          <td>{cvId ? <a href={`/cv-preview/${cvId}`} className="job-browse-btn">View CV</a> : "-"}</td>
                          <td>
                            <div className="employer-apps-status-container">
                              <span className={`${getStatusLabelClass(statusVal)} employer-apps-status-label`}>{statusVal}</span>
                              {allowedNext.length > 0 && (
                                <>
                                  <select
                                    className="form-control"
                                    value=""
                                    onChange={(e) => onChangeStatus(appId, statusVal, e.target.value)}
                                    title="Select next status (feedback required)"
                                  >
                                    <option value="" disabled>Change to…</option>
                                    {allowedNext.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <input
                                    id={`fb-${appId}`}
                                    type="text"
                                    className="form-control employer-apps-feedback-input"
                                    placeholder="Feedback (required)"
                                    value={feedbackMap[appId] || ""}
                                    onChange={(e) => setFeedbackMap((m) => ({ ...m, [appId]: e.target.value }))}
                                    required
                                  />
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            {jobId ? (
                              <a href={`/job-detail/${jobId}`} className="btn btn-default btn-sm">View Job</a>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="utf_flexbox_area padd-0 text-center">
                <div className="employer-apps-pagination-container">
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

      <Footer />
    </>
  );
}
