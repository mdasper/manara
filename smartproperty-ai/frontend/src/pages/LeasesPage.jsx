'use client';
import React, { useEffect, useState } from 'react';
import { getLeases, createLease, updateLease, getUnits, getTenants } from '@/lib/api';
export default function LeasesPage() {
    const [leases, setLeases] = useState([]);
    const [units, setUnits] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        unit_id: '',
        tenant_id: '',
        lease_start: '',
        lease_end: '',
        rent_due_day: 5,
        renewal_status: 'active',
        notes: ''
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [leasesRes, unitsRes, tenantsRes] = await Promise.all([
                getLeases(),
                getUnits(),
                getTenants()
            ]);
            setLeases(leasesRes.data);
            setUnits(unitsRes.data);
            setTenants(tenantsRes.data);
        }
        catch (err) {
            console.error('Error loading leases data:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createLease(formData);
            setShowAddModal(false);
            setFormData({
                unit_id: '',
                tenant_id: '',
                lease_start: '',
                lease_end: '',
                rent_due_day: 5,
                renewal_status: 'active',
                notes: ''
            });
            loadData();
        }
        catch (err) {
            alert('Failed to create lease agreement');
        }
    };
    const handleRenew = async (leaseId) => {
        const months = prompt('Extend lease by how many months? (e.g. 11 or 12):', '11');
        if (!months)
            return;
        try {
            const lease = leases.find(l => l.id === leaseId);
            if (!lease)
                return;
            const currentEnd = new Date(lease.lease_end);
            currentEnd.setMonth(currentEnd.getMonth() + parseInt(months, 10));
            const newEndDate = currentEnd.toISOString().split('T')[0];
            await updateLease(leaseId, {
                lease_end: newEndDate,
                renewal_status: 'renewed'
            });
            loadData();
        }
        catch (err) {
            alert('Failed to renew lease');
        }
    };
    const filteredLeases = leases.filter(lease => {
        if (filter !== 'all' && lease.renewal_status !== filter)
            return false;
        const unit = units.find(u => u.id === lease.unit_id);
        const tenant = tenants.find(t => t.id === lease.tenant_id);
        const text = `${unit?.unit_number || ''} ${tenant?.name || ''} ${lease.notes || ''}`.toLowerCase();
        return text.includes(searchTerm.toLowerCase());
    });
    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="status-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Active</span>;
            case 'pending_renewal':
                return <span className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>Expiring Soon</span>;
            case 'expired':
                return <span className="status-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Expired</span>;
            case 'renewed':
                return <span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>Renewed</span>;
            default:
                return <span className="status-badge" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' }}>{status}</span>;
        }
    };
    return (<div className="page-container animate-fade-in">
      {/* Header action strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Lease Agreements</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Monitor active leases, renewal deadlines, rent due cycles, and tenancy agreements.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem' }}>
          <span>＋</span> New Lease Agreement
        </button>
      </div>

      {/* KPI mini-cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Leases</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{leases.length}</div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Leases</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>
            {leases.filter(l => l.renewal_status === 'active' || l.renewal_status === 'renewed').length}
          </div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Renewal</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>
            {leases.filter(l => l.renewal_status === 'pending_renewal').length}
          </div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expired</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>
            {leases.filter(l => l.renewal_status === 'expired').length}
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'active', 'pending_renewal', 'renewed', 'expired'].map(item => (<button key={item} onClick={() => setFilter(item)} style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: filter === item ? 'var(--primary)' : 'var(--bg-secondary)',
                color: filter === item ? '#ffffff' : 'var(--text-secondary)',
                textTransform: 'capitalize'
            }}>
              {item.replace('_', ' ')}
            </button>))}
        </div>
        <input type="text" placeholder="Search by tenant name, unit..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
            padding: '0.5rem 0.85rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            minWidth: '260px'
        }}/>
      </div>

      {/* Leases Table */}
      {loading ? (<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading leases...</div>) : filteredLeases.length === 0 ? (<div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
          <p style={{ color: 'var(--text-secondary)' }}>No lease agreements found matching criteria.</p>
        </div>) : (<div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Tenant</th>
                <th>Lease Period</th>
                <th>Due Day</th>
                <th>Status</th>
                <th>Expiry Warning</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeases.map(lease => {
                const unit = units.find(u => u.id === lease.unit_id);
                const tenant = tenants.find(t => t.id === lease.tenant_id);
                const today = new Date();
                const end = new Date(lease.lease_end);
                const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return (<tr key={lease.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Unit {unit?.unit_number || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>₹{Number(lease.rent_amount || unit?.rent_amount || 0).toLocaleString('en-IN')}/mo</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tenant?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant?.phone || 'No phone'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        {new Date(lease.lease_start).toLocaleDateString()} &rarr; {new Date(lease.lease_end).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>11 Months Agreement</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{lease.rent_due_day}th</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> of month</span>
                    </td>
                    <td>{getStatusBadge(lease.renewal_status)}</td>
                    <td>
                      {diffDays <= 30 && diffDays > 0 ? (<span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8125rem' }}>
                          ⚠️ Expires in {diffDays} days
                        </span>) : diffDays <= 0 ? (<span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8125rem' }}>
                          ⛔ Expired
                        </span>) : (<span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                          {diffDays} days left
                        </span>)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleRenew(lease.id)} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', marginRight: '0.5rem' }}>
                        🔄 Renew
                      </button>
                    </td>
                  </tr>);
            })}
            </tbody>
          </table>
        </div>)}

      {/* Add Lease Modal */}
      {showAddModal && (<div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
            }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Create Lease Agreement</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Select Unit *</label>
                <select required value={formData.unit_id} onChange={e => setFormData({ ...formData, unit_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="">-- Select Unit --</option>
                  {units.map(u => (<option key={u.id} value={u.id}>Unit {u.unit_number} ({u.unit_type}) - ₹{u.rent_amount?.toLocaleString()}</option>))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Select Tenant *</label>
                <select required value={formData.tenant_id} onChange={e => setFormData({ ...formData, tenant_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="">-- Select Tenant --</option>
                  {tenants.map(t => (<option key={t.id} value={t.id}>{t.name} ({t.phone})</option>))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Lease Start Date *</label>
                  <input type="date" required value={formData.lease_start} onChange={e => setFormData({ ...formData, lease_start: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Lease End Date *</label>
                  <input type="date" required value={formData.lease_end} onChange={e => setFormData({ ...formData, lease_end: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Rent Due Day of Month</label>
                <input type="number" min="1" max="31" value={formData.rent_due_day} onChange={e => setFormData({ ...formData, rent_due_day: parseInt(e.target.value, 10) })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Special Notes / Clauses</label>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="e.g. 5% annual escalation, lock-in period 6 months..." style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  Create Lease
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
