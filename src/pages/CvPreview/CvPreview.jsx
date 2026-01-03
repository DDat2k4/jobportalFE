import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getFullUserCvData } from "../../api/userCvApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/plugins/nice-select/css/nice-select.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "../../assets/css/cv.css";
import "./CvPreview.css";
import defaultAvatar from "../../assets/img/client-1.jpg";

const SectionBlock = ({ section }) => {
  const { type, title, content } = section;
  return (
    <div className="cv-preview-block">
      <h4 className="mt-0">{title || type}</h4>
      {type === "SUMMARY" && <p className="cv-preview-summary-text">{content?.text || ""}</p>}

      {type === "EXPERIENCE" && (
        <ul className="cv-preview-list">
          {(content?.items || []).map((it, i) => (
            <li key={i}>
              <strong>{it.company}</strong> — {it.role}
              {it.startDate || it.endDate ? (
                <span> ({it.startDate || "?"} - {it.endDate || "Present"})</span>
              ) : null}
              {it.description ? <div className="cv-preview-experience-description">{it.description}</div> : null}
            </li>
          ))}
        </ul>
      )}

      {type === "EDUCATION" && (
        <ul className="cv-preview-list">
          {(content?.items || []).map((it, i) => (
            <li key={i}>
              <strong>{it.school}</strong> — {it.degree}
              {it.startYear || it.endYear ? <span> ({it.startYear || "?"} - {it.endYear || "?"})</span> : null}
            </li>
          ))}
        </ul>
      )}

      {type === "SKILL" && (
        <div className="cv-preview-skills-container">
          {(content?.items || []).map((it, i) => (
            <span key={i} className="skill-tag">{it.name}{it.level ? ` — ${it.level}` : ""}</span>
          ))}
        </div>
      )}
    </div>
  );
};

const normalize = (full) => {
  if (!full) return { cv: {}, sections: [] };
  // full có thể là { cv, sections } hoặc { id, ... }
  if (full.cv && Array.isArray(full.sections)) return full;
  return { cv: full, sections: full.sections || [] };
};

const CvPreview = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate(); // thêm
  const [loading, setLoading] = useState(false);
  const [full, setFull] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError("");
        if (id) {
          setLoading(true);
          const res = await getFullUserCvData(id);
          if (mounted) setFull(res);
        } else if (state) {
          setFull(state);
        } else {
          setError("Không có dữ liệu preview");
        }
      } catch (e) {
        setError(e?.message || "Tải dữ liệu thất bại");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, state]);

  const data = useMemo(() => normalize(full), [full]);
  const orderedSections = useMemo(
    () => (data.sections || []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [data.sections]
  );

  // nút back: ưu tiên quay lại history, nếu không có thì về /create-cv
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/create-cv");
  };

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>CV Preview</h2>
            <p>
              <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i>{" "}
              <a href="/create-cv" title="Create CV">Create CV</a> <i className="ti-angle-double-right"></i>{" "}
              CV Preview
            </p>
          </div>
        </div>
      </div>

      {/* Back button wrapper */}
      <div className="container cv-back-wrap">
        <button type="button" className="btn theme-btn" onClick={goBack}>
          ← Back to Create CV
        </button>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {loading ? <p>Loading...</p> : null}
          {error ? <div className="alert alert-danger">{error}</div> : null}
          {!loading && !error && (
            <div className="row">
              <div className="col-md-8 col-sm-12">
                {/* Personal info header */}
                {(() => {
                  const personal = data?.cv?.data?.personal || {};
                  const avatar = personal.avatarUrl || defaultAvatar;
                  const name = personal.fullName || "";
                  const addr = personal.address || "";
                  const phone = personal.phone || "";
                  const email = personal.email || "";
                  const hasPersonal = name || addr || phone || personal.avatarUrl;
                  if (!hasPersonal) return null;
                  return (
                    <div className="cv-preview-block cv-preview-personal-header">
                      <img
                        src={avatar}
                        alt={name || "Avatar"}
                        className="cv-preview-avatar"
                      />
                      <div>
                        {name ? <h3 className="cv-preview-personal-name">{name}</h3> : null}
                        {addr ? <div className="cv-preview-personal-detail">{addr}</div> : null}
                        {phone ? <div className="cv-preview-personal-detail">{phone}</div> : null}
                        {email ? <div className="cv-preview-personal-detail">{email}</div> : null}
                      </div>
                    </div>
                  );
                })()}
                <div className="cv-preview-title-section">
                  <h2 className="cv-preview-title">{data.cv?.title || "Untitled CV"}</h2>
                  <div className="cv-preview-template">Template: {data.cv?.templateCode || "DEFAULT"}</div>
                </div>
                {orderedSections.map((s) => (
                  <SectionBlock key={`${s.id || s.type}-${s.position}`} section={s} />
                ))}
              </div>
              <div className="col-md-4 col-sm-12">
                <div className="panel panel-default">
                  <div className="panel-heading"><h4>Information</h4></div>
                  <div className="panel-body">
                    <div><strong>Default:</strong> {data.cv?.isDefault ? "Yes" : "No"}</div>
                    <div><strong>Sections:</strong> {orderedSections.length}</div>
                    {data?.cv?.data?.personal ? <div><strong>Has Personal Info:</strong> Yes</div> : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CvPreview;
