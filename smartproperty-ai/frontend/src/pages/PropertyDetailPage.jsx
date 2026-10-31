'use client';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getProperty, getUnits, deleteProperty, createUnit } from '@/lib/api';
export default function PropertyDetailPage() {
    const params = useParams();
    const navigate = useNavigate();
  const router = { push: (url) => navigate(url), replace: (url) => navigate(url, { replace: true }), back: () => navigate(-1) };
    const propertyId = params?.id;
    const [property, setProperty] = useState(null);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddUnitModal, setShowAddUnitModal] = useState(false);
    const [unitForm, setUnitForm] = useState({
        floor_number: 1,
        unit_number: '',
        unit_type: 'apartment',
        area_sqft: 1200,
        rent_amount: 25000,
        deposit_amount: 100000,
        status: 'vacant',
        description: '',
        amenities: 'AC, Modular Kitchen, Wardrobes'
    });
    useEffect(() => {
        if (propertyId) {
            loadData();
        }
    }, [propertyId]);
    const loadData = async () => {
        try {
            setLoading(true);
            const [propRes, unitsRes] = await Promise.all([
                getProperty(propertyId),
                getUnits({ property_id: propertyId })
            ]);
            setProperty(propRes.data);
            setUnits(unitsRes.data);
        }
        catch (err) {
            console.error('Error fetching property detail:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDeleteProperty = async () => {
        if (!confirm('Are you sure you want to delete this property? This action cannot be undone.'))
            return;
        try {
            await deleteProperty(propertyId);
            router.push('/properties');
        }
        catch (err) {
            alert('Failed to delete property');
        }
    };
    const handleAddUnit = async (e) => {
        e.preventDefault();
        try {
            await createUnit({
                ...unitForm,
                property_id: propertyId
            });
            setShowAddUnitModal(false);
            setUnitForm({
                floor_number: 1,
                unit_number: '',
                unit_type: 'apartment',
                area_sqft: 1200,
                rent_amount: 25000,
                deposit_amount: 100000,
                status: 'vacant',
                description: '',
                amenities: 'AC, Modular Kitchen, Wardrobes'
            });
            loadData();
        }
        catch (err) {
            alert('Failed to add unit');
        }
    };
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading property details...</div>;
    }
    if (!property) {
        return (<div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Property not found</h3>
        <Link to="/properties" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          Back to Properties
        </Link>
      </div>);
    }
    const occupancyRate = property.total_units > 0
        ? Math.round((property.occupied_units / property.total_units) * 100) : 0;
    return (<div className="page-container animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/properties" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
          &larr; Back to Properties
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {property.name}
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              📍 {property.address}, {property.city}, {property.state} {property.pincode ? `- ${property.pincode}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowAddUnitModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
              <span>＋</span> Add Unit
            </button>
            <button onClick={handleDeleteProperty} className="btn-secondary" style={{ padding: '0.6rem 1rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Occupancy</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: occupancyRate >= 80 ? '#10b981' : '#f59e0b', marginTop: '0.25rem' }}>
            {occupancyRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {property.occupied_units} of {property.total_units} units occupied
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Monthly Revenue</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            ₹{property.monthly_revenue?.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            from active leases
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Vacant Units</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: '#ef4444', marginTop: '0.25rem' }}>
            {property.vacant_units}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            ready for lease
          </div>
        </div>

        <div className="stat-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Structure</div>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {property.total_floors} Floors
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
            {property.type.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Units Listing */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Units in {property.name} ({units.length})
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Complete breakdown of flats, offices, and retail units in this building
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="status-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
              ● {property.occupied_units} Occupied
            </span>
            <span className="status-badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              ● {property.vacant_units} Vacant
            </span>
          </div>
        </div>

        {units.length === 0 ? (<div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No units added to this property yet. Click &quot;Add Unit&quot; to configure flats or shops.
          </div>) : (<div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Unit & Floor</th>
                  <th>Type & Area</th>
                  <th>Monthly Rent</th>
                  <th>Security Deposit</th>
                  <th>Tenant Status</th>
                  <th>Unit Status</th>
                </tr>
              </thead>
              <tbody>
                {units.map(unit => {
                const typeIcon = unit.unit_type === 'office' ? '🏢' :
                    unit.unit_type === 'shop' ? '🛍️' :
                        unit.unit_type === 'penthouse' ? '🏙️' :
                            unit.unit_type === 'studio' ? '🛋️' : '🏠';
                return (<tr key={unit.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{typeIcon}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              Unit {unit.unit_number}
                            </div>
                            <span style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-muted)'
                    }}>
                              Floor {unit.floor_number}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {unit.unit_type}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {unit.area_sqft ? `${unit.area_sqft} sq.ft` : 'Standard'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>
                          ₹{unit.rent_amount?.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ month</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          ₹{unit.deposit_amount?.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Refundable deposit</div>
                      </td>
                      <td>
                        {unit.current_tenant_name ? (<div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                              👤 {unit.current_tenant_name}
                            </div>
                            {unit.lease_end_date && (<div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Lease ends: {unit.lease_end_date}
                              </div>)}
                          </div>) : (<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Unassigned
                          </span>)}
                      </td>
                      <td>
                        <span className="status-badge" style={{
                        background: unit.status === 'occupied' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: unit.status === 'occupied' ? '#10b981' : '#ef4444',
                        border: `1px solid ${unit.status === 'occupied' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                    }}>
                          {unit.status === 'occupied' ? '● Occupied' : '○ Vacant'}
                        </span>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>)}
      </div>

      {/* Add Unit Modal */}
      {showAddUnitModal && (<div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
            }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Add Unit to {property.name}</h2>
              <button onClick={() => setShowAddUnitModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddUnit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Unit Number *</label>
                  <input type="text" required placeholder="e.g. 101, A-204" value={unitForm.unit_number} onChange={e => setUnitForm({ ...unitForm, unit_number: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Floor Number *</label>
                  <input type="number" required value={unitForm.floor_number} onChange={e => setUnitForm({ ...unitForm, floor_number: parseInt(e.target.value, 10) || 1 })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Unit Type *</label>
                  <select value={unitForm.unit_type} onChange={e => setUnitForm({ ...unitForm, unit_type: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <option value="apartment">Apartment / Flat</option>
                    <option value="office">Office Space</option>
                    <option value="shop">Shop / Retail</option>
                    <option value="studio">Studio</option>
                    <option value="penthouse">Penthouse</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Area (sqft)</label>
                  <input type="number" value={unitForm.area_sqft} onChange={e => setUnitForm({ ...unitForm, area_sqft: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Rent / Month (₹) *</label>
                  <input type="number" required value={unitForm.rent_amount} onChange={e => setUnitForm({ ...unitForm, rent_amount: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Security Deposit (₹)</label>
                  <input type="number" value={unitForm.deposit_amount} onChange={e => setUnitForm({ ...unitForm, deposit_amount: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', marginBottom: '0.25rem', fontWeight: 600 }}>Amenities & Furnishing</label>
                <input type="text" placeholder="e.g. Semi-furnished, Geyser, Chimney" value={unitForm.amenities} onChange={e => setUnitForm({ ...unitForm, amenities: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddUnitModal(false)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
