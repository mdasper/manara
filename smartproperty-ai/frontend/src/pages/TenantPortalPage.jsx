'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getActiveUser, logout } from '@/lib/auth';
import {
  getTenant,
  getTenantLeases,
  getTenantPayments,
  getMaintenance,
  createMaintenance,
  queryAI,
  api
} from '@/lib/api';

export default function TenantPortalPage() {
  const navigate = useNavigate();
  const router = { push: (url) => navigate(url), replace: (url) => navigate(url, { replace: true }), back: () => navigate(-1) };
  const [currentUser, setCurrentUser] = useState(null);
  const [tenantDetails, setTenantDetails] = useState(null);
  const [leases, setLeases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active section tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payments' | 'maintenance' | 'documents' | 'ai'

  // Maintenance form modal state
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    category: 'Plumbing',
    priority: 'medium',
    description: '',
    scheduled_date: new Date().toISOString().split('T')[0],
  });
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Pay rent modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // AI chat state
  const [aiQuery, setAiQuery] = useState('');
  const [aiChat, setAiChat] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your Tenant Assistant. You can ask me questions about your rent, maintenance status, building policies, or local amenities.'
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Load tenant session & data
  useEffect(() => {
    const user = getActiveUser();
    if (!user || user.role !== 'tenant') {
      // If no tenant is logged in, check if there is any user, else redirect to login
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadTenantData(user.id);
  }, []);

  const loadTenantData = async (tenantId) => {
    try {
      setLoading(true);
      // Fetch tenant profile
      const tenantRes = await getTenant(tenantId);
      setTenantDetails(tenantRes.data);

      // Fetch leases
      const leasesRes = await getTenantLeases(tenantId);
      setLeases(leasesRes.data || []);

      // Fetch payments
      const paymentsRes = await getTenantPayments(tenantId);
      setPayments(paymentsRes.data || []);

      // Determine initial rent amount from active lease or tenant profile
      const activeL = (leasesRes.data || []).find(l => l.renewal_status === 'active') || leasesRes.data?.[0];
      const initialRent = activeL?.rent_amount || tenantRes.data?.current_rent || 0;
      setPayAmount(initialRent);

      // Fetch maintenance tickets for this tenant's unit if available
      if (activeL && activeL.unit_id) {
        const maintRes = await getMaintenance({ unit_id: activeL.unit_id });
        setMaintenanceTickets(maintRes.data || []);
      }
    } catch (err) {
      console.error('Error loading tenant portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Submit new maintenance request
  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.title.trim()) return;

    const activeLease = leases.find(l => l.renewal_status === 'active') || leases[0];
  const activeRent = activeLease?.rent_amount || tenantDetails?.current_rent || currentUser?.rent || 0;
  const currentProperty = tenantDetails?.current_property || activeLease?.property_name || currentUser?.property || 'MANARA Living';
  const currentUnit = tenantDetails?.current_unit || activeLease?.unit_number || currentUser?.unit || '';
    if (!activeLease) {
      alert('No active lease found to attach this maintenance request.');
      return;
    }

    try {
      setCreatingTicket(true);
      const res = await createMaintenance({
        unit_id: activeLease.unit_id,
        title: maintenanceForm.title.trim(),
        category: maintenanceForm.category,
        priority: maintenanceForm.priority,
        description: maintenanceForm.description.trim() || undefined,
        scheduled_date: maintenanceForm.scheduled_date,
        cost: 0,
        status: 'open',
      });

      setMaintenanceTickets([res.data, ...maintenanceTickets]);
      setShowMaintenanceModal(false);
      setMaintenanceForm({
        title: '',
        category: 'Plumbing',
        priority: 'medium',
        description: '',
        scheduled_date: new Date().toISOString().split('T')[0],
      });
      alert('Maintenance request submitted successfully! Our facility team will contact you.');
    } catch (err) {
      console.error('Failed to submit maintenance:', err);
      alert('Failed to submit maintenance request.');
    } finally {
      setCreatingTicket(false);
    }
  };

  // Simulate Rent Payment
  const handlePayRent = async () => {
    try {
      const activeLease = leases.find(l => l.renewal_status === 'active') || leases[0];
  const activeRent = activeLease?.rent_amount || tenantDetails?.current_rent || currentUser?.rent || 0;
  const currentProperty = tenantDetails?.current_property || activeLease?.property_name || currentUser?.property || 'MANARA Living';
  const currentUnit = tenantDetails?.current_unit || activeLease?.unit_number || currentUser?.unit || '';
      if (!activeLease) return;

      // Add a simulated paid payment
      const paymentData = {
        lease_id: activeLease.id,
        amount: payAmount || activeRent,
        due_date: new Date().toISOString().split('T')[0],
        paid_date: new Date().toISOString().split('T')[0],
        status: 'paid',
        payment_mode: 'UPI / Online',
        transaction_ref: 'TXN' + Math.floor(100000 + Math.random() * 900000),
        notes: 'Paid via Tenant Self-Service Portal',
      };

      await api.post('/api/payments/', paymentData);
      setPaymentSuccess(true);
      setTimeout(async () => {
        setPaymentSuccess(false);
        setShowPayModal(false);
        // Refresh payments
        if (currentUser?.id) {
          const res = await getTenantPayments(currentUser.id);
          setPayments(res.data || []);
        }
      }, 1500);
    } catch (err) {
      console.error('Payment error:', err);
      alert('Payment processing failed. Please try again.');
    }
  };

  // Handle AI Chat Query
  const handleSendAiQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiLoading) return;

    const userText = aiQuery.trim();
    setAiQuery('');
    setAiChat(prev => [...prev, { sender: 'user', text: userText }]);
    setAiLoading(true);

    try {
      const res = await queryAI(userText);
      setAiChat(prev => [...prev, { sender: 'ai', text: res.data.response || res.data.message || 'I have noted your question.' }]);
    } catch (err) {
      setAiChat(prev => [...prev, { sender: 'ai', text: 'Thank you for reaching out. Please contact the facility manager for emergency queries.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const activeLease = leases.find(l => l.renewal_status === 'active') || leases[0];
  const activeRent = activeLease?.rent_amount || tenantDetails?.current_rent || currentUser?.rent || 0;
  const currentProperty = tenantDetails?.current_property || activeLease?.property_name || currentUser?.property || 'MANARA Living';
  const currentUnit = tenantDetails?.current_unit || activeLease?.unit_number || currentUser?.unit || '';

  if (loading && !tenantDetails) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gradient-page)',
        color: 'var(--text-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 2s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading your Tenant Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-page)', color: 'var(--text-primary)' }}>
      {/* Top Navbar */}
      <header className="tenant-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}>
            🏢
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800 }}>MANARA <span style={{ color: 'var(--primary-light)' }}>Living</span></h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Resident Self-Service Portal</p>
          </div>
        </div>

        {/* User Info & Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.4rem 0.85rem',
            background: 'var(--bg-elevated)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              color: '#ffffff',
            }}>
              {tenantDetails?.name?.charAt(0) || 'T'}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tenantDetails?.name || currentUser?.name}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {currentUnit ? `Unit ${currentUnit}` : 'Resident'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', color: 'var(--danger)' }}
            title="Log Out"
          >
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="tenant-main">
        {/* Welcome Banner */}
        <div className="card" style={{
          padding: '1.75rem',
          marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.06) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
                ● Active Resident
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                Welcome, {tenantDetails?.name || currentUser?.name}! 👋
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                Property: {currentProperty}{currentUnit ? ` · Unit ${currentUnit}` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setPayAmount(activeRent);
                  setShowPayModal(true);
                }}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
              >
                💳 Pay Rent Online
              </button>

              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 600 }}
              >
                🔧 Request Maintenance
              </button>
            </div>
          </div>
        </div>

        {/* 3 Quick KPI Cards */}
        <div className="tenant-kpi-grid" style={{
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}>
          {/* Card 1: My Unit */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Allocated Unit
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--primary-light)' }}>
              {currentUnit ? `Unit ${currentUnit}` : 'Assigned Unit'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {currentProperty}
            </div>
          </div>

          {/* Card 2: Rent Status */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Monthly Rent
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--success)' }}>
              ₹{Number(activeRent).toLocaleString('en-IN')} / mo
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Due on the {activeLease?.rent_due_day || 5}th of every month
            </div>
          </div>

          {/* Card 3: Maintenance Requests */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Open Tickets
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.4rem', color: '#f59e0b' }}>
              {maintenanceTickets.filter(m => m.status !== 'resolved' && m.status !== 'cancelled').length} Active
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {maintenanceTickets.length} total requests filed
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1.5rem',
          gap: '1rem',
          overflowX: 'auto',
        }}>
          {[
            { id: 'overview', label: '📋 Lease & Profile' },
            { id: 'payments', label: '💰 Rent & Payments' },
            { id: 'maintenance', label: '🔧 Maintenance & Service' },
            { id: 'ai', label: '🤖 Resident AI Assistant' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 0.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.95rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: Lease & Profile */}
        {activeTab === 'overview' && (
          <div className="tenant-overview-grid">
            {/* Resident Profile Details */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Personal Contact Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>
                  <span style={{ fontWeight: 600 }}>{tenantDetails?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phone Number:</span>
                  <span style={{ fontWeight: 600 }}>{tenantDetails?.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Email Address:</span>
                  <span style={{ fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}>{tenantDetails?.email || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Permanent Address:</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{tenantDetails?.address || 'On file'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Emergency Contact:</span>
                  <span style={{ fontWeight: 600 }}>
                    {tenantDetails?.emergency_contact_name
                      ? `${tenantDetails.emergency_contact_name} (${tenantDetails.emergency_contact_phone || ''})`
                      : 'None provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lease Information */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Active Agreement & Terms</h3>
              {activeLease ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Lease Period:</span>
                    <span style={{ fontWeight: 600 }}>{activeLease.lease_start} to {activeLease.lease_end}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <span className="badge badge-success">{activeLease.renewal_status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Monthly Rent:</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(activeRent).toLocaleString('en-IN')} / mo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Monthly Due Day:</span>
                    <span style={{ fontWeight: 600 }}>{activeLease.rent_due_day}th of each month</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ID Verification:</span>
                    <span style={{ fontWeight: 600 }}>
                      {tenantDetails?.aadhaar_number ? `Aadhaar: ${tenantDetails.aadhaar_number}` : 'Submitted'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Agreement Document:</span>
                    <span style={{ color: 'var(--primary-light)', cursor: 'pointer' }}>📄 Digital Agreement Signed</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Agreement documentation is being finalized by property admin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Rent & Payments */}
        {activeTab === 'payments' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Payment History & Invoices</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Check past receipts and pay upcoming monthly rent.</p>
              </div>

              <button
                onClick={() => {
                  setPayAmount(activeRent);
                  setShowPayModal(true);
                }}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1rem' }}
              >
                + Make Payment
              </button>
            </div>

            {payments.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No payment transactions recorded yet. Click &quot;Make Payment&quot; to pay online.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice / Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment Mode</th>
                      <th>Reference #</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td>{p.due_date || p.paid_date}</td>
                        <td style={{ fontWeight: 700 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`badge badge-${p.status === 'paid' ? 'success' : p.status === 'overdue' ? 'danger' : 'warning'}`}>
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td>{p.payment_mode || 'UPI'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.transaction_ref || 'TRX-DEFAULT'}</td>
                        <td>
                          <button
                            onClick={() => alert(`Receipt #${p.id.slice(0, 8)}: Verified Payment of ₹${p.amount}`)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            📥 Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Maintenance & Service */}
        {activeTab === 'maintenance' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Maintenance & Support Tickets</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Report plumbing, electrical, or appliance issues directly to our facility team.</p>
              </div>

              <button
                onClick={() => setShowMaintenanceModal(true)}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1rem' }}
              >
                + Raise New Request
              </button>
            </div>

            {maintenanceTickets.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                ✨ All systems are functioning smoothly! No maintenance requests active.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {maintenanceTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ticket.title}</span>
                        <span className="badge badge-info">{ticket.category || 'General'}</span>
                        <span className={`badge badge-${ticket.priority === 'emergency' ? 'danger' : ticket.priority === 'high' ? 'warning' : 'secondary'}`}>
                          {ticket.priority} priority
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        {ticket.description || 'No additional notes provided.'}
                      </p>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Scheduled: {ticket.scheduled_date || 'Awaiting assignment'}
                      </div>
                    </div>

                    <div>
                      <span className={`badge badge-${ticket.status === 'resolved' ? 'success' : ticket.status === 'in_progress' ? 'info' : 'warning'}`}>
                        ● {ticket.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Resident AI Assistant */}
        {activeTab === 'ai' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Resident AI Assistant</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
              Ask questions regarding your lease terms, rent due dates, amenities, or maintenance questions.
            </p>

            <div style={{
              height: '340px',
              overflowY: 'auto',
              padding: '1rem',
              background: 'var(--bg-elevated)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}>
              {aiChat.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-surface)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    border: msg.sender === 'ai' ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {msg.text}
                </div>
              ))}
              {aiLoading && (
                <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  🤖 MANARA AI is thinking...
                </div>
              )}
            </div>

            <form onSubmit={handleSendAiQuery} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Ask about rent, visitor parking, maintenance..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
              />
              <button type="submit" disabled={aiLoading || !aiQuery.trim()} className="btn btn-primary" style={{ padding: '0 1.25rem' }}>
                Ask AI
              </button>
            </form>
          </div>
        )}
      </main>

      {/* MODAL: Raise Maintenance Request */}
      {showMaintenanceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Raise Maintenance Request</h3>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMaintenance}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Issue Summary *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Water leak under kitchen sink"
                  value={maintenanceForm.title}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={maintenanceForm.category}
                    onChange={e => setMaintenanceForm({ ...maintenanceForm, category: e.target.value })}
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC / Air Conditioner">HVAC / Air Conditioner</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Appliance">Appliance</option>
                    <option value="Painting">Painting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    value={maintenanceForm.priority}
                    onChange={e => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Description / Details</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Explain when the problem started, exact location..."
                  value={maintenanceForm.description}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="btn btn-primary"
                >
                  {creatingTicket ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Pay Rent Online */}
      {showPayModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Quick Rent Payment</h3>
              <button
                onClick={() => setShowPayModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {paymentSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                <h4 style={{ fontWeight: 700, color: 'var(--success)' }}>Payment Confirmed!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  ₹{payAmount.toLocaleString('en-IN')} has been credited. Receipt generated.
                </p>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-hover)',
                  borderRadius: '8px',
                  marginBottom: '1.25rem',
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount Payable</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
                    ₹{Number(payAmount || activeRent).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    For {currentProperty} · Unit {currentUnit}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Payment Mode</label>
                  <select className="form-control" defaultValue="upi">
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="netbanking">Net Banking (HDFC, SBI, ICICI)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handlePayRent}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontWeight: 700 }}
                >
                  Confirm & Pay ₹{Number(payAmount || activeRent).toLocaleString('en-IN')} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

