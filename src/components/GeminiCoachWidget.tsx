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
import { renderFormattedMessage } from './coach/CoachMessageRenderer';
import { CoachQuickPrompts } from './coach/CoachQuickPrompts';

interface GeminiCoachWidgetProps {
  athleteContext: AthleteContext;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
  isOpenControlled?: boolean;
  onToggleOpen?: (open: boolean) => void;
  hideLauncher?: boolean;
}

export const GeminiCoachWidget: React.FC<GeminiCoachWidgetProps> = ({
  athleteContext,
  externalPrompt,
  onClearExternalPrompt,
  isOpenControlled,
  onToggleOpen,
  hideLauncher = false,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalOpen;
  const setIsOpen = (next: boolean) => {
    setInternalOpen(next);
    if (onToggleOpen) onToggleOpen(next);
  };
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
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : 'Gagal terhubung';
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `Maaf, terjadi kendala saat memproses: ${errText}. Silakan coba lagi.`,
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
      {!isOpen && !hideLauncher && (
        <button
          className="coach-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Buka sesi konsultasi AI Coach rkbot"
          style={{
            position: 'fixed',
            bottom: 'calc(var(--dock-clearance) + 0.5rem)',
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
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} />
          </div>
          <div className="coach-launcher-text" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              rkbot
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Pelatih Atletik Hibrida
            </div>
          </div>
          <span
            className="coach-launcher-text"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-success)',
              flexShrink: 0,
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
                <Sparkles size={14} style={{ color: 'var(--accent-neon)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>rkbot sedang berpikir...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <CoachQuickPrompts
            prompts={quickPrompts}
            onSelectPrompt={(p) => handleSendMessage(p)}
            isLoading={isLoading}
          />

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
              aria-label="Kirim pesan ke rkbot"
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
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
                touchAction: 'manipulation',
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
