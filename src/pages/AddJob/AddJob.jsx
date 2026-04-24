import React, { useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { createJob } from "../../api/jobApi";
import { getAllCareerRoles } from "../../api/careerRoleApi";
import axios from "axios";
import { getEmployerCompanies } from "../../api/userApi";
import { getSkills as getSkillList } from "../../api/skillApi";
import { getUserId as getUserIdFromToken } from "../../utils/jwt";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./AddJob.css";

/**
 * Trạng thái (status) của tin tuyển dụng.
 *
 * 0 = DRAFT      → Tin đang soạn, chưa công khai
 * 1 = ACTIVE     → Tin đang hiển thị, ứng viên có thể ứng tuyển
 * 2 = PAUSED     → Tạm dừng hiển thị, chưa nhận thêm ứng viên
 * 3 = EXPIRED    → Hết hạn (deadline đã qua)
 * 4 = CLOSED     → Đã đóng bởi nhà tuyển dụng
 * 5 = DELETED    → Đã xóa logic, ẩn khỏi hệ thống
 */

const AddJob = () => {
  const [form, setForm] = useState({
    companyId: "",
    title: "",
    description: "",
    requirements: "",
    salaryRange: "",
    location: "",
    careerRoleId: "",
    type: "Full-time",
    deadline: "",
    status: 1,
    requiredEducation: "NONE",
    requiredExperienceYears: 0,
  });

  const [careerRoles, setCareerRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  // selectedSkills: { [skillId]: { requiredLevel: number, priority: number, metaName?: string } }
  const [selectedSkills, setSelectedSkills] = useState({});
  // Skill picker modal state
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [skillModalSearch, setSkillModalSearch] = useState("");
  const [skillModalSelected, setSkillModalSelected] = useState(new Set()); // staging selection inside modal

  const toastTimerRef = useRef(null);
  const locDebounceRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Location autocomplete state
  const [locQuery, setLocQuery] = useState("");
  const [locSuggestions, setLocSuggestions] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);

  const showToast = (message, type = "info", duration = 3500) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  };

  useEffect(() => {
    (async () => {
      try {
        const cats = await getAllCareerRoles();
        if (Array.isArray(cats)) setCareerRoles(cats);
      } catch (err) {
        console.warn("Failed load career roles", err);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        // Lấy userId từ token để chỉ load companies của user hiện tại
        const userId = getUserIdFromToken();
        if (!userId) {
          console.warn("No userId found in token");
          setCompanies([]);
          return;
        }

        // Gọi API để lấy companies của user
        const mapped = await getEmployerCompanies(Number(userId));
        if (Array.isArray(mapped)) {
          setCompanies(mapped);
        } else {
          setCompanies([]);
        }
      } catch (err) {
        console.warn("Failed load companies", err);
        setCompanies([]);
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // load skills for selection
  useEffect(() => {
    (async () => {
      setSkillsLoading(true);
      try {
        // load first 200 skills for selection
        const res = await getSkillList({ page: 1, size: 200 });
        const items = res?.items ?? (Array.isArray(res) ? res : []);
        setSkillsList(items);
      } catch (err) {
        console.warn("Failed to load skills", err);
        setSkillsList([]);
      } finally {
        setSkillsLoading(false);
      }
    })();
  }, []);

  // click outside to close suggestions
  useEffect(() => {
    const onDocClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowLocSuggestions(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Debounced search for location suggestions (Nominatim)
  useEffect(() => {
    if (!locQuery || locQuery.trim().length < 2) {
      setLocSuggestions([]);
      return;
    }
    setLocLoading(true);
    if (locDebounceRef.current) clearTimeout(locDebounceRef.current);
    locDebounceRef.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(locQuery);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${q}`
        );
        const data = await res.json();
        setLocSuggestions(Array.isArray(data) ? data : []);
        setShowLocSuggestions(true);
      } catch (err) {
        console.warn("Location lookup failed", err);
        setLocSuggestions([]);
      } finally {
        setLocLoading(false);
      }
    }, 450);
    return () => {
      if (locDebounceRef.current) clearTimeout(locDebounceRef.current);
    };
  }, [locQuery]);

  // Set location from suggestion or reverse geocoding result
  const setLocationValue = (value) => {
    setForm((p) => ({ ...p, location: value }));
    setLocQuery(value);
    setShowLocSuggestions(false);
  };

  // Use browser geolocation + reverse geocode to fill location
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showToast("Trình duyệt không hỗ trợ định vị.", "danger");
      return;
    }
    try {
      showToast("Đang truy vấn vị trí...", "info");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            const display = data?.display_name ?? `${latitude}, ${longitude}`;
            setLocationValue(display);
            showToast("Đã điền vị trí hiện tại.", "success");
          } catch (err) {
            console.error("Reverse geocode failed", err);
            showToast("Không thể lấy địa chỉ từ tọa độ.", "danger");
          }
        },
        (err) => {
          console.error("Geolocation error", err);
          showToast("Không thể lấy vị trí thiết bị.", "danger");
        }
      );
    } catch (err) {
      console.error(err);
      showToast("Lỗi lấy vị trí.", "danger");
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === "file") {
      // we no longer upload logo in this simplified form, ignore file input if appears
      return;
    }
    // special-case location input: update both form.location and locQuery for autocomplete
    if (name === "location") {
      setForm((p) => ({ ...p, location: value }));
      setLocQuery(value);
      setShowLocSuggestions(false);
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleSkill = (id) => {
    setSelectedSkills((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        // default years = "", priority = 1
        next[id] = { requiredLevel: "", priority: 1 };
      }
      return next;
    });
  };

  const setSkillLevel = (id, level) => {
    setSelectedSkills((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), requiredLevel: level } }));
  };
  const setSkillPriority = (id, priority) => {
    setSelectedSkills((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), priority: Number(priority) } }));
  };

  const openSkillModal = () => {
    // preload staging selection from current selectedSkills
    setSkillModalSelected(new Set(Object.keys(selectedSkills).map((k) => Number(k))));
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
    // merge staging into selectedSkills, default meta for newly added
    setSelectedSkills((prev) => {
      const next = { ...prev };
      skillModalSelected.forEach((id) => {
        if (!next[id]) next[id] = { requiredLevel: "", priority: 1, metaName: (skillsList.find(s => (s.id ?? s._id) === id)?.name) ?? undefined };
      });
      // remove items that were unselected in modal
      Object.keys(next).forEach((k) => {
        if (!skillModalSelected.has(Number(k))) delete next[k];
      });
      return next;
    });
    setSkillModalOpen(false);
  };

  // remove helper: build a new object excluding the key (works reliably for string/number keys)
  const removeSelectedSkill = (id) => {
    const keyToRemove = id == null ? String(id) : String(id);
    setSelectedSkills((prev) => {
      if (!prev) return {};
      const entries = Object.entries(prev).filter(([k]) => k !== keyToRemove);
      return Object.fromEntries(entries);
    });
    // also remove from modal staging selection if present
    setSkillModalSelected((prev) => {
      const next = new Set(prev);
      next.delete(Number(id));
      return next;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    // basic validation
    if (!form.title || !form.companyId || !form.description) {
      showToast("Please fill required fields: companyId, title and description", "danger");
      return;
    }

    // Build payload strictly matching the curl / API contract
    const payload = {
      companyId: Number(form.companyId),
      title: form.title,
      description: form.description,
      requirements: form.requirements || "",
      salaryRange: form.salaryRange || "",
      location: form.location || "",
      careerRoleId: form.careerRoleId ? Number(form.careerRoleId) : undefined,
      type: form.type || "Full-time",
      deadline: form.deadline || undefined,
      status: Number(form.status) || 1,
      requiredEducation: form.requiredEducation || "NONE",
      requiredExperienceYears: Number(form.requiredExperienceYears ?? 0),
      // include selected skills with per-skill requiredLevel and priority
      ...(selectedSkills && Object.keys(selectedSkills).length > 0
        ? {
            skills: Object.entries(selectedSkills).map(([sid, meta]) => ({
              skillId: Number(sid),
              requiredLevel: meta?.requiredLevel ?? "",
              priority: Number(meta?.priority ?? 1),
            })),
          }
        : {}),
    };

    setLoading(true);
    try {
      const res = await createJob(payload);
      showToast("Job created successfully", "success");
      setForm({
        companyId: "",
        title: "",
        description: "",
        requirements: "",
        salaryRange: "",
        location: "",
        careerRoleId: "",
        type: "Full-time",
        deadline: "",
        status: 1,
        requiredEducation: "NONE",
        requiredExperienceYears: 0,
      });
      setSelectedSkills({});
      console.log("createJob response", res);
    } catch (err) {
      console.error(err);
      // surface API error message if available
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : err?.response?.data?.message || err?.message || "Failed to create job";
      showToast(msg, "danger");
    } finally {
      setLoading(false);
    }
  };

  // clear toast timer on unmount
  useEffect(() => () => toastTimerRef.current && clearTimeout(toastTimerRef.current), []);

  if (error) {
    return (
      <>
        <Header />
        <div className="container" style={{ padding: 40 }}>
          <div style={{ background: "#fff3f3", border: "1px solid #f5c2c2", padding: 20, borderRadius: 6 }}>
            <h4 style={{ color: "#a94442" }}>An error occurred</h4>
            <p style={{ color: "#a94442", marginBottom: 0 }}>{error}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Toast */}
      <div aria-live="polite" aria-atomic="true" className="addjob-toast-container">
        {toast.visible && (
          <div
            className={[
              "addjob-toast",
              toast.type === "success"
                ? "addjob-toast--success"
                : toast.type === "danger"
                ? "addjob-toast--danger"
                : "addjob-toast--info",
            ].join(" ")}
          >
            {toast.message}
          </div>
        )}
      </div>

      {notice && (
        <div className={`alert alert-${notice.type} addjob-notice`} role="alert">
          <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={() => setNotice(null)}
            style={{ lineHeight: 1, border: "none", background: "transparent" }} // keep tiny inline (optional)
          >
            <span aria-hidden="true">×</span>
          </button>
          {notice.text}
        </div>
      )}

      <div className="page-title">
        <div className="container addjob-container">
          <div className="page-caption">
            <h2>Add Job</h2>
            <p>
              <a href="#">Home</a> <i className="ti-angle-double-right"></i> Add Job
            </p>
          </div>
        </div>
      </div>

      <section className="create-job padd-top-80 padd-bot-80">
        <div className="container addjob-container">
          <form className="c-form" onSubmit={handleSubmit}>
            <div className="box">
              <div className="box-header">
                <h4>Add Job</h4>
              </div>

              <div className="box-body addjob-box-body">
                <div className="row gx-3">
                  <div className="col-12">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Company</label>
                        {!companiesLoading ? (
                          <select name="companyId" value={form.companyId} onChange={handleChange} className="form-control" required>
                            <option value="">-- Select Company --</option>
                            {companies.map((c, idx) => (
                              <option key={c.id ?? idx} value={c.id ?? idx}>
                                {c.name ?? c.title ?? `#${c.id ?? idx}`}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input type="text" className="form-control" disabled value="Loading companies..." />
                        )}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Career Role</label>
                        <select name="careerRoleId" value={form.careerRoleId} onChange={handleChange} className="form-control">
                          <option value="">-- Select Career Role --</option>
                          {careerRoles.map((c) => (
                            <option key={c.id ?? c._id} value={c.id ?? c._id}>
                              {c.name ?? c.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Job Type</label>
                        <select name="type" value={form.type} onChange={handleChange} className="form-control">
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Freelancer</option>
                          <option>Internship</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Job Title</label>
                    <input name="title" value={form.title} onChange={handleChange} type="text" className="form-control" placeholder="Job Title" required />
                  </div>

                  <div className="col-12">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Salary Range</label>
                        <input name="salaryRange" value={form.salaryRange} onChange={handleChange} className="form-control" placeholder="Salary Range" />
                      </div>
                      <div className="col-md-8 mb-3 addjob-location-col">
                        <label className="form-label">Location</label>
                        <div className="d-flex addjob-location-row">
                          <input
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Location (type or choose)"
                            autoComplete="off"
                            onFocus={() => { if (locSuggestions.length) setShowLocSuggestions(true); }}
                          />
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            title="Use current location"
                            className="btn btn-outline-secondary addjob-loc-btn"
                          >
                            📍
                          </button>
                        </div>

                        <div ref={suggestionsRef} className="addjob-loc-suggestions">
                          {showLocSuggestions && (
                            <div className="list-group addjob-loc-suggestions-list">
                              {locLoading ? (
                                <div className="list-group-item">Searching...</div>
                              ) : locSuggestions.length === 0 ? (
                                <div className="list-group-item">No results</div>
                              ) : (
                                locSuggestions.map((s) => (
                                  <button
                                    type="button"
                                    key={s.place_id}
                                    className="list-group-item list-group-item-action"
                                    onClick={() => setLocationValue(s.display_name)}
                                  >
                                    <div style={{ fontSize: 13 }}>{s.display_name}</div>
                                    <small className="text-muted">{s.type ?? ""}</small>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="row">
                     <div className="col-md-6 mb-3">
                        <label className="form-label">Required Education</label>
                        <select name="requiredEducation" value={form.requiredEducation} onChange={handleChange} className="form-control">
                          <option value="NONE">None</option>
                          <option value="HIGH_SCHOOL">High School</option>
                          <option value="COLLEGE">College</option>
                          <option value="BACHELOR">Bachelor</option>
                          <option value="MASTER">Master</option>
                          <option value="PHD">PhD</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Required Experience (Years)</label>
                        <input
                          type="number"
                          name="requiredExperienceYears"
                          value={form.requiredExperienceYears}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="0 = Fresher"
                          min="0"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Deadline</label>
                        <input name="deadline" value={form.deadline} onChange={handleChange} type="date" className="form-control" />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Status</label>
                        <select name="status" value={form.status} onChange={handleChange} className="form-control">
                          <option value={0}>Draft</option>
                          <option value={1}>Active</option>
                          <option value={2}>Paused</option>
                          <option value={3}>Expired</option>
                          <option value={4}>Closed</option>
                          <option value={5}>Deleted</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="col-12" style={{ marginTop: 12 }}>
                    <div className="mb-3">
                      <label className="form-label">Requirements</label>
                      <textarea name="requirements" value={form.requirements} onChange={handleChange} className="form-control" placeholder="Requirements" rows={4} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea name="description" value={form.description} onChange={handleChange} className="form-control" placeholder="Description" rows={5} required />
                    </div>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Skills</label>
                    <div className="addjob-skills-wrap">
                      <div>
                        <button type="button" className="btn btn-default" onClick={openSkillModal}>
                          {Object.keys(selectedSkills).length ? "Edit Selected Skills" : "Select Skills"}
                        </button>
                      </div>

                      <div className="addjob-skills-list">
                        {Object.keys(selectedSkills).length === 0 ? (
                          <div className="text-muted">No skills selected.</div>
                        ) : (
                          Object.entries(selectedSkills).map(([sid, meta], idx) => {
                            const id = Number(sid);
                            const skillName =
                              meta?.metaName ??
                              skillsList.find((s) => (s.id ?? s._id) === id)?.name ??
                              `#${sid}`;

                            return (
                              <div key={sid} className="addjob-skill-row">
                                <div className="addjob-skill-name">
                                  <strong className="addjob-skill-nameText">{skillName}</strong>
                                </div>

                                <div className="addjob-skill-field">
                                  <small className="addjob-skill-fieldLabel">Years of experience</small>
                                  <select
                                    title="Required years of experience"
                                    className="form-control addjob-skill-select"
                                    value={meta.requiredLevel ?? ""}
                                    onChange={(e) => setSkillLevel(id, e.target.value)}
                                  >
                                    <option value="">Select years</option>
                                    <option value="-1">Learning</option>
                                    <option value="0">0 years</option>
                                    <option value="1">1 year</option>
                                    <option value="2">2 years</option>
                                    <option value="3">3 years</option>
                                    <option value="4">4 years</option>
                                    <option value="5">5+ years</option>
                                  </select>
                                </div>
                                <div className="addjob-skill-field">
                                  <small className="addjob-skill-fieldLabel">Priority</small>
                                  <select
                                    title="Priority"
                                    className="form-control addjob-skill-select"
                                    value={meta.priority}
                                    onChange={(e) => setSkillPriority(id, e.target.value)}
                                  >
                                    <option value={1}>Normal</option>
                                    <option value={2}>High</option>
                                  </select>
                                </div>
                                <div className="addjob-skill-actions">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger addjob-skill-removeBtn"
                                    onClick={() => removeSelectedSkill(sid)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skill Picker Modal */}
                  {skillModalOpen && (
                    <div className="modal addjob-modal-backdrop">
                      <div className="modal-dialog modal-dialog-centered modal-xl addjob-modal-dialog">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Select Skills</h5>
                            <button type="button" className="btn-close" onClick={closeSkillModal} />
                          </div>
                          <div className="modal-body addjob-modal-body">
                            <div className="mb-2">
                              <input className="form-control" placeholder="Search skills..." value={skillModalSearch} onChange={(e) => setSkillModalSearch(e.target.value)} />
                            </div>
                            <div className="addjob-modal-skillList">
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
                                      <label key={sid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px" }}>
                                        <input type="checkbox" checked={checked} onChange={() => toggleSkillModalSelect(sid)} />
                                        <div style={{ flex: 1 }}>
                                          <strong>{s.name ?? s.title ?? `#${sid}`}</strong>
                                          {s.type && <div style={{ fontSize: 12, opacity: 0.7 }}>{s.type}</div>}
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
                </div>
              </div>
            </div>

            <div className="text-center addjob-submitRow">
              <button type="submit" className="btn btn-m theme-btn full-width" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AddJob;