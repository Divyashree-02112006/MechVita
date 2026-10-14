import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Cpu,
  Activity,
  HeartPulse,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import logo from "../assets/mechvita-navbar.png";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      label: "Machine Selection",
      icon: Cpu,
      path: "/machine-selection",
    },
    {
      label: "Live Sensors",
      icon: Activity,
      path: "/live-sensors",
    },
    {
      label: "Health Score",
      icon: HeartPulse,
      path: "/health-score",
    },
    {
      label: "Alerts & Suggestions",
      icon: Bell,
      path: "/alerts",
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    navigate("/login");
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="dashboard-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        className="dashboard-menu-button"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={21} />
      </button>

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <img
            src={logo}
            alt="MechVita"
            className="dashboard-logo"
          />

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Brand */}
        <div className="sidebar-brand">
          <span>MECHVITA</span>
          <small>Machine Health Monitoring</small>
        </div>

        {/* Navigation */}
        <nav className="dashboard-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.path;

            return (
              <button
                key={item.path}
                className={`dashboard-nav-item ${
                  isActive ? "active" : ""
                }`}
                onClick={() =>
                  handleNavigation(item.path)
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <div className="sidebar-system-status">
            <span className="status-dot"></span>

            <div>
              <strong>System Online</strong>
              <small>Monitoring system active</small>
            </div>
          </div>

          <button
            className="dashboard-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;