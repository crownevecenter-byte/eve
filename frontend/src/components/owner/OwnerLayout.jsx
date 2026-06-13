// frontend/src/components/owner/OwnerLayout.jsx
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Icon, ToastContainer } from "./OwnerShared";
import "../../styles/owner.css";

const NAV = [
  { id: "dashboard", label: "Dashboard", path: "/owner/dashboard", icon: "dashboard", section: "Overview" },
  { id: "branches", label: "Branches", path: "/owner/branches", icon: "branches", section: "Network" },
  { id: "orders", label: "All Orders", path: "/owner/orders", icon: "orders", section: "Operations" },
  { id: "purchases", label: "Purchases", path: "/owner/purchases", icon: "purchases", section: "Operations" },
  { id: "users", label: "Personnel", path: "/owner/users", icon: "users", section: "Admin" },
  { id: "reports", label: "Analytics", path: "/owner/reports", icon: "reports", section: "Admin" },
  { id: "settings", label: "Settings", path: "/owner/settings", icon: "settings", section: "Admin" },
];

const SECTIONS = ["Overview", "Network", "Operations", "Admin"];

const OwnerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    setShowSidebar(false);
  }, [location.pathname]);

  const currentPage = NAV.find((n) => n.path === location.pathname);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div id="owner-dashboard-shell">
      {showSidebar && (
        <button
          type="button"
          className="owner-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div id="owner-sidebar" className={showSidebar ? "show" : ""}>
        <div className="sb-brand">
          <button
            type="button"
            className="owner-sidebar-close"
            aria-label="Close menu"
            onClick={() => setShowSidebar(false)}
          >
            <Icon name="close" size={16} />
          </button>
          <div className="sb-mark">CE</div>
          <div>
            <div className="sb-name">
              CROWN <span>EVE</span>
            </div>
            <div className="sb-sub">OWNER PANEL</div>
          </div>
        </div>

        <div className="sidebar-scrollable">
          {SECTIONS.map((sec) => (
            <React.Fragment key={sec}>
              <div className="sb-sec">{sec}</div>
              {NAV.filter((n) => n.section === sec).map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`sb-item ${location.pathname === item.path ? "active" : ""}`}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </Link>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div id="owner-sidebar-footer">
          <div className="sb-user">
            <div className="sb-avatar">{user?.name?.[0]?.toUpperCase() || "O"}</div>
            <div style={{ flex: 1 }}>
              <div className="sb-uname">{user?.name || "Owner"}</div>
              <div className="sb-urole">Company Owner</div>
            </div>
          </div>
          <button
            type="button"
            className="sb-item"
            onClick={handleLogout}
            style={{ width: "100%", marginTop: 8, background: "transparent", border: "none" }}
          >
            <Icon name="logout" size={16} />
            Logout
          </button>
        </div>
      </div>

      <div className="main">
        <div className="branch-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button type="button" className="sidebar-toggle" onClick={() => setShowSidebar(true)}>
              <Icon name="menu" size={20} />
            </button>
            <div className="topbar-title">{currentPage?.label?.toUpperCase() || "DASHBOARD"}</div>
          </div>
          <div className="topbar-right">
            <div className="live-pill">
              <span className="live-dot" /> LIVE STATUS
            </div>
          </div>
        </div>

        <Outlet />
      </div>

      <ToastContainer />
    </div>
  );
};

export default OwnerLayout;
