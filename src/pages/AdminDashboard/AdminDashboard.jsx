import React, { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getJobs, getJobCountsByCategory } from "../../api/jobApi";
import { getCompanies } from "../../api/companyApi";
import { getUsers } from "../../api/userApi";
import { getApplications } from "../../api/applicationApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalJobs, setTotalJobs] = useState(0);
  const [activeJobs, setActiveJobs] = useState(0);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalEmployers, setTotalEmployers] = useState(0);
  const [totalSeekers, setTotalSeekers] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [jobsByCategory, setJobsByCategory] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  const maxCategoryCount = useMemo(
    () => (jobsByCategory.length ? Math.max(...jobsByCategory.map((x) => x.jobCount || 0)) : 0),
    [jobsByCategory]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [
        jobsAll,
        jobsActive,
        companiesAll,
        employers,
        seekers,
        appsAll,
      ] = await Promise.all([
        getJobs({ page: 1, limit: 1 }),                 
        getJobs({ page: 1, limit: 1, status: 1 }),     
        getCompanies({ page: 1, limit: 1 }),           
        getUsers({ page: 1, limit: 1, role: "EMPLOYER" }),
        getUsers({ page: 1, limit: 1, role: "JOB_SEEKER" }),
        getApplications({ page: 1, size: 1 }),         
      ]);

      setTotalJobs(Number(jobsAll?.total || 0));
      setActiveJobs(Number(jobsActive?.total || 0));
      setTotalCompanies(Number(companiesAll?.total || 0));
      setTotalEmployers(Number(employers?.total || 0));
      setTotalSeekers(Number(seekers?.total || 0));
      setTotalApplications(Number(appsAll?.total || 0));

      try {
        const byCat = await getJobCountsByCategory(1);
        const norm = (byCat || []).map((r, i) => ({
          categoryId: r.categoryId ?? i,
          categoryName: r.categoryName ?? r.name ?? `Category ${i + 1}`,
          jobCount: r.jobCount ?? r.count ?? 0,
        }));
        setJobsByCategory(norm);
      } catch {
        setJobsByCategory([]);
      }

      try {
        const rec = await getApplications({ page: 1, size: 8 });
        const items = rec?.items ?? [];
        setRecentApplications(items.slice(0, 8));
      } catch {
        setRecentApplications([]);
      }
    } catch (e) {
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Admin Dashboard</h2>
            <p>
              <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> Admin Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Quick link to User Management */}
      <div className="container adm-quicklink">
        <div className="text-right">
          <a className="btn btn-default btn-sm mrg-5" href="/users">Manage Users</a>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Summary cards */}
          <div className="row">
            <div className="col-md-3 col-sm-6 mrg-bot-20">
              <div className="panel panel-default">
                <div className="panel-body text-center">
                  <div className="h4 mrg-bot-5">{loading ? "…" : totalJobs}</div>
                  <div className="text-muted">Total Jobs</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mrg-bot-20">
              <div className="panel panel-default">
                <div className="panel-body text-center">
                  <div className="h4 mrg-bot-5">{loading ? "…" : activeJobs}</div>
                  <div className="text-muted">Active Jobs</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mrg-bot-20">
              <div className="panel panel-default">
                <div className="panel-body text-center">
                  <div className="h4 mrg-bot-5">{loading ? "…" : totalCompanies}</div>
                  <div className="text-muted">Companies</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mrg-bot-20">
              <div className="panel panel-default">
                <div className="panel-body text-center">
                  <div className="h4 mrg-bot-5">{loading ? "…" : totalApplications}</div>
                  <div className="text-muted">Applications</div>
                </div>
              </div>
            </div>
          </div>

          {/* Users row */}
          <div className="row">
            <div className="col-md-6 col-sm-6 mrg-bot-20">
              <div className="panel panel-default">
                <div className="panel-body text-center">
                  <div className="h4 mrg-bot-5">{loading ? "…" : totalEmployers}</div>
                  <div className="text-muted">Employers</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-sm-6 mrg-bot-20">
              <div className="panel panel-default">
                <div className="panel-body text-center">
                  <div className="h4 mrg-bot-5">{loading ? "…" : totalSeekers}</div>
                  <div className="text-muted">Job Seekers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs by Category */}
          <div className="row">
            <div className="col-md-7">
              <div className="panel panel-default">
                <div className="panel-heading">
                  <strong>Jobs by Category (Active)</strong>
                  <button
                    type="button"
                    className="btn btn-xs btn-default pull-right"
                    onClick={loadData}
                    disabled={loading}
                    title="Reload"
                  >
                    {loading ? "Loading..." : "Reload"}
                  </button>
                </div>
                <div className="panel-body">
                  {jobsByCategory.length === 0 ? (
                    <div className="text-center text-muted">No data</div>
                  ) : (
                    <div>
                      {jobsByCategory.map((it) => {
                        const pct = maxCategoryCount ? Math.round((it.jobCount / maxCategoryCount) * 100) : 0;
                        return (
                          <div key={it.categoryId} className="adm-cat-row">
                            <div className="adm-cat-rowTop">
                              <span>{it.categoryName}</span>
                              <span>{it.jobCount}</span>
                            </div>
                            <div className="adm-progress">
                              <div
                                className="adm-progressBar"
                                style={{ width: `${pct}%` }} // keep dynamic width inline
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Applications */}
            <div className="col-md-5">
              <div className="panel panel-default">
                <div className="panel-heading">
                  <strong>Recent Applications</strong>
                </div>
                <div className="panel-body adm-recentBody">
                  {recentApplications.length === 0 ? (
                    <div className="text-center text-muted">No applications</div>
                  ) : (
                    <table className="table table-striped adm-recentTable">
                      <thead>
                        <tr>
                          <th style={{ width: 80 }}>ID</th>
                          <th>Job</th>
                          <th>Seeker</th>
                          <th style={{ width: 90 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentApplications.map((a) => (
                          <tr key={a.id ?? a._id}>
                            <td>{a.id ?? a._id}</td>
                            <td title={a.jobTitle || a.jobId}>{a.jobTitle || a.jobId || "-"}</td>
                            <td title={a.seekerName || a.seekerId}>{a.seekerName || a.seekerId || "-"}</td>
                            <td><span className="label label-default">{a.status || "-"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
}
