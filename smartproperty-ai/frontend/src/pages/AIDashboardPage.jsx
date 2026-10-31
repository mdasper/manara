'use client';
import React, { useEffect, useState } from 'react';
import { getAIAlerts, getAIInsights } from '@/lib/api';
import { Link } from 'react-router-dom';
const ALERT_ICONS = {
    lease_expiry: '📋',
    rent_overdue: '💸',
    vacant_unit: '🔓',
    maintenance_due: '🔧',
};
const ALERT_COLORS = {
    high: { bg: 'rgba(239,68,68,0.08)', border: '#ef4444', badge: 'badge-danger' },
    medium: { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', badge: 'badge-warning' },
    low: { bg: 'rgba(59,130,246,0.08)', border: '#3b82f6', badge: 'badge-info' },
};
export default function AIDashboardPage() {
    const [alerts, setAlerts] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    useEffect(() => {
        Promise.all([getAIAlerts(), getAIInsights()]).then(([a, i]) => {
            setAlerts(a.data);
            setInsights(i.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);
    const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
    const counts = {
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
    };
    if (loading)
        return <div className="loading-spinner"/>;
    return (<div>
      <div className="page-header animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">🤖 AI Dashboard</h1>
            <p className="page-subtitle">Proactive intelligence — {alerts.length} active alerts</p>
          </div>
        </div>
      </div>

      {/* Insights Cards */}
      {insights && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
                { label: 'Occupancy Rate', value: `${insights.occupancy_rate}%`, icon: '📈', color: '#10b981' },
                { label: 'Monthly Revenue', value: `₹${(insights.monthly_revenue / 100000).toFixed(1)}L`, icon: '💰', color: '#6366f1' },
                { label: 'Maintenance Cost', value: `₹${(insights.total_maintenance_cost / 1000).toFixed(0)}K`, icon: '🔧', color: '#f59e0b' },
                { label: 'Vacant Units', value: insights.vacant_count, icon: '🔓', color: '#ef4444' },
            ].map((s, i) => (<div key={i} className={`kpi-card animate-in animate-delay-${i + 1}`}>
              <div className="kpi-icon" style={{ background: `${s.color}20` }}>
                <span style={{ fontSize: '1.35rem' }}>{s.icon}</span>
              </div>
              <div className="kpi-value" style={{ color: s.color }}>{s.value}</div>
              <div className="kpi-label">{s.label}</div>
            </div>))}
        </div>)}

      {/* AI Insights Text */}
      {insights?.insights && (<div className="card animate-in" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🔍</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Portfolio Insights</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {insights.insights.map((insight, i) => (<div key={i} style={{
                    padding: '0.875rem 1rem',
                    background: 'rgba(99,102,241,0.06)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(99,102,241,0.15)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start'
                }}>
                <span style={{ color: 'var(--primary-light)', flexShrink: 0 }}>→</span>
                {insight}
              </div>))}
          </div>
        </div>)}

      {/* Alert Severity Filters */}
      <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Active Alerts</h3>
        <div className="tabs" style={{ margin: 0 }}>
          {['all', 'high', 'medium', 'low'].map(f => (<button key={f} className={`tab-item ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${alerts.length})` :
                f === 'high' ? `🔴 High (${counts.high})` :
                    f === 'medium' ? `🟡 Medium (${counts.medium})` :
                        `🔵 Low (${counts.low})`}
            </button>))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="alerts-grid">
        {filteredAlerts.map((alert, i) => {
            const colors = ALERT_COLORS[alert.severity];
            return (<div key={i} className="animate-in" style={{
                    padding: '1.25rem',
                    background: colors.bg,
                    border: `1px solid ${colors.border}40`,
                    borderLeft: `3px solid ${colors.border}`,
                    borderRadius: 'var(--radius-md)',
                    transition: 'transform var(--transition)',
                    cursor: 'default',
                }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')} onMouseLeave={e => (e.currentTarget.style.transform = '')}>
              <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{ALERT_ICONS[alert.type] || '⚠️'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {alert.title}
                  </div>
                </div>
                <span className={`badge ${colors.badge}`}>{alert.severity}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {alert.message}
              </p>
              <div className="flex gap-2" style={{ marginTop: '0.75rem' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  View Details
                </button>
                <button className="btn btn-secondary btn-sm">
                  Dismiss
                </button>
              </div>
            </div>);
        })}
      </div>

      {filteredAlerts.length === 0 && (<div className="empty-state card" style={{ padding: '3rem' }}>
          <div className="empty-state-icon">✅</div>
          <h3>No {filter !== 'all' ? filter : ''} alerts</h3>
          <p style={{ marginTop: '0.5rem' }}>All properties are in good standing!</p>
        </div>)}
    </div>);
}
