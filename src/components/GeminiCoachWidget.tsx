import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import {
  AthleteContext,
  ChatMessage,
  askGeminiCoach,
} from '@/lib/ai/geminiCoach';

function renderFormattedMessage(text: string) {
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} style={{ height: '0.2rem' }} />;
        }

        // Heading: starts with # or ## or ###
        if (trimmed.startsWith('#')) {
          const cleanHeading = trimmed.replace(/^#+\s*/, '');
          return (
            <div
              key={lIdx}
              style={{
                fontWeight: 800,
                color: 'var(--accent-neon)',
                fontSize: '0.85rem',
                marginTop: lIdx > 0 ? '0.35rem' : 0,
                marginBottom: '0.1rem',
              }}
            >
              {cleanHeading}
            </div>
          );
        }

        // Bullet item: starts with -, *, or •
        const isBullet = /^[-\*•]\s+/.test(trimmed);
        const contentText = isBullet ? trimmed.replace(/^[-\*•]\s+/, '') : trimmed;

        // Split text by bold markers **...**
        const parts = contentText.split(/(\*\*[^*]+\*\*)/g);
        const formattedParts = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const inner = part.slice(2, -2);
            return (
              <strong key={pIdx} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {inner}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        });

        if (isBullet) {
          return (
            <div
              key={lIdx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
                paddingLeft: '0.15rem',
                lineHeight: 1.45,
              }}
            >
              <span style={{ color: 'var(--accent-neon)', fontWeight: 800 }}>•</span>
              <div style={{ flex: 1 }}>{formattedParts}</div>
            </div>
          );
        }

        return (
          <div key={lIdx} style={{ lineHeight: 1.5 }}>
            {formattedParts}
          </div>
        );
      })}
    </div>
  );
}

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
      text: `Halo! Saya rkbot.

Saya memantau beban latihan Anda (ACWR: ${athleteContext.acwrRatio}), kesiapan fisik (${athleteContext.readinessScore}/100), dan pemulihan otot kaki (${athleteContext.lastLegsHoursAgo < 900 ? `${athleteContext.lastLegsHoursAgo} jam` : '> 72 jam'}).

Ada yang bisa saya bantu terkait jadwal latihan, intensitas lari, atau pemulihan otot Anda?`,
      timestamp: 'Baru saja',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    'Analisis beban latihan saya hari ini',
    'Bolehkah saya lari besok setelah leg day?',
    'Rekomendasi nutrisi pemulihan pasca workout',
    'Cara eksekusi Norwegian 4x4 yang benar',
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
            zIndex: 'var(--z-floating)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            border: '1.5px solid var(--accent-neon)',
            color: 'var(--text-primary)',
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
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              rkbot
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Pelatih Atletik Hibrida
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
          className="coach-panel"
          style={{
            position: 'fixed',
            bottom: '1rem',
            right: '1rem',
            zIndex: 'var(--z-chat)',
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
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    rkbot
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(204, 255, 0, 0.12)',
                      color: 'var(--accent-neon)',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-neon)' }} />
                    Online
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ACWR: <strong style={{ color: 'var(--text-primary)' }}>{athleteContext.acwrRatio}</strong> &bull; Readiness: <strong style={{ color: 'var(--text-primary)' }}>{athleteContext.readinessScore}</strong>
                </div>
              </div>
            </div>

            {/* Actions: Clear, Minimize */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => setMessages([messages[0]])}
                title="Bersihkan Percakapan"
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
                title="Kecilkan Pelatih"
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
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {renderFormattedMessage(msg.text)}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', padding: '0 0.2rem' }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <Sparkles size={14} style={{ color: 'var(--accent-neon)', animation: 'spin 1.5s linear infinite' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>rkbot sedang berpikir...</span>
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
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.75rem',
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
                  e.currentTarget.style.color = 'var(--text-primary)';
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
              placeholder="Tanya rkbot seputar jadwal, lari, pemulihan..."
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
                color: 'var(--text-primary)',
                padding: '0.6rem 0.85rem',
                fontSize: '0.85rem',
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
                color: inputValue.trim() ? 'var(--text-inverse)' : 'var(--text-muted)',
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



