'use client';
import React, { useEffect, useState } from 'react';
import { getUnits, getProperties } from '@/lib/api';
import { Link } from 'react-router-dom';
const STATUS_CONFIGS = {
    occupied: { dot: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', label: 'Occupied' },
    vacant: { dot: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', label: 'Vacant' },
    maintenance: { dot: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', label: 'Maintenance' },
};
const PROPERTY_TYPE_CONFIG = {
    residential: { label: 'Residential Apartment', icon: '🏠', badgeColor: '#10b981' },
    commercial: { label: 'Commercial Office', icon: '🏢', badgeColor: '#6366f1' },
    shopping_complex: { label: 'Shopping Complex / Mall', icon: '🛍️', badgeColor: '#f59e0b' },
};
const UNIT_TYPE_ICONS = {
    apartment: '🏠',
    office: '🏢',
    shop: '🛍️',
    studio: '🛋️',
    penthouse: '🏙️',
};
export default function UnitsPage() {
    const [units, setUnits] = useState([]);
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedPropertyId, setSelectedPropertyId] = useState('all');
    const [view, setView] = useState('grid');
    useEffect(() => {
        Promise.all([getUnits(), getProperties()]).then(([unitsRes, propsRes]) => {
            setUnits(unitsRes.data);
            setProperties(propsRes.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);
    const filteredUnits = units.filter(u => {
        const matchSearch = u.unit_number.toLowerCase().includes(search.toLowerCase()) ||
            (u.current_tenant_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.property_name || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || u.status === statusFilter;
        const matchProp = selectedPropertyId === 'all' || u.property_id === selectedPropertyId;
        return matchSearch && matchStatus && matchProp;
    });
    const counts = {
        all: units.length,
        occupied: units.filter(u => u.status === 'occupied').length,
        vacant: units.filter(u => u.status === 'vacant').length,
        maintenance: units.filter(u => u.status === 'maintenance').length,
    };
    // Group filtered units by property
    const propertiesWithUnits = properties
        .filter(p => selectedPropertyId === 'all' || p.id === selectedPropertyId)
        .map(p => ({
        property: p,
        units: filteredUnits.filter(u => u.property_id === p.id)
    }))
        .filter(group => group.units.length > 0 || search === '');
    if (loading)
        return <div className="loading-spinner"/>;
    return (<div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Property Units Directory</h1>
            <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0' }}>
              Hierarchical view: Parent Property &rarr; Child Units inventory
            </p>
          </div>
          <Link to="/properties">
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>＋</span> Manage Properties
            </button>
          </Link>
        </div>
      </div>

      {/* Visual Legend Strip */}
      <div style={{
            background: 'var(--card-bg, #111827)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
        }}>
        {/* Property Type Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Property Types:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <span>🏠</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>Residential</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <span>🏢</span>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>Commercial Tower</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <span>🛍️</span>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Shopping Complex</span>
          </div>
        </div>

        {/* Status Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Unit Status:
          </span>
          <span className="status-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            ● Occupied ({counts.occupied})
          </span>
          <span className="status-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            ○ Vacant ({counts.vacant})
          </span>
          {counts.maintenance > 0 && (<span className="status-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              🔧 Maintenance ({counts.maintenance})
            </span>)}
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
            background: 'var(--card-bg, #111827)',
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
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <span style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input type="text" placeholder="Search unit number, tenant, or property name..." value={search} onChange={e => setSearch(e.target.value)} style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem'
        }}/>
        </div>

        {/* Property Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Property:</span>
          <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            fontWeight: 600
        }}>
            <option value="all">All Properties ({properties.length})</option>
            {properties.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.total_units} units)</option>))}
          </select>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['all', 'occupied', 'vacant'].map(s => (<button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                background: statusFilter === s ? 'var(--primary)' : 'var(--bg-secondary)',
                color: statusFilter === s ? '#ffffff' : 'var(--text-secondary)',
                textTransform: 'capitalize'
            }}>
              {s}
            </button>))}
        </div>

        {/* View Switcher */}
        <button className="btn btn-secondary" onClick={() => setView(v => v === 'grid' ? 'table' : 'grid')} style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}>
          {view === 'grid' ? '☰ Table View' : '⊞ Grid View'}
        </button>
      </div>

      {/* Parent-Child Hierarchy Listing */}
      {propertiesWithUnits.length === 0 ? (<div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏗️</div>
          <p style={{ color: 'var(--text-secondary)' }}>No units match the filter criteria.</p>
        </div>) : (propertiesWithUnits.map(({ property, units: propUnits }) => {
            const typeMeta = PROPERTY_TYPE_CONFIG[property.type] || { label: property.type, icon: '🏢', badgeColor: '#6366f1' };
            const occupiedCount = propUnits.filter(u => u.status === 'occupied').length;
            const occRate = propUnits.length > 0 ? Math.round((occupiedCount / propUnits.length) * 100) : 0;
            return (<div key={property.id} style={{ marginBottom: '2.5rem' }}>
              {/* Parent Property Header */}
              <div className="property-group-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    border: '1px solid var(--border)'
                }}>
                    {typeMeta.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {property.name}
                      </h2>
                      <span className="status-badge" style={{
                    background: `${typeMeta.badgeColor}20`,
                    color: typeMeta.badgeColor,
                    border: `1px solid ${typeMeta.badgeColor}40`,
                    fontSize: '0.7rem'
                }}>
                        {typeMeta.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      📍 {property.address}, {property.city} · {property.total_floors} Floors
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Occupancy</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: occRate >= 80 ? '#10b981' : '#f59e0b' }}>
                      {occupiedCount} / {propUnits.length} ({occRate}%)
                    </div>
                  </div>
                  <Link to={`/properties/${property.id}`}>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.85rem' }}>
                      Property Details &rarr;
                    </button>
                  </Link>
                </div>
              </div>

              {/* Child Units - Grid or Table */}
              {view === 'grid' ? (<div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: '1rem'
                    }}>
                  {propUnits.map(unit => {
                        const cfg = STATUS_CONFIGS[unit.status] || STATUS_CONFIGS.vacant;
                        const unitIcon = UNIT_TYPE_ICONS[unit.unit_type] || '🏠';
                        return (<div key={unit.id} className="card" style={{
                                padding: '1.1rem',
                                background: cfg.bg,
                                borderColor: cfg.border,
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                        <div>
                          {/* Unit Top Strip */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontSize: '1.15rem' }}>{unitIcon}</span>
                              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                Unit {unit.unit_number}
                              </span>
                            </div>
                            <span className="status-badge" style={{
                                background: unit.status === 'occupied' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                color: unit.status === 'occupied' ? '#10b981' : '#ef4444',
                                fontSize: '0.65rem'
                            }}>
                              {cfg.label}
                            </span>
                          </div>

                          {/* Property & Type subtitle */}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {unit.unit_type}
                            </span>
                            {unit.area_sqft ? ` · ${unit.area_sqft} sq.ft` : ''} · Floor {unit.floor_number}
                          </div>

                          {/* Tenant Info */}
                          <div style={{
                                background: 'rgba(0, 0, 0, 0.25)',
                                padding: '0.5rem 0.65rem',
                                borderRadius: '8px',
                                marginBottom: '0.75rem',
                                fontSize: '0.8rem'
                            }}>
                            {unit.current_tenant_name ? (<div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  👤 {unit.current_tenant_name}
                                </div>
                                {unit.lease_end_date && (<div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                    Exp: {unit.lease_end_date}
                                  </div>)}
                              </div>) : (<div style={{ color: '#10b981', fontWeight: 600 }}>
                                ✨ Available for Lease
                              </div>)}
                          </div>
                        </div>

                        {/* Bottom Rent strip */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monthly Rent</span>
                          <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                            ₹{unit.rent_amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>);
                    })}
                </div>) : (
                /* Table View */
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Unit</th>
                        <th>Type</th>
                        <th>Floor</th>
                        <th>Area</th>
                        <th>Monthly Rent</th>
                        <th>Deposit</th>
                        <th>Tenant</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {propUnits.map(unit => {
                        const unitIcon = UNIT_TYPE_ICONS[unit.unit_type] || '🏠';
                        return (<tr key={unit.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>{unitIcon}</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  Unit {unit.unit_number}
                                </span>
                              </div>
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>{unit.unit_type}</td>
                            <td>Floor {unit.floor_number}</td>
                            <td>{unit.area_sqft ? `${unit.area_sqft} sqft` : '—'}</td>
                            <td style={{ fontWeight: 700, color: '#10b981' }}>
                              ₹{unit.rent_amount.toLocaleString('en-IN')}
                            </td>
                            <td>₹{unit.deposit_amount?.toLocaleString('en-IN') || 0}</td>
                            <td>
                              {unit.current_tenant_name ? (<span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {unit.current_tenant_name}
                                </span>) : (<span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Available</span>)}
                            </td>
                            <td>
                              <span className="status-badge" style={{
                                background: unit.status === 'occupied' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                color: unit.status === 'occupied' ? '#10b981' : '#ef4444'
                            }}>
                                {unit.status}
                              </span>
                            </td>
                          </tr>);
                    })}
                    </tbody>
                  </table>
                </div>)}
            </div>);
        }))}
    </div>);
}
