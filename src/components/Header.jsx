import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import userAvatar from "../assets/img/avatar.png";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "../assets/plugins/bootstrap/css/bootsnav.css";
import "../assets/plugins/icons/css/icons.css";
import '../assets/css/Header.css';
import { logout as authLogout, getCurrentUser, logoutAllDevices as authLogoutAllDevices, changePassword as authChangePassword } from "../auth/auth";
import { getUserProfileByUserId } from "../api/userProfileApi";
import NotificationBell from "./NotificationBell";
import { createPortal } from "react-dom";

// Menu với permission & role constraints
const menuItems = [
  { label: "Home", link: "/" },
  {
    label: "Employer",
    children: [
      { label: "Employer", link: "/employer", permission: "USER_READ" },
      { label: "Employer Applications", link: "/employer-applications", permission: "APPLICATION_UPDATE", role: "EMPLOYER" },
      { label: "Create Company", link: "/create-company", permission: "COMPANY_CREATE"},
      { label: "Add Job", link: "/add-job", permission: "JOB_CREATE" },
      { label: "Company List", link: "/company-list", permission: "COMPANY_READ" },
    ],
  },
  {
    label: "Seeker",
    children: [
      { label: "Seeker", link: "/seeker", permission: "USER_READ" },
      { label: "Seeker Applications", link: "/seeker-applications", permission: "APPLICATION_READ", role: "JOB_SEEKER" },
      { label: "Create CV", link: "/create-cv", permission: "USER_CV_CREATE", role: "JOB_SEEKER" },
      { label: "CV List", link: "/cv-list", permission: "USER_CV_READ", role: "JOB_SEEKER" },
      { label: "Browse Jobs", link: "/browse-jobs", permission: "JOB_READ" },
      { label: "Browse Categories", link: "/browse-categories", permission: "JOB_CATEGORY_READ" },
    
    ],
  },
  {
    label: "Admin",
    children: [
      { label: "Admin Dashboard", link: "/admin-dashboard", permission: "ROLE_CREATE" },
      { label: "User Management", link: "/users", permission: "ROLE_CREATE" },
      { label: "Role Management", link: "/roles", permission: "ROLE_CREATE" },
      { label: "Permission Management", link: "/permissions", permission: "PERMISSION_CREATE" },
      { label: "Category Management", link: "/category-management", permission: "JOB_CATEGORY_CREATE" },
      { label: "Skill Management", link: "/skills-management", permission: "SKILL_CREATE" },
      { label: "Role Permission Management", link: "/roles-permissions", permission: "ROLE_PERMISSION_CREATE" },
    ],
  },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const [showConfirmLogoutAll, setShowConfirmLogoutAll] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const navigate = useNavigate();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update user when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => setUser(getCurrentUser());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
  };

  // logout all devices -> open confirm popup
  const handleLogoutAllDevices = () => {
    setShowConfirmLogoutAll(true); 
  };

  // confirm action in popup
  const confirmLogoutAllDevices = async () => {
    try {
      setIsLoggingOutAll(true);
      await authLogoutAllDevices();
      setUser(null);
    } finally {
      setIsLoggingOutAll(false);
      setShowConfirmLogoutAll(false);
    }
  };

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleOpenProfile = async (e) => {
    e?.preventDefault?.();
    const uid = user?.id ?? user?.userId;
    if (!uid) {
      navigate("/login");
      return;
    }
    try {
      const data = await getUserProfileByUserId(uid);
      sessionStorage.setItem(
        "prefill_user_profile",
        JSON.stringify({ ts: Date.now(), data, userId: uid })
      );
    } catch {
    } finally {
      navigate(`/edit-user-profile/${uid}`);
    }
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  // Hàm kiểm tra role
  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const isVisibleItem = (item) => {
    if (!item) return false;
    const needPerm = !!item.permission;
    const needRole = !!item.role;
    const permOk = needPerm ? hasPermission(item.permission) : true;
    const roleOk = needRole ? hasRole(item.role) : true;
    return permOk && roleOk;
  };

  // lock body scroll while modal is open
  useEffect(() => {
    if (showConfirmLogoutAll) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [showConfirmLogoutAll]);

  // NEW: close on Escape
  useEffect(() => {
    if (!showConfirmLogoutAll) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowConfirmLogoutAll(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConfirmLogoutAll]);

  return (
    <nav className={`navbar navbar-expand-lg navbar-fixed bootsnav ${scrolled ? 'bg-white shadow-sm' : 'no-background'}`}>
      <div className="container d-flex justify-content-between align-items-center">
        {/* Brand */}
        <Link
          to="/"
          className={`navbar-brand jp-brand ${scrolled ? 'text-dark' : 'text-light'}`}
          aria-label="JobPortal home"
        >
          <span className="jp-logo-box">
            <span className="jp-logo-initials">JP</span>
          </span>
          <span className="jp-brand-text">JobPortal</span>
        </Link>

        {/* Toggler */}
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu */}
        <div className="collapse navbar-collapse" id="navbar-menu">
          <ul className={`navbar-nav me-auto mb-2 mb-lg-0`}>
            {menuItems.map(menu => {
              if (menu.children) {
                // Lọc menu con theo permission/role
                const visibleChildren = menu.children.filter(isVisibleItem);
                if (visibleChildren.length === 0) return null; // Ko có quyền => ko hiện menu cha

                return (
                  <li className="nav-item dropdown" key={menu.label}>
                    <span
                      className={`nav-link dropdown-toggle ${scrolled ? 'text-dark' : 'text-light'}`}
                      role="button"
                      data-bs-toggle="dropdown"
                    >
                      {menu.label}
                    </span>
                    <ul className={`dropdown-menu ${scrolled ? '' : 'bg-dark'}`}>
                      {visibleChildren.map(i => (
                        <li key={i.label}>
                          <Link className={`dropdown-item ${scrolled ? '' : 'text-light'}`} to={i.link}>
                            {i.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }

              // nếu menu có constraint (permission/role) thì kiểm tra visibility
              if (!isVisibleItem(menu)) return null;
              return (
                <li className="nav-item" key={menu.label}>
                  <Link className={`nav-link ${scrolled ? 'text-dark' : 'text-light'}`} to={menu.link}>
                    {menu.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Right */}
        <ul className="navbar-nav ms-auto d-flex align-items-center gap-2">
          {user ? (
            <>
              {/* Notification bell */}
              <li className="nav-item jp-notif-item">
                <NotificationBell user={user} scrolled={scrolled} />
              </li>
              {/* end notification bell */}
              <div className="dropdown">
                <span
                  className={`nav-link dropdown-toggle d-flex align-items-center ${scrolled ? 'text-dark' : 'text-light'}`}
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  <img src={user.avatar || userAvatar} alt="avatar" className="rounded-circle" width="35" height="35" />
                  <span className="ms-2">{user.username}</span>
                </span>
                <ul className={`dropdown-menu dropdown-menu-end ${scrolled ? '' : 'bg-dark'}`}>
                  <li>
                    <button
                      className={`dropdown-item ${scrolled ? '' : 'text-light'}`}
                      onClick={handleOpenProfile}
                    >
                      Profile
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  {/* Change Password */}
                  <li>
                    <button
                      className={`dropdown-item ${scrolled ? '' : 'text-light'}`}
                      onClick={handleChangePassword}
                    >
                      Change Password
                    </button>
                  </li>
                  {/* Logout From All Devices */}
                  <li>
                    <button
                      className={`dropdown-item ${scrolled ? '' : 'text-light'}`}
                      onClick={handleLogoutAllDevices}
                    >
                      Log out from all devices
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className={`dropdown-item ${scrolled ? '' : 'text-light'}`} onClick={handleLogout}>Logout</button></li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className={`btn-signup red-btn ${scrolled ? 'btn-outline-dark' : 'btn-outline-light'}`} to="/login">
                  <i className="ti-user"></i> Login
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`btn-signup red-btn ${scrolled ? 'btn-dark' : 'btn-light'}`} to="/signup?role=3">
                  <span className="ti-briefcase"></span> Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
      {/* Confirm Logout-All popup via portal */}
      {showConfirmLogoutAll && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmLogoutAllTitle"
          onClick={() => setShowConfirmLogoutAll(false)}
          className="jp-confirm-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="jp-confirm-modal"
          >
            <div className="jp-confirm-header">
              <h5 id="confirmLogoutAllTitle" className="m-0">Confirm action</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowConfirmLogoutAll(false)} />
            </div>
            <div className="jp-confirm-body">
              Are you sure you want to log out from all devices?
            </div>
            <div className="jp-confirm-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmLogoutAll(false)} disabled={isLoggingOutAll}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={confirmLogoutAllDevices} disabled={isLoggingOutAll}>
                {isLoggingOutAll ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default Header;