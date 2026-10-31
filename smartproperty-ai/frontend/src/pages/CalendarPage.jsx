
'use client';
import React, { useEffect, useState } from 'react';
import { getCalendarEvents } from '@/lib/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        setLoading(true);
        getCalendarEvents(currentMonth, currentYear).then(r => {
            setEvents(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [currentMonth, currentYear]);

    const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
    const getFirstDay = (month, year) => new Date(year, month - 1, 1).getDay();
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDay(currentMonth, currentYear);

    const getEventsForDay = (day) => {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const prevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

    const EVENT_TYPE_LABELS = {
        lease_expiry: '📋 Lease Expiry',
        rent_due: '💰 Rent Due',
        maintenance: '🔧 Maintenance',
        exit: '🚪 Tenant Exit',
    };

    return (
      <div className="page-container animate-fade-in">
        <div className="page-header animate-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">📅 Property Calendar</h1>
              <p className="page-subtitle">All events — leases, rent, maintenance, exits</p>
            </div>
            <div className="calendar-filter-bar">
              {['lease_expiry', 'rent_due', 'maintenance', 'exit'].map(type => (
                <span key={type} className="badge calendar-filter-pill" style={{
                  background: type === 'lease_expiry' ? 'rgba(239,68,68,0.1)' :
                      type === 'rent_due' ? 'rgba(245,158,11,0.1)' :
                          type === 'maintenance' ? 'rgba(139,92,246,0.1)' : 'rgba(99,102,241,0.1)',
                  color: type === 'lease_expiry' ? '#ef4444' :
                      type === 'rent_due' ? '#f59e0b' :
                          type === 'maintenance' ? '#8b5cf6' : '#6366f1',
                  border: '1px solid currentColor',
                }}>
                  {EVENT_TYPE_LABELS[type]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="calendar-layout">
          {/* Calendar Grid */}
          <div className="card animate-in calendar-grid-card">
            {/* Month Navigation */}
            <div className="card-header calendar-month-nav">
              <button className="btn btn-secondary btn-sm" onClick={prevMonth}>← Prev</button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {MONTHS[currentMonth - 1]} {currentYear}
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={nextMonth}>Next →</button>
            </div>

            <div style={{ padding: '0.85rem' }}>
              {/* Day Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                {DAYS.map(d => (
                  <div key={d} style={{
                    textAlign: 'center', fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--text-muted)', textTransform: 'uppercase',
                    padding: '0.4rem 0', letterSpacing: '0.05em'
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {/* Empty cells for first week */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="calendar-day-empty" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day);
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();
                  const isSelected = selectedDay === day;
                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    >
                      <div className="calendar-day-number" style={{
                        fontWeight: isToday ? 800 : 600,
                        color: isToday ? 'var(--primary-light)' : 'var(--text-primary)',
                      }}>
                        {day}
                      </div>

                      {/* Desktop titles */}
                      <div className="calendar-day-events-desktop">
                        {dayEvents.slice(0, 3).map((event, j) => (
                          <div key={j} style={{
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            background: `${event.color}20`,
                            color: event.color,
                            marginBottom: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {event.title.slice(0, 18)}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>

                      {/* Mobile event dots */}
                      <div className="calendar-day-dots-mobile">
                        {dayEvents.slice(0, 4).map((event, j) => (
                          <span key={j} className="calendar-event-dot" style={{ background: event.color || '#6366f1' }} />
                        ))}
                        {dayEvents.length > 4 && (
                          <span className="calendar-event-dot-more">+{dayEvents.length - 4}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar — Events / Month Summary */}
          <div className="calendar-sidebar">
            {/* Selected Day Events */}
            {selectedDay && (
              <div className="card animate-in">
                <div className="card-header">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                    {selectedDay} {MONTHS[currentMonth - 1]}
                  </h3>
                  <span className="badge badge-primary">{selectedEvents.length} events</span>
                </div>
                <div className="card-body">
                  {selectedEvents.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No events on this day</p>
                  ) : (
                    selectedEvents.map((event, i) => (
                      <div key={i} style={{
                        padding: '0.75rem',
                        background: `${event.color}10`,
                        border: `1px solid ${event.color}30`,
                        borderLeft: `3px solid ${event.color}`,
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.5rem',
                      }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {event.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {EVENT_TYPE_LABELS[event.type]}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Month Summary */}
            <div className="card animate-in">
              <div className="card-header">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Month Summary</h3>
              </div>
              <div className="card-body">
                {[
                  { type: 'lease_expiry', label: 'Lease Expiries', color: '#ef4444', icon: '📋' },
                  { type: 'rent_due', label: 'Rent Dues', color: '#f59e0b', icon: '💰' },
                  { type: 'maintenance', label: 'Maintenance', color: '#8b5cf6', icon: '🔧' },
                  { type: 'exit', label: 'Tenant Exits', color: '#6366f1', icon: '🚪' },
                ].map(s => {
                  const count = events.filter(e => e.type === s.type).length;
                  return (
                    <div key={s.type} className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                      <div className="flex items-center gap-2">
                        <span>{s.icon}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                      </div>
                      <span className="badge" style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}30` }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Events</span>
                    <span className="badge badge-primary">{events.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events List */}
            <div className="card animate-in" style={{ flex: 1 }}>
              <div className="card-header">
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>All Events</h3>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto', padding: '0.75rem' }}>
                {events.slice(0, 20).map((event, i) => (
                  <div key={i} style={{
                    padding: '0.6rem 0.75rem',
                    borderLeft: `3px solid ${event.color}`,
                    marginBottom: '0.5rem',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    background: `${event.color}08`,
                  }}>
                    <div style={{ fontSize: '0.72rem', color: event.color, fontWeight: 700 }}>
                      {event.date}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {event.title}
                    </div>
                  </div>
                ))}
                {events.length === 0 && !loading && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                    No events this month
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}

