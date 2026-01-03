import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../../api/notificationApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "../../assets/plugins/bootstrap/css/bootstrap.min.css";
import "../../assets/plugins/icons/css/icons.css";
import "../../assets/plugins/animate/animate.css";
import "../../assets/plugins/bootstrap/css/bootsnav.css";
import "../../assets/css/style.css";
import "../../assets/css/responsive.css";
import "./Notifications.css";

export default function Notifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filter, setFilter] = useState("all");
  const pageSize = 20;
  const navigate = useNavigate();
  const { user } = useAuth();

  const loadNotifications = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        size: pageSize,
        sortBy: "createdAt",
        asc: false,
      };

      if (filter === "unread") {
        params.isRead = false;
      } else if (filter === "read") {
        params.isRead = true;
      }

      const result = await getNotifications(params);
      setNotifications(Array.isArray(result.items) ? result.items : []);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.total || 0);
      setCurrentPage(page);
    } catch (e) {
      setError(e?.message || "Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(1);
  }, [filter]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      setError("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setTotalItems((prev) => prev - 1);
    } catch (e) {
      setError("Failed to delete notification");
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on user role
    if (user && user.roles) {
      const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
      const roleNames = roles.map(r => typeof r === 'string' ? r : r.name).filter(Boolean);
      
      if (roleNames.includes("JOB_SEEKER")) {
        navigate("/seeker-applications");
      } else if (roleNames.includes("EMPLOYER")) {
        navigate("/employer-applications");
      } else if (notification.target) {
        try {
          navigate(notification.target);
        } catch (e) {
          console.error("Navigation failed", e);
        }
      }
    } else if (notification.target) {
      try {
        navigate(notification.target);
      } catch (e) {
        console.error("Navigation failed", e);
      }
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    loadNotifications(page);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <Header />
      <div className="page-title">
        <div className="container">
          <div className="page-caption">
            <h2>All Notifications</h2>
            <p>
              <a href="/" title="Home">Home</a> <i className="ti-angle-double-right"></i> Notifications
            </p>
          </div>
        </div>
      </div>

      <section className="padd-top-80 padd-bot-80">
        <div className="container">
          {error && (
            <div className="alert alert-danger alert-dismissible">
              <button type="button" className="close" onClick={() => setError("")}>×</button>
              {error}
            </div>
          )}

          {/* Summary and Actions */}
          <div className="row mrg-bot-20">
            <div className="col-md-12">
              <div className="panel panel-default">
                <div className="panel-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h4 className="mrg-top-0">
                        Total: {totalItems} notifications
                        {unreadCount > 0 && (
                          <span className="label label-danger notifications-unread-badge">
                            {unreadCount} unread
                          </span>
                        )}
                      </h4>
                    </div>
                    <div className="col-md-6 text-right">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={handleMarkAllAsRead}
                        disabled={loading || unreadCount === 0}
                      >
                        <i className="ti-check"></i> Mark All as Read
                      </button>
                      <button
                        className="btn btn-default btn-sm notifications-reload-btn"
                        onClick={() => loadNotifications(currentPage)}
                        disabled={loading}
                        style={{ marginLeft: 10 }}
                      >
                        <i className="ti-reload"></i> Reload
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="row mrg-bot-20">
            <div className="col-md-12">
              <ul className="nav nav-tabs">
                <li className={filter === "all" ? "active" : ""}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setFilter("all"); }}>
                    All
                  </a>
                </li>
                <li className={filter === "unread" ? "active" : ""}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setFilter("unread"); }}>
                    Unread
                  </a>
                </li>
                <li className={filter === "read" ? "active" : ""}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setFilter("read"); }}>
                    Read
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Notifications List */}
          <div className="row">
            <div className="col-md-12">
              <div className="panel panel-default">
                <div className="panel-heading">
                  <strong>Notifications</strong>
                </div>
                <div className="panel-body notifications-panel-body-no-padding">
                  {loading ? (
                    <div className="text-center padd-top-30 padd-bot-30">
                      <i className="ti-reload notifications-loading-icon"></i>
                      <p>Loading...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center text-muted padd-top-30 padd-bot-30">
                      <i className="ti-info-alt notifications-empty-icon"></i>
                      <p className="notifications-empty-text">No notifications found</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover notifications-table">
                        <thead>
                          <tr>
                            <th>Message</th>
                            <th className="notifications-date-column">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notifications.map((notification) => {
                            const id = notification.id ?? notification._id;
                            const isRead = notification.isRead || notification.read || false;
                            const rowClasses = [
                              isRead ? "" : "notifications-unread-row",
                              notification.target ? "notifications-clickable-row" : "notifications-default-row"
                            ].filter(Boolean).join(" ");
                            return (
                              <tr
                                key={id}
                                className={rowClasses}
                              >
                                <td
                                  onClick={() => handleNotificationClick(notification)}
                                  style={{ fontWeight: isRead ? "normal" : "bold" }}
                                >
                                  {notification.message ?? notification.title ?? "Notification"}
                                </td>
                                <td>
                                  <small className="text-muted">
                                    {notification.createdAt
                                      ? new Date(notification.createdAt).toLocaleString()
                                      : "-"}
                                  </small>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="panel-footer">
                    <div className="text-center">
                      <ul className="pagination notifications-pagination">
                        <li className={currentPage === 1 ? "disabled" : ""}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage - 1);
                            }}
                          >
                            <i className="ti-angle-left"></i> Previous
                          </a>
                        </li>
                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          // Show first, last, current, and adjacent pages
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                          ) {
                            return (
                              <li key={page} className={currentPage === page ? "active" : ""}>
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePageChange(page);
                                  }}
                                >
                                  {page}
                                </a>
                              </li>
                            );
                          } else if (page === currentPage - 3 || page === currentPage + 3) {
                            return <li key={page} className="disabled"><a href="#">...</a></li>;
                          }
                          return null;
                        })}
                        <li className={currentPage === totalPages ? "disabled" : ""}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(currentPage + 1);
                            }}
                          >
                            Next <i className="ti-angle-right"></i>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
