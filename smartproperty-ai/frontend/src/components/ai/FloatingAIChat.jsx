'use client';

import React, { useState, useEffect, useRef } from 'react';
import { queryAI } from '@/lib/api';
import { Sparkles, Send, Trash2, X, Zap, Bot, ArrowRight, CornerDownLeft } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'Vacant Units', query: 'Which units are currently vacant?' },
  { label: 'Unpaid Rent', query: 'Who has not paid rent this month?' },
  { label: 'Expiring Leases', query: 'Are there any leases expiring in the next 30 days?' },
  { label: 'Maintenance', query: 'What are the open high priority maintenance tickets?' },
];

const INITIAL_MESSAGES = [
  {
    role: 'ai',
    content: "Hello! I'm **MANARA AI**, your executive property copilot.\n\nI have direct access to your live portfolio database—occupancy, overdue balances, active leases, and maintenance workflows. How can I help you today?",
    timestamp: new Date('2026-01-01T10:00:00Z'),
  }
];

export default function FloatingAIChat({ externalOpen, onToggle }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (val) => {
    const next = typeof val === 'function' ? val(isOpen) : val;
    if (onToggle) onToggle(next);
    setInternalOpen(next);
  };
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(prev => prev.map((m, i) => i === 0 ? { ...m, timestamp: new Date() } : m));
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await queryAI(q);
      const aiResponse = res.data?.response || res.data?.message || "I couldn't process that query.";
      setMessages(prev => [...prev, {
        role: 'ai',
        content: aiResponse,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "⚠️ **Service Notice**: Unable to reach MANARA AI core. Please confirm the backend server is running on `http://127.0.0.1:8000`.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'ai',
        content: "Chat cleared. What insights or portfolio operations would you like to explore?",
        timestamp: new Date(),
      }
    ]);
  };

  const formatInline = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff; font-weight: 700;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color: #cbd5e1;">$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(99,102,241,0.18); border: 1px solid rgba(99,102,241,0.3); padding: 0.12rem 0.35rem; border-radius: 4px; font-size: 0.8rem; color: #a5b4fc;">$1</code>');
  };

  const formatMessage = (content) => {
    if (!content) return '';
    const lines = content.split('\n');
    const result = [];
    let tableBuffer = [];
    let inTable = false;

    const flushTable = () => {
      if (tableBuffer.length >= 2) {
        let html = '<div class="ai-table-wrap"><table class="ai-table">';
        // Headers
        const rawHeaders = tableBuffer[0].split('|').map(s => s.trim()).filter(s => s.length > 0);
        html += '<thead><tr>';
        rawHeaders.forEach(h => {
          html += `<th>${formatInline(h)}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Data rows (skip index 1 which is |---|)
        for (let r = 2; r < tableBuffer.length; r++) {
          const rawCells = tableBuffer[r].split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          if (rawCells.length > 0) {
            html += '<tr>';
            rawCells.forEach(cell => {
              let cellContent = formatInline(cell);
              const lower = cell.toLowerCase();
              if (cell.includes('₹')) {
                cellContent = `<span class="ai-cell-currency">${cellContent}</span>`;
              } else if (lower.includes('vacant') || lower.includes('unpaid') || lower.includes('high')) {
                cellContent = `<span class="ai-badge-warn">${cellContent}</span>`;
              } else if (lower.includes('occupied') || lower.includes('paid')) {
                cellContent = `<span class="ai-badge-ok">${cellContent}</span>`;
              }
              html += `<td>${cellContent}</td>`;
            });
            html += '</tr>';
          }
        }
        html += '</tbody></table></div>';
        result.push(html);
      } else {
        tableBuffer.forEach(line => result.push(formatInline(line)));
      }
      tableBuffer = [];
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const isTable = trimmed.startsWith('|') && trimmed.endsWith('|');

      if (isTable) {
        inTable = true;
        tableBuffer.push(trimmed);
      } else {
        if (inTable) flushTable();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          result.push(`<div style="display:flex;align-items:flex-start;gap:6px;margin:2px 0;"><span style="color:#818cf8;font-weight:700;">•</span><span>${formatInline(trimmed.substring(2))}</span></div>`);
        } else if (trimmed.length > 0) {
          result.push(formatInline(line));
        } else {
          result.push('<div style="height:6px;"></div>');
        }
      }
    }
    if (inTable) flushTable();

    return result.join('<br/>').replace(/(<div class="ai-table-wrap">.*?<\/div>)<br\/>/g, '$1');
  };

  return (
    <>
      {/* ─── Top Notch iOS Native AI Copilot Bottom Sheet ──────────────────────── */}
      {isOpen && (
        <>
          <div
            className="floating-ai-backdrop"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="floating-ai-window" role="dialog" aria-modal="true" aria-label="MANARA AI Copilot">
            {/* iOS Pull Down Drag Handle */}
            <div className="ios-sheet-handle-bar">
              <div className="ios-sheet-handle" />
            </div>

            {/* iOS Navigation Header */}
            <div className="ios-ai-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="ios-ai-avatar">
                  <Sparkles size={18} color="#ffffff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ffffff', letterSpacing: '-0.01em' }}>
                      MANARA Copilot
                    </span>
                    <span className="ios-live-chip">
                      <span className="ios-live-dot" />
                      Live
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '1px' }}>
                    Gemini 3.5 Flash • Real-time DB
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear Conversation"
                  className="ios-header-icon-btn"
                  aria-label="Clear chat"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="ios-done-pill"
                  aria-label="Dismiss Copilot"
                >
                  Done
                </button>
              </div>
            </div>

            {/* Quick Prompts Carousel Bar */}
            <div className="ios-quick-prompts-bar">
              {QUICK_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(item.query)}
                  disabled={loading}
                  className="ios-quick-chip"
                >
                  <Zap size={11} color="#818cf8" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Messages Thread Container */}
            <div className="ios-chat-messages">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    maxWidth: msg.role === 'user' ? '85%' : '94%',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  }}>
                    {msg.role === 'ai' && (
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '9px',
                        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(124, 58, 237, 0.3) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        <Sparkles size={14} color="#a5b4fc" />
                      </div>
                    )}

                    <div style={{
                      padding: '0.85rem 1rem',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                        : 'rgba(23, 25, 46, 0.85)',
                      border: msg.role === 'ai' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      color: msg.role === 'user' ? '#ffffff' : '#f1f5f9',
                      fontSize: '0.875rem',
                      lineHeight: 1.55,
                      boxShadow: msg.role === 'user'
                        ? '0 6px 18px rgba(79, 70, 229, 0.4)'
                        : '0 4px 16px rgba(0, 0, 0, 0.35)',
                      wordBreak: 'break-word',
                    }}>
                      {msg.role === 'ai' ? (
                        <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.64rem',
                    color: '#64748b',
                    marginTop: '0.3rem',
                    paddingLeft: msg.role === 'ai' ? '36px' : 0,
                    paddingRight: msg.role === 'user' ? '4px' : 0,
                  }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3) 0%, rgba(124, 58, 237, 0.3) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Sparkles size={14} color="#a5b4fc" />
                  </div>
                  <div style={{
                    padding: '0.75rem 1.1rem',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'rgba(23, 25, 46, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: 'pulse 1s infinite' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: 'pulse 1s 0.2s infinite' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', animation: 'pulse 1s 0.4s infinite' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* iOS Luxury Capsule Input Footer */}
            <div className="ios-chat-footer">
              <div className="ios-input-capsule">
                <input
                  type="text"
                  placeholder="Ask MANARA AI about leases, rent, units..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="ios-chat-input"
                />
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className={`ios-send-btn ${input.trim() ? 'active' : ''}`}
                  aria-label="Send message"
                >
                  <Send size={15} style={{ marginLeft: input.trim() ? '1px' : 0 }} />
                </button>
              </div>

              <div className="ios-footer-caption">
                <span>⚡ Real-time Portfolio AI Engine</span>
                <span className="ios-desktop-hint">
                  Press <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '0.05rem 0.35rem', borderRadius: '3px', fontSize: '0.62rem', color: '#94a3b8' }}>↵ Enter</kbd>
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Luxury Floating Pill Trigger Button ──────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle MANARA AI Copilot"
        className="floating-ai-trigger"
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 14px 34px -4px rgba(79, 70, 229, 0.6), 0 0 20px rgba(124, 58, 237, 0.35)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 28px -4px rgba(79, 70, 229, 0.45), 0 0 16px rgba(124, 58, 237, 0.25)';
        }}
        title="MANARA AI Copilot"
      >
        <Sparkles size={16} />
        <span>{isOpen ? 'Close Copilot' : 'MANARA Copilot'}</span>
        {!isOpen && (
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }} />
        )}
      </button>
    </>
  );
}
