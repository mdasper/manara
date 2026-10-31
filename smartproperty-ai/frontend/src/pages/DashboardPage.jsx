'use client';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';
import { getDashboardKPIs, getRevenueReport, getRenewalPipeline, getAIAlerts, getExpiringLeases } from '@/lib/api';
const KPI_CONFIGS = [
    { key: 'total_properties', label: 'Total Properties', icon: '🏢', color: '#6366f1', prefix: '', suffix: '' },
    { key: 'total_units', label: 'Total Units', icon: '🏗️', color: '#8b5cf6', prefix: '', suffix: '' },
    { key: 'occupied_units', label: 'Occupied Units', icon: '✅', color: '#10b981', prefix: '', suffix: '' },
    { key: 'vacant_units', label: 'Vacant Units', icon: '🔓', color: '#ef4444', prefix: '', suffix: '' },
    { key: 'upcoming_renewals', label: 'Renewals Due', icon: '📋', color: '#f59e0b', prefix: '', suffix: '' },
    { key: 'rent_due', label: 'Rent Overdue', icon: '⚠️', color: '#ef4444', prefix: '', suffix: '' },
    { key: 'maintenance_due', label: 'Maintenance Due', icon: '🔧', color: '#f59e0b', prefix: '', suffix: '' },
    { key: 'monthly_revenue', label: 'Monthly Revenue', icon: '💰', color: '#10b981', prefix: '₹', suffix: '' },
    { key: 'occupancy_rate', label: 'Occupancy Rate', icon: '📈', color: '#6366f1', prefix: '', suffix: '%' },
];
function formatValue(value, prefix, suffix, key) {
    if (key === 'monthly_revenue') {
        if (value >= 100000)
            return `${prefix}${(value / 100000).toFixed(1)}L`;
        if (value >= 1000)
            return `${prefix}${(value / 1000).toFixed(0)}K`;
        return `${prefix}${value.toFixed(0)}`;
    }
    return `${prefix}${value}${suffix}`;
}
// Custom high-contrast tooltips for crystal-clear readability
function CustomExpiryTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (<div style={{
                background: '#0f172a',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                color: '#ffffff',
                minWidth: '220px'
            }}>
        <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>
          📅 {label} Window
        </div>
        <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }}>
          Expiring Leases : <span style={{ color: '#ffffff', fontWeight: 800 }}>{data.units} Units</span>
        </div>
        <div style={{ color: '#fbbf24', fontSize: '0.8rem', marginTop: '3px', fontWeight: 600 }}>
          💰 ₹{Number(data.rentAtRisk).toLocaleString('en-IN')}/mo at risk
        </div>
        <div style={{ color: '#a78bfa', fontSize: '0.72rem', marginTop: '6px', borderTop: '1px dashed #334155', paddingTop: '4px', fontWeight: 600 }}>
          👆 Click bar to inspect all {data.units} units & tenants
        </div>
      </div>);
    }
    return null;
}
function CustomDueTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        return (<div style={{
                background: '#0f172a',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                color: '#ffffff',
                minWidth: '200px'
            }}>
        <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.9rem', marginBottom: '6px' }}>
          📅 {label} Collections
        </div>
        {payload.map((item, idx) => (<div key={idx} style={{ color: item.color, fontWeight: 700, fontSize: '0.85rem', marginTop: '3px' }}>
            {item.name === 'collected' ? 'Collected Rent' : 'Due / Overdue'}: ₹{Number(item.value).toLocaleString('en-IN')}
          </div>))}
      </div>);
    }
    return null;
}
export default function DashboardPage() {
    const [kpis, setKpis] = useState(null);
    const [revenueReport, setRevenueReport] = useState([]);
    const [renewalPipeline, setRenewalPipeline] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [expiring, setExpiring] = useState([]);
    const [selectedTimeline, setSelectedTimeline] = useState('31-60 Days');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([
            getDashboardKPIs(),
            getRevenueReport(),
            getRenewalPipeline(),
            getAIAlerts(),
            getExpiringLeases(30),
        ]).then(([k, revRep, renPipe, a, e]) => {
            setKpis(k.data);
            setRevenueReport(revRep.data || []);
            setRenewalPipeline(renPipe.data || []);
            setAlerts(a.data.slice(0, 5));
            setExpiring(e.data.slice(0, 5));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);
    if (loading) {
        return (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-spinner"/>
        <p className="text-muted">Loading property data...</p>
      </div>);
    }
    // Due vs Collected Bar Data
    const dueComparisonData = revenueReport
        .filter((r) => r.collected > 0 || r.pending > 0)
        .slice(-5)
        .map((r) => ({
        month: r.month,
        collected: r.collected,
        due: r.pending,
        total: r.total
    }));
    // Expiry Timeline Buckets Data
    const criticalCount = renewalPipeline.filter((p) => p.days_until_expiry <= 7).length;
    const urgentCount = renewalPipeline.filter((p) => p.days_until_expiry > 7 && p.days_until_expiry <= 30).length;
    const upcomingCount = renewalPipeline.filter((p) => p.days_until_expiry > 30 && p.days_until_expiry <= 60).length;
    const quarterCount = renewalPipeline.filter((p) => p.days_until_expiry > 60 && p.days_until_expiry <= 90).length;
    const safeCount = renewalPipeline.filter((p) => p.days_until_expiry > 90).length;
    const expiryTimelineData = [
        {
            timeline: '< 7 Days',
            units: criticalCount,
            rentAtRisk: renewalPipeline.filter((p) => p.days_until_expiry <= 7).reduce((s, p) => s + (p.rent_amount || 0), 0),
            fill: '#ef4444'
        },
        {
            timeline: '8-30 Days',
            units: urgentCount,
            rentAtRisk: renewalPipeline.filter((p) => p.days_until_expiry > 7 && p.days_until_expiry <= 30).reduce((s, p) => s + (p.rent_amount || 0), 0),
            fill: '#f59e0b'
        },
        {
            timeline: '31-60 Days',
            units: upcomingCount,
            rentAtRisk: renewalPipeline.filter((p) => p.days_until_expiry > 30 && p.days_until_expiry <= 60).reduce((s, p) => s + (p.rent_amount || 0), 0),
            fill: '#8b5cf6'
        },
        {
            timeline: '61-90 Days',
            units: quarterCount,
            rentAtRisk: renewalPipeline.filter((p) => p.days_until_expiry > 60 && p.days_until_expiry <= 90).reduce((s, p) => s + (p.rent_amount || 0), 0),
            fill: '#3b82f6'
        },
        {
            timeline: '90+ Days',
            units: safeCount,
            rentAtRisk: renewalPipeline.filter((p) => p.days_until_expiry > 90).reduce((s, p) => s + (p.rent_amount || 0), 0),
            fill: '#10b981'
        }
    ];
    const totalOverdueAmount = dueComparisonData.reduce((s, d) => s + d.due, 0);
    // Filter units for selected timeline drilldown
    const getUnitsForTimeline = (timelineKey) => {
        if (!timelineKey)
            return [];
        if (timelineKey === '< 7 Days') {
            return renewalPipeline.filter((p) => p.days_until_expiry <= 7);
        }
        if (timelineKey === '8-30 Days') {
            return renewalPipeline.filter((p) => p.days_until_expiry > 7 && p.days_until_expiry <= 30);
        }
        if (timelineKey === '31-60 Days') {
            return renewalPipeline.filter((p) => p.days_until_expiry > 30 && p.days_until_expiry <= 60);
        }
        if (timelineKey === '61-90 Days') {
            return renewalPipeline.filter((p) => p.days_until_expiry > 60 && p.days_until_expiry <= 90);
        }
        if (timelineKey === '90+ Days') {
            return renewalPipeline.filter((p) => p.days_until_expiry > 90);
        }
        return renewalPipeline;
    };
    const selectedUnits = getUnitsForTimeline(selectedTimeline);
    return (<div>
      {/* Page Header */}
      <div className="page-header animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Welcome back! 👋</h1>
            <p className="page-subtitle">Here's what's happening across your portfolio today.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/properties/new"><button className="btn btn-primary">+ Add Property</button></Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-kpi">
        {KPI_CONFIGS.map((config, i) => {
            const value = kpis ? kpis[config.key] : 0;
            return (<div key={config.key} className={`kpi-card animate-in animate-delay-${Math.min(i + 1, 5)}`}>
              <div className="kpi-icon" style={{ background: `${config.color}20` }}>
                <span style={{ fontSize: '1.35rem' }}>{config.icon}</span>
              </div>
              <div className="kpi-value" style={{ color: config.color }}>
                {formatValue(value, config.prefix, config.suffix, config.key)}
              </div>
              <div className="kpi-label">{config.label}</div>
              {config.key === 'occupancy_rate' && (<div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                  <div className="progress-fill" style={{ width: `${value}%`, background: `${config.color}` }}/>
                </div>)}
            </div>);
        })}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Chart 1: Rent Collected vs Due Amount */}
        <div className="card animate-in">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>💰 Rent Collections vs Due Amount</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monthly Collected vs Pending Overdue Breakdown</p>
            </div>
            <span className="badge badge-warning" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              ⚠️ ₹{totalOverdueAmount.toLocaleString('en-IN')} Total Overdue
            </span>
          </div>
          <div className="card-body" style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={dueComparisonData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false}/>
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}/>
                <Tooltip content={<CustomDueTooltip />}/>
                <Legend verticalAlign="top" align="right" height={32} formatter={(value) => (<span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>
                      {value === 'collected' ? 'Collected Rent (Green)' : 'Due / Overdue (Red)'}
                    </span>)}/>
                <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="collected"/>
                <Bar dataKey="due" fill="#ef4444" radius={[4, 4, 0, 0]} name="due"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lease Expiry & Renewal Timeline */}
        <div className="card animate-in">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>⏳ Lease Expiry Timeline & Urgency</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {selectedTimeline ? `Active filter: ${selectedTimeline} (click again to reset)` : 'Click any bar to drilldown into units & tenants'}
              </p>
            </div>
            <span className="badge badge-primary" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              ⏰ {criticalCount + urgentCount} Expiring in 30 Days
            </span>
          </div>
          <div className="card-body" style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={expiryTimelineData} barCategoryGap="25%" onClick={(e) => {
            if (e && e.activePayload && e.activePayload[0]) {
                const clickedTimeline = e.activePayload[0].payload.timeline;
                setSelectedTimeline(prev => prev === clickedTimeline ? null : clickedTimeline);
            }
        }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
                <XAxis dataKey="timeline" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false}/>
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false}/>
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.06)' }} content={<CustomExpiryTooltip />}/>
                <Legend verticalAlign="top" align="right" height={32} formatter={() => (<span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>
                      🚨 &lt;7d Critical · ⚠️ &lt;30d Urgent · 🛡️ Active
                    </span>)}/>
                <Bar dataKey="units" name="units" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(entry) => {
            if (entry && entry.timeline) {
                setSelectedTimeline(prev => prev === entry.timeline ? null : entry.timeline);
            }
        }}>
                  {expiryTimelineData.map((entry, index) => {
            const isSelected = selectedTimeline === entry.timeline;
            return (<Cell key={`cell-${index}`} fill={entry.fill} stroke={isSelected ? '#ffffff' : 'none'} strokeWidth={isSelected ? 3 : 0} onClick={() => setSelectedTimeline(prev => prev === entry.timeline ? null : entry.timeline)} style={{
                    filter: selectedTimeline && !isSelected ? 'opacity(0.35)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}/>);
        })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Quick Interactive Timeline Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {expiryTimelineData.map(d => {
            const isSelected = selectedTimeline === d.timeline;
            return (<button key={d.timeline} onClick={() => setSelectedTimeline(prev => prev === d.timeline ? null : d.timeline)} style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${d.fill}` : '1px solid #334155',
                    background: isSelected ? `${d.fill}33` : '#1e293b',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: isSelected ? `0 0 12px ${d.fill}50` : 'none',
                    transition: 'all 0.15s ease'
                }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill }}/>
                    <span>{d.timeline}:</span>
                    <strong style={{ color: isSelected ? '#ffffff' : '#f1f5f9' }}>{d.units} Units</strong>
                  </button>);
        })}
            </div>
          </div>
        </div>
      </div>

      {/* Drilldown Details Panel when a Bar or Timeline is clicked */}
      {selectedTimeline && (<div className="card animate-in" style={{ marginBottom: '1.5rem', border: '1.5px solid rgba(139, 92, 246, 0.5)', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.35rem' }}>🎯</span>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  Units Expiring in {selectedTimeline} Window
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Found {selectedUnits.length} units ({`₹${selectedUnits.reduce((s, u) => s + (u.rent_amount || 0), 0).toLocaleString('en-IN')}/mo at risk`})
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {expiryTimelineData.map(d => (<button key={d.timeline} onClick={() => setSelectedTimeline(d.timeline)} style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: selectedTimeline === d.timeline ? `1.5px solid ${d.fill}` : '1px solid #334155',
                    background: selectedTimeline === d.timeline ? `${d.fill}33` : '#1e293b',
                    color: selectedTimeline === d.timeline ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                }}>
                    {d.timeline} ({d.units})
                  </button>))}
              </div>
              <button onClick={() => setSelectedTimeline(null)} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid #475569',
                color: '#e2e8f0',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.35rem 0.65rem',
                marginLeft: '0.5rem'
            }} title="Close drilldown view">
                ✕ Close
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {selectedUnits.length === 0 ? (<div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                <p>No units found for {selectedTimeline}.</p>
              </div>) : (<div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Property & Unit</th>
                      <th>Tenant Name</th>
                      <th>Contact Phone</th>
                      <th>Monthly Rent</th>
                      <th>Expiry Date</th>
                      <th>Countdown</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUnits.map((u, idx) => {
                    const icon = u.property_type === 'shopping_complex' ? '🛍️' : u.property_type === 'commercial' ? '🏢' : '🏠';
                    return (<tr key={idx}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                              <div>
                                <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.9rem' }}>
                                  Unit {u.unit}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  {u.property}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                              {u.tenant}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>
                              Active Tenant
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                              <span>📞</span>
                              <span>{u.phone || 'No phone'}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
                              ₹{Number(u.rent_amount || 0).toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/mo</span>
                          </td>
                          <td>
                            <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>
                              {u.lease_end}
                            </div>
                          </td>
                          <td>
                            <span className="status-badge" style={{
                            background: u.days_until_expiry <= 7 ? 'rgba(239, 68, 68, 0.2)' : u.days_until_expiry <= 30 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                            color: u.days_until_expiry <= 7 ? '#f87171' : u.days_until_expiry <= 30 ? '#fbbf24' : '#a78bfa',
                            border: `1px solid ${u.days_until_expiry <= 7 ? 'rgba(239, 68, 68, 0.4)' : u.days_until_expiry <= 30 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
                            fontWeight: 700
                        }}>
                              ⏳ {u.days_until_expiry} Days left
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <Link to={`/leases/${u.lease_id}`}>
                                <button className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                  Manage Lease
                                </button>
                              </Link>
                            </div>
                          </td>
                        </tr>);
                })}
                  </tbody>
                </table>
              </div>)}
          </div>
        </div>)}

      {/* Bottom Row */}
      <div className="grid-2">
        {/* AI Alerts */}
        <div className="card animate-in">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>🤖 AI Proactive Alerts</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated notifications & rules</p>
            </div>
            <Link to="/ai-dashboard">
              <button className="btn btn-secondary btn-sm">View All</button>
            </Link>
          </div>
          <div className="card-body">
            {alerts.length === 0 ? (<div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <p>No critical alerts</p>
              </div>) : (alerts.slice(0, 5).map((alert, i) => (<div key={i} className={`alert-card ${alert.severity}`}>
                  <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                    {alert.type === 'lease_expiry' ? '📋' :
                alert.type === 'rent_overdue' ? '💸' :
                    alert.type === 'vacant_unit' ? '🔓' : '🔧'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{alert.message}</div>
                  </div>
                  <span className={`badge badge-${alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info'}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    {alert.severity}
                  </span>
                </div>)))}
          </div>
        </div>

        {/* Expiring Leases */}
        <div className="card animate-in">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>⏰ Expiring Leases</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Next 30 days renewals pipeline</p>
            </div>
            <Link to="/leases">
              <button className="btn btn-secondary btn-sm">View All</button>
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {expiring.length === 0 ? (<div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <p>No leases expiring soon</p>
              </div>) : (<div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Property & Unit</th>
                      <th>Tenant & Contact</th>
                      <th>Expiry Date</th>
                      <th>Countdown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiring.map((lease, i) => {
                const typeIcon = lease.property_type === 'commercial' ? '🏢' : lease.property_type === 'shopping_complex' ? '🛍️' : '🏠';
                return (<tr key={i}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{typeIcon}</span>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {lease.property_name || 'Property'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 700, marginTop: '0.15rem' }}>
                              Unit {lease.unit_number || (lease.unit_id ? lease.unit_id.slice(0, 6) : 'N/A')}
                            </div>
                          </td>
                          <td>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              {lease.tenant_name || 'Assigned Tenant'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              📞 {lease.tenant_phone || 'No phone'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                              {lease.lease_end}
                            </div>
                          </td>
                          <td>
                            <span className="status-badge" style={{
                        background: lease.days_until_expiry <= 7 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: lease.days_until_expiry <= 7 ? '#ef4444' : '#f59e0b',
                        border: `1px solid ${lease.days_until_expiry <= 7 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
                    }}>
                              ⏳ {lease.days_until_expiry} Days
                            </span>
                          </td>
                        </tr>);
            })}
                  </tbody>
                </table>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
