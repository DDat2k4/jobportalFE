import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/plugins/nice-select/css/nice-select.css";
import "./Home.css";
import { getAllIndustries } from "../../api/industryApi";
import { getJobCountsByIndustry, getJobs } from "../../api/jobApi";
import { getCompany } from "../../api/companyApi";
import { getAllCareerRoles, getCareerRoles } from "../../api/careerRoleApi";

const Home = () => {
  const [industries, setIndustries] = useState([]);
  const [featuredIndustries, setFeaturedIndustries] = useState([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [careerRoles, setCareerRoles] = useState([]);
  const [careerRolesLoading, setCareerRolesLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobKeyword, setJobKeyword] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedCareerRole, setSelectedCareerRole] = useState("");
  const [companyCache, setCompanyCache] = useState({});

  // normalize text to be accent-insensitive
  const normalizeText = (text = "") =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();

  useEffect(() => {
    let mounted = true;
    // Initialize AOS here if you install the "aos" package.
    // try { AOS.init(); } catch (e) { /* ignore if already initialized */ }
    (async () => {
      try {
        const items = await getAllIndustries();
        if (mounted && Array.isArray(items)) setIndustries(items);
        // build featured top-8 by job count
        try {
          const counts = await getJobCountsByIndustry(1); // ACTIVE
          const countMap = {};
          (counts || []).forEach((it) => {
            if (it?.industryId != null) countMap[Number(it.industryId)] = it.jobCount || 0;
            if (it?.industryName) countMap[it.industryName] = it.jobCount || 0;
          });
          const mapped = (items || []).map((c, i) => {
            const id = c.id ?? c._id ?? i;
            const name = c.name ?? c.title ?? `Industry ${i + 1}`;
            const jobCount = countMap[Number(id)] ?? countMap[name] ?? 0;
            return { id, name, icon: c.icon ?? null, jobCount };
          });
          mapped.sort((a, b) => (b.jobCount || 0) - (a.jobCount || 0));
          if (mounted) setFeaturedIndustries(mapped.slice(0, 8));
        } catch { /* ignore count errors */ }
      } catch (err) {
        console.error("load industries failed", err);
      } finally {
        if (mounted) setIndustriesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Load career roles based on selected industry
  useEffect(() => {
    let mounted = true;
    (async () => {
      setCareerRolesLoading(true);
      try {
        let items = [];
        if (selectedIndustry) {
          // Load career roles for specific industry
          const res = await getCareerRoles({ page: 1, size: 1000, industryId: Number(selectedIndustry) });
          items = res?.items ?? (Array.isArray(res) ? res : []);
        } else {
          // Load all career roles
          items = await getAllCareerRoles();
        }
        if (mounted && Array.isArray(items)) {
          setCareerRoles(items);
          // Reset selected career role when industry changes
          setSelectedCareerRole("");
        }
      } catch (err) {
        console.error("load career roles failed", err);
        if (mounted) setCareerRoles([]);
      } finally {
        if (mounted) setCareerRolesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedIndustry]);

  // Load latest jobs, filtered by Industry and/or Career Role if selected
  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const keywordNorm = normalizeText(jobKeyword);
      const params = {
        page: 1,
        size: 8,
        sortBy: "id",
        asc: false,
        ...(keywordNorm ? { keyword: keywordNorm } : {}),
        ...(selectedIndustry ? { industryId: Number(selectedIndustry) } : {}),
        ...(selectedCareerRole ? { careerRoleId: Number(selectedCareerRole) } : {}),
      };
      const res = await getJobs(params);

      setJobs((res.items || []).slice(0, 8));
    } catch (e) {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndustry, selectedCareerRole]);

  // After jobs load, fetch missing company info (logoUrl) by companyId
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

  return (
    <>
      <Header />

      {/* ======================= Start Banner ===================== */}
      <div
        className="utf_main_banner_area home-banner-bg"
        data-overlay="8"
      >
        <div className="container">
          <div className="col-md-8 col-sm-10">
            <div className="caption cl-white home_two_slid">
              <h2>
                Search Between More Than <span className="theme-cl">XXX</span> Open Jobs.
              </h2>
              <p>
                Trending Jobs Keywords:
                <span className="trending_key">
                  <a href="#">Web Designer</a>
                </span>
                <span className="trending_key">
                  <a href="#">Web Developer</a>
                </span>
                <span className="trending_key">
                  <a href="#">IOS Developer</a>
                </span>
                <span className="trending_key">
                  <a href="#">Android Developer</a>
                </span>
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const params = new URLSearchParams();
                const keywordNorm = normalizeText(jobKeyword);
                if (keywordNorm) params.set("keyword", keywordNorm);
                if (selectedIndustry) params.set("industry", String(selectedIndustry));
                if (selectedCareerRole) params.set("careerRole", String(selectedCareerRole));
                window.location.href = `/browse-jobs${params.toString() ? `?${params.toString()}` : ""}`;
              }}
            >
              <fieldset className="utf_home_form_one">
                <div className="col-md-4 col-sm-4 padd-0">
                  <input
                    type="text"
                    className="form-control br-1"
                    placeholder="Search Keywords..."
                    value={jobKeyword}
                    onChange={(e) => setJobKeyword(e.target.value)}
                  />
                </div>

                <div className="col-md-3 col-sm-3 padd-0">
                  <select
                    className="nice-select form-control home-career-role-select"
                    value={selectedIndustry || ""}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                  >
                    <option value="">All Industries</option>
                    {industriesLoading ? (
                      <option value="" disabled>Loading...</option>
                    ) : (industries || []).map((industry, idx) => (
                      <option key={industry.id ?? industry._id ?? idx} value={industry.id ?? industry._id ?? ""}>
                        {industry.name ?? industry.title ?? "Unnamed Industry"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3 col-sm-3 padd-0">
                  <select
                    className="nice-select form-control home-career-role-select"
                    value={selectedCareerRole || ""}
                    onChange={(e) => setSelectedCareerRole(e.target.value)}
                  >
                    <option value="">All Career Roles</option>
                    {careerRolesLoading ? (
                      <option value="" disabled>Loading...</option>
                    ) : (careerRoles || []).map((role, idx) => (
                      <option key={role.id ?? role._id ?? idx} value={role.id ?? role._id ?? ""}>
                        {role.name ?? role.title ?? "Unnamed Career Role"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2 col-sm-2 padd-0 m-clear">
                  <button type="submit" className="btn theme-btn cl-white seub-btn">
                    Search
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
      {/* ======================= End Banner ===================== */}


      {/* ========== JOB LISTINGS ========== */}
      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {/* Replaced tab bar with a clean section header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="m-0">Latest Jobs</h3>
          </div>

          {/* Job grid */}
          <div className="row">
            {jobsLoading ? (
              <div className="col-12 text-center"><span>Loading...</span></div>
            ) : jobs.length === 0 ? (
              <div className="col-12 text-center"><span>No jobs found.</span></div>
            ) : (
              jobs.map((job) => {
                const id = job.id ?? job._id ?? "";
                const title = job.title ?? "Job Title";
                const type = (job.type ?? "Full-time").toLowerCase().replace(/\s+/g, "-");
                const companyName = job.company?.name ?? job.companyName ?? "Company";
                const logo =
                  (job.companyId && companyCache[job.companyId]?.logoUrl) ??
                  job.company?.logoUrl ??
                  job.companyLogo ??
                  job.company?.logo_url ??
                  null;
                const location = job.location ?? "";
                return (
                  <div className="col-md-3 col-sm-6" key={id}>
                    <div className="utf_grid_job_widget_area">
                      <span className={`job-type ${type}-type`}>
                        {job.type ?? "Full-time"}
                      </span>
                      <div className="utf_job_like">
                        <label className="toggler toggler-danger">
                          <input type="checkbox" />
                          <i className="fa fa-heart"></i>
                        </label>
                      </div>
                      <div className="u-content">
                        <div className="avatar box-80">
                          {logo ? (
                            <img className="img-responsive" src={logo} alt={companyName} />
                          ) : null}
                        </div>
                        <h5>{title}</h5>
                        <p className="text-muted">{location || companyName}</p>
                      </div>
                      <div className="utf_apply_job_btn_item">
                        <a href={`/job-detail/${id}`} className="btn job-browse-btn btn-radius br-light">
                          View Job
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="col-md-12 mrg-top-20 text-center">
            <a href="/browse-jobs" className="btn theme-btn btn-m">Browse All Jobs</a>
          </div>
        </div>
      </section>

      {/* ========== INDUSTRY SECTION ========== */}
      <section className="utf_job_career_role_area">
        <div className="container">
          <div className="row">
            <div className="col-md-8 offset-md-2">
              <div className="heading">
                <h2>Industries</h2>
              </div>
            </div>
          </div>

          <div className="row">
            {(featuredIndustries.length ? featuredIndustries : []).map((industry) => (
              <div className="col-md-3 col-sm-6" key={industry.id}>
                <a href={`/browse-jobs?industry=${industry.id}`} title={industry.name}>
                  <div className="utf_category_box_area">
                    <div className="utf_category_desc">
                      <div className="utf_category_icon">
                        <i className={industry.icon ?? "icon-briefcase"} aria-hidden="true"></i>
                      </div>
                      <div className="category-detail utf_category_desc_text">
                        <h4>{industry.name}</h4>
                        <p>{(industry.jobCount ?? 0) + " Jobs"}</p>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
            {!industriesLoading && featuredIndustries.length === 0 && (
              <>
                {/* fallback: danh sách tĩnh 8 mục nếu không có dữ liệu */}
                {[
                  { icon: "icon-bargraph", title: "Web & Software Dev", jobs: "122 Jobs" },
                  { icon: "icon-tools", title: "Data Science & Analytics", jobs: "155 Jobs" },
                  { icon: "ti-briefcase", title: "Accounting & Consulting", jobs: "300 Jobs" },
                  { icon: "ti-ruler-pencil", title: "Writing & Translations", jobs: "80 Jobs" },
                  { icon: "icon-briefcase", title: "Sales & Marketing", jobs: "120 Jobs" },
                  { icon: "icon-wine", title: "Graphics & Design", jobs: "78 Jobs" },
                  { icon: "ti-world", title: "Digital Marketing", jobs: "90 Jobs" },
                  { icon: "ti-desktop", title: "Education & Training", jobs: "210 Jobs" },
                ].map((cat, i) => (
                  <div className="col-md-3 col-sm-6" key={i}>
                    <a href="/browse-jobs" title={cat.title}>
                      <div className="utf_category_box_area">
                        <div className="utf_category_desc">
                          <div className="utf_category_icon">
                            <i className={cat.icon} aria-hidden="true"></i>
                          </div>
                          <div className="category-detail utf_category_desc_text">
                            <h4>{cat.title}</h4>
                            <p>{cat.jobs}</p>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </>
            )}

            <div className="col-md-12 mrg-top-20 text-center">
              <a href="/browse-industry" className="btn theme-btn btn-m">
                View All Industries
              </a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Home;