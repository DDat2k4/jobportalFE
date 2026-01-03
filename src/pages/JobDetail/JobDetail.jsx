import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getJobDetail } from "../../api/jobApi";
import { getCompanyFull } from "../../api/companyApi";
import { createApplication } from "../../api/applicationApi";
import { getUserId } from "../../utils/jwt";
import { getDefaultUserCv, getUserCvs } from "../../api/userCvApi";
import { getSkills as getSkillList } from "../../api/skillApi";

import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./JobDetail.css";

function getIdFromUrl() {
    // support: /job-detail/:id, ?id=, ?jobId=
    const qs = new URLSearchParams(window.location.search);
    const qid = qs.get("id") ?? qs.get("jobId");
    if (qid && !Number.isNaN(Number(qid))) return Number(qid);
    const parts = window.location.pathname.split("/").filter(Boolean);
    // e.g., /job-detail/123 or /jobs/job-detail/123
    const maybeId = parts[parts.length - 1];
    const num = Number(maybeId);
    return Number.isNaN(num) ? null : num;
}

function getInitials(name) {
    if (!name) return "?";
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    const init = (first + last).toUpperCase();
    return init || (String(name)[0] || "?").toUpperCase();
}

function getSocialIcon(platform) {
    const p = String(platform || "").toLowerCase();
    if (p.includes("facebook")) return "fa fa-facebook facebook-cl";
    if (p.includes("linkedin")) return "fa fa-linkedin linkedin-cl";
    if (p.includes("x") || p.includes("twitter")) return "fa fa-twitter twitter-cl";
    if (p.includes("instagram")) return "fa fa-instagram instagram-cl";
    if (p.includes("youtube")) return "fa fa-youtube-play youtube-cl";
    if (p.includes("github")) return "fa fa-github";
    return "fa fa-globe";
}

function buildMapSrc(addr) {
    if (!addr) return "";
    const q = encodeURIComponent(String(addr));
    return `https://www.google.com/maps?q=${q}&output=embed`;
}

