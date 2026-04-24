import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getJobs } from "../../api/jobApi";
import { getCompany } from "../../api/companyApi";
import { createApplication } from "../../api/applicationApi";
import { getUserId } from "../../utils/jwt";
import { getDefaultUserCv, getUserCvs } from "../../api/userCvApi";
import { getSkills as getSkillList, getSkillById } from "../../api/skillApi";
import { getIndustries } from "../../api/industryApi";
import { getCareerRoles } from "../../api/careerRoleApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/plugins/nice-select/css/nice-select.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./BrowseJob.css";

const PAGE_SIZE = 10;
const SALARY_OPTIONS = [
  { key: "u10", label: "Dưới 10 triệu (VND)", count: 102 },
  { key: "10-20", label: "10 - 20 triệu (VND)", count: 78 },
  { key: "20-30", label: "20 - 30 triệu (VND)", count: 12 },
  { key: "30-40", label: "30 - 40 triệu (VND)", count: 85 },
  { key: "40-50", label: "40 - 50 triệu (VND)", count: 307 },
  { key: "50+", label: "Trên 50 triệu (VND)", count: 0 },
];
const TYPE_FILTERS = [
  { value: "Full-time", label: "Full Time", count: 102 },
  { value: "Part-time", label: "Part Time", count: 78 },
  { value: "Internship", label: "Internship", count: 12 },
  { value: "Freelancer", label: "Freelancer", count: 85 },
];

