import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getIndustries } from "../../api/industryApi";
import { getCareerRoles } from "../../api/careerRoleApi";
import { getJobCountsByCareerRole, getJobCountsByIndustry } from "../../api/jobApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./BrowseIndustry.css";

const PAGE_SIZE = 8;

const BrowseIndustry = () => {
  const [industries, setIndustries] = useState([]);
  const [careerRoles, setCareerRoles] = useState([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);
  const [loadingCareerRoles, setLoadingCareerRoles] = useState(false);
  const [selectedIndustryId, setSelectedIndustryId] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingIndustries(true);
        const { items = [], total: t = 0 } = await getIndustries({
          page,
          size: PAGE_SIZE,
        });

        if (!mounted) return;

        const mappedIndustries =
          Array.isArray(items)
            ? items.map((industry, i) => ({
                id: industry.id ?? industry._id ?? i,
                name: industry.name ?? industry.title ?? `Industry ${i + 1}`,
                icon: industry.icon ?? "icon-layers",
                jobs: "0 Jobs",
              }))
            : [];

        try {
          const counts = await getJobCountsByIndustry(1);
          const countMap = {};
          counts.forEach((item) => {
            countMap[Number(item.industryId)] = item.jobCount;
            if (item.industryName) countMap[item.industryName] = item.jobCount;
          });

          mappedIndustries.forEach((industry) => {
            const byId = countMap[Number(industry.id)];
            const byName = countMap[industry.name];
            const value = typeof byId !== "undefined" ? byId : byName;
            industry.jobs = `${Number(value) || 0} Jobs`;
          });
        } catch (countErr) {
          console.warn("load job counts by industry failed", countErr);
        }

        setIndustries(mappedIndustries);
        setTotal(Number(t) || 0);

        const hasSelectedIndustry = mappedIndustries.some(
          (industry) => Number(industry.id) === Number(selectedIndustryId)
        );

        if (!selectedIndustryId || !hasSelectedIndustry) {
          setSelectedIndustryId(mappedIndustries[0]?.id ?? null);
        }
      } catch (err) {
        console.warn("load industries failed", err);
        if (mounted) {
          setIndustries([]);
          setTotal(0);
        }
      } finally {
        if (mounted) setLoadingIndustries(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [page, selectedIndustryId]);

  useEffect(() => {
    let mounted = true;

    if (!selectedIndustryId) {
      setCareerRoles([]);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        setLoadingCareerRoles(true);
        const { items = [] } = await getCareerRoles({
          industryId: selectedIndustryId,
          page: 1,
          size: 50,
        });

        if (!mounted) return;

        const mappedRoles =
          Array.isArray(items)
            ? items.map((role, i) => ({
                id: role.id ?? role._id ?? i,
                name: role.name ?? role.title ?? `Career Role ${i + 1}`,
                icon: role.icon ?? "icon-briefcase",
                jobs: "0 Jobs",
              }))
            : [];

        try {
          const counts = await getJobCountsByCareerRole(1);
          const countMap = {};
          counts.forEach((item) => {
            countMap[Number(item.careerRoleId)] = item.jobCount;
            if (item.careerRoleName) countMap[item.careerRoleName] = item.jobCount;
          });

          mappedRoles.forEach((role) => {
            const byId = countMap[Number(role.id)];
            const byName = countMap[role.name];
            const value = typeof byId !== "undefined" ? byId : byName;
            role.jobs = `${Number(value) || 0} Jobs`;
          });
        } catch (countErr) {
          console.warn("load job counts by career role failed", countErr);
        }

        setCareerRoles(mappedRoles);
      } catch (err) {
        console.warn("load career roles by industry failed", err);
        if (mounted) setCareerRoles([]);
      } finally {
        if (mounted) setLoadingCareerRoles(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedIndustryId]);

  const selectedIndustryName =
    industries.find((industry) => Number(industry.id) === Number(selectedIndustryId))
      ?.name ?? "Industry";

  return (
    <>
      <Header />

      <div className="page-title">
        <div className="container container-narrow">
          <div className="page-caption">
            <h2>Browse Industries</h2>
            <p>
              <a href="#">Home</a>{" "}
              <i className="ti-angle-double-right"></i> Browse Industries
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-60">
        <div className="container container-narrow">
          <h4 className="mb-3">Industries</h4>
          <div className="row">
            {industries.map((industry) => (
              <div className="col-md-3 col-sm-6" key={industry.id}>
                <button
                  type="button"
                  className="utf_category_box_area w-100 text-center border-0"
                  onClick={() => setSelectedIndustryId(industry.id)}
                  title={industry.name}
                  aria-pressed={Number(selectedIndustryId) === Number(industry.id)}
                >
                  <div className="utf_category_desc">
                    <div className="category-detail utf_category_desc_text">
                      <h4>{industry.name}</h4>
                    </div>
                    <div className="utf_category_icon">
                      <i
                        className={industry.icon ?? "icon-layers"}
                        aria-hidden="true"
                      ></i>
                    </div>
                    <div className="category-detail utf_category_desc_text industry-meta">
                      <div className="industry-jobs">{industry.jobs}</div>
                      <div
                        className={`industry-state ${
                          Number(selectedIndustryId) === Number(industry.id)
                            ? "is-selected"
                            : "is-view"
                        }`}
                      >
                        {Number(selectedIndustryId) === Number(industry.id)
                          ? "Selected"
                          : "View career roles"}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}

            {!loadingIndustries && industries.length === 0 && (
              <div className="col-12">
                <p className="text-muted">No industries available.</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h4 className="mb-3">Career Roles in {selectedIndustryName}</h4>
            <div className="row">
              {careerRoles.map((role) => (
                <div className="col-md-3 col-sm-6" key={role.id}>
                  <a
                    href={`/browse-jobs?industry=${selectedIndustryId}&careerRole=${role.id}`}
                    title={role.name}
                  >
                    <div className="utf_category_box_area">
                      <div className="utf_category_desc">
                        <div className="utf_category_icon">
                          <i
                            className={role.icon ?? "icon-briefcase"}
                            aria-hidden="true"
                          ></i>
                        </div>
                        <div className="category-detail utf_category_desc_text">
                          <h4>{role.name}</h4>
                          <p>{role.jobs}</p>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}

              {!loadingCareerRoles && careerRoles.length === 0 && (
                <div className="col-12">
                  <p className="text-muted">No career roles found for this industry.</p>
                </div>
              )}
            </div>
          </div>

          <div className="utf_flexbox_area padd-0 text-center">
            <div className="flex-center">
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

                {Array.from({ length: Math.max(1, totalPages) }, (_, i) => (
                  <li key={i + 1} className={`page-item${page === i + 1 ? " active" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(i + 1)}
                      disabled={page === i + 1}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}

                <li
                  className={`page-item next${
                    page === totalPages || totalPages === 0 ? " disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    aria-label="Next"
                    onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                  >
                    <span aria-hidden="true">»</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default BrowseIndustry;
