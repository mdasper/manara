'use client';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { createTenant } from '@/lib/api';
export default function NewTenantPage() {
    const navigate = useNavigate();
  const router = { push: (url) => navigate(url), replace: (url) => navigate(url, { replace: true }), back: () => navigate(-1) };
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        alternate_phone: '',
        address: '',
        aadhaar_number: '',
        pan_number: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: 'Family',
        notes: ''
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await createTenant(formData);
            router.push('/tenants');
        }
        catch (err) {
            alert('Failed to register tenant. Please check required fields.');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="page-container animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/tenants" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
          &larr; Back to Tenants
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: 'var(--text-primary)' }}>
          Register New Tenant
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Store tenant KYC, Aadhaar, PAN, contact numbers, and emergency details.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Full Name *
              </label>
              <input type="text" required placeholder="e.g. Rajesh Kumar" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Primary Phone *
              </label>
              <input type="tel" required placeholder="+91 9876543210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <input type="email" placeholder="rajesh@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Alternate Phone
              </label>
              <input type="tel" placeholder="Optional backup number" value={formData.alternate_phone} onChange={e => setFormData({ ...formData, alternate_phone: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Permanent Address
            </label>
            <textarea rows={2} placeholder="Native / permanent residence address..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>KYC Verification Identifiers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Aadhaar Number
                </label>
                <input type="text" placeholder="12-digit Aadhaar number" value={formData.aadhaar_number} onChange={e => setFormData({ ...formData, aadhaar_number: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  PAN Card Number
                </label>
                <input type="text" placeholder="10-digit PAN (e.g. ABCDE1234F)" value={formData.pan_number} onChange={e => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Emergency Contact</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Contact Name
                </label>
                <input type="text" placeholder="Emergency contact" value={formData.emergency_contact_name} onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Phone
                </label>
                <input type="tel" placeholder="Phone number" value={formData.emergency_contact_phone} onChange={e => setFormData({ ...formData, emergency_contact_phone: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Relation
                </label>
                <input type="text" placeholder="e.g. Father, Spouse" value={formData.emergency_contact_relation} onChange={e => setFormData({ ...formData, emergency_contact_relation: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <Link to="/tenants">
              <button type="button" className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                Cancel
              </button>
            </Link>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '0.6rem 1.75rem' }}>
              {submitting ? 'Registering...' : 'Register Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
