// frontend/src/components/branch/BranchLayout.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BRANCH_DASHBOARD_ROLES, normalizeRole } from "../../constants/roles";
import { Icon, ToastContainer } from "./BranchShared";
import "../../styles/branch.css";

const NAV = [
  { id: "dashboard",    label: "Dashboard",      icon: "dashboard",    path: "/branch/dashboard",    section: "Overview" },
  { id: "pos",          label: "POS Terminal",   icon: "pos",          path: "/branch/pos",          section: "Operations", target: "_blank" },
  { id: "orders",       label: "Order Queue",    icon: "orders",       path: "/branch/orders",       section: "Operations" },
  { id: "inventory",    label: "Inventory",      icon: "inventory",    path: "/branch/inventory",    section: "Operations" },
  { id: "products",     label: "Products",       icon: "products",     path: "/branch/products",     section: "Operations" },
  { id: "services",     label: "Services",       icon: "services",     path: "/branch/services",     section: "Service Bay" },
  { id: "appointments", label: "Appointments",   icon: "appointments", path: "/branch/appointments", section: "Service Bay" },
  { id: "suppliers",    label: "Suppliers",      icon: "suppliers",    path: "/branch/suppliers",    section: "Procurement" },
  { id: "reports",      label: "Reports",        icon: "reports",      path: "/branch/reports",      section: "Admin" },
  { id: "settings",     label: "System Settings",  icon: "settings",     path: "/branch/settings",     section: "Admin" },
];

const BranchLayout = () => {
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      navigate("/login");
      return;
    }
    const role = normalizeRole(authUser.role);
    if (!BRANCH_DASHBOARD_ROLES.includes(role)) {
      navigate("/unauthorized");
    }
  }, [authUser, authLoading, navigate]);

  useEffect(() => {
    setShowSidebar(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
  };

  if (authLoading || !authUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07070A" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #0EA5E9", borderTopColor: "transparent", borderRadius: "50%", animation: "spin-loader .8s linear infinite" }} />
        <style>{"@keyframes spin-loader{to{transform:rotate(360deg)}}"}</style>
      </div>
    );
  }

  const user = authUser;
  const activeNav = NAV.find(n => location.pathname === n.path) || NAV[0];

  return (
    <div id="branch-dashboard-shell">
      {showSidebar && (
        <button
          type="button"
          className="branch-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div id="branch-sidebar" className={showSidebar ? "show" : ""}>
        <div className="sb-brand">
          <button
            type="button"
            className="branch-sidebar-close"
            aria-label="Close menu"
            onClick={() => setShowSidebar(false)}
          >
            <Icon n="close" />
          </button>
          <div className="sb-mark">CE</div>
          <div>
            <div className="sb-name">CROWN <span>EVE</span></div>
            <div className="sb-sub">BRANCH TERMINAL</div>
          </div>
        </div>

        <div className="sidebar-scrollable">
          {["Overview", "Operations", "Service Bay", "Procurement", "Admin"].map(sec => (
            <React.Fragment key={sec}>
              <div className="sb-sec">{sec}</div>
              {NAV.filter(n => n.section === sec).map(item => (
                <Link
                  key={item.id}
                  to={item.path}
                  target={item.target || undefined}
                  rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
                  className={`sb-item ${location.pathname === item.path || (item.path !== '/branch/pos' && location.pathname.startsWith(item.path + '/')) ? "active" : ""}`}
                >
                  <Icon n={item.icon} />
                  {item.label}
                </Link>
              ))}
            </React.Fragment>
          ))}
        </div>

        <div style={{ marginTop: "auto" }}>
          <div className="sb-user">
            <div className="sb-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1 }}>
              <div className="sb-uname">{user?.name || "Branch User"}</div>
              <div className="sb-urole">{user?.branchName || "LOCAL STATION"}</div>
            </div>
          </div>
          <button className="sb-item" onClick={handleLogout} style={{ width: "100%", marginTop: 8, background: "transparent", border: "none" }}>
            <Icon n="logout" /> Logout
          </button>
        </div>
      </div>

      <div className="main">
        <div className="branch-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button className="sidebar-toggle" onClick={() => setShowSidebar(true)}>
              <Icon n="menu" />
            </button>
            <div className="topbar-title">{activeNav.label.toUpperCase()}</div>
          </div>
          <div className="topbar-right">
            <div className="live-pill"><span className="live-dot" /> LIVE STATUS</div>
          </div>
        </div>

        <Outlet context={{ user }} />
      </div>

      <ToastContainer />
    </div>
  );
};

export default BranchLayout;
