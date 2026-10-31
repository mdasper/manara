'use client';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTenants } from '@/lib/api';
export default function TenantsPage() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    useEffect(() => {
        getTenants().then(r => {
            setTenants(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);
    const [statusFilter, setStatusFilter] = useState('all');
    const filtered = tenants.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.phone.includes(search) ||
            (t.email || '').toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch)
            return false;
        if (statusFilter === 'active')
            return !!t.current_unit;
        if (statusFilter === 'without_unit')
            return !t.current_unit;
        return true;
    });
    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
    if (loading)
        return <div className="loading-spinner"/>;
    return (<div>
      <div className="page-header animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Tenants</h1>
            <p className="page-subtitle">{tenants.length} tenants registered in system</p>
          </div>
          <Link to="/tenants/new">
            <button className="btn btn-primary">+ Add Tenant</button>
          </Link>
        </div>
      </div>

      {/* Stats with Quick Filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
            { key: 'all', label: 'Total Tenants', value: tenants.length, color: '#6366f1', desc: 'All registered tenants in system' },
            { key: 'active', label: 'Active Leases', value: tenants.filter(t => t.current_unit).length, color: '#10b981', desc: 'Tenants currently occupying a unit' },
            { key: 'without_unit', label: 'Without Unit', value: tenants.filter(t => !t.current_unit).length, color: '#f59e0b', desc: 'Unassigned or exited / past tenants' },
        ].map((s) => {
            const isSelected = statusFilter === s.key;
            return (<div key={s.key} onClick={() => setStatusFilter(s.key)} className="card" style={{
                    padding: '1.1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${s.color}` : '1px solid var(--border-color)',
                    background: isSelected ? `${s.color}15` : 'var(--bg-card)',
                    boxShadow: isSelected ? `0 0 16px ${s.color}30` : 'none',
                    transition: 'all 0.2s ease',
                }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {s.desc}
              </div>
              {isSelected && (<div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: s.color, fontWeight: 600 }}>
                  ● Showing Filtered
                </div>)}
            </div>);
        })}
      </div>

      {/* Search */}
      <div className="page-search-input animate-in" style={{ marginBottom: '1.5rem', maxWidth: '100%' }}>
        <span>🔍</span>
        <input type="text" placeholder="Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Table */}
      <div className="card animate-in">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Phone</th>
                <th>Unit</th>
                <th>Property</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant, i) => (<tr key={tenant.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: colors[i % colors.length],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'white',
                flexShrink: 0
            }}>
                        {getInitials(tenant.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tenant.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{tenant.phone}</td>
                  <td>
                    {tenant.current_unit ? (<span className="badge badge-primary">{tenant.current_unit}</span>) : (<span className="badge badge-warning">Unassigned</span>)}
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>{tenant.current_property || '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      {tenant.aadhaar_doc_url && <span className="badge badge-success" title="Aadhaar">ID</span>}
                      {tenant.pan_doc_url && <span className="badge badge-info" title="PAN">PAN</span>}
                      {tenant.agreement_url && <span className="badge badge-primary" title="Agreement">Agmt</span>}
                      {!tenant.aadhaar_doc_url && !tenant.pan_doc_url && !tenant.agreement_url && (<span className="badge badge-warning">None</span>)}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/tenants/${tenant.id}`}>
                        <button className="btn btn-secondary btn-sm">View</button>
                      </Link>
                      <Link to={`/tenants/${tenant.id}/edit`}>
                        <button className="btn btn-secondary btn-sm">Edit</button>
                      </Link>
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
          {filtered.length === 0 && (<div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p>No tenants found</p>
            </div>)}
        </div>
      </div>
    </div>);
}
