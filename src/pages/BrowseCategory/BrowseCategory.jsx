import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getCategories } from "../../api/categoryApi";
import { getJobCountsByCategory } from "../../api/jobApi";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./BrowseCategory.css";

const PAGE_SIZE = 8;

const BrowseCategory = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(1); // Default to Active
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { items: cats = [], total: t = 0 } = await getCategories({
          page,
          size: PAGE_SIZE,
        });
        if (!mounted) return;
        const mapped =
          Array.isArray(cats)
            ? cats.map((c, i) => ({
                id: c.id ?? c._id ?? i,
                name: c.name ?? c.title ?? `Category ${i + 1}`,
                jobs: undefined,
                icon: c.icon ?? null,
              }))
            : [];

        // Fetch job counts and merge
        try {
          const counts = await getJobCountsByCategory(selectedStatus);
          const countMap = {};
          counts.forEach((it) => {
            countMap[Number(it.categoryId)] = it.jobCount;
            if (it.categoryName) countMap[it.categoryName] = it.jobCount;
          });
          mapped.forEach((m) => {
            const byId = countMap[Number(m.id)];
            const byName = countMap[m.name];
            if (typeof byId !== "undefined") m.jobs = `${byId} Jobs`;
            else if (typeof byName !== "undefined") m.jobs = `${byName} Jobs`;
          });
        } catch (countErr) {
          console.warn("load job counts failed", countErr);
        }

        setCategories(mapped);
        setTotal(Number(t) || 0);
      } catch (err) {
        console.warn("load categories failed", err);
        setCategories([]);
        setTotal(0);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedStatus, page]);

  const list = categories;

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container container-narrow">
          <div className="page-caption">
            <h2>Browse by Categories</h2>
            <p>
              <a href="#">Home</a>{" "}
              <i className="ti-angle-double-right"></i> Browse by Categories
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-60">
        <div className="container container-narrow">
          <div className="row">
            {list.map((cat) => (
              <div className="col-md-3 col-sm-6" key={cat.id}>
                <a href={`/browse-jobs?category=${cat.id}`} title={cat.name}>
                  <div className="utf_category_box_area">
                    <div className="utf_category_desc">
                      <div className="utf_category_icon">
                        <i
                          className={cat.icon ?? "icon-briefcase"}
                          aria-hidden="true"
                        ></i>
                      </div>
                      <div className="category-detail utf_category_desc_text">
                        <h4>{cat.name}</h4>
                        <p>{cat.jobs ?? ""}</p>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            ))}
            {!loading && list.length === 0 && (
              <div className="col-12">
                <p className="text-muted">No categories available.</p>
              </div>
            )}
          </div>
          {/* Pagination */}
          <div className="utf_flexbox_area padd-0 text-center">
            <div className="flex-center">
              <ul className="pagination custom-pagination">
                <li
                  className={`page-item prev${
                    page === 1 ? " disabled" : ""
                  }`}
                >
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
                  <li
                    key={i + 1}
                    className={`page-item${
                      page === i + 1 ? " active" : ""
                    }`}
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

export default BrowseCategory;