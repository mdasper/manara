'use client';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { createProperty } from '@/lib/api';
export default function NewPropertyPage() {
    const navigate = useNavigate();
  const router = { push: (url) => navigate(url), replace: (url) => navigate(url, { replace: true }), back: () => navigate(-1) };
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'residential',
        address: '',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        total_floors: 3,
        description: '',
        image_url: ''
    });
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await createProperty(formData);
            router.push('/properties');
        }
        catch (err) {
            alert('Failed to create property. Please try again.');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="page-container animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/properties" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
          &larr; Back to Properties
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: 'var(--text-primary)' }}>
          Add New Property
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Register an apartment complex, commercial office building, or shopping mall.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Property Name *
            </label>
            <input type="text" required placeholder="e.g. Skyline Residency, Marina Tech Park" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Property Category *
              </label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <option value="residential">Residential Apartment</option>
                <option value="commercial">Commercial Office</option>
                <option value="shopping_complex">Shopping Mall / Complex</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Total Floors *
              </label>
              <input type="number" min="1" required value={formData.total_floors} onChange={e => setFormData({ ...formData, total_floors: parseInt(e.target.value, 10) || 1 })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Street Address *
            </label>
            <input type="text" required placeholder="e.g. 42 Gandhi Road, Anna Nagar" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                City *
              </label>
              <input type="text" required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                State *
              </label>
              <input type="text" required value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Postal Code / PIN
              </label>
              <input type="text" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Description & Highlights
            </label>
            <textarea rows={3} placeholder="e.g. 24/7 power backup, high-speed elevators, CCTV surveillance, gated security..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <Link to="/properties">
              <button type="button" className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
                Cancel
              </button>
            </Link>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '0.6rem 1.75rem' }}>
              {submitting ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>);
}
