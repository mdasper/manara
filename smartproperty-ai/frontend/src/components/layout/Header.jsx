'use client';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
const pageTitles = {
    '/dashboard': 'Dashboard',
    '/properties': 'Properties',
    '/units': 'Units',
    '/tenants': 'Tenants',
    '/leases': 'Leases',
    '/payments': 'Payments',
    '/maintenance': 'Maintenance',
    '/calendar': 'Calendar',
    '/ai-dashboard': 'AI Dashboard',
    '/ai-assistant': 'AI Assistant',
    '/notifications': 'Notifications',
    '/reports': 'Reports & Analytics',
};
import { Menu } from 'lucide-react';
import { getActiveUser } from '@/lib/auth';

export default function Header({ onToggleMobile }) {
    const { pathname } = useLocation();
    const [theme, setTheme] = useState('dark');
    const [search, setSearch] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        setCurrentUser(getActiveUser());
        setCurrentDate(new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }, [pathname]);
    const title = pageTitles[pathname] || pageTitles[Object.keys(pageTitles).find(k => pathname.startsWith(k)) || ''] || 'MANARA';
    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
    };
    return (<header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobile}
          aria-label="Toggle Navigation Drawer"
        >
          <Menu size={19} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.1 }}>{title}</h1>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {currentDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="header-search">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>🔍</span>
          <input type="text" placeholder="Search properties, tenants..." value={search} onChange={e => setSearch(e.target.value)}/>
          <kbd style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>⌘K</kbd>
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme} className="btn btn-secondary btn-icon" title="Toggle theme" style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {/* Notifications */}
        <Link to="/notifications">
          <button className="btn btn-secondary btn-icon notification-badge" title="Notifications" style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🔔
          </button>
        </Link>

        {/* User Avatar & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
              width: 36,
              height: 36,
              background: currentUser?.role === 'manager' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' 
                : 'var(--gradient-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
          }} title={currentUser?.role === 'manager' ? 'Property Manager' : 'Administrator'}>
            {currentUser?.role === 'manager' ? 'MG' : 'AD'}
          </div>
          <Link to="/login" className="header-logout-btn" style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
          }}>
            Logout
          </Link>
        </div>
      </div>
    </header>);
}
