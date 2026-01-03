import React, { useMemo, useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { createUserCvWithSectionsData, updateFullUserCvData, getFullUserCvData, setDefaultUserCv } from "../../api/userCvApi";
import { useAuth } from "../../auth/useAuth";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/plugins/nice-select/css/nice-select.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../assets/css/cv.css";
import { getUserId as getUserIdFromToken } from "../../utils/jwt";
import defaultAvatar from "../../assets/img/client-1.jpg";
import { uploadImage } from "../../api/uploadApi";

const SECTION_TYPES = [
  "OBJECTIVE",
  "EXPERIENCE",
  "EDUCATION",
  "PROJECT",
  "HONORS",
  "CERTIFICATIONS",
  "ACTIVITIES",
  "REFERENCES",
  "SKILL",
  "INTERESTS"
];

// Icon + friendly label for each section type
const TYPE_META = {
  OBJECTIVE: { label: "Objective", icon: "ti-target" },
  EXPERIENCE: { label: "Work experience", icon: "ti-briefcase" },
  EDUCATION: { label: "Education", icon: "ti-book" },
  PROJECT: { label: "Projects", icon: "ti-layout" },
  HONORS: { label: "Honors & Awards", icon: "ti-cup" },
  CERTIFICATIONS: { label: "Certifications", icon: "ti-medall" },
  ACTIVITIES: { label: "Activities", icon: "ti-clipboard" },
  REFERENCES: { label: "References", icon: "ti-id-badge" },
  SKILL: { label: "Skills", icon: "ti-ruler-pencil" },
  INTERESTS: { label: "Interests", icon: "ti-heart" },
  SUMMARY: { label: "Objective", icon: "ti-target" },
};

const getTypeLabel = (t) => TYPE_META[t]?.label || t;
const getTypeIcon = (t) => TYPE_META[t]?.icon || "ti-layout";

const initDataByType = (type) => {
  switch (type) {
    case "OBJECTIVE":
      return { text: "" };
    case "EXPERIENCE":
      return { items: [{ position: "", company: "", startDate: "", endDate: "", description: "" }] };
    case "EDUCATION":
      return { items: [{ courses: "", school: "", startDate: "", endDate: "", description: "" }] };
    case "PROJECT":
      return { items: [{ projectName: "", startDate: "", endDate: "", description: "" }] };
    case "HONORS":
    case "CERTIFICATIONS":
      return { items: [{ time: "", name: "" }] };
    case "ACTIVITIES":
      return { items: [{ position: "", organizationName: "", startDate: "", endDate: "", description: "" }] };
    case "REFERENCES":
      return { items: [{ information: "" }] };
    case "SKILL":
      return { items: [{ name: "", years: "" }] };
    case "INTERESTS":
      return { items: [{ name: "" }] };
    default:
      return {};
  }
};

const DEFAULT_SECTION = (type = "SUMMARY") => ({
  type,
  title: "",
  position: 1,
  data: initDataByType(type),
  id: undefined,
});

// Hiển thị form theo loại section
const SectionFields = ({ section, onChange }) => {
  const { type, data } = section;
  const updateData = (patch) => onChange({ ...section, data: { ...data, ...patch } });

  // helper: chuẩn hóa "YYYY" -> "YYYY-01"
  const normalizeMonth = (v) => {
    if (!v) return "";
    if (/^\d{4}-\d{2}$/.test(v)) return v;
    if (/^\d{4}$/.test(v)) return `${v}-01`;
    return "";
  };

  if (type === "OBJECTIVE") {
    return (
      <div className="col-md-12 mt-10">
        <label>Objective Text</label>
        <textarea
          className="form-control"
          rows={5}
          value={data.text || ""}
          onChange={(e) => updateData({ text: e.target.value })}
          placeholder="Your career objective"
        />
      </div>
    );
  }

  if (type === "EXPERIENCE") {
    const items = data.items || [];
    const setItem = (i, patch) => {
      const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
      updateData({ items: next });
    };
    const addItem = () => updateData({ items: [...items, { position: "", company: "", startDate: "", endDate: "", description: "" }] });
    const removeItem = (i) => updateData({ items: items.filter((_, idx) => idx !== i) });

    return (
      <div className="col-md-12 mt-10">
        <div className="cv-between">
          <label>Work Experience</label>
          <button type="button" className="btn btn-xs btn-success" onClick={addItem}>+ Add</button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="cv-row-box">
            <div className="row cv-item-row">
              <div className="col-md-3 col-sm-12">
                <label>Position</label>
                <input className="form-control" placeholder="Position" value={it.position}
                       onChange={(e) => setItem(i, { position: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-6">
                <label>From</label>
                <input
                  type="month"
                  className="form-control"
                  placeholder="YYYY-MM"
                  value={normalizeMonth(it.startDate)}
                  onChange={(e) => setItem(i, { startDate: e.target.value })}
                />
              </div>
              <div className="col-md-2 col-sm-6">
                <label>To</label>
                <input
                  type="month"
                  className="form-control"
                  placeholder="YYYY-MM"
                  value={normalizeMonth(it.endDate)}
                  onChange={(e) => setItem(i, { endDate: e.target.value })}
                />
              </div>
              <div className="col-md-3 col-sm-10">
                <label>Company</label>
                <input className="form-control" placeholder="Company name" value={it.company}
                       onChange={(e) => setItem(i, { company: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-2 d-flex justify-content-end align-items-end">
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeItem(i)}>Remove</button>
              </div>
              <div className="col-md-12 cv-desc">
                <label>Experience Description</label>
                <textarea className="form-control" rows={2} placeholder="Experience description" value={it.description}
                       onChange={(e) => setItem(i, { description: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "EDUCATION") {
    const items = data.items || [];
    const setItem = (i, patch) => {
      const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
      updateData({ items: next });
    };
    const addItem = () => updateData({ items: [...items, { courses: "", school: "", startDate: "", endDate: "", description: "" }] });
    const removeItem = (i) => updateData({ items: items.filter((_, idx) => idx !== i) });

    return (
      <div className="col-md-12 mt-10">
        <div className="cv-between">
          <label>Education</label>
          <button type="button" className="btn btn-xs btn-success" onClick={addItem}>+ Add</button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="cv-row-box">
            <div className="row cv-item-row">
              <div className="col-md-4 col-sm-12">
                <label>Courses / Subjects</label>
                <input className="form-control" placeholder="Courses or subjects" value={it.courses}
                       onChange={(e) => setItem(i, { courses: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-6">
                <label>From</label>
                <input
                  type="month"
                  className="form-control"
                  placeholder="YYYY-MM"
                  value={normalizeMonth(it.startDate)}
                  onChange={(e) => setItem(i, { startDate: e.target.value })}
                />
              </div>
              <div className="col-md-2 col-sm-6">
                <label>To</label>
                <input
                  type="month"
                  className="form-control"
                  placeholder="YYYY-MM"
                  value={normalizeMonth(it.endDate)}
                  onChange={(e) => setItem(i, { endDate: e.target.value })}
                />
              </div>
              <div className="col-md-4 col-sm-12">
                <label>School Name</label>
                <input className="form-control" placeholder="School name" value={it.school}
                       onChange={(e) => setItem(i, { school: e.target.value })} />
              </div>
              <div className="col-md-10 col-sm-10">
                <label>Education Description</label>
                <textarea className="form-control" rows={2} placeholder="Education description" value={it.description}
                       onChange={(e) => setItem(i, { description: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-2 d-flex justify-content-end align-items-end">
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeItem(i)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "PROJECT") {
    const items = data.items || [];
    const setItem = (i, patch) => {
      const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
      updateData({ items: next });
    };
    const addItem = () => updateData({ items: [...items, { projectName: "", startDate: "", endDate: "", description: "" }] });
    const removeItem = (i) => updateData({ items: items.filter((_, idx) => idx !== i) });

    return (
      <div className="col-md-12 mt-10">
        <div className="cv-between">
          <label>Project</label>
          <button type="button" className="btn btn-xs btn-success" onClick={addItem}>+ Add</button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="cv-row-box">
            <div className="row cv-item-row">
              <div className="col-md-2 col-sm-6">
                <label>From</label>
                <input
                  type="month"
                  className="form-control"
                  placeholder="YYYY-MM"
                  value={normalizeMonth(it.startDate)}
                  onChange={(e) => setItem(i, { startDate: e.target.value })}
                />
              </div>
              <div className="col-md-2 col-sm-6">
                <label>To</label>
                <input
                  type="month"
                  className="form-control"
                  placeholder="YYYY-MM"
                  value={normalizeMonth(it.endDate)}
                  onChange={(e) => setItem(i, { endDate: e.target.value })}
                />
              </div>
              <div className="col-md-8 col-sm-12">
                <label>Project Name</label>
                <input className="form-control" placeholder="Project name" value={it.projectName}
                       onChange={(e) => setItem(i, { projectName: e.target.value })} />
              </div>
              <div className="col-md-10 col-sm-10">
                <label>Project Description</label>
                <textarea className="form-control" rows={3} 
                  placeholder="Briefly describe the project, its goals, your role, the technologies used, and the achievements you accomplished" 
                  value={it.description}
                  onChange={(e) => setItem(i, { description: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-2 d-flex justify-content-end align-items-end">
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeItem(i)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "SKILL") {
    const items = data.items || [];
    const setItem = (i, patch) => {
      const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
      updateData({ items: next });
    };
    const addItem = () => updateData({ items: [...items, { name: "", years: "" }] });
    const removeItem = (i) => updateData({ items: items.filter((_, idx) => idx !== i) });

    return (
      <div className="col-md-12 mt-10">
        <div className="cv-between">
          <label>Skills</label>
          <button type="button" className="btn btn-xs btn-success" onClick={addItem}>+ Add</button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="cv-row-box">
            <div className="row cv-item-row">
              <div className="col-md-6 col-sm-12">
                <label>Skill name</label>
                <input className="form-control" placeholder="Skill name" value={it.name}
                       onChange={(e) => setItem(i, { name: e.target.value })} />
              </div>
              <div className="col-md-4 col-sm-10">
                <label>Years of experience</label>
                <select className="form-control" value={it.years}
                       onChange={(e) => setItem(i, { years: e.target.value })}>
                  <option value="">Select years</option>
                  <option value="learning">Learning</option>
                  <option value="0">0 years</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                  <option value="4">4 years</option>
                  <option value="5">5+ years</option>
                </select>
              </div>
              <div className="col-md-2 col-sm-2 d-flex justify-content-end align-items-end">
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeItem(i)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "HONORS" || type === "CERTIFICATIONS") {
    const items = data.items || [];
    const setItem = (i, patch) => {
      const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
      updateData({ items: next });
    };
    const addItem = () => updateData({ items: [...items, { time: "", name: "" }] });
    const removeItem = (i) => updateData({ items: items.filter((_, idx) => idx !== i) });

    return (
      <div className="col-md-12 mt-10">
        <div className="cv-between">
          <label>{type === "HONORS" ? "Honors & Awards" : "Certifications"}</label>
          <button type="button" className="btn btn-xs btn-success" onClick={addItem}>+ Add</button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="cv-row-box">
            <div className="row cv-item-row">
              <div className="col-md-3 col-sm-12">
                <label>Time</label>
                <input type="month" className="form-control" placeholder="YYYY-MM" value={it.time}
                       onChange={(e) => setItem(i, { time: e.target.value })} />
              </div>
              <div className="col-md-7 col-sm-10">
                <label>{type === "HONORS" ? "Award Name" : "Certification Name"}</label>
                <input className="form-control" placeholder={type === "HONORS" ? "Award name" : "Certification name"} value={it.name}
                       onChange={(e) => setItem(i, { name: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-2 d-flex justify-content-end align-items-end">
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeItem(i)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "ACTIVITIES") {
    const items = data.items || [];
    const setItem = (i, patch) => {
      const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
      updateData({ items: next });
    };
    const addItem = () => updateData({ items: [...items, { position: "", organizationName: "", startDate: "", endDate: "", description: "" }] });
    const removeItem = (i) => updateData({ items: items.filter((_, idx) => idx !== i) });

    return (
      <div className="col-md-12 mt-10">
        <div className="cv-between">
          <label>Activities</label>
          <button type="button" className="btn btn-xs btn-success" onClick={addItem}>+ Add</button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="cv-row-box">
            <div className="row cv-item-row">
              <div className="col-md-3 col-sm-12">
                <label>Position</label>
                <input className="form-control" placeholder="Position" value={it.position}
                       onChange={(e) => setItem(i, { position: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-6">
                <label>From</label>
                <input type="month" className="form-control" placeholder="YYYY-MM" value={normalizeMonth(it.startDate)}
                       onChange={(e) => setItem(i, { startDate: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-6">
                <label>To</label>
                <input type="month" className="form-control" placeholder="YYYY-MM" value={normalizeMonth(it.endDate)}
                       onChange={(e) => setItem(i, { endDate: e.target.value })} />
              </div>
              <div className="col-md-3 col-sm-10">
                <label>Organization Name</label>
                <input className="form-control" placeholder="Organization name" value={it.organizationName}
                       onChange={(e) => setItem(i, { organizationName: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-2 d-flex justify-content-end align-items-end">
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeItem(i)}>Remove</button>
              </div>
              <div className="col-md-12 cv-desc">
                <label>Activity Description</label>
                <textarea className="form-control" rows={2} placeholder="Activity description" value={it.description}
                       onChange={(e) => setItem(i, { description: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "REFERENCES") {
    const items = data.items || [];
    const setItem = (i, patch) => {
      const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
      updateData({ items: next });
    };
    const addItem = () => updateData({ items: [...items, { information: "" }] });
    const removeItem = (i) => updateData({ items: items.filter((_, idx) => idx !== i) });

    return (
      <div className="col-md-12 mt-10">
        <div className="cv-between">
          <label>References</label>
          <button type="button" className="btn btn-xs btn-success" onClick={addItem}>+ Add</button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="cv-row-box">
            <div className="row cv-item-row">
              <div className="col-md-10 col-sm-10">
                <label>Reference Information</label>
                <textarea className="form-control" rows={3} 
                  placeholder="Reference information including name, title and contact information" 
                  value={it.information}
                  onChange={(e) => setItem(i, { information: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-2 d-flex justify-content-end align-items-end">
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeItem(i)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "INTERESTS") {
    const items = data.items || [];
    const setItem = (i, patch) => {
      const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
      updateData({ items: next });
    };
    const addItem = () => updateData({ items: [...items, { name: "" }] });
    const removeItem = (i) => updateData({ items: items.filter((_, idx) => idx !== i) });

    return (
      <div className="col-md-12 mt-10">
        <div className="cv-between">
          <label>Interests</label>
          <button type="button" className="btn btn-xs btn-success" onClick={addItem}>+ Add</button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="cv-row-box">
            <div className="row cv-item-row">
              <div className="col-md-10 col-sm-10">
                <label>Interest</label>
                <input className="form-control" placeholder="Your interest" value={it.name}
                       onChange={(e) => setItem(i, { name: e.target.value })} />
              </div>
              <div className="col-md-2 col-sm-2 d-flex justify-content-end align-items-end">
                <button type="button" className="btn btn-xs btn-danger" onClick={() => removeItem(i)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const SectionRow = ({ idx, section, onChange, onRemove, onMoveUp, onMoveDown, canUp, canDown }) => {
  const update = (patch) => onChange(idx, { ...section, ...patch });
  const onTypeChange = (t) => update({ type: t, data: initDataByType(t) });

  return (
    <div className="panel panel-default cv-panel">
      <div className="panel-heading cv-panel-heading">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#f2f3f5", color: "#666" }}>
            <i className={getTypeIcon(section.type)} />
          </span>
          <strong>{getTypeLabel(section.type)}</strong>
          {section.title ? (
            <span className="text-muted" style={{ marginLeft: 6 }}>— {section.title}</span>
          ) : null}
        </div>
        <div className="cv-actions">
          <button type="button" className="btn btn-xs btn-default" onClick={() => onMoveUp(idx)} disabled={!canUp}>↑</button>
          <button type="button" className="btn btn-xs btn-default" onClick={() => onMoveDown(idx)} disabled={!canDown}>↓</button>
          <button type="button" className="btn btn-xs btn-danger" onClick={() => onRemove(idx)}>Remove</button>
        </div>
      </div>
      <div className="panel-body">
        <div className="row cv-gap-8">
          <div className="col-md-3">
            <label>Type</label>
            <select className="form-control" value={section.type} onChange={(e) => onTypeChange(e.target.value)}>
              {SECTION_TYPES.map((t) => (
                <option key={t} value={t}>{getTypeLabel(t)}</option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <label>Title</label>
            <input
              className="form-control"
              placeholder="Section title"
              value={section.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <label>Position</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={section.position ?? idx + 1}
              onChange={(e) => update({ position: Number(e.target.value) || idx + 1 })}
            />
          </div>

          {/* Fields theo type */}
          <SectionFields section={section} onChange={(next) => onChange(idx, next)} />
        </div>
      </div>
    </div>
  );
};

const CreateCV = () => {
  const [userId, setUserId] = useState(() => {
    const uid = getUserIdFromToken();
    return uid ? String(uid) : "";
  });
  const [title, setTitle] = useState("");
  const [templateCode, setTemplateCode] = useState("DEFAULT");
  const [isDefault, setIsDefault] = useState(true);
  const [sections, setSections] = useState(() => [
    "OBJECTIVE",
    "EXPERIENCE",
    "EDUCATION",
    "PROJECT",
    "HONORS",
    "CERTIFICATIONS",
    "ACTIVITIES",
    "REFERENCES",
    "SKILL",
    "INTERESTS"
  ].map((t, i) => ({ ...DEFAULT_SECTION(t), position: i + 1 })));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [createdId, setCreatedId] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Personal info (will be saved into cv.data.personal)
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const userIdNum = useMemo(() => Number(userId) || 0, [userId]);

  // === Lưu/khôi phục nháp ===
  const DRAFT_KEY = "cv_create_draft";
  // Khôi phục nháp khi mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && typeof draft === "object") {
        if (draft.userId !== undefined) setUserId(String(draft.userId));
        if (draft.title !== undefined) setTitle(draft.title);
        if (draft.templateCode !== undefined) setTemplateCode(draft.templateCode);
        if (draft.isDefault !== undefined) setIsDefault(!!draft.isDefault);
        if (Array.isArray(draft.sections) && draft.sections.length) setSections(draft.sections);
        if (draft.createdId !== undefined) setCreatedId(draft.createdId);
        if (draft.fullName !== undefined) setFullName(draft.fullName);
        if (draft.address !== undefined) setAddress(draft.address);
        if (draft.phone !== undefined) setPhone(draft.phone);
        if (draft.avatarUrl !== undefined) setAvatarUrl(draft.avatarUrl);
        if (draft.email !== undefined) setEmail(draft.email);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự đồng bộ nháp khi state chính thay đổi
  useEffect(() => {
    try {
      const draft = {
        userId,
        title,
        templateCode,
        isDefault,
        createdId,
        sections,
        fullName,
        address,
        phone,
        avatarUrl,
        email,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* ignore */ }
  }, [userId, title, templateCode, isDefault, createdId, sections, fullName, address, phone, avatarUrl, email]);

  // Fallback: nếu userId chưa có, cố gắng nạp lại từ token và lắng nghe thay đổi storage
  useEffect(() => {
    const hydrate = () => {
      if (!userId) {
        const uid = getUserIdFromToken();
        if (uid) setUserId(String(uid));
      }
    };
    hydrate();
    const onStorage = (e) => {
      if (e.key === "access_token" || e.key === "userId") hydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);

  useEffect(() => {
    if (user) {
      const uid = user?.id ?? user?.userId;
      if (uid && !userId) setUserId(String(uid)); // không ghi đè userId đã khôi phục
      const nameFromUser = user?.fullName || user?.name || user?.username;
      const nameFromStorage = localStorage.getItem("username");
      const name = nameFromUser || nameFromStorage || "";
      setDisplayName(name);
      if (!title && name) setTitle(`CV ${name}`); // không ghi đè title đã khôi phục
      // Prefill fullName if empty
      if (!fullName && name) setFullName(name);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // If editing (?id or ?cvId), load full CV and prefill all fields
  useEffect(() => {
    const idParam = searchParams.get("id") || searchParams.get("cvId");
    const editId = idParam ? Number(idParam) : 0;
    if (!editId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getFullUserCvData(editId);
        if (!mounted || !data?.cv) return;
        const cv = data.cv;
        // Basic fields
        setCreatedId(cv.id);
        setUserId(String(cv.userId ?? userId));
        setTitle(cv.title || "");
        setTemplateCode(cv.templateCode || "DEFAULT");
        setIsDefault(!!cv.isDefault);
        // Personal info from cv.data.personal
        const personal = (cv.data && cv.data.personal) || {};
        setFullName(personal.fullName || "");
        setAddress(personal.address || "");
        setPhone(personal.phone || "");
        setEmail(personal.email || "");
        setAvatarUrl(personal.avatarUrl || "");
        // Map sections -> editor model
        const mapped = (data.sections || [])
          .slice()
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((sec) => {
            const c = sec.content || {};
            let dataByType = {};
            switch (sec.type) {
              case "OBJECTIVE":
                dataByType = { text: c.text || "" };
                break;
              case "EXPERIENCE":
                dataByType = {
                  items: (c.items || []).map((it) => ({
                    position: it.position || "",
                    company: it.company || "",
                    startDate: it.startDate || "",
                    endDate: it.endDate || "",
                    description: it.description || "",
                  })),
                };
                break;
              case "EDUCATION":
                dataByType = {
                  items: (c.items || []).map((it) => ({
                    courses: it.courses || "",
                    school: it.school || "",
                    startDate: it.startDate || "",
                    endDate: it.endDate || "",
                    description: it.description || "",
                  })),
                };
                break;
              case "PROJECT":
                dataByType = {
                  items: (c.items || []).map((it) => ({
                    projectName: it.projectName || "",
                    startDate: it.startDate || "",
                    endDate: it.endDate || "",
                    description: it.description || "",
                  })),
                };
                break;
              case "HONORS":
              case "CERTIFICATIONS":
                dataByType = {
                  items: (c.items || []).map((it) => ({
                    time: it.time || "",
                    name: it.name || "",
                  })),
                };
                break;
              case "ACTIVITIES":
                dataByType = {
                  items: (c.items || []).map((it) => ({
                    position: it.position || "",
                    organizationName: it.organizationName || "",
                    startDate: it.startDate || "",
                    endDate: it.endDate || "",
                    description: it.description || "",
                  })),
                };
                break;
              case "REFERENCES":
                dataByType = {
                  items: (c.items || []).map((it) => ({
                    information: it.information || "",
                  })),
                };
                break;
              case "SKILL":
                dataByType = {
                  items: (c.items || []).map((it) => ({
                    name: it.name || "",
                    years: it.years || it.level || "",
                  })),
                };
                break;
              case "INTERESTS":
                dataByType = {
                  items: (c.items || []).map((it) => ({
                    name: it.name || "",
                  })),
                };
                break;
              default:
                dataByType = initDataByType(sec.type);
            }
            return {
              id: sec.id,
              type: sec.type,
              title: sec.title || sec.type,
              position: sec.position ?? 1,
              data: dataByType,
            };
          });
        if (mapped.length) setSections(mapped);
      } catch (e) {
        setMsg({ type: "error", text: e?.message || "Load CV failed" });
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [sections]
  );

  const addSection = () => {
    const next = DEFAULT_SECTION();
    next.position = (sections?.length || 0) + 1;
    setSections((s) => [...s, next]);
  };

  // thêm nhanh theo type
  const addSectionOfType = (type) => {
    const next = DEFAULT_SECTION(type);
    next.position = (sections?.length || 0) + 1;
    setSections((s) => [...s, next]);
  };

  // layout cơ bản: tất cả các section
  const addBasicTemplate = () => {
    const base = [
      "OBJECTIVE",
      "EXPERIENCE",
      "EDUCATION",
      "PROJECT",
      "HONORS",
      "CERTIFICATIONS",
      "ACTIVITIES",
      "REFERENCES",
      "SKILL",
      "INTERESTS"
    ].map((t, i) => ({
      ...DEFAULT_SECTION(t),
      position: i + 1,
    }));
    setSections(base);
  };

  const removeSection = (idx) => {
    setSections((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // normalize position
      return next.map((s, i) => ({ ...s, position: i + 1 }));
    });
  };

  const changeSection = (idx, next) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? next : s)));
  };

  const moveUp = (idx) => {
    if (idx <= 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((s, i) => ({ ...s, position: i + 1 }));
    });
  };

  const moveDown = (idx) => {
    if (idx >= sections.length - 1) return;
    setSections((prev) => {
      const next = [...prev];
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      return next.map((s, i) => ({ ...s, position: i + 1 }));
    });
  };

  const validate = () => {
    if (!userId || isNaN(Number(userId))) return "Please enter a valid userId";
    if (!title.trim()) return "Please enter CV title";
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (!SECTION_TYPES.includes(s.type)) return `Section #${i + 1}: invalid type`;
      if (!s.title) return `Section #${i + 1}: missing title`;

      if (s.type === "OBJECTIVE") {
        if (!s.data?.text?.trim()) return `Section #${i + 1}: OBJECTIVE has no content`;
      }
      if (s.type === "EXPERIENCE") {
        const items = s.data?.items || [];
        if (!items.length) return `Section #${i + 1}: No experience items added`;
        for (let j = 0; j < items.length; j++) {
          if (!items[j].company || !items[j].position) return `Section #${i + 1}: Experience #${j + 1} missing company/position`;
        }
      }
      if (s.type === "EDUCATION") {
        const items = s.data?.items || [];
        if (!items.length) return `Section #${i + 1}: No education items added`;
        for (let j = 0; j < items.length; j++) {
          if (!items[j].school || !items[j].courses) return `Section #${i + 1}: Education #${j + 1} missing school/courses`;
        }
      }
      if (s.type === "PROJECT") {
        const items = s.data?.items || [];
        if (!items.length) return `Section #${i + 1}: No project items added`;
        for (let j = 0; j < items.length; j++) {
          if (!items[j].projectName) return `Section #${i + 1}: Project #${j + 1} missing project name`;
        }
      }
      if (s.type === "HONORS" || s.type === "CERTIFICATIONS") {
        const items = s.data?.items || [];
        if (!items.length) return `Section #${i + 1}: No items added`;
        for (let j = 0; j < items.length; j++) {
          if (!items[j].name) return `Section #${i + 1}: Item #${j + 1} missing name`;
        }
      }
      if (s.type === "ACTIVITIES") {
        const items = s.data?.items || [];
        if (!items.length) return `Section #${i + 1}: No activities added`;
        for (let j = 0; j < items.length; j++) {
          if (!items[j].position || !items[j].organizationName) return `Section #${i + 1}: Activity #${j + 1} missing position/organization`;
        }
      }
      if (s.type === "REFERENCES") {
        const items = s.data?.items || [];
        if (!items.length) return `Section #${i + 1}: No references added`;
        for (let j = 0; j < items.length; j++) {
          if (!items[j].information) return `Section #${i + 1}: Reference #${j + 1} missing information`;
        }
      }
      if (s.type === "SKILL") {
        const items = s.data?.items || [];
        if (!items.length) return `Section #${i + 1}: No skills added`;
        for (let j = 0; j < items.length; j++) {
          if (!items[j].name) return `Section #${i + 1}: Skill #${j + 1} missing name`;
        }
      }
      if (s.type === "INTERESTS") {
        const items = s.data?.items || [];
        if (!items.length) return `Section #${i + 1}: No interests added`;
        for (let j = 0; j < items.length; j++) {
          if (!items[j].name) return `Section #${i + 1}: Interest #${j + 1} missing name`;
        }
      }
    }
    return "";
  };

  const buildContentFromSection = (s) => {
    switch (s.type) {
      case "OBJECTIVE":
        return { text: s.data?.text || "" };
      case "EXPERIENCE":
        return {
          items: (s.data?.items || []).map((it) => ({
            position: it.position || "",
            company: it.company || "",
            startDate: it.startDate || "",
            endDate: it.endDate || "",
            description: it.description || "",
          })),
        };
      case "EDUCATION":
        return {
          items: (s.data?.items || []).map((it) => ({
            courses: it.courses || "",
            school: it.school || "",
            startDate: it.startDate || "",
            endDate: it.endDate || "",
            description: it.description || "",
          })),
        };
      case "PROJECT":
        return {
          items: (s.data?.items || []).map((it) => ({
            projectName: it.projectName || "",
            startDate: it.startDate || "",
            endDate: it.endDate || "",
            description: it.description || "",
          })),
        };
      case "HONORS":
      case "CERTIFICATIONS":
        return {
          items: (s.data?.items || []).map((it) => ({
            time: it.time || "",
            name: it.name || "",
          })),
        };
      case "ACTIVITIES":
        return {
          items: (s.data?.items || []).map((it) => ({
            position: it.position || "",
            organizationName: it.organizationName || "",
            startDate: it.startDate || "",
            endDate: it.endDate || "",
            description: it.description || "",
          })),
        };
      case "REFERENCES":
        return {
          items: (s.data?.items || []).map((it) => ({
            information: it.information || "",
          })),
        };
      case "SKILL":
        return {
          items: (s.data?.items || []).map((it) => ({
            name: it.name || "",
            years: it.years || "",
          })),
        };
      case "INTERESTS":
        return {
          items: (s.data?.items || []).map((it) => ({
            name: it.name || "",
          })),
        };
      default:
        return {};
    }
  };

  // Lưu (create lần đầu hoặc update các lần sau)
  const onSave = async () => {
    setMsg({ type: "", text: "" });
    const err = validate();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }
    setLoading(true);
    try {
      const dataPayload = {
        personal: {
          fullName: fullName || displayName || "",
          address: address || "",
          phone: phone || "",
          email: email || "",
          avatarUrl: avatarUrl || "",
        },
      };
      const cvPayload = {
        userId: Number(userId),
        title: title.trim(),
        templateCode: templateCode || "DEFAULT",
        data: dataPayload,
      };
      const sectionPayload = sections.map((s, i) => ({
        ...(s.id ? { id: s.id } : {}),
        type: s.type,
        title: s.title,
        position: s.position ?? i + 1,
        content: buildContentFromSection(s),
      }));
      if (createdId) {
        await updateFullUserCvData(createdId, { cv: cvPayload, sections: sectionPayload });
        // Make default via dedicated endpoint (avoid unique constraint violation)
        if (isDefault) {
          try { await setDefaultUserCv(createdId); } catch (e) { console.warn("setDefaultUserCv failed", e); }
        }
        setMsg({ type: "success", text: "CV saved successfully!" });
      } else {
        const created = await createUserCvWithSectionsData(cvPayload, sectionPayload);
        const newId = created?.cv?.id || created?.id || null;
        setCreatedId(newId);
        // đồng bộ sections với id từ server
        if (created?.sections?.length) {
          setSections(
            created.sections
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((sec) => ({
                id: sec.id,
                type: sec.type,
                title: sec.title,
                position: sec.position,
                data: sec.content || initDataByType(sec.type),
              }))
          );
        }
        // Make default via dedicated endpoint (avoid unique constraint violation)
        if (isDefault && newId) {
          try { await setDefaultUserCv(newId); } catch (e) { console.warn("setDefaultUserCv failed", e); }
        }
        setMsg({ type: "success", text: "CV created successfully!" });
      }
    } catch (e2) {
      setMsg({ type: "error", text: e2?.message || "Saving CV failed" });
    } finally {
      setLoading(false);
    }
  };

  // Submit form dùng onSave
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave();
  };

  // Phím tắt Ctrl/Cmd + S để lưu nhanh
  useEffect(() => {
    const handler = (e) => {
      const key = e.key?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        if (!loading) onSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, userId, title, templateCode, isDefault, sections, createdId]);

  const resetForm = () => {
    // giữ nguyên userId để không bị disable nút
    // setUserId("");
    setTitle("");
    setTemplateCode("DEFAULT");
    setIsDefault(true);
    setSections([DEFAULT_SECTION()]);
    setCreatedId(null);
    setMsg({ type: "", text: "" });
    setFullName("");
    setAddress("");
    setPhone("");
    setAvatarUrl("");
    setEmail("");
    // Xóa nháp
    sessionStorage.removeItem(DRAFT_KEY);
  };

  const buildPreviewPayload = () => ({
    cv: {
      userId: Number(userId),
      title: (title || "").trim() || "CV",
      templateCode: templateCode || "DEFAULT",
      isDefault: !!isDefault,
     data: {
       personal: {
         fullName: fullName || displayName || "",
         address: address || "",
         phone: phone || "",
         email: email || "",
         avatarUrl: avatarUrl || "",
       },
     },
    },
    sections: sections.map((s, i) => ({
      ...(s.id ? { id: s.id } : {}),
      type: s.type,
      title: s.title || s.type,
      position: s.position ?? i + 1,
      content: buildContentFromSection(s),
    })),
  });

  const handlePreview = () => {
    // Lưu nháp trước khi chuyển trang
    try {
      const draft = {
        userId,
        title,
        templateCode,
        isDefault,
        createdId,
        sections,
        fullName,
        address,
        phone,
        email,
        avatarUrl,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* ignore */ }

    if (createdId) {
      navigate(`/cv-preview/${createdId}`);
    } else {
      navigate("/cv-preview", { state: buildPreviewPayload() });
    }
  };

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Create CV</h2>
            <p>
              <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> Create CV
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row">
            {/* CV Info Form */}
            <div className="col-md-4 col-sm-12">
              <div className="panel panel-default">
                <div className="panel-heading"><h4>CV Information</h4></div>
                <div className="panel-body">
                  <form onSubmit={handleSubmit}>
                    {/* Profile (show only) */}
                    <div className="user_profile_img" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <img
                        src={(avatarUrl || user?.avatar || localStorage.getItem("avatar")) || defaultAvatar}
                        alt={displayName || "User"}
                        width={56}
                        height={56}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{displayName || "Guest"}</div>
                        {!isAuthenticated && (
                          <small className="text-muted">You are not logged in</small>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        className="form-control"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="VD: CV Backend Developer"
                      />
                    </div>
                    <div className="form-group">
                      <label>Template Code</label>
                      <input
                        className="form-control"
                        value={templateCode}
                        onChange={(e) => setTemplateCode(e.target.value)}
                        placeholder="VD: MODERN_BLUE"
                      />
                    </div>
                    <div className="checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                        />
                        Set as default CV
                      </label>
                    </div>

                    {/* Personal Information (saved into cv.data.personal) */}
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        className="form-control"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input
                        className="form-control"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Your address"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Your phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Avatar Upload</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={async (e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          setUploadingAvatar(true);
                          try {
                            const url = await uploadImage(file, { folder: "avatars", fieldName: "file", endpoint: "/upload" });
                            setAvatarUrl(url);
                          } catch (err) {
                            setMsg({ type: "error", text: err?.message || "Upload avatar failed" });
                          } finally {
                            setUploadingAvatar(false);
                          }
                        }}
                      />
                      {uploadingAvatar && <small className="text-muted">Uploading...</small>}
                      {avatarUrl ? (
                        <div>
                          <img src={avatarUrl} alt="avatar preview" className="logo-preview" />
                        </div>
                      ) : null}
                    </div>

                    {msg.text ? (
                      <div className={`alert ${msg.type === "success" ? "alert-success" : "alert-danger"}`} role="alert" style={{ marginTop: 10 }}>
                        {msg.text}
                      </div>
                    ) : null}

                    <div className="d-flex" style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button type="submit" className="btn theme-btn" disabled={loading || userIdNum <= 0}>
                        {loading ? "Processing..." : createdId ? "Save changes" : "Create CV"}
                      </button>
                      <button type="button" className="btn btn-default" onClick={resetForm} disabled={loading}>
                        Reset
                      </button>
                      <button type="button" className="btn btn-default" onClick={handlePreview} disabled={loading}>
                        Preview
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Sections Manager */}
            <div className="col-md-8 col-sm-12">
              <div className="panel panel-default">
                <div className="panel-heading cv-between">
                  <h4>Sections</h4>
                  <div className="d-flex gap-8">
                    <button type="button" className="btn theme-btn btn-sm" onClick={handlePreview}>
                      Preview
                    </button>
                    <button type="button" className="btn theme-btn btn-sm" onClick={addSection}>+ Add Section</button>
                  </div>
                </div>
                <div className="panel-body">
                  {sections.length === 0 ? (
                    <div className="cv-empty">
                      <p>No sections yet. Use quick actions below to get started.</p>
                      <div className="cv-quick-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSectionOfType("SUMMARY")}>
                          <i className="ti-target" style={{ marginRight: 6 }} /> Objective
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSectionOfType("EXPERIENCE")}>
                          <i className="ti-briefcase" style={{ marginRight: 6 }} /> Experience
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSectionOfType("EDUCATION")}>
                          <i className="ti-book" style={{ marginRight: 6 }} /> Education
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => addSectionOfType("SKILL")}>
                          <i className="ti-ruler-pencil" style={{ marginRight: 6 }} /> Skill
                        </button>
                      </div>
                      <div className="cv-empty-footer">
                        <button type="button" className="btn theme-btn btn-sm" onClick={addBasicTemplate}>
                          <i className="ti-layout" style={{ marginRight: 6 }} /> Add basic layout
                        </button>
                        <small className="text-muted d-block">You can reorder and edit sections later.</small>
                      </div>
                    </div>
                  ) : (
                    sections.map((s, idx) => (
                      <SectionRow
                        key={idx}
                        idx={idx}
                        section={s}
                        onChange={changeSection}
                        onRemove={removeSection}
                        onMoveUp={moveUp}
                        onMoveDown={moveDown}
                        canUp={idx > 0}
                        canDown={idx < sections.length - 1}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default CreateCV;
