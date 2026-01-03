import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getUsers } from "../../api/userApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./Seeker.css";
import defaultAvatar from "../../assets/img/client-1.jpg"; 

export default function Seeker() {
  const [seekers, setSeekers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 8;
  const totalPages = Math.ceil(total / LIMIT);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const toAbsUrl = (u) => {
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return `${API_URL}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getUsers({ page, limit: LIMIT, role: "JOB_SEEKER" });
        const items = res.items || [];
        setSeekers(items);
        setTotal(res.total || items.length || 0);
      } catch (e) {
        console.warn("load seekers failed", e);
        setSeekers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Seeker</h2>
            <p>
              <a href="#" title="Home">Home</a> <i className="ti-angle-double-right"></i> Seeker
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row">
            {seekers.map((c) => {
              const name = c.fullName ?? c.name ?? c.username ?? "Candidate";
              const avatar = toAbsUrl(c.avatar || c.avatarUrl || c.img) || defaultAvatar;
              const email = c.email ?? "";
              const phone = c.phone ?? "";
              const roles = Array.isArray(c.roles) ? c.roles.join(", ") : "";
              return (
                <div className="col-md-3 col-sm-6 col-xs-12" key={c.id}>
                  <div className="contact-box">
                    <div className="utf_flexbox_area mrg-l-10">
                      <label className="toggler toggler-danger">
                        <input type="checkbox" />
                        <i className="fa fa-heart"></i>
                      </label>
                    </div>
                    <div className="contact-img">
                      <img src={avatar} className="img-responsive" alt={name} />
                    </div>
                    <div className="contact-caption">
                      <a href="#">{name}</a>
                      {email && <div className="seeker-email">{email}</div>}
                      {phone && <div className="seeker-phone">{phone}</div>}
                      {roles && (
                        <div className="seeker-roles">
                          {roles}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && seekers.length === 0 && (
              <div className="col-12">
                <p className="text-muted">No seekers found.</p>
              </div>
            )}
            <div className="clearfix"></div>
            <div className="utf_flexbox_area padd-0 text-center">
              <div className="seeker-pagination-container">
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
      </section>

      <Footer />
    </>
  );
}