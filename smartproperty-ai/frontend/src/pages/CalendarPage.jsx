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
        setSelectedDay(null);
    };

    const nextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
        setSelectedDay(null);
    };

    const jumpToToday = () => {
        setCurrentMonth(today.getMonth() + 1);
        setCurrentYear(today.getFullYear());
        setSelectedDay(today.getDate());
    };

    const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

    const EVENT_TYPE_LABELS = {
        lease_expiry: '📋 Lease Expiry',
        rent_due: '💰 Rent Due',
        maintenance: '🔧 Maintenance',
        exit: '🚪 Tenant Exit',
    };

    const isCurrentMonthToday = currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();

    return (
      <div className="page-container animate-fade-in calendar-page-root">
        {/* Page Header */}
        <div className="calendar-page-header animate-in">
          <div className="calendar-title-wrap">
            <h1 className="page-title">📅 Property Calendar</h1>
            <p className="page-subtitle">All events — leases, rent, maintenance, exits</p>
          </div>

          {/* Filter Pills (Horizontal swipe on mobile) */}
          <div className="calendar-filter-bar">
            {['lease_expiry', 'rent_due', 'maintenance', 'exit'].map(type => (
              <span key={type} className="badge calendar-filter-pill" style={{
                background: type === 'lease_expiry' ? 'rgba(239,68,68,0.12)' :
                    type === 'rent_due' ? 'rgba(245,158,11,0.12)' :
                        type === 'maintenance' ? 'rgba(139,92,246,0.12)' : 'rgba(99,102,241,0.12)',
                color: type === 'lease_expiry' ? '#ef4444' :
                    type === 'rent_due' ? '#f59e0b' :
                        type === 'maintenance' ? '#a78bfa' : '#818cf8',
                border: '1px solid currentColor',
              }}>
                {EVENT_TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        </div>

        <div className="calendar-layout">
          {/* Calendar Grid Card */}
          <div className="card animate-in calendar-grid-card">
            {/* Dedicated Month Navigation Bar (Never stacked into column) */}
            <div className="calendar-month-bar">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={prevMonth}
                aria-label="Previous Month"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Prev</span>
              </button>

              <div className="calendar-month-center">
                <h2 className="calendar-month-title">
                  {MONTHS[currentMonth - 1]} {currentYear}
                </h2>
                {!isCurrentMonthToday && (
                  <button type="button" className="calendar-today-pill" onClick={jumpToToday}>
                    Today
                  </button>
                )}
              </div>

              <button
                type="button"
                className="calendar-nav-btn"
                onClick={nextMonth}
                aria-label="Next Month"
              >
                <span>Next</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            <div className="calendar-grid-body">
              {/* Day Headers (Sun - Sat) */}
              <div className="calendar-day-header-grid">
                {DAYS.map(d => (
                  <div key={d} className="calendar-day-header-cell">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="calendar-days-grid">
                {/* Empty cells for leading days */}
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
                      <div className="calendar-day-number">
                        {day}
                      </div>

                      {/* Desktop event badges */}
                      <div className="calendar-day-events-desktop">
                        {dayEvents.slice(0, 3).map((event, j) => (
                          <div key={j} style={{
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontSize: '0.62rem',
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
                          <span
                            key={j}
                            className="calendar-event-dot"
                            style={{ background: event.color || '#6366f1', color: event.color || '#6366f1' }}
                          />
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
            {/* Selected Day Events Sheet */}
            {selectedDay && (
              <div className="card animate-in calendar-selected-card">
                <div className="card-header flex items-center justify-between" style={{ padding: '0.9rem 1.15rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                      Selected Date
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                      {selectedDay} {MONTHS[currentMonth - 1]} {currentYear}
                    </h3>
                  </div>
                  <span className="badge badge-primary">{selectedEvents.length} events</span>
                </div>
                <div className="card-body" style={{ padding: '0.85rem 1.15rem' }}>
                  {selectedEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '4px' }}>☕</span>
                      No events scheduled for this day
                    </div>
                  ) : (
                    selectedEvents.map((event, i) => (
                      <div key={i} style={{
                        padding: '0.75rem',
                        background: `${event.color}12`,
                        border: `1px solid ${event.color}35`,
                        borderLeft: `3px solid ${event.color}`,
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '0.5rem',
                      }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {event.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{EVENT_TYPE_LABELS[event.type]}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Month Summary */}
            <div className="card animate-in">
              <div className="card-header" style={{ padding: '0.9rem 1.15rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Month Summary</h3>
              </div>
              <div className="card-body" style={{ padding: '1rem 1.15rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  {[
                    { type: 'lease_expiry', label: 'Lease Expiries', color: '#ef4444', icon: '📋' },
                    { type: 'rent_due', label: 'Rent Dues', color: '#f59e0b', icon: '💰' },
                    { type: 'maintenance', label: 'Maintenance', color: '#8b5cf6', icon: '🔧' },
                    { type: 'exit', label: 'Tenant Exits', color: '#6366f1', icon: '🚪' },
                  ].map(s => {
                    const count = events.filter(e => e.type === s.type).length;
                    return (
                      <div
                        key={s.type}
                        style={{
                          background: `${s.color}10`,
                          border: `1px solid ${s.color}25`,
                          borderRadius: '10px',
                          padding: '0.65rem 0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{count}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Events this month</span>
                    <span className="badge badge-primary">{events.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events List */}
            <div className="card animate-in" style={{ flex: 1 }}>
              <div className="card-header" style={{ padding: '0.9rem 1.15rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Upcoming Events</h3>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', padding: '0.75rem 1.15rem' }}>
                {events.slice(0, 15).map((event, i) => (
                  <div key={i} style={{
                    padding: '0.6rem 0.75rem',
                    borderLeft: `3px solid ${event.color}`,
                    marginBottom: '0.5rem',
                    borderRadius: '0 8px 8px 0',
                    background: `${event.color}0a`,
                  }}>
                    <div style={{ fontSize: '0.72rem', color: event.color, fontWeight: 700 }}>
                      {event.date}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem', fontWeight: 600 }}>
                      {event.title}
                    </div>
                  </div>
                ))}
                {events.length === 0 && !loading && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>
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
