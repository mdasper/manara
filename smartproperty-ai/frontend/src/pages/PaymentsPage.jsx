'use client';
import React, { useEffect, useState } from 'react';
import { getPayments, createPayment, updatePayment, getLeases, getTenants, getUnits } from '@/lib/api';
export default function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [leases, setLeases] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [formData, setFormData] = useState({
        lease_id: '',
        amount: 0,
        due_date: new Date().toISOString().split('T')[0],
        paid_date: new Date().toISOString().split('T')[0],
        status: 'paid',
        payment_mode: 'UPI',
        transaction_ref: '',
        notes: ''
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [payRes, leaseRes, tenantRes, unitRes] = await Promise.all([
                getPayments(),
                getLeases(),
                getTenants(),
                getUnits()
            ]);
            setPayments(payRes.data);
            setLeases(leaseRes.data);
            setTenants(tenantRes.data);
            setUnits(unitRes.data);
        }
        catch (err) {
            console.error('Error fetching payments:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            await createPayment(formData);
            setShowRecordModal(false);
            setFormData({
                lease_id: '',
                amount: 0,
                due_date: new Date().toISOString().split('T')[0],
                paid_date: new Date().toISOString().split('T')[0],
                status: 'paid',
                payment_mode: 'UPI',
                transaction_ref: '',
                notes: ''
            });
            loadData();
        }
        catch (err) {
            alert('Failed to record payment');
        }
    };
    const handleMarkPaid = async (paymentId) => {
        try {
            const mode = prompt('Payment mode (UPI, Bank Transfer, Cheque, Cash):', 'UPI') || 'UPI';
            const ref = prompt('Transaction Reference Number (optional):', '') || '';
            await updatePayment(paymentId, {
                status: 'paid',
                paid_date: new Date().toISOString().split('T')[0],
                payment_mode: mode,
                transaction_ref: ref
            });
            loadData();
        }
        catch (err) {
            alert('Failed to update payment status');
        }
    };
    const totalCollected = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOverdue = payments
        .filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPending = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    const filteredPayments = payments.filter(payment => {
        if (filter !== 'all' && payment.status !== filter)
            return false;
        const lease = leases.find(l => l.id === payment.lease_id);
        const tenant = tenants.find(t => t.id === lease?.tenant_id);
        const unit = units.find(u => u.id === lease?.unit_id);
        const text = `${tenant?.name || ''} ${unit?.unit_number || ''} ${payment.transaction_ref || ''}`.toLowerCase();
        return text.includes(searchTerm.toLowerCase());
    });
    return (<div className="page-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Rent & Payments</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Track rent collections, overdue accounts, payment receipts, and automated payment reminders.
          </p>
        </div>
        <button onClick={() => setShowRecordModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem' }}>
          <span>＋</span> Record Payment
        </button>
      </div>

      {/* Financial Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Total Collected</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>
            ₹{totalCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
            ✓ {payments.filter(p => p.status === 'paid').length} payments processed
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Overdue Rent</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>
            ₹{totalOverdue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
            ⚠️ {payments.filter(p => p.status === 'overdue').length} overdue accounts
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Pending Due</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>
            ₹{totalPending.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
            ⏳ {payments.filter(p => p.status === 'pending').length} pending this cycle
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
          {['all', 'paid', 'overdue', 'pending'].map(item => (<button key={item} onClick={() => setFilter(item)} style={{
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
              {item}
            </button>))}
        </div>
        <input type="text" placeholder="Search tenant, unit, txn ref..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{
            padding: '0.5rem 0.85rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            minWidth: '260px'
        }}/>
      </div>

      {/* Payments Table */}
      {loading ? (<div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading payments...</div>) : filteredPayments.length === 0 ? (<div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💰</div>
          <p style={{ color: 'var(--text-secondary)' }}>No payment records found.</p>
        </div>) : (<div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant & Unit</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Payment Status</th>
                <th>Mode / Reference</th>
                <th>Date Paid</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(payment => {
                const lease = leases.find(l => l.id === payment.lease_id);
                const tenant = tenants.find(t => t.id === lease?.tenant_id);
                const unit = units.find(u => u.id === lease?.unit_id);
                return (<tr key={payment.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tenant?.name || 'Unknown Tenant'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit {unit?.unit_number || 'N/A'}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        ₹{payment.amount?.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem' }}>{new Date(payment.due_date).toLocaleDateString()}</span>
                    </td>
                    <td>
                      {payment.status === 'paid' && (<span className="status-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Paid</span>)}
                      {payment.status === 'overdue' && (<span className="status-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Overdue</span>)}
                      {payment.status === 'pending' && (<span className="status-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Pending</span>)}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{payment.payment_mode || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payment.transaction_ref || 'No ref'}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {payment.status !== 'paid' && (<button onClick={() => handleMarkPaid(payment.id)} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                          ✓ Mark as Paid
                        </button>)}
                    </td>
                  </tr>);
            })}
            </tbody>
          </table>
        </div>)}

      {/* Record Payment Modal */}
      {showRecordModal && (<div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
            }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Record Rent Payment</h2>
              <button onClick={() => setShowRecordModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Select Lease Agreement *</label>
                <select required value={formData.lease_id} onChange={e => {
                const selectedLease = leases.find(l => l.id === e.target.value);
                const unit = units.find(u => u.id === selectedLease?.unit_id);
                setFormData({
                    ...formData,
                    lease_id: e.target.value,
                    amount: unit ? unit.rent_amount : 0
                });
            }} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="">-- Select Tenant / Lease --</option>
                  {leases.map(l => {
                const tenant = tenants.find(t => t.id === l.tenant_id);
                const unit = units.find(u => u.id === l.unit_id);
                return (<option key={l.id} value={l.id}>
                        {tenant?.name} — Unit {unit?.unit_number} (₹{unit?.rent_amount})
                      </option>);
            })}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Amount (₹) *</label>
                  <input type="number" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Payment Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Due Date</label>
                  <input type="date" required value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Paid Date</label>
                  <input type="date" value={formData.paid_date} onChange={e => setFormData({ ...formData, paid_date: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Payment Method</label>
                  <select value={formData.payment_mode} onChange={e => setFormData({ ...formData, payment_mode: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Transaction / Cheque Ref</label>
                  <input type="text" placeholder="e.g. UPI-98492021" value={formData.transaction_ref} onChange={e => setFormData({ ...formData, transaction_ref: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Notes / Receipt Memo</label>
                <input type="text" placeholder="e.g. Month of October 2026 rent" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowRecordModal(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
