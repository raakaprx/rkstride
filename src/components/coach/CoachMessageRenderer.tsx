export function renderFormattedMessage(text: string) {
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
