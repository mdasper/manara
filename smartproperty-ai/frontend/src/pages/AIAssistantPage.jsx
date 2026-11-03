'use client';
import React, { useEffect, useState, useRef } from 'react';
import { queryAI } from '@/lib/api';

const SUGGESTED_QUERIES = [
    "Who has renewal this month?",
    "Which units are vacant?",
    "Who has not paid rent?",
    "Show maintenance due next week.",
    "Show all commercial vacancies.",
    "What is the total monthly revenue?",
    "Which tenants are in MANARA HOMES?",
    "How many units are in MANARA CENTER?",
    "What is the occupancy of GRANDEUR GOLD?",
];

const INITIAL_MESSAGES = [
    {
        role: 'ai',
        content: "👋 Hello! I'm **MANARA AI**, your intelligent property management assistant.\n\nI have real-time access to all your property data — tenants, leases, payments, maintenance, and more.\n\nAsk me anything like:\n• *\"Who has renewal this month?\"*\n• *\"Which units are vacant?\"*\n• *\"Who hasn't paid rent?\"*",
        timestamp: new Date(),
    }
];

export default function AIAssistantPage() {
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const sendMessage = async (query) => {
        if (!query.trim() || loading)
            return;
        const userMsg = { role: 'user', content: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        try {
            const res = await queryAI(query);
            const aiMsg = {
                role: 'ai',
                content: res.data.response,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
        }
        catch (err) {
            setMessages(prev => [...prev, {
                    role: 'ai',
                    content: "⚠️ I'm having trouble connecting to the backend. Please make sure the FastAPI server is running on port 8000.",
                    timestamp: new Date(),
                }]);
        }
        finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const formatMessage = (content) => {
        if (!content) return '';

        // Check for markdown tables
        if (content.includes('|') && content.includes('\n|')) {
            const lines = content.split('\n');
            const output = [];
            let inTable = false;
            let tableRows = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('|') && line.endsWith('|')) {
                    if (line.includes('---')) continue; // Separator row
                    inTable = true;
                    const cells = line.split('|').slice(1, -1).map(c => c.trim());
                    tableRows.push(cells);
                } else {
                    if (inTable && tableRows.length > 0) {
                        output.push(renderTableHTML(tableRows));
                        tableRows = [];
                        inTable = false;
                    }
                    if (line) {
                        output.push(formatInlineText(line));
                    }
                }
            }
            if (inTable && tableRows.length > 0) {
                output.push(renderTableHTML(tableRows));
            }
            return output.join('<br/>');
        }

        return formatInlineText(content).replace(/\n/g, '<br/>');
    };

    const renderTableHTML = (rows) => {
        if (rows.length === 0) return '';
        const header = rows[0];
        const bodyRows = rows.slice(1);

        let html = '<div class="ai-table-wrap"><table class="ai-table"><thead><tr>';
        header.forEach(h => {
            html += `<th>${formatInlineText(h)}</th>`;
        });
        html += '</tr></thead><tbody>';

        bodyRows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                const isCurrency = cell.includes('₹') || cell.toLowerCase().includes('inr');
                const isStatus = cell.toLowerCase().includes('paid') || cell.toLowerCase().includes('active') || cell.toLowerCase().includes('vacant');
                let cellClass = '';
                if (isCurrency) cellClass = ' class="ai-cell-currency"';
                else if (isStatus) cellClass = ' class="ai-cell-status"';
                html += `<td${cellClass}>${formatInlineText(cell)}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        return html;
    };

    const formatInlineText = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    };

    return (
      <div className="page-container animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header animate-in" style={{ marginBottom: '1rem', flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)', flexShrink: 0
            }}>
              🤖
            </div>
            <div>
              <h1 className="page-title" style={{ marginBottom: 0, fontSize: '1.35rem' }}>AI Assistant</h1>
              <p className="page-subtitle" style={{ fontSize: '0.8rem', margin: 0 }}>Powered by Google Gemini · Real-time portfolio analysis</p>
            </div>
            <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>● Live</span>
          </div>
        </div>

        <div className="ai-page-layout">
          {/* Main Chat Area */}
          <div className="card ai-chat-card">
            {/* Messages Scroll Area */}
            <div className="chat-messages ai-messages-area">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.role === 'ai' && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', width: '100%' }}>
                      <div style={{
                        width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                      }}>
                        🤖
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="message-bubble" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                          {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '85%' }}>
                      <div className="message-bubble">{msg.content}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="message ai">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{
                      width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.875rem'
                    }}>
                      🤖
                    </div>
                    <div className="message-bubble" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '0.85rem 1.25rem' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: '50%', background: '#6366f1',
                          animation: `pulse 1.2s ease ${i * 0.2}s infinite`
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Mobile Swipeable Quick Prompts (visible only on mobile directly above input) */}
            <div className="ai-mobile-quick-prompts">
              {SUGGESTED_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="ai-quick-pill"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="chat-input-container ai-input-box">
              <input
                type="text"
                className="chat-input ai-text-input"
                placeholder="Ask MANARA AI about properties, rent, dues..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="btn btn-primary ai-send-btn"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
              >
                ➤
              </button>
            </div>
          </div>

          {/* Desktop Suggestions Sidebar (Hidden on mobile) */}
          <div className="ai-page-sidebar">
            <div className="card" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ padding: '0.85rem 1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>💡 Suggested Queries</h3>
              </div>
              <div className="card-body" style={{ padding: '0.75rem', overflowY: 'auto', flex: 1 }}>
                {SUGGESTED_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="ai-sidebar-query-btn"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Info Card */}
            <div className="card" style={{ padding: '1rem', flexShrink: 0 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>🔒 Powered by Gemini</div>
                <div>Real-time access to all your property, tenant, lease, payment, and maintenance data.</div>
                <div style={{ marginTop: '0.45rem', color: 'var(--primary-light)', fontSize: '0.72rem' }}>
                  Live API connection active.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
