'use client';

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProperties } from '@/lib/api';

const DEFAULT_IMAGES = {
  residential: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
  commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
  shopping_complex: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=1000&q=80',
  mixed: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1000&q=80',
};

const TYPE_CONFIG = {
  residential: {
    label: 'Residential',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    badgeColor: '#34d399',
    icon: '🏠',
  },
  commercial: {
    label: 'Commercial',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    badgeBorder: 'rgba(99, 102, 241, 0.35)',
    badgeColor: '#818cf8',
    icon: '🏢',
  },
  shopping_complex: {
    label: 'Shopping Complex',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    badgeColor: '#fbbf24',
    icon: '🛍️',
  },
  mixed: {
    label: 'Mixed Use',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    badgeColor: '#c084fc',
    icon: '🏙️',
  },
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getProperties()
      .then(r => {
        setProperties(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = properties.filter(p => {
    return filter === 'all' || p.type === filter;
  });

  const totalRevenue = properties.reduce((sum, p) => sum + (p.monthly_revenue || 0), 0);
  const totalUnits = properties.reduce((sum, p) => sum + (p.total_units || 0), 0);
  const totalOccupied = properties.reduce((sum, p) => sum + (p.occupied_units || 0), 0);
  const overallOccupancy = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;
  const totalVacant = totalUnits - totalOccupied;

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', animation: 'spin 1.5s linear infinite', marginBottom: '0.75rem' }}>⚙️</div>
          <p>Loading MANARA Property Portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: '0.75rem',
            color: 'var(--primary-light)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem',
          }}>
            <span>🏢</span>
            <span>MANARA Portfolio Assets</span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#ffffff', margin: 0 }}>
            Properties Portfolio
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            {properties.length} Active Properties · {totalUnits} Total Units under Governance
          </p>
        </div>

        <Link to="/properties/new">
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.4rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}>
            <span style={{ fontSize: '1.1rem' }}>+</span>
            <span>Add New Property</span>
          </button>
        </Link>
      </div>

      {/* ─── Executive KPI Cards Strip ──────────────────────────────── */}
      <div className="properties-kpi-grid" style={{
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        {/* KPI 1: Revenue */}
        <div style={{
          padding: '1.4rem',
          background: 'rgba(20, 20, 42, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Monthly Gross Yield
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}>
              💎
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#10b981', marginTop: '0.65rem' }}>
            ₹{(totalRevenue / 100000).toFixed(2)}L
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8' }}> / mo</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.4rem', fontWeight: 600 }}>
            ▲ 100% Verified Collections
          </div>
        </div>

        {/* KPI 2: Total Units */}
        <div style={{
          padding: '1.4rem',
          background: 'rgba(20, 20, 42, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Units
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}>
              🏢
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginTop: '0.65rem' }}>
            {totalUnits} Units
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            Across {properties.length} Prime Complexes
          </div>
        </div>

        {/* KPI 3: Occupancy Rate */}
        <div style={{
          padding: '1.4rem',
          background: 'rgba(20, 20, 42, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Portfolio Occupancy
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}>
              📈
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#38bdf8', marginTop: '0.65rem' }}>
            {overallOccupancy}%
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            {totalOccupied} Occupied · Active Leases
          </div>
        </div>

        {/* KPI 4: Vacancies */}
        <div style={{
          padding: '1.4rem',
          background: 'rgba(20, 20, 42, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Available Vacancies
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}>
              🔑
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#fbbf24', marginTop: '0.65rem' }}>
            {totalVacant} Units
          </div>
          <div style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '0.4rem', fontWeight: 600 }}>
            Ready for Onboarding
          </div>
        </div>
      </div>

      {/* ─── Category Filters Bar ─────────────────────────── */}
      <div className="properties-filter-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: '2rem',
        background: 'rgba(20, 20, 42, 0.5)',
        padding: '0.75rem 1rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>

        {/* Category Tabs */}
        <div className="properties-filter-tabs">
          {[
            { id: 'all', label: 'All Properties' },
            { id: 'mixed', label: 'Mixed' },
            { id: 'commercial', label: 'Commercial' },
            { id: 'residential', label: 'Residential' },
          ].map(f => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                  background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.2) 100%)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Luxury Property Cards Grid ─────────────────────────────── */}
      <div className="properties-cards-grid">
        {filtered.map(property => {
          const typeConf = TYPE_CONFIG[property.type] || TYPE_CONFIG.residential;
          const occupancyRate = property.total_units > 0
            ? Math.round((property.occupied_units / property.total_units) * 100)
            : 0;
          const imageUrl = property.image_url || DEFAULT_IMAGES[property.type] || DEFAULT_IMAGES.residential;

          return (
            <div
              key={property.id}
              style={{
                background: 'rgba(18, 18, 38, 0.75)',
                backdropFilter: 'blur(20px)',
                borderRadius: '22px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.45)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              {/* Cinematic Architecture Photography Header */}
              <div style={{
                position: 'relative',
                height: '210px',
                overflow: 'hidden',
              }}>
                <img
                  src={imageUrl}
                  alt={property.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                />

                {/* Rich Cinematic Dark Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(18, 18, 38, 0.98) 0%, rgba(18, 18, 38, 0.4) 55%, rgba(0, 0, 0, 0.3) 100%)',
                }} />

                {/* Top Left Floors Pill */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#ffffff',
                }}>
                  🏢 {property.total_floors} Floor{property.total_floors > 1 ? 's' : ''}
                </div>

                {/* Top Right Luxury Type Badge */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: typeConf.badgeBg,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${typeConf.badgeBorder}`,
                  borderRadius: '20px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: typeConf.badgeColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {typeConf.label}
                </div>

                {/* Bottom Left Property Identity */}
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1.25rem',
                  right: '1.25rem',
                }}>
                  <h3 style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0,
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                  }}>
                    {property.name}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    marginTop: '0.25rem',
                  }}>
                    <span>📍</span>
                    <span>{property.address}, {property.city}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>

                {/* Occupancy Progress Bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Occupancy Rate</span>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: occupancyRate >= 80 ? '#10b981' : occupancyRate >= 50 ? '#fbbf24' : '#ef4444'
                    }}>
                      {occupancyRate}%
                    </span>
                  </div>
                  <div style={{
                    height: '7px',
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${occupancyRate}%`,
                      background: occupancyRate >= 80
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #f59e0b, #d97706)',
                      borderRadius: '10px',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>

                {/* Units Metric Pills (3 columns) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.65rem',
                  marginBottom: '1.25rem',
                }}>
                  <div style={{
                    padding: '0.75rem 0.5rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                      {property.total_units}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px', fontWeight: 600 }}>
                      Total
                    </div>
                  </div>

                  <div style={{
                    padding: '0.75rem 0.5rem',
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.18)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                      {property.occupied_units}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#10b981', textTransform: 'uppercase', marginTop: '2px', fontWeight: 600 }}>
                      Occupied
                    </div>
                  </div>

                  <div style={{
                    padding: '0.75rem 0.5rem',
                    background: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.18)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>
                      {property.vacant_units}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#fbbf24', textTransform: 'uppercase', marginTop: '2px', fontWeight: 600 }}>
                      Vacant
                    </div>
                  </div>
                </div>

                {/* Revenue Card Strip */}
                <div style={{
                  padding: '0.85rem 1rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Monthly Revenue Yield</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981' }}>
                    ₹{Number(property.monthly_revenue).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                  <Link to={`/properties/${property.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                    <button style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                      transition: 'transform 0.15s',
                    }}>
                      Manage Property →
                    </button>
                  </Link>

                  <Link to={`/units?property_id=${property.id}`} style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '0.75rem 1.15rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#f1f5f9',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}>
                      Units ({property.total_units})
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'rgba(20, 20, 42, 0.5)',
          borderRadius: '20px',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          marginTop: '2rem',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏢</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>No properties found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            No property assets in this category.
          </p>
        </div>
      )}
    </div>
  );
}
