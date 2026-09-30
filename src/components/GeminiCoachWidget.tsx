import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Key,
  Trash2,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  AthleteContext,
  ChatMessage,
  askGeminiCoach,
  getStoredApiKey,
  saveStoredApiKey,
} from '@/lib/ai/geminiCoach';

interface GeminiCoachWidgetProps {
  athleteContext: AthleteContext;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
}

export const GeminiCoachWidget: React.FC<GeminiCoachWidgetProps> = ({
  athleteContext,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Halo! Saya **RKStride AI Athletic Coach** yang ditenagai oleh Google Gemini.

Saya otomatis memantau rasio beban latihan Anda (**ACWR: ${athleteContext.acwrRatio}**), kesiapan fisik (${athleteContext.readinessScore}/100), dan status pemulihan otot kaki (${athleteContext.lastLegsHoursAgo < 900 ? `${athleteContext.lastLegsHoursAgo}h` : '> 72h'}).

Ada yang bisa saya bantu terkait jadwal, intensitas lari, atau pemulihan otot Anda hari ini?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load existing API key on mount
  useEffect(() => {
    const key = getStoredApiKey();
    setHasApiKey(Boolean(key));
    setApiKeyInput(key);
  }, []);

  // Handle external prompt passed e.g. from PostWorkoutDebriefModal
  useEffect(() => {
    if (externalPrompt) {
      setIsOpen(true);
      handleSendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSaveKey = () => {
    saveStoredApiKey(apiKeyInput);
    setHasApiKey(Boolean(apiKeyInput.trim()));
    setShowKeyModal(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const reply = await askGeminiCoach(text, messages, athleteContext);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `Maaf, terjadi kendala saat memproses: ${err.message || 'Gagal terhubung'}. Silakan coba lagi.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    '📊 Analisis beban latihan saya hari ini',
    '🦵 Bolehkah saya lari besok setelah leg day?',
    '🥗 Rekomendasi nutrisi pemulihan pasca workout',
    '⚡ Cara eksekusi Norwegian 4x4 yang benar',
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 45,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            border: '1.5px solid var(--accent-neon)',
            color: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(204, 255, 0, 0.15)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--accent-neon-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              Gemini AI Coach
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              Live Telemetry Connected
            </div>
          </div>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-success)',
            }}
          />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            zIndex: 50,
            width: '92vw',
            maxWidth: '430px',
            height: '620px',
            maxHeight: '85vh',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-elevation-3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(204, 255, 0, 0.1)',
                  border: '1px solid var(--accent-neon)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-neon)',
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>
                    RKStride AI Coach
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-full)',
                      background: hasApiKey ? 'var(--color-success-bg)' : 'rgba(204, 255, 0, 0.1)',
                      color: hasApiKey ? 'var(--color-success)' : 'var(--accent-neon)',
                      fontWeight: 700,
                    }}
                  >
                    {hasApiKey ? 'Gemini 2.5 Live' : 'Smart Offline'}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  ACWR: <strong style={{ color: '#FFF' }}>{athleteContext.acwrRatio}</strong> &bull; Readiness: <strong style={{ color: '#FFF' }}>{athleteContext.readinessScore}</strong>
                </div>
              </div>
            </div>

            {/* Actions: Settings, Clear, Minimize */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => setShowKeyModal((prev) => !prev)}
                title="Configure Google Gemini API Key"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: hasApiKey ? 'var(--color-success)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Key size={16} />
              </button>

              <button
                onClick={() => setMessages([messages[0]])}
                title="Clear Chat History"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Trash2 size={16} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Coach"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Inline API Key Config Box (Collapsible) */}
          {showKeyModal && (
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '0.85rem 1rem',
                borderBottom: '1px solid var(--border-default)',
                fontSize: '0.78rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: '#FFFFFF' }}>Google Gemini API Key</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'var(--accent-neon)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontSize: '0.72rem',
                  }}
                >
                  Get Free Key <ExternalLink size={10} />
                </a>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                Enter your Google AI Studio API key to enable live generation. Key is stored locally in your browser.
              </p>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
                    padding: '0.35rem 0.55rem',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSaveKey}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-neon)',
                    color: '#09090b',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      background: isUser ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                      border: isUser ? '1px solid var(--border-hover)' : '1px solid var(--border-default)',
                      borderLeft: !isUser ? '3px solid var(--accent-neon)' : undefined,
                      padding: '0.75rem 0.95rem',
                      borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', padding: '0 0.2rem' }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <Sparkles size={14} style={{ color: 'var(--accent-neon)', animation: 'spin 1.5s linear infinite' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Coach is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                disabled={isLoading}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-neon)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div
            style={{
              padding: '0.75rem',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              placeholder="Ask coach about ACWR, running, recovery..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              style={{
                flex: 1,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: '#FFFFFF',
                padding: '0.6rem 0.85rem',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: inputValue.trim() ? 'var(--accent-neon)' : 'var(--bg-surface-elevated)',
                color: inputValue.trim() ? '#09090b' : 'var(--text-muted)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                transition: 'var(--transition-fast)',
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
