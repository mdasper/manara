'use client';
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { getRevenueReport, getOccupancyReport, getMaintenanceCostReport, getVacancyReport, getRenewalPipeline } from '@/lib/api';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('revenue');
    const [revenue, setRevenue] = useState([]);
    const [occupancy, setOccupancy] = useState([]);
    const [maintenance, setMaintenance] = useState(null);
    const [vacancy, setVacancy] = useState(null);
    const [pipeline, setPipeline] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getRevenueReport(),
            getOccupancyReport(),
            getMaintenanceCostReport(),
            getVacancyReport(),
            getRenewalPipeline(),
        ]).then(([r, o, m, v, p]) => {
            setRevenue(r.data);
            setOccupancy(o.data);
            setMaintenance(m.data);
            setVacancy(v.data);
            setPipeline(p.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const tabs = [
        { id: 'revenue', label: '💰 Revenue', icon: '💰' },
        { id: 'occupancy', label: '📊 Occupancy', icon: '📊' },
        { id: 'maintenance', label: '🔧 Maintenance', icon: '🔧' },
        { id: 'vacancy', label: '🔓 Vacancy', icon: '🔓' },
        { id: 'pipeline', label: '📋 Renewals', icon: '📋' },
    ];

    if (loading)
        return <div className="loading-spinner"/>;

    const totalRevenue = revenue.reduce((s, r) => s + r.collected, 0);
    const totalPending = revenue.reduce((s, r) => s + r.pending, 0);

    return (
      <div className="page-container animate-fade-in">
        <div className="page-header animate-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Reports & Analytics</h1>
              <p className="page-subtitle">Comprehensive property portfolio analysis</p>
            </div>
            <button className="btn btn-primary" onClick={() => window.print()}>
              ⬇ Export PDF
            </button>
          </div>
        </div>

        {/* Tabs with smooth horizontal touch scroll */}
        <div className="tabs reports-tabs animate-in">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab-item ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="animate-in">
            <div className="reports-kpi-grid">
              {[
                  { label: 'Total Collected (12mo)', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, color: '#10b981' },
                  { label: 'Total Pending', value: `₹${(totalPending / 1000).toFixed(0)}K`, color: '#f59e0b' },
                  { label: 'Collection Rate', value: `${totalRevenue + totalPending > 0 ? ((totalRevenue / (totalRevenue + totalPending)) * 100).toFixed(0) : 0}%`, color: '#6366f1' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 700, margin: 0 }}>Monthly Revenue (Last 12 Months)</h3>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} tickFormatter={v => v.split(' ')[0]}/>
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}/>
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']}/>
                    <Legend />
                    <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]}/>
                    <Bar dataKey="pending" fill="#f59e0b80" name="Pending" radius={[4, 4, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Occupancy Tab */}
        {activeTab === 'occupancy' && (
          <div className="animate-in">
            <div className="reports-charts-grid">
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 700, margin: 0 }}>Occupancy by Property</h3>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={occupancy} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }}/>
                      <YAxis dataKey="property" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={90} tickFormatter={v => v.split(' ')[0]}/>
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}/>
                      <Bar dataKey="occupied" fill="#10b981" name="Occupied" radius={[0, 4, 4, 0]}/>
                      <Bar dataKey="vacant" fill="#ef444460" name="Vacant" radius={[0, 4, 4, 0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontWeight: 700, margin: 0 }}>Occupancy Distribution</h3>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={occupancy.map((o) => ({ name: o.property.split(' ')[0], value: o.occupied }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="value"
                        label={({ name, percent }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {occupancy.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="table-container" style={{ marginTop: '1rem' }}>
                    <table className="table">
                      <thead><tr><th>Property</th><th>Total</th><th>Occupied</th><th>Rate</th></tr></thead>
                      <tbody>
                        {occupancy.map((o, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{o.property}</td>
                            <td>{o.total_units}</td>
                            <td style={{ color: '#10b981' }}>{o.occupied}</td>
                            <td><span className={`badge ${o.occupancy_rate >= 80 ? 'badge-success' : 'badge-warning'}`}>{o.occupancy_rate}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && maintenance && (
          <div className="animate-in">
            <div className="reports-kpi-grid">
              {[
                  { label: 'Total Maintenance Cost', value: `₹${(maintenance.total_maintenance_cost / 1000).toFixed(0)}K`, color: '#f59e0b' },
                  { label: 'Total Records', value: maintenance.total_records, color: '#6366f1' },
                  { label: 'Avg Cost / Record', value: `₹${maintenance.total_records > 0 ? ((maintenance.total_maintenance_cost / maintenance.total_records) / 1000).toFixed(1) : 0}K`, color: '#8b5cf6' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 700, margin: 0 }}>Cost by Category</h3>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={maintenance.by_category}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 11 }}/>
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}/>
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Cost']}/>
                    <Bar dataKey="total_cost" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Total Cost">
                      {maintenance.by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Vacancy Tab */}
        {activeTab === 'vacancy' && vacancy && (
          <div className="animate-in">
            <div className="card vacancy-summary-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
              <div style={{ textAlign: 'center', minWidth: '100px' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{vacancy.total_vacant}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vacant Units</div>
              </div>
              <div className="vacancy-summary-desc">
                {vacancy.total_vacant === 0
                  ? '✅ All units are occupied. Excellent performance!'
                  : `⚠️ ${vacancy.total_vacant} units currently vacant. Consider targeted marketing or rent adjustments for long-vacant units.`}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 700, margin: 0 }}>Vacant Units Detail</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Unit</th><th>Property</th><th>Type</th><th>Floor</th><th>Rent</th><th>Days Vacant</th></tr></thead>
                  <tbody>
                    {vacancy.vacant_units.map((u, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.unit_number}</td>
                        <td>{u.property}</td>
                        <td style={{ textTransform: 'capitalize' }}>{u.type}</td>
                        <td>Floor {u.floor}</td>
                        <td style={{ fontWeight: 600, color: '#ef4444' }}>₹{u.rent_amount.toLocaleString('en-IN')}</td>
                        <td>
                          {u.days_vacant !== null ? (
                            <span className={`badge ${u.days_vacant > 30 ? 'badge-danger' : 'badge-warning'}`}>
                              {u.days_vacant}d
                            </span>
                          ) : <span className="badge badge-info">New</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="animate-in">
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 700, margin: 0 }}>Renewal Pipeline</h3>
                <span className="badge badge-warning">{pipeline.length} leases</span>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Tenant</th><th>Phone</th><th>Unit</th><th>Property</th><th>Lease End</th><th>Days Left</th><th>Rent</th></tr>
                  </thead>
                  <tbody>
                    {pipeline.map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.tenant}</td>
                        <td>{l.phone}</td>
                        <td><span className="badge badge-primary">{l.unit}</span></td>
                        <td>{l.property}</td>
                        <td>{l.lease_end}</td>
                        <td>
                          <span className={`badge ${l.days_until_expiry <= 7 ? 'badge-danger' : l.days_until_expiry <= 15 ? 'badge-warning' : 'badge-info'}`}>
                            {l.days_until_expiry}d
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>₹{l.rent_amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pipeline.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <p>No renewals in pipeline</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
