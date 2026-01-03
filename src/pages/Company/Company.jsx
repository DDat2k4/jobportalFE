import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getEmployerCompanies } from "../../api/userApi";
import { getJobs, updateJob, deleteJob } from "../../api/jobApi";
import { getCompanyFull, updateCompany, deleteCompany, createCompanyAddress, updateCompanyAddress, deleteCompanyAddress, createCompanySocial, updateCompanySocial, deleteCompanySocial } from "../../api/companyApi";
import { getAllCategories } from "../../api/categoryApi";
import { getUserId as getUserIdFromToken } from "../../utils/jwt";
import { uploadImage } from "../../api/uploadApi";
import { getSkills as getSkillList, getSkillById } from "../../api/skillApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/plugins/nice-select/css/nice-select.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./Company.css";

// Centered confirm modal using existing styles
function ConfirmModal({ open, title, message, confirmText = "Delete", cancelText = "Cancel", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="jp-modal-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="jp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="jp-modal-header">
          <h4 className="jp-modal-title">{title}</h4>
          <button className="jp-modal-close" aria-label="Close" onClick={onCancel}>×</button>
        </div>
        <div className="jp-modal-body">
          <p>{message}</p>
        </div>
        <div className="jp-modal-actions">
          <button type="button" className="btn btn-default" onClick={onCancel}>{cancelText}</button>
          <button type="button" className="btn theme-btn" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

const Company = () => {
  const [userId, setUserId] = useState(() => {
    const uid = getUserIdFromToken();
    return uid ? String(uid) : "";
  });
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [error, setError] = useState("");

  const [jobsByCompany, setJobsByCompany] = useState({}); // { [companyId]: { loading, error, items: Job[] } }
  const [showJobsByCompany, setShowJobsByCompany] = useState({}); // control show/hide per company
  const [editingJob, setEditingJob] = useState(null); // { id, companyId, title, type, status, deadline }

  const [openDetails, setOpenDetails] = useState({}); 
  const [compFullById, setCompFullById] = useState({}); // { [id]: { loading, error, data } }
  const [categoriesMap, setCategoriesMap] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: "", tagline: "", website: "", employees: "", workingTime: "",
    establishedYear: "", ownerName: "", categoryId: "", description: "", logoUrl: ""
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingLoading, setEditingLoading] = useState(false);

  // New states for editing address and socials
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    email: "", phone: "", landline: "", address: "", address2: "",
    zipCode: "", city: "", state: "", country: ""
  });
  const [editingSocials, setEditingSocials] = useState(false);
  const [socialsForm, setSocialsForm] = useState([]);

  // floating notice (toast-like)
  const [notice, setNotice] = useState(null); // { type: 'success'|'danger'|'info'|'warning', text: string }
  const toastTimerRef = useRef(null);
  const showNotice = (text, type = "info", timeout = 3500) => {
    if (!text) return;
    setNotice({ text, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setNotice(null), timeout);
  };
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const userIdNum = useMemo(() => Number(userId) || 0, [userId]);

  const loadCompanies = async (uid) => {
    if (!uid) return;
    setLoadingCompanies(true);
    setError("");
    try {
      const list = await getEmployerCompanies(Number(uid));
      setCompanies(list || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load companies.");
      setCompanies([]);
      const msg = typeof e?.response?.data === "string" ? e.response.data : (e?.message || "Failed to load companies.");
      showNotice(msg, "danger");
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (userIdNum > 0) loadCompanies(userIdNum);
    // load categories map once for display names
    (async () => {
      setCategoriesLoading(true);
      try {
        const cats = await getAllCategories();
        if (Array.isArray(cats)) {
          setCategories(cats);
          const m = {};
          cats.forEach((c, i) => {
            const id = c.id ?? c._id ?? i;
            m[id] = c.name ?? c.title ?? c.category ?? String(id);
          });
          setCategoriesMap(m);
        }
      } catch (err) {
        console.warn("Failed to load categories", err);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdNum]);

  const loadJobsForCompany = async (companyId) => {
    setJobsByCompany((prev) => ({ ...prev, [companyId]: { ...(prev[companyId] || {}), loading: true, error: "" } }));
    try {
      const res = await getJobs({
        page: 1,
        size: 50,
        companyId: Number(companyId),
      });
      setJobsByCompany((prev) => ({
        ...prev,
        [companyId]: { loading: false, error: "", items: res.items || [] },
      }));
      // show jobs after successful load
      setShowJobsByCompany((s) => ({ ...s, [companyId]: true }));
    } catch (e) {
      console.error(e);
      setJobsByCompany((prev) => ({
        ...prev,
        [companyId]: { loading: false, error: "Failed to load jobs.", items: [] },
      }));
    }
  };

  // Toggle show/hide jobs for a company. If not loaded yet, load then show.
  const toggleJobs = async (companyId) => {
    const visible = Boolean(showJobsByCompany[companyId]);
    if (visible) {
      // hide only
      setShowJobsByCompany((s) => ({ ...s, [companyId]: false }));
      return;
    }
    // if items already loaded, just show; otherwise load then show
    const compState = jobsByCompany[companyId];
    if (compState && Array.isArray(compState.items) && compState.items.length >= 0) {
      setShowJobsByCompany((s) => ({ ...s, [companyId]: true }));
      return;
    }
    await loadJobsForCompany(companyId);
  };

  // editing job: helper input for adding a new skill (simple text)
  const [newSkillInput, setNewSkillInput] = useState("");
  const [skillsLookup, setSkillsLookup] = useState({}); // optional cache for skill names by id
  // global skills list + modal state to match AddJob UI
  const [skillsList, setSkillsList] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [skillModalSearch, setSkillModalSearch] = useState("");
  const [skillModalSelected, setSkillModalSelected] = useState(new Set());
  // fetch initial skill list lazily if needed (not required; optional)
  const fetchSkillById = async (id) => {
    if (!id) return null;
    if (skillsLookup[id]) return skillsLookup[id];
    try {
      const res = await getSkillById(Number(id));
      const data = res?.data ?? res ?? null;
      setSkillsLookup((p) => ({ ...p, [id]: data }));
      return data;
    } catch {
      return null;
    }
  };

  // load skills list (for modal) once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSkillsLoading(true);
      try {
        const res = await getSkillList({ page: 1, size: 500 });
        const items = res?.items ?? (Array.isArray(res) ? res : []);
        if (cancelled) return;
        setSkillsList(items);
      } catch {
        if (!cancelled) setSkillsList([]);
      } finally {
        if (!cancelled) setSkillsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Skill modal helpers (for editingJob)
  const openSkillModalForEdit = () => {
    if (!editingJob) return;
    const selected = new Set(
      (editingJob.skills || [])
        .map((sk) => Number(sk?.skillId ?? sk?.id ?? (typeof sk === "number" ? sk : NaN)))
        .filter(Boolean)
    );
    setSkillModalSelected(selected);
    setSkillModalSearch("");
    setSkillModalOpen(true);
  };
  const closeSkillModal = () => setSkillModalOpen(false);
  const toggleSkillModalSelect = (id) => {
    setSkillModalSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const confirmSkillModal = () => {
    // apply selected ids to editingJob.skills (preserve existing meta if present)
    setEditingJob((prev) => {
      if (!prev) return prev;
      const selectedIds = Array.from(skillModalSelected).map((x) => Number(x));
      const existing = Array.isArray(prev.skills) ? prev.skills : [];
      const byId = new Map();
      existing.forEach((sk) => {
        const sid = Number(sk?.skillId ?? sk?.id ?? (typeof sk === "number" ? sk : NaN));
        if (sid) byId.set(sid, sk);
      });
      const nextSkills = selectedIds.map((id) => {
        if (byId.has(id)) return byId.get(id);
        const metaName = skillsList.find((s) => (s.id ?? s._id) === id)?.name ?? undefined;
        return { skillId: id, requiredLevel: 1, priority: 1, name: metaName };
      });
      return { ...prev, skills: nextSkills };
    });
    setSkillModalOpen(false);
  };

  // --- Skill editing helpers for editingJob (add / set level / set priority) ---
  const addSkillToEditing = (input) => {
    if (!editingJob) return;
    const trimmed = String(input || "").trim();
    if (!trimmed) return;
    setEditingJob((prev) => {
      if (!prev) return prev;
      const next = Array.isArray(prev.skills) ? [...prev.skills] : [];
      if (/^\d+$/.test(trimmed)) {
        next.push({ skillId: Number(trimmed), requiredLevel: 1, priority: 1 });
      } else {
        next.push({ name: trimmed, requiredLevel: 1, priority: 1 });
      }
      return { ...prev, skills: next };
    });
    setNewSkillInput("");
  };

  const setSkillLevelInEditing = (idx, level) => {
    setEditingJob((prev) => {
      if (!prev) return prev;
      const arr = Array.isArray(prev.skills) ? [...prev.skills] : [];
      if (idx < 0 || idx >= arr.length) return prev;
      const item = { ...(arr[idx] || {}) };
      item.requiredLevel = Number(level);
      arr[idx] = item;
      return { ...prev, skills: arr };
    });
  };

  const setSkillPriorityInEditing = (idx, priority) => {
    setEditingJob((prev) => {
      if (!prev) return prev;
      const arr = Array.isArray(prev.skills) ? [...prev.skills] : [];
      if (idx < 0 || idx >= arr.length) return prev;
      const item = { ...(arr[idx] || {}) };
      item.priority = Number(priority);
      arr[idx] = item;
      return { ...prev, skills: arr };
    });
  };

  // remove skill by index from editingJob.skills (immutable)
  const removeSkillFromEditing = (idx) => {
    setEditingJob((prev) => {
      if (!prev) return prev;
      const arr = Array.isArray(prev.skills) ? [...prev.skills] : [];
      if (idx < 0 || idx >= arr.length) return prev;
      arr.splice(idx, 1);
      return { ...prev, skills: arr };
    });
    // also ensure modal staging is consistent (remove by skillId if present)
    setSkillModalSelected((prev) => {
      try {
        const next = new Set(prev);
        // try to remove skillId at idx if exists
        const sid = editingJob?.skills?.[idx]?.skillId ?? editingJob?.skills?.[idx]?.id;
        if (sid != null) next.delete(Number(sid));
        return next;
      } catch {
        return prev;
      }
    });
  };
  // --- end skill editing helpers ---

  // include full job fields when entering edit mode
  const onEditClick = (job, companyId) => {
    setEditingJob({
      id: job.id ?? job._id,
      companyId,
      title: job.title ?? "",
      type: job.type ?? "Full-time",
      status: Number(job.status ?? 1),
      deadline: job.deadline ?? "",
      // keep original fields to prevent PUT nulling them on server
      description: job.description ?? "",
      requirements: job.requirements ?? "",
      salaryRange: job.salaryRange ?? "",
      location: job.location ?? "",
      categoryId: job.categoryId ?? job.category?.id ?? undefined,
      requiredEducation: job.requiredEducation ?? "NONE",
      requiredExperienceYears: job.requiredExperienceYears ?? 0,
      // include skills if present (array)
      skills: Array.isArray(job.skills) ? job.skills.map((s) => {
        // normalize skill entry to object with skillId/name + defaults
        if (s == null) return null;
        if (typeof s === "number") return { skillId: s, requiredLevel: 1, priority: 1 };
        if (typeof s === "string") return (/^\d+$/.test(s) ? { skillId: Number(s), requiredLevel: 1, priority: 1 } : { name: s, requiredLevel: 1, priority: 1 });
        if (typeof s === "object") {
          return {
            skillId: s.skillId ?? s.id ?? undefined,
            name: s.name ?? s.title ?? undefined,
            requiredLevel: s.requiredLevel ?? s.level ?? 1,
            priority: s.priority ?? 1,
          };
        }
        return null;
      }).filter(Boolean) : [],
    });
  };

  const onCancelEdit = () => setEditingJob(null);

  const onSaveJob = async () => {
    if (!editingJob?.id) return;
    const {
      id,
      companyId,
      title,
      type,
      status,
      deadline,
      description,
      requirements,
      salaryRange,
      location,
      categoryId,
      requiredEducation,
      requiredExperienceYears,
      skills,
    } = editingJob;

    const payload = {
      companyId: Number(companyId),
      title: (title || "").trim(),
      description: description ?? "",
      requirements: requirements ?? "",
      salaryRange: salaryRange ?? "",
      location: location ?? "",
      type,
      status: Number(status),
      deadline: deadline || null,
      requiredEducation: requiredEducation || "NONE",
      requiredExperienceYears: Number(requiredExperienceYears ?? 0),
      ...(categoryId !== undefined && categoryId !== null ? { categoryId: Number(categoryId) } : {}),
      // include skills if any (map to expected shape)
      ...(Array.isArray(skills) && skills.length > 0 ? {
        skills: skills.map((s) => {
          // prefer numeric skillId
          if (s == null) return null;
          if (s.skillId || s.id) {
            return { skillId: Number(s.skillId ?? s.id), requiredLevel: Number(s.requiredLevel ?? 1), priority: Number(s.priority ?? 1) };
          }
          if (typeof s === "number") return { skillId: Number(s), requiredLevel: 1, priority: 1 };
          if (typeof s === "string" && /^\d+$/.test(s)) return { skillId: Number(s), requiredLevel: 1, priority: 1 };
          // fallback: send name (server may ignore or create)
          return { name: String(s.name ?? s).trim(), requiredLevel: Number(s.requiredLevel ?? 1), priority: Number(s.priority ?? 1) };
        }).filter(Boolean),
      } : {}),
    };

    try {
      await updateJob(id, payload);
      await loadJobsForCompany(companyId);
      setEditingJob(null);
      showNotice("Job updated successfully.", "success");
    } catch (e) {
      console.error(e);
      const msg =
        typeof e?.response?.data === "string"
          ? e.response.data
          : e?.response?.data?.message || e?.message || "Update job failed";
      showNotice(msg, "danger");
    }
  };

  const onDeleteJob = async (companyId, jobId) => {
    try {
      await deleteJob(jobId);
      await loadJobsForCompany(companyId);
      showNotice("Job deleted.", "success");
    } catch (e) {
      console.error(e);
      showNotice(e?.response?.data?.message || e?.message || "Delete job failed", "danger");
    }
  };

  const normalizeCompany = (c = {}) => ({
    id: c.id ?? c.companyId ?? c.company?.id ?? "",
    name: c.name ?? "",
    tagline: c.tagline ?? "",
    website: c.website ?? "",
    employees: c.employees ?? c.employeeCount ?? "",
    workingTime: c.workingTime ?? c.working_time ?? "",
    establishedYear: c.establishedYear ?? c.established_year ?? "",
    ownerName: c.ownerName ?? c.owner_name ?? "",
    categoryId: c.categoryId ?? c.category_id ?? c.category?.id ?? "",
    description: c.description ?? "",
    logoUrl: c.logoUrl ?? c.logo_url ?? "",
  });

  const defaultCompany = (c = {}) => ({
    name: c.name ?? "",
    tagline: c.tagline ?? "",
    website: c.website ?? "",
    employees: c.employees ?? "",
    workingTime: c.workingTime ?? "",
    establishedYear: c.establishedYear ?? "",
    ownerName: c.ownerName ?? "",
    categoryId: c.categoryId ?? "",
    description: c.description ?? "",
    logoUrl: c.logoUrl ?? "",
  });

  const toggleCompanyDetails = async (companyId) => {
    setOpenDetails((prev) => ({ ...prev, [companyId]: !prev[companyId] }));
    const cached = compFullById[companyId];
    if (!cached) {
      setCompFullById((prev) => ({ ...prev, [companyId]: { loading: true, error: "", data: null } }));
      try {
        const data = await getCompanyFull(companyId);
        setCompFullById((prev) => ({ ...prev, [companyId]: { loading: false, error: "", data } }));
      } catch (e) {
        setCompFullById((prev) => ({ ...prev, [companyId]: { loading: false, error: "Failed to load company info.", data: null } }));
      }
    }
  };

  const onEditCompany = async (c) => {
    const cid = c?.id;
    if (!cid) return;
    setEditingCompanyId(cid);
    const fillAddrSocial = (fullObj) => {
      const addr = fullObj?.address ?? fullObj?.data?.address ?? {};
      setAddressForm({
        email: addr.email || "",
        phone: addr.phone || "",
        landline: addr.landline || "",
        address: addr.address || "",
        address2: addr.address2 || "",
        zipCode: addr.zipCode || "",
        city: addr.city || "",
        state: addr.state || "",
        country: addr.country || "",
      });
      const socials = fullObj?.socials ?? fullObj?.data?.socials ?? [];
      setSocialsForm((socials || []).map((s) => ({ id: s.id, platform: s.platform || "", url: s.url || "" })));
      setEditingAddressId(cid);
      setEditingSocials(cid);
    };

    const cached = compFullById[cid]?.data?.company;
    if (cached) {
      setCompanyForm(normalizeCompany(cached));
      fillAddrSocial(compFullById[cid]?.data ?? compFullById[cid]);
      return;
    }
    setEditingLoading(true);
    try {
      const full = await getCompanyFull(cid);
      setCompFullById((prev) => ({ ...prev, [cid]: { loading: false, error: "", data: full } }));
      setCompanyForm(normalizeCompany(full?.company || c));
      fillAddrSocial(full);
    } catch (e) {
      setCompanyForm(normalizeCompany(c));
    } finally {
      setEditingLoading(false);
    }
  };
  const onCancelCompanyEdit = () => {
    setEditingCompanyId(null);
    setCompanyForm(defaultCompany());
    setEditingAddressId(null);
    setEditingSocials(false);
    setAddressForm({
      email: "", phone: "", landline: "", address: "", address2: "",
      zipCode: "", city: "", state: "", country: ""
    });
    setSocialsForm([]);
  };
  const onCompanyFieldChange = (e) => {
    const { name, value } = e.target;
    setCompanyForm((f) => ({ ...f, [name]: value }));
  };
  const onSaveCompany = async (companyId, keepEditing = false) => {
    try {
      const toNum = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
      const payload = {
        name: (companyForm.name || "").trim(),
        tagline: companyForm.tagline ?? "",
        website: companyForm.website ?? "",
        employees: toNum(companyForm.employees),
        workingTime: companyForm.workingTime ?? "",
        establishedYear: toNum(companyForm.establishedYear),
        ownerName: companyForm.ownerName ?? "",
        categoryId: companyForm.categoryId !== "" ? Number(companyForm.categoryId) : null,
        description: companyForm.description ?? "",
        logoUrl: companyForm.logoUrl ?? "",
      };
      await updateCompany(companyId, payload);
      await loadCompanies(userIdNum);
      if (openDetails[companyId]) {
        try {
          const data = await getCompanyFull(companyId);
          setCompFullById((prev) => ({ ...prev, [companyId]: { loading: false, error: "", data } }));
        } catch { /* ignore */ }
      }
      if (!keepEditing) {
        setEditingCompanyId(null);
      }
      showNotice && showNotice("Company updated successfully.", "success");
    } catch (e) {
      const msg = typeof e?.response?.data === "string" ? e.response.data : (e?.message || "Update company failed");
      showNotice ? showNotice(msg, "danger") : alert(msg);
    }
  };
  const onSaveAll = async (companyId) => {
    try {
      await onSaveCompany(companyId, true);
      await onSaveAddress(companyId, true);
      await onSaveSocials(companyId, true);
      setEditingCompanyId(null);
      setEditingAddressId(null);
      setEditingSocials(false);
      showNotice("Saved company, address, and socials.", "success");
    } catch (e) {
      const msg = typeof e?.response?.data === "string" ? e.response.data : (e?.message || "Save failed");
      showNotice(msg, "danger");
    }
  };
  const onEditAddress = (companyId) => {
    const full = compFullById[companyId];
    const addr = full?.data?.address || {};
    setAddressForm({
      email: addr.email || "",
      phone: addr.phone || "",
      landline: addr.landline || "",
      address: addr.address || "",
      address2: addr.address2 || "",
      zipCode: addr.zipCode || "",
      city: addr.city || "",
      state: addr.state || "",
      country: addr.country || "",
    });
    setEditingAddressId(companyId);
  };

  const onCancelAddressEdit = () => {
    setEditingAddressId(null);
    setAddressForm({
      email: "", phone: "", landline: "", address: "", address2: "",
      zipCode: "", city: "", state: "", country: ""
    });
  };

  const onAddressFieldChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((f) => ({ ...f, [name]: value }));
  };

  const onSaveAddress = async (companyId) => {
    try {
      const full = compFullById[companyId];
      const existingAddr = full?.data?.address;
      
      const payload = {
        companyId: Number(companyId),
        email: addressForm.email?.trim() || "",
        phone: addressForm.phone?.trim() || "",
        landline: addressForm.landline?.trim() || "",
        address: addressForm.address?.trim() || "",
        address2: addressForm.address2?.trim() || "",
        zipCode: addressForm.zipCode?.trim() || "",
        city: addressForm.city?.trim() || "",
        state: addressForm.state?.trim() || "",
        country: addressForm.country?.trim() || "",
      };

      if (existingAddr?.id) {
        await updateCompanyAddress(existingAddr.id, payload);
      } else {
        await createCompanyAddress(payload);
      }

      const data = await getCompanyFull(companyId);
      setCompFullById((prev) => ({ ...prev, [companyId]: { loading: false, error: "", data } }));
      
      setEditingAddressId(null);
      showNotice("Address updated successfully.", "success");
    } catch (e) {
      const msg = typeof e?.response?.data === "string" ? e.response.data : (e?.message || "Update address failed");
      showNotice(msg, "danger");
    }
  };

  const onEditSocials = (companyId) => {
    const full = compFullById[companyId];
    const socials = full?.data?.socials || [];
    setSocialsForm(socials.map(s => ({ id: s.id, platform: s.platform || "", url: s.url || "" })));
    setEditingSocials(companyId);
  };

  const onCancelSocialsEdit = () => {
    setEditingSocials(false);
    setSocialsForm([]);
  };

  const onSocialFieldChange = (index, field, value) => {
    setSocialsForm(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addSocialRow = () => {
    setSocialsForm(prev => [...prev, { id: null, platform: "", url: "" }]);
  };

  const removeSocialRow = (index) => {
    setSocialsForm(prev => prev.filter((_, i) => i !== index));
  };

  const onSaveSocials = async (companyId) => {
    try {
      const full = compFullById[companyId];
      const existingSocials = full?.data?.socials || [];
      
      const existingIds = existingSocials.map(s => s.id);
      const formIds = socialsForm.filter(s => s.id).map(s => s.id);
      const toDelete = existingIds.filter(id => !formIds.includes(id));
      
      for (const id of toDelete) {
        await deleteCompanySocial(id);
      }

      for (const social of socialsForm) {
        if (!social.platform?.trim() || !social.url?.trim()) continue;
        
        const payload = {
          companyId: Number(companyId),
          platform: social.platform.trim(),
          url: social.url.trim(),
        };

        if (social.id) {
          await updateCompanySocial(social.id, payload);
        } else {
          await createCompanySocial(payload);
        }
      }

      const data = await getCompanyFull(companyId);
      setCompFullById((prev) => ({ ...prev, [companyId]: { loading: false, error: "", data } }));
      
      setEditingSocials(false);
      showNotice("Social links updated successfully.", "success");
    } catch (e) {
      const msg = typeof e?.response?.data === "string" ? e.response.data : (e?.message || "Update socials failed");
      showNotice(msg, "danger");
    }
  };

  const onDeleteCompany = async (companyId) => {
    try {
      await deleteCompany(companyId);
      await loadCompanies(userIdNum);
      setCompFullById((prev) => {
        const n = { ...prev };
        delete n[companyId];
        return n;
      });
      showNotice("Company deleted.", "success");
    } catch (e) {
      console.error(e);
      const msg = typeof e?.response?.data === "string" ? e.response.data : (e?.message || "Delete company failed");
      showNotice(msg, "danger");
    }
  };

  // Confirm delete modal state
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });
  const openConfirm = (payload) => setConfirm({ open: true, ...payload });
  const closeConfirm = () => setConfirm({ open: false, title: "", message: "", onConfirm: null });

  // Open modal helpers
  const requestDeleteJob = (companyId, jobId) => {
    openConfirm({
      title: "Delete Job",
      message: "Are you sure you want to delete this job? This action cannot be undone.",
      onConfirm: async () => {
        closeConfirm();
        await onDeleteJob(companyId, jobId);
      },
    });
  };
  const requestDeleteCompany = (companyId) => {
    openConfirm({
      title: "Delete Company",
      message: "Are you sure you want to delete this company? This action cannot be undone.",
      onConfirm: async () => {
        closeConfirm();
        await onDeleteCompany(companyId);
      },
    });
  };

  return (
    <>
      <Header />
      {notice && (
        <div className={`alert alert-${notice.type} company-notice`} role="alert">
          <button
            type="button"
            className="close company-noticeClose"
            aria-label="Close"
            onClick={() => setNotice(null)}
          >
            <span aria-hidden="true">×</span>
          </button>
          {notice.text}
        </div>
      )}

      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>My Companies</h2>
            <p>
              <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> Companies
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {/* Companies list */}
          <div className="row">
            <div className="col-md-12">
              {error && <div className="alert alert-danger">{error}</div>}
              {loadingCompanies ? (
                <div className="text-center">Loading companies...</div>
              ) : companies.length === 0 ? (
                <div className="text-center">No companies.</div>
              ) : (
                companies.map((c) => {
                  const companyId = c.id;
                  const compState = jobsByCompany[companyId] || {};
                  const isEditingCompany = editingCompanyId === companyId;
                  const full = compFullById[companyId];

                  return (
                    <div className="box box-hover-shadow" key={companyId}>
                      <div className="box-header">
                        <h4 className="mrg-0">{c.name}</h4>
                      </div>
                      <div className="box-body">
                        {/* Company actions */}
                        <div className="row">
                          <div className="col-md-8">
                            <div className="mrg-bot-10">
                              <h4><strong>Name:</strong> {c.name ?? companyId}</h4>
                            </div>
                          </div>
                          <div className="col-md-4 text-right">
                            <button
                              type="button"
                              className="btn btn-sm btn-general-theme-bg"
                              onClick={() => toggleCompanyDetails(companyId)}
                            >
                              {openDetails[companyId] ? "Hide Info" : "View Info"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm light-gray-btn mrg-l-10"
                              onClick={() => onEditCompany(c)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger mrg-l-10"
                              onClick={() => requestDeleteCompany(companyId)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Company detail or edit form */}
                        {isEditingCompany ? (
                          <div className="row mrg-top-10">
                            {editingLoading ? (
                              <div className="col-md-12">Loading company...</div>
                            ) : (
                              <>
                                <div className="col-md-6">
                                  <label>Name</label>
                                  <input className="form-control" name="name" value={companyForm.name} onChange={onCompanyFieldChange} />
                                </div>
                                <div className="col-md-6">
                                  <label>Tagline</label>
                                  <input className="form-control" name="tagline" value={companyForm.tagline} onChange={onCompanyFieldChange} />
                                </div>
                                <div className="col-md-6">
                                  <label>Website</label>
                                  <input className="form-control" name="website" value={companyForm.website} onChange={onCompanyFieldChange} />
                                </div>
                                <div className="col-md-6">
                                  <label>Employees</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    name="employees"
                                    value={companyForm.employees}
                                    onChange={(e) => setCompanyForm((f) => ({ ...f, employees: e.target.value }))}
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label>Working Time</label>
                                  <input className="form-control" name="workingTime" value={companyForm.workingTime} onChange={onCompanyFieldChange} />
                                </div>
                                <div className="col-md-6">
                                  <label>Established Year</label>
                                  <input
                                    type="number"
                                    className="form-control"
                                    name="establishedYear"
                                    value={companyForm.establishedYear}
                                    onChange={(e) => setCompanyForm((f) => ({ ...f, establishedYear: e.target.value }))}
                                  />
                                </div>
                                <div className="col-md-6">
                                  <label>Owner Name</label>
                                  <input className="form-control" name="ownerName" value={companyForm.ownerName} onChange={onCompanyFieldChange} />
                                </div>
                                <div className="col-md-6">
                                  <label>Category</label>
                                  {!categoriesLoading ? (
                                    <select
                                      className="form-control"
                                      name="categoryId"
                                      value={companyForm.categoryId ?? ""}
                                      onChange={(e) => setCompanyForm((f) => ({ ...f, categoryId: e.target.value }))
                                      }
                                    >
                                      {categories.map((cat) => (
                                        <option key={cat.id ?? cat._id} value={cat.id ?? cat._id}>
                                          {cat.name ?? cat.title ?? String(cat.id ?? cat._id)}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input type="text" className="form-control" disabled value="Loading categories..." />
                                  )}
                                </div>
                                <div className="col-md-12">
                                  <label>Description</label>
                                  <textarea className="form-control" rows={3} name="description" value={companyForm.description} onChange={onCompanyFieldChange} />
                                </div>
                                <div className="col-md-12">
                                  <label>Logo</label>
                                  <div className="d-flex align-items-center company-logoRow">
                                    {companyForm.logoUrl ? (
                                      <img
                                        src={companyForm.logoUrl}
                                        alt="Logo Preview"
                                        className="logo-preview"
                                      />
                                    ) : (
                                      <span className="text-muted">No logo</span>
                                    )}
                                  </div>
                                  <div className="mrg-top-10">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="form-control"
                                      onChange={async (e) => {
                                        const file = e.target.files && e.target.files[0];
                                        if (!file) return;
                                        setUploadingLogo(true);
                                        try {
                                          const url = await uploadImage(file);
                                          setCompanyForm((f) => ({ ...f, logoUrl: url }));
                                          showNotice && showNotice("Logo uploaded.", "success");
                                        } catch (err) {
                                          showNotice && showNotice(err?.message || "Upload logo failed", "danger");
                                        } finally {
                                          setUploadingLogo(false);
                                        }
                                      }}
                                    />
                                    {uploadingLogo && <small className="text-muted">Uploading...</small>}
                                  </div>
                                </div>
                                {/* Address edit section */}
                                <div className="col-md-12 mrg-top-20">
                                  <h4>Address</h4>
                                </div>
                                <div className="col-md-4">
                                  <label>Email</label>
                                  <input className="form-control" name="email" value={addressForm.email} onChange={onAddressFieldChange} />
                                </div>
                                <div className="col-md-4">
                                  <label>Phone</label>
                                  <input className="form-control" name="phone" value={addressForm.phone} onChange={onAddressFieldChange} />
                                </div>
                                <div className="col-md-4">
                                  <label>Landline</label>
                                  <input className="form-control" name="landline" value={addressForm.landline} onChange={onAddressFieldChange} />
                                </div>
                                <div className="col-md-6">
                                  <label>Address</label>
                                  <input className="form-control" name="address" value={addressForm.address} onChange={onAddressFieldChange} />
                                </div>
                                <div className="col-md-6">
                                  <label>Address 2</label>
                                  <input className="form-control" name="address2" value={addressForm.address2} onChange={onAddressFieldChange} />
                                </div>
                                <div className="col-md-3">
                                  <label>Zip Code</label>
                                  <input className="form-control" name="zipCode" value={addressForm.zipCode} onChange={onAddressFieldChange} />
                                </div>
                                <div className="col-md-3">
                                  <label>City</label>
                                  <input className="form-control" name="city" value={addressForm.city} onChange={onAddressFieldChange} />
                                </div>
                                <div className="col-md-3">
                                  <label>State</label>
                                  <input className="form-control" name="state" value={addressForm.state} onChange={onAddressFieldChange} />
                                </div>
                                <div className="col-md-3">
                                  <label>Country</label>
                                  <input className="form-control" name="country" value={addressForm.country} onChange={onAddressFieldChange} />
                                </div>
                                {/* Socials edit section */}
                                <div className="col-md-12 mrg-top-20">
                                  <h4>Social Links</h4>
                                </div>
                                {socialsForm.map((social, idx) => (
                                  <div key={idx} className="col-md-12 mrg-bot-10">
                                    <div className="row">
                                      <div className="col-md-5">
                                        <label>Platform</label>
                                        <input
                                          className="form-control"
                                          placeholder="Facebook, LinkedIn, etc."
                                          value={social.platform}
                                          onChange={(e) => onSocialFieldChange(idx, 'platform', e.target.value)}
                                        />
                                      </div>
                                      <div className="col-md-6">
                                        <label>URL</label>
                                        <input
                                          className="form-control"
                                          placeholder="https://..."
                                          value={social.url}
                                          onChange={(e) => onSocialFieldChange(idx, 'url', e.target.value)}
                                        />
                                      </div>
                                      <div className="col-md-1 company-socialRemove">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-danger"
                                          onClick={() => removeSocialRow(idx)}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <div className="col-md-12">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-default mrg-r-10"
                                    onClick={addSocialRow}
                                  >
                                    + Add Social Link
                                  </button>
                                </div>
                                <div className="col-md-12 mrg-top-20 text-left">
                                  <button className="btn theme-btn mrg-r-10" onClick={() => onSaveAll(companyId)}>Save</button>
                                  <button className="btn btn-default" onClick={onCancelCompanyEdit}>Cancel</button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : openDetails[companyId] ? (
                          <div className="row mrg-top-10">
                            {full?.loading ? (
                              <div className="col-md-12">Loading company info...</div>
                            ) : full?.error ? (
                              <div className="col-md-12 alert alert-danger">{full.error}</div>
                            ) : (
                              <>
                                {(() => {
                                  const comp = full?.data?.company ?? c;
                                  return (
                                    <>
                                      <div className="col-md-6">
                                        <ul className="detail-list">
                                          <li><strong>Tagline:</strong> {comp?.tagline || "-"}</li>
                                          <li>
                                            <strong>Website:</strong>{" "}
                                            {comp?.website ? (
                                              <a href={comp.website} target="_blank" rel="noreferrer">{comp.website}</a>
                                            ) : ("-")}
                                          </li>
                                          <li><strong>Employees:</strong> {comp?.employees ?? "-"}</li>
                                          <li><strong>Working Time:</strong> {comp?.workingTime || "-"}</li>
                                        </ul>
                                      </div>
                                      <div className="col-md-6">
                                        <ul className="detail-list">
                                          <li><strong>Established:</strong> {comp?.establishedYear ?? "-"}</li>
                                          <li><strong>Owner:</strong> {comp?.ownerName || "-"}</li>
                                          <li>
                                            <strong>Category:</strong>{" "}
                                            {(
                                              (comp && (
                                                categoriesMap[comp.categoryId] ||
                                                comp.category?.name ||
                                                comp.categoryName ||
                                                comp.categoryId
                                              ))
                                            ) ?? "-"}
                                          </li>
                                        </ul>
                                      </div>
                                      <div className="col-md-12">
                                        <strong>Description:</strong>
                                        <div>{comp?.description || "-"}</div>
                                      </div>
                                    </>
                                  );
                                })()}
                                 {full?.data?.address && (
                                   <div className="col-md-12 mrg-top-10">
                                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                       <h4><strong>Address</strong></h4>
                                       {editingAddressId !== companyId && (
                                         <button
                                           type="button"
                                           className="btn btn-sm light-gray-btn"
                                           onClick={() => onEditAddress(companyId)}
                                         >
                                           Edit Address
                                         </button>
                                       )}
                                     </div>
                                     {editingAddressId === companyId ? (
                                       <div className="row">
                                         <div className="col-md-4">
                                           <label>Email</label>
                                           <input className="form-control" name="email" value={addressForm.email} onChange={onAddressFieldChange} />
                                         </div>
                                         <div className="col-md-4">
                                           <label>Phone</label>
                                           <input className="form-control" name="phone" value={addressForm.phone} onChange={onAddressFieldChange} />
                                         </div>
                                         <div className="col-md-4">
                                           <label>Landline</label>
                                           <input className="form-control" name="landline" value={addressForm.landline} onChange={onAddressFieldChange} />
                                         </div>
                                         <div className="col-md-6">
                                           <label>Address</label>
                                           <input className="form-control" name="address" value={addressForm.address} onChange={onAddressFieldChange} />
                                         </div>
                                         <div className="col-md-6">
                                           <label>Address 2</label>
                                           <input className="form-control" name="address2" value={addressForm.address2} onChange={onAddressFieldChange} />
                                         </div>
                                         <div className="col-md-3">
                                           <label>Zip Code</label>
                                           <input className="form-control" name="zipCode" value={addressForm.zipCode} onChange={onAddressFieldChange} />
                                         </div>
                                         <div className="col-md-3">
                                           <label>City</label>
                                           <input className="form-control" name="city" value={addressForm.city} onChange={onAddressFieldChange} />
                                         </div>
                                         <div className="col-md-3">
                                           <label>State</label>
                                           <input className="form-control" name="state" value={addressForm.state} onChange={onAddressFieldChange} />
                                         </div>
                                         <div className="col-md-3">
                                           <label>Country</label>
                                           <input className="form-control" name="country" value={addressForm.country} onChange={onAddressFieldChange} />
                                         </div>
                                         <div className="col-md-12" style={{ marginTop: "10px" }}>
                                           <button className="btn theme-btn" style={{ marginRight: "10px" }} onClick={() => onSaveAddress(companyId)}>Save</button>
                                           <button className="btn btn-default" onClick={onCancelAddressEdit}>Cancel</button>
                                         </div>
                                       </div>
                                     ) : (
                                       <ul className="detail-list">
                                         <li><strong>Email:</strong> {full.data.address.email || "-"}</li>
                                         <li><strong>Phone:</strong> {full.data.address.phone || "-"}</li>
                                         <li><strong>Address:</strong> {full.data.address.address || "-"}</li>
                                         <li><strong>City/State/Country:</strong> {[full.data.address.city, full.data.address.state, full.data.address.country].filter(Boolean).join(", ") || "-"}</li>
                                       </ul>
                                     )}
                                   </div>
                                 )}
                                 {(Array.isArray(full?.data?.socials) || editingSocials === companyId) && (
                                   <div className="col-md-12 mrg-top-10">
                                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                       <h4><strong>Socials</strong></h4>
                                       {editingSocials !== companyId && (
                                         <button
                                           type="button"
                                           className="btn btn-sm light-gray-btn"
                                           onClick={() => onEditSocials(companyId)}
                                         >
                                           Edit Socials
                                         </button>
                                       )}
                                     </div>
                                     {editingSocials === companyId ? (
                                       <div className="row">
                                         {socialsForm.map((social, idx) => (
                                           <div key={idx} className="col-md-12" style={{ marginBottom: "10px" }}>
                                             <div className="row">
                                               <div className="col-md-5">
                                                 <label>Platform</label>
                                                 <input
                                                   className="form-control"
                                                   placeholder="Facebook, LinkedIn, etc."
                                                   value={social.platform}
                                                   onChange={(e) => onSocialFieldChange(idx, 'platform', e.target.value)}
                                                 />
                                               </div>
                                               <div className="col-md-6">
                                                 <label>URL</label>
                                                 <input
                                                   className="form-control"
                                                   placeholder="https://..."
                                                   value={social.url}
                                                   onChange={(e) => onSocialFieldChange(idx, 'url', e.target.value)}
                                                 />
                                               </div>
                                               <div className="col-md-1 company-socialRemove">
                                                 <button
                                                   type="button"
                                                   className="btn btn-sm btn-danger"
                                                   onClick={() => removeSocialRow(idx)}
                                                 >
                                                   ×
                                                 </button>
                                               </div>
                                             </div>
                                           </div>
                                         ))}
                                         <div className="col-md-12">
                                           <button
                                             type="button"
                                             className="btn btn-sm btn-default"
                                             style={{ marginRight: "10px" }}
                                             onClick={addSocialRow}
                                           >
                                             + Add Social Link
                                           </button>
                                         </div>
                                         <div className="col-md-12" style={{ marginTop: "10px" }}>
                                           <button className="btn theme-btn" style={{ marginRight: "10px" }} onClick={() => onSaveSocials(companyId)}>Save</button>
                                           <button className="btn btn-default" onClick={onCancelSocialsEdit}>Cancel</button>
                                         </div>
                                       </div>
                                     ) : full?.data?.socials && full.data.socials.length > 0 ? (
                                       <ul className="detail-list">
                                         {full.data.socials.map((s, idx) => (
                                           <li key={idx}><strong>{s.platform}:</strong> {s.url}</li>
                                         ))}
                                       </ul>
                                     ) : (
                                       <p className="text-muted">No social links</p>
                                     )}
                                   </div>
                                 )}
                               </>
                             )}
                           </div>
                         ) : null}

                        <div className="row mrg-top-10">
                          <div className="col-md-12 text-right">
                            <a
                              className="btn btn-sm btn-general-theme-bg"
                              href={`/add-job?employerId=${userIdNum}&companyId=${companyId}`}
                              title="Add Job"
                            >
                              + Add Job
                            </a>
                            <button
                              type="button"
                              className="btn btn-sm light-gray-btn mrg-l-10"
                              onClick={() => toggleJobs(companyId)}
                              title={showJobsByCompany[companyId] ? "Hide Jobs" : "View Jobs"}
                            >
                              {showJobsByCompany[companyId] ? "Hide Jobs" : "View Jobs"}
                            </button>
                          </div>
                        </div>
                        {showJobsByCompany[companyId] ? (
                          compState.loading ? (
                            <div className="mrg-top-10">Loading jobs...</div>
                          ) : compState.error ? (
                            <div className="alert alert-danger mrg-top-10">{compState.error}</div>
                          ) : compState.items && compState.items.length === 0 ? (
                            <div className="mrg-top-10">No jobs in this company.</div>
                          ) : (
                            <div className="mrg-top-10">
                              {compState.items.map((j) => {
                                const jid = j.id ?? j._id;
                                const editing = editingJob && editingJob.id === jid;

                                return (
                                  <div className="job-verticle-list" key={jid}>
                                    <div className="vertical-job-card">
                                      <div className="vertical-job-header">
                                        <h4><a href={`/job-detail/${jid}`}>{j.title || "Job"}</a></h4>
                                        <span className="com-tagline">{j.categoryName || j.type || ""}</span>
                                      </div>
                                      <div className="vertical-job-body">
                                        {!editing ? (
                                          <div className="row">
                                            <div className="col-md-9 col-sm-12">
                                              <ul className="can-skils">
                                                <li><strong>Job Type: </strong>{j.type ?? "Full-time"}</li>
                                                {j.salaryRange && <li><strong>Salary: </strong>{j.salaryRange}</li>}
                                                {(j.location || j.deadline) && (
                                                  <>
                                                    {j.location && <li><strong>Location: </strong>{j.location}</li>}
                                                    {j.deadline && <li><strong>Deadline: </strong>{j.deadline}</li>}
                                                  </>
                                                )}
                                              </ul>
                                            </div>
                                            <div className="col-md-3 col-sm-12">
                                              <div className="vrt-job-act">
                                                <button
                                                  type="button"
                                                  className="btn-job light-gray-btn"
                                                  onClick={() => onEditClick(j, companyId)}
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  type="button"
                                                  className="btn-job btn-danger"
                                                  onClick={() => requestDeleteJob(companyId, jid)}
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="row">
                                            <div className="col-md-4">
                                              <label>Title</label>
                                              <input
                                                className="form-control"
                                                value={editingJob.title}
                                                onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                                              />
                                            </div>
                                            <div className="col-md-3">
                                              <label>Type</label>
                                              <select
                                                className="form-control"
                                                value={editingJob.type}
                                                onChange={(e) => setEditingJob({ ...editingJob, type: e.target.value })}
                                              >
                                                <option>Full-time</option>
                                                <option>Part-time</option>
                                                <option>Freelancer</option>
                                                <option>Internship</option>
                                              </select>
                                            </div>
                                            <div className="col-md-2">
                                              <label>Status</label>
                                              <select
                                                className="form-control"
                                                value={editingJob.status}
                                                onChange={(e) => setEditingJob({ ...editingJob, status: Number(e.target.value) })}
                                              >
                                                <option value={0}>Draft</option>
                                                <option value={1}>Active</option>
                                                <option value={2}>Paused</option>
                                                <option value={3}>Expired</option>
                                                <option value={4}>Closed</option>
                                                <option value={5}>Deleted</option>
                                              </select>
                                            </div>
                                            <div className="col-md-3">
                                              <label>Deadline</label>
                                              <input
                                                type="date"
                                                className="form-control"
                                                value={editingJob.deadline || ""}
                                                onChange={(e) => setEditingJob({ ...editingJob, deadline: e.target.value })}
                                              />
                                            </div>
                                            <div className="col-md-6 mrg-top-10">
                                              <label>Salary Range</label>
                                              <input
                                                className="form-control"
                                                placeholder="e.g., $1000 - $1500"
                                                value={editingJob.salaryRange || ""}
                                                onChange={(e) => setEditingJob({ ...editingJob, salaryRange: e.target.value })}
                                              />
                                            </div>
                                            <div className="col-md-6 mrg-top-10">
                                              <label>Location</label>
                                              <input
                                                className="form-control"
                                                placeholder="Location"
                                                value={editingJob.location || ""}
                                                onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                                              />
                                            </div>
                                            <div className="col-md-6 mrg-top-10">
                                              <label>Required Education</label>
                                              <select
                                                className="form-control"
                                                value={editingJob.requiredEducation ?? "NONE"}
                                                onChange={(e) => setEditingJob({ ...editingJob, requiredEducation: e.target.value })}
                                              >
                                                <option value="NONE">None</option>
                                                <option value="HIGH_SCHOOL">High School</option>
                                                <option value="COLLEGE">College</option>
                                                <option value="BACHELOR">Bachelor</option>
                                                <option value="MASTER">Master</option>
                                                <option value="PHD">PhD</option>
                                              </select>
                                            </div>
                                            <div className="col-md-6 mrg-top-10">
                                              <label>Required Experience (Years)</label>
                                              <input
                                                type="number"
                                                className="form-control"
                                                placeholder="0 = Fresher"
                                                value={editingJob.requiredExperienceYears ?? 0}
                                                onChange={(e) => setEditingJob({ ...editingJob, requiredExperienceYears: Number(e.target.value) })}
                                                min="0"
                                              />
                                            </div>
                                            <div className="col-md-12 mrg-top-10">
                                              <label>Description</label>
                                              <textarea
                                                className="form-control"
                                                rows={4}
                                                value={editingJob.description || ""}
                                                onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                                              />
                                            </div>
                                            <div className="col-md-12 mrg-top-10">
                                              <label>Requirements</label>
                                              <textarea
                                                className="form-control"
                                                rows={3}
                                                value={editingJob.requirements || ""}
                                                onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value })}
                                              />
                                            </div>
                                            <div className="col-md-12" style={{ display: "none" }}>
                                              <input
                                                value={editingJob.categoryId ?? ""}
                                                onChange={(e) => setEditingJob({ ...editingJob, categoryId: e.target.value })}
                                              />
                                            </div>
                                            {/* Skills editor */}
                                            <div className="col-md-12 mrg-top-10">
                                              <label>Skills</label>

                                              <div className="company-skillToolbar">
                                                <button type="button" className="btn btn-default" onClick={openSkillModalForEdit}>
                                                  Select Skills
                                                </button>
                                              </div>

                                              <div className="company-skillList">
                                                {(editingJob.skills || []).length === 0 ? (
                                                  <div className="text-muted">No skills added.</div>
                                                ) : (editingJob.skills || []).map((sk, idx) => {
                                                  // prefer name property, otherwise resolve from global skillsList by skillId
                                                  const sid = Number(sk?.skillId ?? sk?.id ?? (typeof sk === "number" ? sk : NaN));
                                                  const resolvedName = sk?.name ?? skillsList.find((s) => (s.id ?? s._id) === sid)?.name;
                                                  const label = resolvedName ?? (sid ? `#${sid}` : (sk?.name ?? "Unnamed"));
                                                  return (
                                                    <div key={idx} className="company-skillRow">
                                                      <div className="company-skillName">
                                                        <strong>{label}</strong>
                                                      </div>
                                                      <div className="company-skillField">
                                                        <small className="company-skillFieldLabel">Years of experience</small>
                                                        <select className="form-control" value={sk.requiredLevel ?? ""} onChange={(e) => setSkillLevelInEditing(idx, e.target.value)}>
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
                                                      <div className="company-skillField">
                                                        <small className="company-skillFieldLabel">Priority</small>
                                                        <select className="form-control" value={sk.priority ?? 1} onChange={(e) => setSkillPriorityInEditing(idx, e.target.value)}>
                                                          <option value={1}>Normal</option>
                                                          <option value={2}>High</option>
                                                        </select>
                                                      </div>
                                                      <div className="company-skillRemoveWrap">
                                                        <button
                                                          type="button"
                                                          className="btn btn-sm btn-danger"
                                                          onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            removeSkillFromEditing(idx);
                                                          }}
                                                        >
                                                          Remove
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                 })}
                                              </div>
                                            </div>
                                            <div className="col-md-12 mrg-top-10">
                                              <button type="button" className="btn theme-btn mrg-r-10" onClick={onSaveJob}>
                                                Save
                                              </button>
                                              <button type="button" className="btn btn-default" onClick={onCancelEdit}>
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Center confirm modal */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirm.onConfirm || closeConfirm}
        onCancel={closeConfirm}
      />
      {/* Skill Picker Modal for editing job */}
      {skillModalOpen && (
        <div className="modal company-modalBackdrop">
          <div className="modal-dialog modal-dialog-centered modal-xl company-modalDialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select Skills</h5>
                <button type="button" className="btn-close" onClick={closeSkillModal} />
              </div>
              <div className="modal-body company-modalBody">
                <div className="mb-2">
                  <input className="form-control" placeholder="Search skills..." value={skillModalSearch} onChange={(e) => setSkillModalSearch(e.target.value)} />
                </div>
                <div className="company-modalSkillList">
                  {skillsLoading ? (
                    <div className="text-muted">Loading skills...</div>
                  ) : skillsList.length === 0 ? (
                    <div className="text-muted">No skills</div>
                  ) : (
                    skillsList
                      .filter((s) => {
                        const q = skillModalSearch.trim().toLowerCase();
                        if (!q) return true;
                        const name = (s.name ?? s.title ?? "").toLowerCase();
                        return name.includes(q) || String(s.id ?? s._id).includes(q);
                      })
                      .map((s) => {
                        const sid = s.id ?? s._id;
                        const checked = skillModalSelected.has(sid);
                        return (
                          <label key={sid} className="company-modalSkillItem">
                            <input type="checkbox" checked={checked} onChange={() => toggleSkillModalSelect(sid)} />
                            <div className="company-modalSkillMeta">
                              <strong>{s.name ?? s.title ?? `#${sid}`}</strong>
                              {s.type && <div className="company-modalSkillType">{s.type}</div>}
                            </div>
                          </label>
                        );
                      })
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={closeSkillModal}>Cancel</button>
                <button type="button" className="btn theme-btn" onClick={confirmSkillModal}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default Company;