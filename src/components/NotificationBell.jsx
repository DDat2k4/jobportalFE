import React, { useEffect, useRef, useState } from "react";
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from "../api/notificationApi";
import { useNotifications } from "../hooks/useNotification";
import { useNavigate } from "react-router-dom";

export default function NotificationBell({ user, maxItems = 5, scrolled = false }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const p = await getNotifications({ page: 1, size: maxItems, sortBy: "createdAt", asc: false });
      setItems(Array.isArray(p.items) ? p.items : []);
      const c = await getUnreadCount();
      setUnread(Number(c || 0));
    } catch (e) {
      console.warn("load notifications failed", e);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, [user]);

  useNotifications((notif) => {
    setItems((prev) => {
      const next = [notif, ...prev];
      return next.slice(0, maxItems);
    });
    setUnread((u) => Number(u) + 1);
  });

  useEffect(() => {
    const onDoc = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const handleToggle = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      await load();
    }
  };

  const handleMarkRead = async (n) => {
    if (!n || !n.id) return;
    try {
      await markAsRead(n.id);
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it)));
      setUnread((u) => Math.max(0, u - 1));
      
      // Navigate based on user role
      if (user && user.roles) {
        const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
        const roleNames = roles.map(r => typeof r === 'string' ? r : r.name).filter(Boolean);
        
        if (roleNames.includes("JOB_SEEKER")) {
          navigate("/seeker-applications");
        } else if (roleNames.includes("EMPLOYER")) {
          navigate("/employer-applications");
        } else if (n.target) {
          try { navigate(n.target); } catch {}
        }
      } else if (n.target) {
        try { navigate(n.target); } catch {}
      }
    } catch (e) {
      console.warn("markAsRead failed", e);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
      setUnread(0);
    } catch (e) {
      console.warn("markAllAsRead failed", e);
    }
  };

  return (
    <div className="nav-item dropdown" ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        className={`nav-link dropdown-toggle d-flex align-items-center ${scrolled ? "text-dark" : "text-light"}`}
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        aria-expanded={open}
        style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px 8px" }}
      >
        <i className="ti-bell" style={{ fontSize: 18, color: "currentColor" }} />
        {unread > 0 && (
          <span
            className="badge"
            style={{
              marginLeft: 6,
              background: "#dc3545",
              color: "#fff",
              fontSize: 11,
              padding: "3px 6px",
              borderRadius: 10,
              lineHeight: 1,
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`dropdown-menu dropdown-menu-end`} style={{ display: "block", minWidth: 320, right: 0, left: "auto", zIndex: 2000 }}>
          <div style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 14 }}>Notifications</strong>
            <div>
              <button className="btn btn-sm btn-link" onClick={handleMarkAll} disabled={unread === 0}>Mark all read</button>
            </div>
          </div>

          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {loading ? (
              <div className="p-3 text-center">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-3 text-center text-muted">No notifications</div>
            ) : (
              items.map((n) => {
                const id = n.id ?? n._id;
                const isRead = n.isRead || n.read || false;
                return (
                  <button
                    key={id}
                    type="button"
                    className="dropdown-item d-flex"
                    onClick={() => handleMarkRead(n)}
                    style={{ justifyContent: "space-between", alignItems: "flex-start", whiteSpace: "normal" }}
                  >
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: isRead ? 400 : 600 }}>{n.message ?? n.title ?? "Notification"}</div>
                      <small className="text-muted">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</small>
                    </div>
                    {!isRead && <span className="badge bg-danger" style={{ marginLeft: 8 }}>New</span>}
                  </button>
                );
              })
            )}
          </div>

          <div style={{ padding: 8, borderTop: "1px solid #eee", textAlign: "center" }}>
            <a className="btn btn-link" href="/notifications">View all</a>
          </div>
        </div>
      )}
    </div>
  );
}
