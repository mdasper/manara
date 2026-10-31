'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTenants, getUnits, createTenant, createLease } from '@/lib/api';
import { setActiveUser } from '@/lib/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const router = { push: (url) => navigate(url), replace: (url) => navigate(url, { replace: true }), back: () => navigate(-1) };
  const [role, setRole] = useState('admin'); // 'admin' | 'tenant'
  const [tenantMode, setTenantMode] = useState('existing'); // 'existing' | 'new'

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('admin@manara.com');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Existing tenants list
  const [tenantsList, setTenantsList] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Vacant units for new tenant registration
  const [vacantUnits, setVacantUnits] = useState([]);

  // New tenant form fields
  const [newTenant, setNewTenant] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    preferred_unit_id: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch data
  useEffect(() => {
    setLoadingTenants(true);
    getTenants()
      .then(res => {
        setTenantsList(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedTenantId(res.data[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingTenants(false));

    getUnits({ status: 'vacant' })
      .then(res => setVacantUnits(res.data || []))
      .catch(err => console.error(err));
  }, []);

  // Admin login action
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setActiveUser({
      role: 'admin',
      name: 'MANARA Admin',
      email: adminEmail,
    });
    router.push('/dashboard');
  };

  // Existing tenant login action
  const handleExistingTenantLogin = (e) => {
    e.preventDefault();
    if (!selectedTenantId) {
      setErrorMsg('Please select your resident account.');
      return;
    }
    const tenant = tenantsList.find(t => t.id === selectedTenantId);
    if (!tenant) return;

    setActiveUser({
      role: 'tenant',
      id: tenant.id,
      name: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      unit: tenant.current_unit,
      property: tenant.current_property,
    });
    router.push('/tenant-portal');
  };

  // New tenant registration action
  const handleNewTenantRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newTenant.name.trim() || !newTenant.phone.trim()) {
      setErrorMsg('Name and Phone number are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createTenant({
        name: newTenant.name.trim(),
        phone: newTenant.phone.trim(),
        email: newTenant.email.trim() || undefined,
        address: newTenant.address.trim() || undefined,
        emergency_contact_name: newTenant.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: newTenant.emergency_contact_phone.trim() || undefined,
        notes: 'Registered via MANARA Resident Portal',
      });

      const created = res.data;
      let assignedUnit = '';

      if (newTenant.preferred_unit_id) {
        const today = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(today.getFullYear() + 1);

        const chosen = vacantUnits.find(u => u.id === newTenant.preferred_unit_id);
        assignedUnit = chosen ? chosen.unit_number : '';

        try {
          await createLease({
            unit_id: newTenant.preferred_unit_id,
            tenant_id: created.id,
            lease_start: today.toISOString().split('T')[0],
            lease_end: nextYear.toISOString().split('T')[0],
            rent_due_day: 5,
            notes: 'MANARA Online Onboarding',
          });
        } catch (leaseErr) {
          console.warn('Lease creation note:', leaseErr);
        }
      }

      setSuccessMsg('Account created successfully! Opening your portal...');
      setActiveUser({
        role: 'tenant',
        id: created.id,
        name: created.name,
        phone: created.phone,
        email: created.email,
        unit: assignedUnit || created.current_unit || 'Unit 3C',
        property: created.current_property || 'MANARA Living',
      });

      setTimeout(() => router.push('/tenant-portal'), 900);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed. Please verify your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 25%, rgba(99, 102, 241, 0.12) 0%, transparent 60%), #090915',
      padding: '2.5rem 1.5rem',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          fontSize: '1.5rem',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
          marginBottom: '1rem',
        }}>
          🏢
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '0.12em',
          color: '#ffffff',
          margin: 0,
          textTransform: 'uppercase',
        }}>
          MANARA
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '0.85rem',
          marginTop: '0.4rem',
          letterSpacing: '0.02em',
        }}>
          Property Management &amp; Living
        </p>
      </div>

      {/* Main Centered Minimal Card */}
      <div style={{
        width: '100%',
        maxWidth: role === 'tenant' && tenantMode === 'new' ? '540px' : '440px',
        background: 'rgba(20, 20, 42, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s ease',
      }}>

        {/* Clean Pill Switcher: Admin / Resident */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          padding: '4px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          marginBottom: '1.75rem',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <button
            type="button"
            onClick={() => { setRole('admin'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: role === 'admin' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
              color: role === 'admin' ? '#ffffff' : '#94a3b8',
              boxShadow: role === 'admin' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            👑 Admin
          </button>

          <button
            type="button"
            onClick={() => { setRole('tenant'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: role === 'tenant' ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
              color: role === 'tenant' ? '#ffffff' : '#94a3b8',
              boxShadow: role === 'tenant' ? '0 2px 10px rgba(99, 102, 241, 0.4)' : 'none',
            }}
          >
            🏠 Resident
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
          }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            color: '#34d399',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
          }}>
            {successMsg}
          </div>
        )}

        {/* ─── ADMIN FORM ─────────────────────────── */}
        {role === 'admin' ? (
          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.45rem' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="admin@manara.com"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.45rem' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.85rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
              }}
            >
              Sign In to Admin Console →
            </button>

            <div style={{
              marginTop: '1.25rem',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#64748b',
            }}>
              Demo Account:{' '}
              <span
                onClick={() => {
                  setAdminEmail('admin@manara.com');
                  setAdminPassword('admin123');
                }}
                style={{ color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}
              >
                admin@manara.com
              </span>
            </div>
          </form>
        ) : (
          /* ─── RESIDENT FORM ──────────────────────── */
          <div>
            {/* Simple resident mode toggle */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1.5rem',
            }}>
              <button
                type="button"
                onClick={() => { setTenantMode('existing'); setErrorMsg(''); }}
                style={{
                  padding: '0.5rem 0.25rem 0.75rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: tenantMode === 'existing' ? '2px solid #818cf8' : '2px solid transparent',
                  color: tenantMode === 'existing' ? '#ffffff' : '#64748b',
                  fontWeight: tenantMode === 'existing' ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Existing Resident
              </button>

              <button
                type="button"
                onClick={() => { setTenantMode('new'); setErrorMsg(''); }}
                style={{
                  padding: '0.5rem 0.25rem 0.75rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: tenantMode === 'new' ? '2px solid #818cf8' : '2px solid transparent',
                  color: tenantMode === 'new' ? '#ffffff' : '#64748b',
                  fontWeight: tenantMode === 'new' ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                New Application
              </button>
            </div>

            {tenantMode === 'existing' ? (
              /* EXISTING RESIDENT */
              <form onSubmit={handleExistingTenantLogin}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.45rem' }}>
                    Select Your Name
                  </label>
                  {loadingTenants ? (
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading resident list...</div>
                  ) : (
                    <select
                      value={selectedTenantId}
                      onChange={e => setSelectedTenantId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        background: '#13132a',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    >
                      {tenantsList.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.phone} {t.current_unit ? `(Unit ${t.current_unit})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Enter Resident Portal →
                </button>
              </form>
            ) : (
              /* NEW RESIDENT REGISTRATION */
              <form onSubmit={handleNewTenantRegister}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={newTenant.name}
                      onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9840123456"
                      value={newTenant.phone}
                      onChange={e => setNewTenant({ ...newTenant, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="rahul@example.com"
                      value={newTenant.email}
                      onChange={e => setNewTenant({ ...newTenant, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Select Unit (Optional)
                    </label>
                    <select
                      value={newTenant.preferred_unit_id}
                      onChange={e => setNewTenant({ ...newTenant, preferred_unit_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem',
                        background: '#13132a',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      <option value="">-- Auto-Assign Unit --</option>
                      {vacantUnits.map(u => (
                        <option key={u.id} value={u.id}>
                          Unit {u.unit_number} (₹{Number(u.rent_amount).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Permanent Address
                  </label>
                  <input
                    type="text"
                    placeholder="City, State"
                    value={newTenant.address}
                    onChange={e => setNewTenant({ ...newTenant, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  {submitting ? 'Creating Profile...' : 'Complete & Open Portal →'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Clean, discreet footer */}
      <div style={{
        marginTop: '2rem',
        fontSize: '0.75rem',
        color: '#475569',
        letterSpacing: '0.04em',
      }}>
        © MANARA Properties · All rights reserved
      </div>
    </div>
  );
}
