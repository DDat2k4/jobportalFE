import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/aos-master/aos.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./Employer.css";

import defaultAvatar from "../../assets/img/client-1.jpg";
import { getUsers } from "../../api/userApi";

const PAGE_SIZE = 8;

const Employer = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    getUsers({ page, limit: PAGE_SIZE, role: "EMPLOYER" })
      .then((res) => {
        setEmployers(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        setEmployers([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <Header />

      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>Employer</h2>
            <p>
              <a href="/">Home</a> <i className="ti-angle-double-right"></i> Employer
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          <div className="row">
            <div className="tab-content">
              <div className="row">
                {loading ? (
                  <div className="col-12 text-center">
                    <span>Loading...</span>
                  </div>
                ) : employers.length === 0 ? (
                  <div className="col-12 text-center">
                    <span>No employers found.</span>
                  </div>
                ) : (
                  employers.map((emp) => (
                    <div className="col-md-3 col-sm-6 col-xs-12" key={emp.id}>
                      <div className="contact-box">
                        <div className="utf_flexbox_area mrg-l-10">
                          <label className="toggler toggler-danger">
                            <input type="checkbox" />
                            <i className="fa fa-heart"></i>
                          </label>
                        </div>
                        <div className="contact-img">
                          <img
                            src={emp.avatar || defaultAvatar}
                            className="img-responsive"
                            alt={emp.name || emp.username}
                          />
                        </div>
                        <div className="contact-caption">
                          <div className="employer-name">{emp.name || emp.username}</div>
                          <div className="employer-email">{emp.email}</div>
                          {emp.phone && (
                            <div className="employer-phone">{emp.phone}</div>
                          )}
                          <div className="employer-roles">
                            {emp.roles && emp.roles.length > 0 ? emp.roles.join(", ") : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div className="clearfix"></div>

                <div className="utf_flexbox_area padd-0 text-center">
                  <div className="employer-pagination-container">
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
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Employer;
