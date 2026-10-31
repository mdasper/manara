import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Sparkles, Menu } from 'lucide-react';

export default function IOSBottomNav({ onOpenAIChat, onToggleMore }) {
  const { pathname } = useLocation();

  return (
    <nav className="ios-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Dashboard Tab */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `ios-tab-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} className="ios-tab-icon" />
        <span className="ios-tab-label">Home</span>
      </NavLink>

      {/* 2. Properties Tab */}
      <NavLink
        to="/properties"
        className={({ isActive }) => `ios-tab-item ${isActive ? 'active' : ''}`}
      >
        <Building2 size={20} className="ios-tab-icon" />
        <span className="ios-tab-label">Properties</span>
      </NavLink>

      {/* 3. Center AI Copilot Action Button */}
      <button
        type="button"
        onClick={onOpenAIChat}
        className="ios-tab-center-btn"
        aria-label="Open MANARA AI Copilot"
      >
        <div className="ios-ai-spark-ring">
          <Sparkles size={21} color="#ffffff" />
        </div>
        <span className="ios-tab-label" style={{ color: '#c7d2fe', fontWeight: 700 }}>AI Copilot</span>
      </button>

      {/* 4. Tenants Tab */}
      <NavLink
        to="/tenants"
        className={({ isActive }) => `ios-tab-item ${isActive ? 'active' : ''}`}
      >
        <Users size={20} className="ios-tab-icon" />
        <span className="ios-tab-label">Tenants</span>
      </NavLink>

      {/* 5. More Menu Tab */}
      <button
        type="button"
        onClick={onToggleMore}
        className="ios-tab-item"
        aria-label="More Features"
      >
        <Menu size={20} className="ios-tab-icon" />
        <span className="ios-tab-label">More</span>
      </button>
    </nav>
  );
}

