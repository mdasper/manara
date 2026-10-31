'use client';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
const navItems = [
    {
        section: 'Overview',
        items: [
            { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
            { href: '/ai-dashboard', icon: '🤖', label: 'AI Dashboard', badge: null },
        ]
    },
    {
        section: 'Management',
        items: [
            { href: '/properties', icon: '🏢', label: 'Properties' },
            { href: '/units', icon: '🏗️', label: 'Units' },
            { href: '/tenants', icon: '👥', label: 'Tenants' },
            { href: '/leases', icon: '📋', label: 'Leases' },
        ]
    },
    {
        section: 'Finance',
        items: [
            { href: '/payments', icon: '💰', label: 'Payments' },
            { href: '/maintenance', icon: '🔧', label: 'Maintenance' },
        ]
    },
    {
        section: 'Tools',
        items: [
            { href: '/calendar', icon: '📅', label: 'Calendar' },
            { href: '/notifications', icon: '🔔', label: 'Notifications' },
            { href: '/reports', icon: '📊', label: 'Reports' },
        ]
    }
];
import { getAIAlerts } from '@/lib/api';

export default function Sidebar({ isOpen = false, onClose }) {
    const { pathname } = useLocation();
    const [alerts, setAlerts] = useState(0);
    useEffect(() => {
        // Fetch alert count
        getAIAlerts()
            .then(res => {
                const data = res.data || [];
                setAlerts(data.filter((a) => a.severity === 'high').length);
            })
            .catch(() => { });
    }, []);
    return (<aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="sidebar-logo-icon">🏢</div>
          <div>
            <div className="sidebar-logo-text" suppressHydrationWarning>MANARA</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Properties</div>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (<div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (<Link key={item.href} to={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.label === 'AI Dashboard' && alerts > 0 && (<span className="nav-badge">{alerts}</span>)}
                  {item.label === 'Notifications' && alerts > 0 && (<span className="nav-badge">{alerts}</span>)}
                </Link>);
            })}
          </div>))}
      </nav>

      {/* Footer */}
      <div style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Link to="/tenant-portal" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.6rem',
            background: 'var(--bg-elevated)',
            borderRadius: '6px',
            color: 'var(--primary-light)',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '0.75rem',
            border: '1px solid var(--border)',
          }}>
            <span>🏠</span>
            <span>Switch to Tenant View</span>
          </Link>
          <Link to="/login" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.6rem',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '6px',
            color: 'var(--danger)',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '0.75rem',
          }}>
            <span>🚪</span>
            <span>Logout</span>
          </Link>
        </div>
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>MANARA Properties</div>
        <div>v1.0 · Admin Console</div>
      </div>
    </aside>);
}