export default function JobDetail() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState(null);
    const [company, setCompany] = useState(null);
    const [error, setError] = useState("");
    const [applying, setApplying] = useState(false);
    const [showApply, setShowApply] = useState(false);
    const [cvLoading, setCvLoading] = useState(false);
    const [cvItems, setCvItems] = useState([]);
    const [selectedCvId, setSelectedCvId] = useState(null);
    const [coverLetter, setCoverLetter] = useState("");
    const [applyErr, setApplyErr] = useState("");
    const [toast, setToast] = useState({ show: false, text: "" });
    const [toastTimer, setToastTimer] = useState(null);
    const [skillMap, setSkillMap] = useState({}); // id -> name
    const [showCompanyModal, setShowCompanyModal] = useState(false);

    const jobId = useMemo(() => getIdFromUrl(), []);

    useEffect(() => {
        let cancelled = false;
        if (!jobId) {
            window.location.replace("/browse-job");
            return;
        }
        (async () => {
            try {
                const res = await getJobDetail(jobId);
                const data = res?.data ?? res;
                if (cancelled) return;
                setJob(data || null);
                if (data?.companyId) {
                    try {
                        const full = await getCompanyFull(data.companyId);
                        const normalized = full?.company
                            ? {
                                ...full.company,
                                email: full.address?.email ?? full.company?.email ?? "",
                                phone: full.address?.phone ?? full.address?.landline ?? "",
                                address: full.address ?? null,
                                socials: Array.isArray(full.socials) ? full.socials : [],
                            }
                            : null;
                        if (!cancelled) setCompany(normalized || null);
                    } catch {
                        /* ignore company error */
                    }
                }
            } catch (e) {
                if (!cancelled) setError("Failed to load job");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [jobId]);

    // load skills once to map skillId -> name for display
    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await getSkillList({ page: 1, size: 500 });
          const items = res?.items ?? (Array.isArray(res) ? res : []);
          if (cancelled) return;
          const map = {};
          (items || []).forEach((s) => {
            const id = s.id ?? s._id;
            const name = s.name ?? s.title ?? null;
            if (id != null && name) map[String(id)] = name;
          });
          setSkillMap(map);
        } catch {
          // ignore skill load failure
        }
      })();
      return () => { cancelled = true; };
    }, []);

    const title = job?.title ?? "Job Detail";
    const companyName = company?.name ?? job?.companyName ?? job?.company?.name ?? "Company";
    const logo = company?.logoUrl ?? job?.company?.logoUrl ?? null;
    const salaryRange = job?.salaryRange ?? "";
    const type = job?.type ?? "Full-time";
    const deadline = job?.deadline ?? "";
    const location = job?.location ?? "";
    const requirements = job?.requirements ?? job?.requirement ?? "";
    const description = job?.description ?? "";
    const jobCode = job?.code ?? job?.jobCode ?? job?.id ?? "";
    const email =
      company?.email ??
      job?.company?.email ??
      job?.contactEmail ??
      job?.hrEmail ??
      job?.email ??
      "";
    const phone =
      company?.phone ??
      job?.company?.phone ??
      job?.contactPhone ??
      job?.hrPhone ??
      job?.phone ??
      "";

    // Open apply modal: load user's CVs, preselect default or first
    const openApply = async () => {
      const uid = getUserId();
      if (!uid) {
        window.location.href = "/login";
        return;
      }
      setApplyErr("");
      setCoverLetter("");
      setSelectedCvId(null);
      setCvItems([]);
      setShowApply(true);
      setCvLoading(true);
      try {
        const res = await getUserCvs({ userId: Number(uid), page: 1, size: 100, sortBy: "updatedAt", asc: false });
        const box = res?.data ?? res;
        const items = box?.items ?? (Array.isArray(box) ? box : []) ?? [];
        setCvItems(items);
        let defId = items.find((i) => i.isDefault)?.id || null;
        if (!defId) {
          try {
            const dres = await getDefaultUserCv(Number(uid));
            const d = dres?.data ?? dres;
            defId = d?.id ?? d?.cv?.id ?? null;
          } catch {}
        }
        setSelectedCvId(defId || (items[0]?.id ?? null));
      } catch (e) {
        setApplyErr(e?.message || "Failed to load CVs");
      } finally {
        setCvLoading(false);
      }
    };

    const closeApply = () => {
      setShowApply(false);
      setApplyErr("");
      setCvItems([]);
      setSelectedCvId(null);
      setCoverLetter("");
    };

    const openCompanyModal = () => {
      if (company) {
        setShowCompanyModal(true);
      }
    };

    const closeCompanyModal = () => {
      setShowCompanyModal(false);
    };

    const showToast = (text) => {
      if (toastTimer) clearTimeout(toastTimer);
      setToast({ show: true, text });
      const t = setTimeout(() => setToast({ show: false, text: "" }), 2500);
      setToastTimer(t);
    };
    useEffect(() => {
      return () => {
        if (toastTimer) clearTimeout(toastTimer);
      };
    }, [toastTimer]);

    const submitApply = async () => {
      const uid = getUserId();
      if (!uid) {
        window.location.href = "/login";
        return;
      }
      if (!selectedCvId) {
        setApplyErr("Please select a CV.");
        return;
      }
      try {
        setApplying(true);
        await createApplication({
          jobId,
          seekerId: Number(uid),
          cvId: selectedCvId,
          ...(coverLetter.trim() ? { coverLetter: coverLetter.trim() } : {}),
        });
        closeApply();
        showToast("Applied successfully.");
      } catch (e) {
        setApplyErr(e?.message || "Apply failed");
      } finally {
        setApplying(false);
      }
    };

    useEffect(() => {
      if (showApply || showCompanyModal) document.body.classList.add("modal-open");
      else document.body.classList.remove("modal-open");
      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          if (showApply) closeApply();
          if (showCompanyModal) closeCompanyModal();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.classList.remove("modal-open");
        window.removeEventListener("keydown", onKey);
      };
    }, [showApply, showCompanyModal]);

    return (
        <>
            <Header />

            <div className="page-title">
                <div className="container">
                    <div className="page-caption">
                        <h2>{loading ? "Loading..." : title}</h2>
                        <p>
                            <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> Job Detail
                        </p>
                    </div>
                </div>
            </div>

            <section className="padd-top-80 padd-bot-60">
                <div className="container">
                    {error ? (
                        <div className="alert alert-danger">{error}</div>
                    ) : (
                        <div className="row">
                            <div className="col-md-8 col-sm-7">
                                <div className="detail-wrapper">
                                    <div className="detail-wrapper-body">
                                        <div className="row">
                                            <div className="col-md-4 text-center user_profile_img">
                                                <div className="job-detail-logo-container">
                                                    {logo ? (
                                                        <img
                                                            src={logo}
                                                            alt={companyName}
                                                            className="job-detail-logo-img"
                                                        />
                                                    ) : (
                                                        <div
                                                            className="job-detail-logo-initials"
                                                            aria-label="company-initials"
                                                        >
                                                            {getInitials(companyName)}
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="meg-0 job-detail-title">
                                                  <a 
                                                    href="#" 
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      openCompanyModal();
                                                    }}
                                                    style={{ cursor: company ? "pointer" : "default", textDecoration: "none" }}
                                                  >
                                                    {companyName}
                                                  </a>
                                                </h4>
                                                <span>{location}</span>
                                                {email && (
                                                  <div className="job-detail-contact-item">
                                                    <a href={`mailto:${email}`}>{email}</a>
                                                  </div>
                                                )}
                                                {phone && (
                                                  <div className="job-detail-contact-item-phone">
                                                    {phone}
                                                  </div>
                                                )}
                                                <div className="text-center job-detail-apply-btn-container">
                                                  <button
                                                    type="button"
                                                    className="btn-job theme-btn job-apply"
                                                    onClick={openApply}
                                                    disabled={applying}
                                                  >
                                                    Apply Now
                                                  </button>
                                                </div>
                                            </div>
                                            <div className="col-md-8 user_job_detail">
                                                {salaryRange && (
                                                    <div className="col-sm-12 mrg-bot-10">
                                                        <i className="ti-credit-card padd-r-10"></i>{salaryRange}
                                                    </div>
                                                )}
                                                {email && (
                                                    <div className="col-sm-12 mrg-bot-10">
                                                        <i className="ti-email padd-r-10"></i>
                                                        <a href={`mailto:${email}`}>{email}</a>
                                                    </div>
                                                )}
                                                {phone && (
                                                    <div className="col-sm-12 mrg-bot-10">
                                                        <i className="ti-mobile padd-r-10"></i>{phone}
                                                    </div>
                                                )}
                                                <div className="col-sm-12 mrg-bot-10">
                                                    <i className="ti-calendar padd-r-10"></i><span className="full-type">{type}</span>
                                                </div>
                                                {deadline && (
                                                    <div className="col-sm-12 mrg-bot-10">
                                                        <i className="ti-time padd-r-10"></i>Deadline: {deadline}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {description && (
                                    <div className="detail-wrapper">
                                        <div className="detail-wrapper-header">
                                            <h4>Job Description</h4>
                                        </div>
                                        <div className="detail-wrapper-body">
                                            <p className="job-detail-description-text">{description}</p>
                                        </div>
                                    </div>
                                )}

                                {requirements && (
                                    <div className="detail-wrapper">
                                        <div className="detail-wrapper-header">
                                            <h4>Requirements</h4>
                                        </div>
                                        <div className="detail-wrapper-body">
                                            <div className="job-detail-requirements-text">{requirements}</div>
                                        </div>
                                    </div>
                                )}
                                {(
                                    (job?.requiredEducation && job.requiredEducation !== "NONE") ||
                                    typeof job?.requiredExperienceYears === "number"
                                ) && (
                                    <div className="detail-wrapper">
                                        <div className="detail-wrapper-header">
                                            <h4>Qualifications</h4>
                                        </div>
                                        <div className="detail-wrapper-body job-detail-qualifications-container">
                                            {job?.requiredEducation && job.requiredEducation !== "NONE" && (
                                                <div><strong>Education:</strong> {String(job.requiredEducation).replace(/_/g, " ")}</div>
                                            )}
                                            {typeof job?.requiredExperienceYears === "number" && (
                                                <div><strong>Experience:</strong> {job.requiredExperienceYears} year{job.requiredExperienceYears === 1 ? "" : "s"}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Skills: show skill tags similar to BrowseJob */}
                                {Array.isArray(job?.skills) && job.skills.length > 0 && (
                                    <div className="detail-wrapper">
                                        <div className="detail-wrapper-header">
                                            <h4>Skills</h4>
                                        </div>
                                        <div className="detail-wrapper-body">
                                            <div className="job-detail-skills-container">
                                                {job.skills.map((s, i) => {
                                                    let label = "-";
                                                    if (s == null) label = "-";
                                                    else if (typeof s === "number") {
                                                      // prefer mapped name
                                                      label = skillMap[String(s)] ?? `#${s}`;
                                                    } else if (typeof s === "string") {
                                                      if (/^\d+$/.test(s)) label = skillMap[s] ?? `#${s}`;
                                                      else label = s;
                                                    } else if (typeof s === "object") {
                                                      const sid = s.skillId ?? s.id ?? s._id;
                                                      if (sid != null) label = skillMap[String(sid)] ?? (s.name ?? s.title ?? `#${sid}`);
                                                      else label = s.name ?? s.title ?? s.skillName ?? JSON.stringify(s);
                                                    } else label = String(s);
                                                     return (
                                                         <span key={i} className="skill-tag job-detail-skill-tag">
                                                             {label}
                                                         </span>
                                                     );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {location && (
                                    <div className="detail-wrapper">
                                        <div className="detail-wrapper-header">
                                            <h4>Location</h4>
                                        </div>
                                        <div className="detail-wrapper-body">
                                            <p className="job-detail-location-text">{location}</p>
                                            <div className="job-detail-map-container">
                                                <iframe
                                                    title="job-location-map-main"
                                                    src={buildMapSrc(location)}
                                                    width="100%"
                                                    height="320"
                                                    className="job-detail-map-iframe"
                                                    allowFullScreen
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="col-md-4 col-sm-5">
                                <div className="sidebar">
                                    <div className="widget-boxed">
                                        <div className="widget-boxed-header">
                                            <h4><i className="ti-briefcase padd-r-10"></i>Overview</h4>
                                        </div>
                                        <div className="widget-boxed-body">
                                            <div className="side-list no-border">
                                                <ul>
                                                    {companyName && <li><i className="ti-user padd-r-10"></i>{companyName}</li>}
                                                    {salaryRange && <li><i className="ti-credit-card padd-r-10"></i>{salaryRange}</li>}
                                                    {type && <li><i className="ti-calendar padd-r-10"></i>{type}</li>}
                                                    {job?.requiredEducation && job.requiredEducation !== "NONE" && (
                                                        <li><i className="ti-book padd-r-10"></i>Edu: {String(job.requiredEducation).replace(/_/g, " ")}</li>
                                                    )}
                                                    {typeof job?.requiredExperienceYears === "number" && (
                                                        <li><i className="ti-bar-chart padd-r-10"></i>Exp: {job.requiredExperienceYears} year{job.requiredExperienceYears === 1 ? "" : "s"}</li>
                                                    )}
                                                    {deadline && <li><i className="ti-time padd-r-10"></i>Deadline: {deadline}</li>}
                                                    {location && <li><i className="ti-location-pin padd-r-10"></i>{location}</li>}
                                                    {email && (
                                                        <li>
                                                            <i className="ti-email padd-r-10"></i>
                                                            <a href={`mailto:${email}`}>{email}</a>
                                                        </li>
                                                    )}
                                                    {phone && (
                                                        <li>
                                                            <i className="ti-mobile padd-r-10"></i>{phone}
                                                        </li>
                                                    )}
                                                    {company?.website && <li><i className="ti-world padd-r-10"></i>{company.website}</li>}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {location && (
                                        <div className="widget-boxed">
                                            <div className="widget-boxed-header">
                                                <h4><i className="ti-location-pin padd-r-10"></i>Location</h4>
                                            </div>
                                            <div className="widget-boxed-body">
                                                <p className="job-detail-location-text">{location}</p>
                                                <div className="job-detail-map-container">
                                                    <iframe
                                                        title="job-location-map"
                                                        src={buildMapSrc(location)}
                                                        width="100%"
                                                        height="260"
                                                        className="job-detail-map-iframe"
                                                        allowFullScreen
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer-when-downgrade"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {company?.socials && company.socials.length > 0 && (
                                        <div className="widget-boxed">
                                            <div className="widget-boxed-header">
                                                <h4><i className="ti-sharethis padd-r-10"></i>Socials</h4>
                                            </div>
                                            <div className="widget-boxed-body">
                                                <div className="side-list no-border">
                                                    <ul>
                                                        {company.socials.map((s) => (
                                                            <li key={s.id ?? s.url}>
                                                                <i className={`${getSocialIcon(s.platform)} padd-r-10`}></i>
                                                                <a href={s.url} target="_blank" rel="noopener noreferrer">
                                                                    {s.platform || s.url}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Apply Modal */}
            {showApply && (
              <div
                className="jp-modal-overlay"
                role="dialog"
                aria-modal="true"
                onClick={closeApply}
              >
                <div className="jp-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="jp-modal-header">
                    <h4 className="jp-modal-title">
                      Submit Application{title ? ` — ${title}` : ""}
                    </h4>
                    <button type="button" className="jp-modal-close" onClick={closeApply} aria-label="Close">×</button>
                  </div>
                  <div className="jp-modal-body">
                    <div className="form-group">
                      <label>Select CV</label>
                      {cvLoading ? (
                        <div>Loading CVs...</div>
                      ) : cvItems.length > 0 ? (
                        <div className="jp-cv-list">
                          {cvItems.map((cv) => (
                            <label key={cv.id} className="jp-cv-item">
                              <input
                                type="radio"
                                name="apply-cv"
                                checked={selectedCvId === cv.id}
                                onChange={() => setSelectedCvId(cv.id)}
                              />
                              <div className="jp-cv-meta job-detail-cv-meta-flex">
                                <div className="job-detail-cv-meta-header">
                                  <strong>{cv.title || "Untitled CV"}</strong>
                                  {cv.isDefault && <span className="label label-success job-detail-cv-default-label">Default</span>}
                                </div>
                                <small>
                                  {cv.templateCode || "DEFAULT"} · {cv.updatedAt ? new Date(cv.updatedAt).toLocaleString() : "-"}
                                </small>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="alert alert-warning">
                          No CVs found. <a href="/create-cv">Create one</a>
                        </div>
                      )}
                    </div>
                    <div className="form-group job-detail-cover-letter-group">
                      <label>Cover Letter (optional)</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Write a short message to the employer"
                      />
                    </div>
                    {applyErr && (
                      <div className="alert alert-danger job-detail-apply-error">
                        {applyErr}
                      </div>
                    )}
                  </div>
                  <div className="jp-modal-actions">
                    <button type="button" className="btn btn-default" onClick={closeApply} disabled={applying}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn theme-btn"
                      onClick={submitApply}
                      disabled={applying || cvLoading || !selectedCvId}
                    >
                      {applying ? "Submitting..." : "Submit Application"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Company Detail Modal */}
            {showCompanyModal && company && (
              <div
                className="jp-modal-overlay"
                role="dialog"
                aria-modal="true"
                onClick={closeCompanyModal}
              >
                <div className="jp-modal jp-company-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="jp-modal-header">
                    <h4 className="jp-modal-title">Company Details</h4>
                    <button type="button" className="jp-modal-close" onClick={closeCompanyModal} aria-label="Close">×</button>
                  </div>
                  <div className="jp-modal-body">
                    <div className="company-detail-content">
                      <div className="company-header-info">
                        {company.logoUrl && (
                          <div className="company-logo-large">
                            <img src={company.logoUrl} alt={company.name} />
                          </div>
                        )}
                        <div className="company-basic-info">
                          <h3>{company.name}</h3>
                          {company.industry && (
                            <p className="company-industry">
                              <i className="ti-briefcase"></i> {company.industry}
                            </p>
                          )}
                          {company.location && (
                            <p className="company-location">
                              <i className="ti-location-pin"></i> {company.location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="company-detail-section">
                        {company.description && (
                          <div className="info-block">
                            <h5><i className="ti-info-alt"></i> About Company</h5>
                            <p>{company.description}</p>
                          </div>
                        )}

                        {company.website && (
                          <div className="info-block">
                            <h5><i className="ti-world"></i> Website</h5>
                            <p>
                              <a href={company.website} target="_blank" rel="noopener noreferrer">
                                {company.website}
                              </a>
                            </p>
                          </div>
                        )}

                        {company.email && (
                          <div className="info-block">
                            <h5><i className="ti-email"></i> Email</h5>
                            <p>{company.email}</p>
                          </div>
                        )}

                        {company.phone && (
                          <div className="info-block">
                            <h5><i className="ti-mobile"></i> Phone</h5>
                            <p>{company.phone}</p>
                          </div>
                        )}

                        {(company.employeeCount || company.size) && (
                          <div className="info-block">
                            <h5><i className="ti-user"></i> Company Size</h5>
                            <p>{company.employeeCount || company.size} employees</p>
                          </div>
                        )}

                        {company.foundedYear && (
                          <div className="info-block">
                            <h5><i className="ti-calendar"></i> Founded</h5>
                            <p>{company.foundedYear}</p>
                          </div>
                        )}

                        {company.address?.street && (
                          <div className="info-block">
                            <h5><i className="ti-location-pin"></i> Address</h5>
                            <p>
                              {company.address.street}
                              {company.address.city && `, ${company.address.city}`}
                              {company.address.state && `, ${company.address.state}`}
                              {company.address.country && `, ${company.address.country}`}
                            </p>
                          </div>
                        )}

                        {company.socials && company.socials.length > 0 && (
                          <div className="info-block">
                            <h5><i className="ti-sharethis"></i> Social Media</h5>
                            <div className="job-detail-company-socials">
                              {company.socials.map((s) => (
                                <a 
                                  key={s.id ?? s.url} 
                                  href={s.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="job-detail-social-link"
                                >
                                  <i className={getSocialIcon(s.platform)}></i> {s.platform || 'Link'}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="jp-modal-actions">
                    <button type="button" className="btn btn-default" onClick={closeCompanyModal}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {toast.show && (
              <div className="jp-toast-container">
                <div className="jp-toast jp-toast-success">{toast.text}</div>
              </div>
            )}

            <Footer />
        </>
    );
}