const BrowseJob = () => {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // filters
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [types, setTypes] = useState([]);
  const [sort, setSort] = useState("recent");
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [salaryFilters, setSalaryFilters] = useState([]);
  const [status, setStatus] = useState(1);
  const [careerRoleId, setCareerRoleId] = useState(undefined);
  const [companyId, setCompanyId] = useState(undefined);
  const [companyCache, setCompanyCache] = useState({});
  const [skillCache, setSkillCache] = useState({}); // id -> skill object { id, name }
  const [industries, setIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const [industryId, setIndustryId] = useState(undefined);
  const [careerRoles, setCareerRoles] = useState([]);
  const [careerRolesLoading, setCareerRolesLoading] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [qualOpen, setQualOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [applyJobId, setApplyJobId] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvItems, setCvItems] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applyErr, setApplyErr] = useState("");
  const [toast, setToast] = useState({ show: false, text: "" });
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);

  const toastTimerRef = useRef(null);
  const debounceRef = useRef(null);

  // current job info for modal header
  const currentJob = useMemo(() => {
    if (!applyJobId) return null;
    return (jobs || []).find((j) => (j.id ?? j._id ?? "") === applyJobId) || null;
  }, [jobs, applyJobId]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const qIndustry = qs.get("industry");
      const qCareerRole = qs.get("careerRole");
      const qStatus = qs.get("status");
      const qCompany = qs.get("companyId");
      const qKeyword = qs.get("keyword");
      const qLocation = qs.get("location");
      if (qIndustry) setIndustryId(Number(qIndustry));
      if (qCareerRole) setCareerRoleId(Number(qCareerRole));
      if (qStatus) setStatus(Number(qStatus));
      if (qCompany) setCompanyId(Number(qCompany));
      if (qKeyword) setKeyword(qKeyword);
      if (qLocation) setLocation(qLocation);
    } catch { }
  }, []);

  // Load industries
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIndustriesLoading(true);
      try {
        const res = await getIndustries({ page: 1, size: 100 });
        if (cancelled) return;
        const items = res?.items ?? (Array.isArray(res) ? res : []);
        setIndustries(items || []);
      } catch (e) {
        console.error("Failed to load industries", e);
        if (!cancelled) setIndustries([]);
      } finally {
        if (!cancelled) setIndustriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load career roles based on selected industry
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCareerRolesLoading(true);
      try {
        let items = [];
        if (industryId) {
          // Load career roles for specific industry
          const res = await getCareerRoles({ page: 1, size: 1000, industryId });
          items = res?.items ?? (Array.isArray(res) ? res : []);
        } else {
          // Load all career roles
          const res = await getCareerRoles({ page: 1, size: 1000 });
          items = res?.items ?? (Array.isArray(res) ? res : []);
        }
        if (!cancelled) setCareerRoles(items || []);
      } catch (e) {
        console.error("Failed to load career roles", e);
        if (!cancelled) setCareerRoles([]);
      } finally {
        if (!cancelled) setCareerRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [industryId]);

  // NEW: normalize text for accent-insensitive search
  const normalizeText = (text = "") =>
    String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();

  // Split requirements into bullet items, supporting \n or leading dash/• separators
  const formatRequirements = (text = "") =>
    String(text)
      .replace(/\r/g, "")
      .split(/\n+/)
      .map((line) => line.replace(/^[\-\u2022•·\s]+/, "").trim())
      .filter(Boolean);

  const loadData = async () => {
    setLoading(true);
    try {
      const keywordParam = normalizeText(keyword);
      const locationParam = location;
      
      const res = await getJobs({
        page,
        size: pageSize,
        ...(keywordParam ? { keyword: keywordParam } : {}),
        ...(locationParam ? { location: locationParam } : {}),
        ...(industryId ? { industryId } : {}),
        ...(careerRoleId ? { careerRoleId } : {}),
        ...(companyId ? { companyId } : {}),
        sortBy: "id",
        asc: false,
      });

      // Fallback filter client-side for types and salary (backend doesn't support yet)
      let items = res.items || [];
      const BAND_MAP = {
        u10: [0, 10_000_000],
        "10-15": [10_000_000, 20_000_000],
        "15-20": [20_000_000, 30_000_000],
        "20-30": [30_000_000, 40_000_000],
        "30-40": [40_000_000, 50_000_000],
        "40+": [50_000_000, Number.MAX_SAFE_INTEGER],
      };
      const hasTypeFilter = Array.isArray(types) && types.length > 0;
      const hasSalaryFilter = Array.isArray(salaryFilters) && salaryFilters.length > 0;

      const parseSalaryRange = (s) => {
        if (!s || typeof s !== "string") return null;
        const lower = s.toLowerCase();
        const nums = s.match(/\d[\d,\.]*/g);
        if (!nums || nums.length === 0) return null;

        const toNum = (t) => Number(String(t).replace(/[^0-9]/g, "")) || 0;

        let mult = 1;
        if (/triệu/i.test(s)) mult = 1_000_000;
        else if (/(tỷ|tỉ|ty|billion)/i.test(s)) mult = 1_000_000_000;
        else if (/\$|usd/i.test(s)) mult = 24_000;

        const makeRange = (a, b) => [a * mult, b * mult];

        if (nums.length >= 2) return makeRange(toNum(nums[0]), toNum(nums[1]));

        const n = toNum(nums[0]);
        if (/(under|less|below|<|≤|dưới)/i.test(lower)) return makeRange(0, n);
        if (/(over|above|>|≥|trên)/i.test(lower)) return makeRange(n, Number.MAX_SAFE_INTEGER);
        return makeRange(n, n);
      };
      
      const intersect = (a, b) => {
        if (!a || !b) return false;
        const [a1, a2] = a;
        const [b1, b2] = b;
        return Math.max(a1, b1) <= Math.min(a2, b2);
      };

      if (hasTypeFilter) {
        items = items.filter((j) => (j?.type ? types.includes(j.type) : true));
      }
      if (hasSalaryFilter) {
        items = items.filter((j) => {
          const jr = parseSalaryRange(j?.salaryRange);
          if (!jr) return false;
          return salaryFilters.some((k) => intersect(jr, BAND_MAP[k]));
        });
      }

      setJobs(items);
      setTotal(res.total || 0);
    } catch (e) {
      console.warn("load jobs failed", e);
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, industryId, careerRoleId, companyId]);

  // Reset careerRoleId when industryId changes
  useEffect(() => {
    setCareerRoleId(undefined);
    setPage(1);
  }, [industryId]);

  // Immediate fetch when checkbox filters change
  useEffect(() => {
    if (page !== 1) setPage(1);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, salaryFilters]);

  const fetchMissingSkills = async (ids) => {
    const missing = ids.filter((id) => id && !skillCache[id]);
    if (missing.length === 0) return;
    try {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            const s = await getSkillById(Number(id));
            // unwrap shape: may be { id, name } or API wrapper
            const data = s?.data ?? s ?? null;
            const skillObj = data?.id ? data : data;
            return [id, skillObj];
          } catch {
            return [id, null];
          }
        })
      );
      setSkillCache((prev) => {
        const next = { ...prev };
        results.forEach(([id, s]) => {
          if (s) next[id] = s;
        });
        return next;
      });
    } catch (e) {
      // ignore
    }
  };

  // After jobs change, fetch company details for missing companyIds
  useEffect(() => {
    const ids = Array.from(
      new Set(
        (jobs || [])
          .map((j) => j.companyId)
          .filter((id) => typeof id === "number" || (typeof id === "string" && id !== ""))
      )
    );
    const missing = ids.filter((id) => !companyCache[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const c = await getCompany(id);
              return [id, c];
            } catch {
              return [id, null];
            }
          })
        );
        if (cancelled) return;
        setCompanyCache((prev) => {
          const next = { ...prev };
          results.forEach(([id, c]) => {
            if (c) next[id] = c;
          });
          return next;
        });
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [jobs]);
  useEffect(() => {
    const ids = new Set();
    (jobs || []).forEach((job) => {
      const sarr = job.skills ?? [];
      if (!Array.isArray(sarr)) return;
      sarr.forEach((s) => {
        // support numeric id or string numeric id
        if (s == null) return;
        if (typeof s === "number") ids.add(String(s));
        else if (typeof s === "string" && /^\d+$/.test(s)) ids.add(s);
        else if (typeof s === "object" && (s.skillId || s.id)) ids.add(String(s.skillId ?? s.id));
      });
    });
    const idsArr = Array.from(ids).map((x) => Number(x)).filter(Boolean);
    if (idsArr.length) fetchMissingSkills(idsArr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  const handleSubmitFilters = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const clearFilters = () => {
    setKeyword("");
    setLocation("");
    setTypes([]);
    setSalaryFilters([]);
    setCareerRoleId(undefined);
    setPage(1);
  };

  const toggleType = (val) => {
    setTypes((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));
  };
  const toggleSalary = (key) => {
    setSalaryFilters((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const openApply = async (jobId) => {
    const uid = getUserId();
    if (!uid) {
      window.location.href = "/login";
      return;
    }
    setApplyErr("");
    setCoverLetter("");
    setSelectedCvId(null);
    setCvItems([]);
    setApplyJobId(jobId);
    setShowApply(true);
    setCvLoading(true);
    try {
      // load user's CVs
      const res = await getUserCvs({ userId: Number(uid), page: 1, size: 100, sortBy: "updatedAt", asc: false });
      const box = res?.data ?? res;
      const items = box?.items ?? (Array.isArray(box) ? box : []) ?? [];
      setCvItems(items);
      // preselect default or first
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
    setApplyJobId(null);
  };

  const openCompanyModal = async (companyId) => {
    if (!companyId) return;
    setShowCompanyModal(true);
    setCompanyLoading(true);
    setSelectedCompany(null);
    
    try {
      if (companyCache[companyId]) {
        setSelectedCompany(companyCache[companyId]);
      } else {
        const company = await getCompany(companyId);
        setSelectedCompany(company);
        setCompanyCache((prev) => ({ ...prev, [companyId]: company }));
      }
    } catch (e) {
      console.error("Failed to load company details", e);
    } finally {
      setCompanyLoading(false);
    }
  };

  const closeCompanyModal = () => {
    setShowCompanyModal(false);
    setSelectedCompany(null);
  };

  const showToast = (text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, text });
    toastTimerRef.current = setTimeout(() => setToast({ show: false, text: "" }), 2500);
  };
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const submitApply = async () => {
    const uid = getUserId();
    if (!uid) {
      window.location.href = "/login";
      return;
    }
    if (!applyJobId) return;
    if (!selectedCvId) {
      setApplyErr("Please select a CV.");
      return;
    }
    try {
      setApplying(true);
      await createApplication({
        jobId: applyJobId,
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

  // Modal: lock scroll & Esc to close
  useEffect(() => {
    if (showApply || showCompanyModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
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
            <h2>Browse Job</h2>
            <p>
              <a href="#" title="Home">Home</a> <i className="ti-angle-double-right"></i> Browse Job
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row">
            {/* Sidebar Filters */}
            <div className="col-md-3 col-sm-5">
              <form onSubmit={handleSubmitFilters}>
                <div className="widget-boxed padd-bot-0">
                  <div className="widget-boxed-body">
                    <div className="search_widget_job">
                      <div className="field_w_search">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search Keywords"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                        />
                      </div>
                      <div className="field_w_search">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="All Locations"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Industry Filter */}
                <div className="widget-boxed padd-bot-0">
                  <div className="widget-boxed-header">
                    <h4>Industry</h4>
                  </div>
                  <div className="widget-boxed-body">
                    {industriesLoading ? (
                      <div className="text-center">Loading industries...</div>
                    ) : (
                      <div className="side-list no-border">
                        <select
                          className="form-control"
                          value={industryId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIndustryId(val ? Number(val) : undefined);
                            setPage(1);
                          }}
                        >
                          <option value="">All Industries</option>
                          {industries.map((industry) => (
                            <option key={industry.id} value={industry.id}>
                              {industry.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Career Role Filter */}
                <div className="widget-boxed padd-bot-0">
                  <div className="widget-boxed-header">
                    <h4>Career Role</h4>
                  </div>
                  <div className="widget-boxed-body">
                    {careerRolesLoading ? (
                      <div className="text-center">Loading career roles...</div>
                    ) : (
                      <div className="side-list no-border">
                        <select
                          className="form-control"
                          value={careerRoleId || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCareerRoleId(val ? Number(val) : undefined);
                            setPage(1);
                          }}
                        >
                          <option value="">All Career Roles</option>
                          {careerRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Offered Salary (structure like HTML; optional UI filter) */}
                <div className="widget-boxed padd-bot-0">
                  <div className="widget-boxed-header">
                    <h4>Salary (VND)</h4>
                  </div>
                  <div className="widget-boxed-body">
                    <div className="side-list no-border">
                      <ul>
                        {SALARY_OPTIONS.map((opt) => (
                          <li key={opt.key}>
                            <span className="custom-checkbox">
                              <input
                                type="checkbox"
                                id={`sal-${opt.key}`}
                                checked={salaryFilters.includes(opt.key)}
                                onChange={() => toggleSalary(opt.key)}
                              />
                              <label htmlFor={`sal-${opt.key}`}></label>
                            </span>
                            {opt.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Job Type as checkbox list (like HTML) */}
                <div className="widget-boxed padd-bot-0">
                  <div className="widget-boxed-header">
                    <h4>Job Type</h4>
                  </div>
                  <div className="widget-boxed-body">
                    <div className="side-list no-border">
                      <ul>
                        {TYPE_FILTERS.map((t) => (
                          <li key={t.value}>
                            <span className="custom-checkbox">
                              <input
                                type="checkbox"
                                id={`type-${t.value}`}
                                checked={types.includes(t.value)}
                                onChange={() => toggleType(t.value)}
                              />
                              <label htmlFor={`type-${t.value}`}></label>
                            </span>
                            {t.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Experince (accordion placeholder to mirror HTML)
                <div className="widget-boxed padd-bot-0">
                  <div className="widget-boxed-header br-0">
                    <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      Experience
                      <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setExpOpen((v) => !v)}
                        aria-expanded={expOpen}
                        aria-controls="experience"
                        style={{ textDecoration: "none" }}
                      >
                        <i className={`pull-right ${expOpen ? "ti-minus" : "ti-plus"}`} aria-hidden="true"></i>
                      </button>
                    </h4>
                  </div>
                  <div className={`widget-boxed-body ${expOpen ? "" : "collapse"}`} id="experience">
                    <div className="side-list no-border">
                      <ul>
                        {["1Year To 2Year", "2Year To 3Year", "3Year To 4Year", "4Year To 5Year", "5Year To 7Year", "7Year To 10Year"].map((d, i) => (
                          <li key={i}>
                            <span className="custom-checkbox">
                              <input type="checkbox" id={`exp-${i}`} />
                              <label htmlFor={`exp-${i}`}></label>
                            </span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div> */}

                {/* Qualification (accordion placeholder to mirror HTML)
                <div className="widget-boxed padd-bot-0">
                  <div className="widget-boxed-header br-0">
                    <h4 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      Qualification
                      <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setQualOpen((v) => !v)}
                        aria-expanded={qualOpen}
                        aria-controls="qualification"
                        style={{ textDecoration: "none" }}
                      >
                        <i className={`pull-right ${qualOpen ? "ti-minus" : "ti-plus"}`} aria-hidden="true"></i>
                      </button>
                    </h4>
                  </div>
                  <div className={`widget-boxed-body ${qualOpen ? "" : "collapse"}`} id="qualification">
                    <div className="side-list no-border">
                      <ul>
                        {["High School", "Intermediate", "Graduation", "Master Degree"].map((q, i) => (
                          <li key={q}>
                            <span className="custom-checkbox">
                              <input type="checkbox" id={`qua-${i}`} />
                              <label htmlFor={`qua-${i}`}></label>
                            </span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div> */}
                <div className="widget-boxed-body text-center bj-filterActions">
                  <button type="submit" className="btn theme-btn btn-m bj-filterSearchBtn">
                    Search
                  </button>
                  <button type="button" className="btn btn-default btn-m" onClick={clearFilters}>
                    Clear
                  </button>
                </div>
              </form>
            </div>

            {/* Jobs List */}
            <div className="col-md-9 col-sm-7">
              <div className="row mrg-bot-20">
                <div className="col-md-4 col-sm-12 col-xs-12 browse_job_tlt">
                  <h4 className="job_vacancie">{loading ? "Loading..." : `${total} Jobs & Vacancies`}</h4>
                </div>
                <div className="col-md-8 col-sm-12 col-xs-12">
                  <div className="fl-right short_by_filter_list">
                    <div className="search-wide short_by_til">
                    </div>
                    <div className="search-wide full">
                    </div>
                    <div className="search-wide full">
                      <select
                        className="wide form-control"
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                      >
                        {[10, 20, 30, 50].map((n) => (
                          <option key={n} value={n}>{n} Per Page</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {jobs.map((job) => {
                const companyData = job.companyId ? companyCache[job.companyId] : undefined;
                const company = companyData?.name ?? job.companyName ?? job.company?.name ?? "Company";
                const logo = companyData?.logoUrl ?? job.company?.logoUrl ?? null;
                const jtype = job.type ?? "Full-time";
                const skills = job.skills ?? [];
                const experience = job.experience ?? job.yearsOfExperience ?? null;
                const jobCode = job.code ?? job.jobCode ?? job.id ?? job._id ?? "";
                const locationText = job.location ?? "";
                const title = job.title ?? "Job Title";
                const industryName = job.industryName ?? job.industry?.name ?? "";
                const careerRoleName = job.careerRoleName ?? job.careerRole?.name ?? job.categoryName ?? job.category?.name ?? "";
                const tagline = [industryName, careerRoleName].filter(Boolean).join(" • ") || "";
                const salaryRange = job.salaryRange ?? "";
                const deadline = job.deadline ?? "";
                const requirements = job.requirements ?? job.requirement ?? "";
                const id = job.id ?? job._id ?? "";
                const companyId = job.companyId;

                return (
                  <div className="job-verticle-list" key={id}>
                    <div className="vertical-job-card">
                      <div className="vertical-job-header">
                        <div className="vrt-job-cmp-logo bj-companyLogoBox">
                          {logo ? (
                            <a href={`/job-detail/${id}`} className="bj-logoLink">
                              <img src={logo} alt={company} className="bj-logoImg" />
                            </a>
                          ) : null}
                        </div>
                        <h4>
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              if (companyId) openCompanyModal(companyId);
                            }}
                            style={{ cursor: companyId ? "pointer" : "default" }}
                          >
                            {company}
                          </a>
                        </h4>
                        <span className="com-tagline">{tagline || title}</span>
                        {typeof job.vacancy === "number" ? (
                          <span className="pull-right vacancy-no">No. <span className="v-count">{job.vacancy}</span></span>
                        ) : null}
                      </div>
                      <div className="vertical-job-body">
                        <div className="row">
                          <div className="col-md-9 col-sm-12 col-xs-12">
                            <ul className="can-skils">
                              <li><strong>Job Type: </strong>{jtype}</li>
                              {job.requiredEducation && job.requiredEducation !== "NONE" && (
                                <li><strong>Education: </strong>{job.requiredEducation.replace(/_/g, " ")}</li>
                              )}
                              {typeof job.requiredExperienceYears === "number" && job.requiredExperienceYears > 0 && (
                                <li><strong>Experience: </strong>{job.requiredExperienceYears} year{job.requiredExperienceYears > 1 ? "s" : ""}</li>
                              )}
                              {salaryRange && <li><strong>Salary: </strong>{salaryRange}</li>}
                              {requirements && (
                                <li>
                                  <div><strong>Requirements:</strong></div>
                                  <ul className="bj-reqList">
                                    {formatRequirements(requirements).map((req, i) => (
                                      <li key={i}>{req}</li>
                                    ))}
                                  </ul>
                                </li>
                              )}
                              {skills.length > 0 && (
                                <li>
                                  <strong>Skills: </strong>
                                  <div>
                                    {skills.map((s, i) => {
                                      let label = "";
                                      if (s == null) label = "-";
                                      else if (typeof s === "number") label = skillCache[s]?.name ?? `#${s}`;
                                      else if (typeof s === "string") {
                                        label = /^\d+$/.test(s) ? (skillCache[Number(s)]?.name ?? `#${s}`) : s;
                                      } else if (typeof s === "object") {
                                        label = s.name ?? s.title ?? s.skillName ?? (s.skillId ? (skillCache[s.skillId]?.name ?? `#${s.skillId}`) : JSON.stringify(s));
                                      } else label = String(s);
                                      return <span key={i} className="skill-tag">{label}</span>;
                                    })}
                                  </div>
                                </li>
                              )}
                              {experience && <li><strong>Experience: </strong>{experience}</li>}
                              <li><strong>Location: </strong>{locationText}</li>
                              {deadline && <li><strong>Deadline: </strong>{deadline}</li>}
                            </ul>
                          </div>
                          <div className="col-md-3 col-sm-12 col-xs-12">
                            <div className="vrt-job-act">
                              <button
                                type="button"
                                className="btn-job theme-btn job-apply"
                                onClick={() => openApply(id)}
                                disabled={applying}
                              >
                                Apply Now
                              </button>
                              <a href={`/job-detail/${id}`} title="" className="btn-job light-gray-btn">View Job</a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              <div className="utf_flexbox_area padd-0 text-center">
                <div className="bj-paginationCenter">
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
                      <li
                        key={i + 1}
                        className={`page-item${page === i + 1 ? " active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPage(i + 1)}
                          disabled={page === i + 1}
                        >
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
          {/* End Row */}
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
              <h4 id="apply-modal-title" className="jp-modal-title">
                Submit Application{currentJob?.title ? ` — ${currentJob.title}` : ""}
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
                        <div className="jp-cv-meta bj-cvMeta">
                          <div className="bj-cvMetaTop">
                            <strong>{cv.title || "Untitled CV"}</strong>
                            {cv.isDefault && <span className="label label-success bj-defaultBadge">Default</span>}
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
              <div className="form-group bj-coverLetterGroup">
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
                <div className="alert alert-danger bj-applyError">
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
      {showCompanyModal && (
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
              {companyLoading ? (
                <div className="text-center">
                  <p>Loading company information...</p>
                </div>
              ) : selectedCompany ? (
                <div className="company-detail-content">
                  <div className="company-header-info">
                    {selectedCompany.logoUrl && (
                      <div className="company-logo-large">
                        <img src={selectedCompany.logoUrl} alt={selectedCompany.name} />
                      </div>
                    )}
                    <div className="company-basic-info">
                      <h3>{selectedCompany.name}</h3>
                      {selectedCompany.industry && (
                        <p className="company-industry">
                          <i className="ti-briefcase"></i> {selectedCompany.industry}
                        </p>
                      )}
                      {selectedCompany.location && (
                        <p className="company-location">
                          <i className="ti-location-pin"></i> {selectedCompany.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="company-detail-section">
                    {selectedCompany.description && (
                      <div className="info-block">
                        <h5><i className="ti-info-alt"></i> About Company</h5>
                        <p>{selectedCompany.description}</p>
                      </div>
                    )}

                    {selectedCompany.website && (
                      <div className="info-block">
                        <h5><i className="ti-world"></i> Website</h5>
                        <p>
                          <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">
                            {selectedCompany.website}
                          </a>
                        </p>
                      </div>
                    )}

                    {selectedCompany.email && (
                      <div className="info-block">
                        <h5><i className="ti-email"></i> Email</h5>
                        <p>{selectedCompany.email}</p>
                      </div>
                    )}

                    {selectedCompany.phone && (
                      <div className="info-block">
                        <h5><i className="ti-mobile"></i> Phone</h5>
                        <p>{selectedCompany.phone}</p>
                      </div>
                    )}

                    {(selectedCompany.employeeCount || selectedCompany.size) && (
                      <div className="info-block">
                        <h5><i className="ti-user"></i> Company Size</h5>
                        <p>{selectedCompany.employeeCount || selectedCompany.size} employees</p>
                      </div>
                    )}

                    {selectedCompany.foundedYear && (
                      <div className="info-block">
                        <h5><i className="ti-calendar"></i> Founded</h5>
                        <p>{selectedCompany.foundedYear}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning">
                  Company information not available.
                </div>
              )}
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
};

export default BrowseJob;