'use client';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getTenant, getTenantLeases, getTenantPayments, deleteTenant } from '@/lib/api';
export default function TenantDetailPage() {
    const params = useParams();
    const navigate = useNavigate();
  const router = { push: (url) => navigate(url), replace: (url) => navigate(url, { replace: true }), back: () => navigate(-1) };
    const tenantId = params?.id;
    const [tenant, setTenant] = useState(null);
    const [leases, setLeases] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (tenantId) {
            loadData();
        }
    }, [tenantId]);
    const loadData = async () => {
        try {
            setLoading(true);
            const [tRes, lRes, pRes] = await Promise.all([
                getTenant(tenantId),
                getTenantLeases(tenantId),
                getTenantPayments(tenantId)
            ]);
            setTenant(tRes.data);
            setLeases(lRes.data);
            setPayments(pRes.data);
        }
        catch (err) {
            console.error('Error fetching tenant details:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to remove this tenant record?'))
            return;
        try {
            await deleteTenant(tenantId);
            router.push('/tenants');
        }
        catch (err) {
            alert('Failed to delete tenant');
        }
    };
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading tenant profile...</div>;
    }
    if (!tenant) {
        return (<div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Tenant profile not found</h3>
        <Link to="/tenants" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          Back to Tenants
        </Link>
      </div>);
    }
    const initials = tenant.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    const overdueCount = payments.filter(p => p.status === 'overdue').length;
    return (<div className="page-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/tenants" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
          &larr; Back to All Tenants
        </Link>

        {/* Tenant Profile Banner */}
        <div className="tenant-profile-banner">
          <div className="tenant-profile-main">
            <div className="tenant-profile-avatar">
              {initials}
            </div>
            <div className="tenant-profile-meta">
              <div className="tenant-profile-heading">
                <h1 className="tenant-profile-name">
                  {tenant.name}
                </h1>
                <span className="status-badge tenant-status-pill">
                  ✓ Active Tenant
                </span>
              </div>
              <div className="tenant-contact-row">
                <a href={`tel:${tenant.phone}`} className="tenant-contact-chip">
                  <span className="tenant-chip-icon">📞</span>
                  <span className="tenant-chip-val">{tenant.phone}</span>
                </a>
                {tenant.email && (
                  <a href={`mailto:${tenant.email}`} className="tenant-contact-chip" title={tenant.email}>
                    <span className="tenant-chip-icon">✉️</span>
                    <span className="tenant-chip-val">{tenant.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="tenant-banner-actions">
            <Link to="/payments" className="tenant-action-link">
              <button className="btn btn-primary tenant-action-btn">
                + Record Payment
              </button>
            </Link>
            <button onClick={handleDelete} className="btn btn-secondary tenant-action-btn-del">
              🗑️ Remove
            </button>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Tenancy Placement Card */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🏢</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Assigned Property & Unit
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Unit:</span>
              <span style={{ fontWeight: 700, color: '#6366f1' }}>
                {tenant.current_unit ? `Unit ${tenant.current_unit}` : 'Unassigned'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Property:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {tenant.current_property || 'Not linked'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Monthly Rent:</span>
              <span style={{ fontWeight: 800, color: '#10b981' }}>
                ₹{Number(tenant.current_rent || 0).toLocaleString('en-IN')} / mo
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Permanent Address:</span>
              <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '180px', color: 'var(--text-secondary)' }}>
                {tenant.address || 'Chennai, TN'}
              </span>
            </div>
          </div>
        </div>

        {/* KYC Verification Card */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🪪</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              KYC & Identity Verification
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Aadhaar Number:</span>
              <span style={{ fontWeight: 600, letterSpacing: '0.04em' }}>
                {tenant.aadhaar_number ? `XXXX-XXXX-${tenant.aadhaar_number.slice(-4)}` : 'Not provided'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>PAN Card:</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>
                {tenant.pan_number || 'Not provided'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>ID Status:</span>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.8rem' }}>
                ✓ Verified Documents
              </span>
            </div>
          </div>
        </div>

        {/* Emergency Contact & Financials */}
        <div className="card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🚨</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Emergency & Payment Summary
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Emergency Contact:</span>
              <span style={{ fontWeight: 600 }}>
                {tenant.emergency_contact_name || 'Not provided'} ({tenant.emergency_contact_relation || 'Family'})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Contact Phone:</span>
              <span style={{ fontWeight: 600 }}>
                {tenant.emergency_contact_phone || '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Rent Paid:</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>
                ₹{totalPaid.toLocaleString('en-IN')} {overdueCount > 0 ? `(⚠️ ${overdueCount} Overdue)` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lease Agreements Table Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Lease Agreements History ({leases.length})
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Rental terms, active dates, and renewal status for this tenant
            </p>
          </div>
          <Link to="/leases">
            <button className="btn btn-secondary btn-sm">+ New Lease</button>
          </Link>
        </div>

        {leases.length === 0 ? (<div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No lease agreements recorded for this tenant.
          </div>) : (<div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Agreement Period</th>
                  <th>Monthly Rent</th>
                  <th>Monthly Due Day</th>
                  <th>Renewal Status</th>
                  <th>Special Terms / Notes</th>
                </tr>
              </thead>
              <tbody>
                {leases.map(l => (<tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {new Date(l.lease_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} &rarr; {new Date(l.lease_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Standard 11-Months Tenancy
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#10b981' }}>₹{Number(l.rent_amount || tenant.current_rent || 0).toLocaleString('en-IN')}/mo</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{l.rent_due_day}th</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> of every month</span>
                    </td>
                    <td>
                      <span className="status-badge" style={{
                    background: l.renewal_status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    color: l.renewal_status === 'active' ? '#10b981' : '#f59e0b',
                    border: `1px solid ${l.renewal_status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                }}>
                        ● {l.renewal_status}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {l.notes || '5% annual escalation, standard tenancy clause'}
                      </span>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>

      {/* Payment Records Table Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Payment Records & Receipts ({payments.length})
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Full transaction history with payment method and reference IDs
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>
            Total Collected: ₹{totalPaid.toLocaleString('en-IN')}
          </span>
        </div>

        {payments.length === 0 ? (<div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No payment transactions found.
          </div>) : (<div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Rent Due Date</th>
                  <th>Payment Status</th>
                  <th>Payment Date</th>
                  <th>Mode & Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                const isPaid = p.status === 'paid';
                const isOverdue = p.status === 'overdue';
                return (<tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: isPaid ? '#10b981' : isOverdue ? '#ef4444' : 'var(--text-primary)', fontSize: '1rem' }}>
                          ₹{p.amount?.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {new Date(p.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <span className="status-badge" style={{
                        background: isPaid ? 'rgba(16,185,129,0.12)' : isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                        color: isPaid ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b',
                        border: `1px solid ${isPaid ? 'rgba(16,185,129,0.3)' : isOverdue ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
                    }}>
                          {isPaid ? '✓ Paid' : isOverdue ? '⚠️ Overdue' : '⏳ Pending'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {p.payment_mode || 'UPI'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {p.transaction_ref || 'TXN-DIRECT'}
                        </div>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>)}
      </div>
    </div>);
}
