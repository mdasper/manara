'use client';
import React, { useEffect, useState } from 'react';
import { getMaintenance, createMaintenance, updateMaintenance, getUnits } from '@/lib/api';
const CATEGORIES = ['All', 'Plumbing', 'Electrical', 'HVAC / AC', 'Carpentry', 'Painting', 'Appliance', 'General'];
export default function MaintenancePage() {
    const [tickets, setTickets] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        unit_id: '',
        title: '',
        description: '',
        category: 'Plumbing',
        priority: 'medium',
        cost: 0,
        vendor_name: '',
        vendor_phone: '',
        scheduled_date: new Date().toISOString().split('T')[0]
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [maintRes, unitsRes] = await Promise.all([
                getMaintenance(),
                getUnits()
            ]);
            setTickets(maintRes.data);
            setUnits(unitsRes.data);
        }
        catch (err) {
            console.error('Error fetching maintenance:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createMaintenance(formData);
            setShowAddModal(false);
            setFormData({
                unit_id: '',
                title: '',
                description: '',
                category: 'Plumbing',
                priority: 'medium',
                cost: 0,
                vendor_name: '',
                vendor_phone: '',
                scheduled_date: new Date().toISOString().split('T')[0]
            });
            loadData();
        }
        catch (err) {
            alert('Failed to log maintenance request');
        }
    };
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await updateMaintenance(id, {
                status: newStatus,
                resolved_date: newStatus === 'resolved' ? new Date().toISOString().split('T')[0] : null
            });
            loadData();
        }
        catch (err) {
            alert('Failed to update maintenance request');
        }
    };
    const totalCost = tickets.reduce((sum, t) => sum + (t.cost || 0), 0);
    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const emergencyCount = tickets.filter(t => t.priority === 'emergency' && t.status !== 'resolved').length;
    const filteredTickets = tickets.filter(t => {
        if (selectedCategory !== 'All' && t.category?.toLowerCase() !== selectedCategory.toLowerCase())
            return false;
        if (selectedStatus !== 'all' && t.status !== selectedStatus)
            return false;
        const unit = units.find(u => u.id === t.unit_id);
        const text = `${t.title} ${t.description || ''} ${t.vendor_name || ''} ${unit?.unit_number || ''}`.toLowerCase();
        return text.includes(searchTerm.toLowerCase());
    });
    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'emergency':
                return <span className="status-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700 }}>🚨 Emergency</span>;
            case 'high':
                return <span className="status-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600 }}>High</span>;
            case 'medium':
                return <span className="status-badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>Medium</span>;
            default:
                return <span className="status-badge" style={{ background: 'rgba(148,163,184,0.15)', color: '#94a3b8' }}>Low</span>;
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'open':
                return <span className="status-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Open</span>;
            case 'in_progress':
                return <span className="status-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>In Progress</span>;
            case 'resolved':
                return <span className="status-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Resolved</span>;
            default:
                return <span className="status-badge" style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>{status}</span>;
        }
    };
    return (<div className="page-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Maintenance Management</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Dispatch vendors, track repair tickets, monitor repair expenses, and resolve tenant issues.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem' }}>
          <span>＋</span> New Maintenance Request
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Active Tickets</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{openCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Emergency / Urgent</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>{emergencyCount}</div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Total Maintenance Spend</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>₹{totalCost.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter and Category Strip */}
      <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['all', 'open', 'in_progress', 'resolved'].map(s => (<button key={s} onClick={() => setSelectedStatus(s)} style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: selectedStatus === s ? 'var(--primary)' : 'var(--bg-secondary)',
                color: selectedStatus === s ? '#ffffff' : 'var(--text-secondary)',
                textTransform: 'capitalize'
            }}>
                {s.replace('_', ' ')}
              </button>))}
          </div>

          <input type="text" placeholder="Search request, unit, vendor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
            padding: '0.5rem 0.85rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            minWidth: '240px'
        }}/>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {CATEGORIES.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: selectedCategory === cat ? 'rgba(59,130,246,0.2)' : 'transparent',
                color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: selectedCategory === cat ? 700 : 500,
                whiteSpace: 'nowrap'
            }}>
              {cat}
            </button>))}
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading tickets...</div>) : filteredTickets.length === 0 ? (<div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔧</div>
          <p style={{ color: 'var(--text-secondary)' }}>No maintenance requests found.</p>
        </div>) : (<div className="maintenance-grid">
          {filteredTickets.map(ticket => {
                const unit = units.find(u => u.id === ticket.unit_id);
                return (<div key={ticket.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {ticket.category || 'General'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>
                    {ticket.title}
                  </h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Unit: <strong style={{ color: 'var(--text-primary)' }}>{unit?.unit_number || 'N/A'}</strong>
                    {ticket.scheduled_date && ` · Scheduled: ${new Date(ticket.scheduled_date).toLocaleDateString()}`}
                  </div>

                  {ticket.description && (<p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                      {ticket.description}
                    </p>)}

                  <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '0.625rem',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        marginBottom: '1rem'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Vendor:</span>
                      <span style={{ fontWeight: 600 }}>{ticket.vendor_name || 'Not assigned'}</span>
                    </div>
                    {ticket.vendor_phone && (<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                        <span>{ticket.vendor_phone}</span>
                      </div>)}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Est. Cost:</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{ticket.cost?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  {ticket.status === 'open' && (<button onClick={() => handleUpdateStatus(ticket.id, 'in_progress')} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      Mark In Progress
                    </button>)}
                  {ticket.status !== 'resolved' && (<button onClick={() => handleUpdateStatus(ticket.id, 'resolved')} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      ✓ Mark Resolved
                    </button>)}
                </div>
              </div>);
            })}
        </div>)}

      {/* Add Maintenance Modal */}
      {showAddModal && (<div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
            }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Log Maintenance Request</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Select Unit *</label>
                <select required value={formData.unit_id} onChange={e => setFormData({ ...formData, unit_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="">-- Select Unit --</option>
                  {units.map(u => (<option key={u.id} value={u.id}>Unit {u.unit_number} ({u.unit_type})</option>))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Issue Title *</label>
                <input type="text" required placeholder="e.g. Master bathroom tap leaking" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Vendor / Handyman Name</label>
                  <input type="text" placeholder="e.g. Ramesh Plumbing" value={formData.vendor_name} onChange={e => setFormData({ ...formData, vendor_name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Vendor Phone</label>
                  <input type="text" placeholder="+91 98..." value={formData.vendor_phone} onChange={e => setFormData({ ...formData, vendor_phone: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Estimated Cost (₹)</label>
                  <input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Scheduled Date</label>
                  <input type="date" value={formData.scheduled_date} onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Detailed Description</label>
                <textarea rows={2} placeholder="Describe the problem, location inside unit, or technician notes..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  Save Ticket
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
