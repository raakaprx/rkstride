import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { DailyLog } from '@/types/workout';
import { calculateACWR } from '@/lib/engine/workload';
import { Button } from './ui/Button';

interface TrendsDashboardCardProps {
  history: DailyLog[];
  onNavigateToLogger?: () => void;
}

export const TrendsDashboardCard: React.FC<TrendsDashboardCardProps> = ({ history, onNavigateToLogger }) => {
  // Compute rolling ACWR for each day in history (chronological order)
  const chartData = useMemo(() => {
    // Clone and reverse so oldest is first
    const chronoHistory = [...history].reverse();
    const result = [];

    for (let i = 0; i < chronoHistory.length; i++) {
      // Sub-slice representing up to day i
      const subSlice = chronoHistory.slice(0, i + 1).reverse();
      const acwr = calculateACWR(subSlice);
      const log = chronoHistory[i];

      result.push({
        tanggal: log.tanggal,
        loadScore: log.totalLoadScore,
        acuteLoad: acwr.acuteLoad,
        chronicLoad: acwr.chronicLoad,
        ratio: acwr.ratio,
        status: acwr.status,
      });
    }

    return result;
  }, [history]);

  // Overall current ACWR
  const currentACWR = useMemo(() => calculateACWR(history), [history]);

  // SVG Chart Dimensions
  const svgWidth = 720;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Max scale for ACWR ratio (default up to 2.0)
  const maxRatio = Math.max(2.0, ...chartData.map((d) => d.ratio));

  // Points for SVG path
  const points = chartData.map((d, idx) => {
    const x = padding.left + (idx / Math.max(1, chartData.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - (d.ratio / maxRatio) * graphHeight;
    return { x, y, data: d };
  });

  const pathD = points.length > 0
    ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
    : '';

  // Area under path
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${padding.top + graphHeight} L ${points[0].x},${padding.top + graphHeight} Z`
    : '';

  // Horizontal threshold levels (single 1.4 guardrail)
  const ySweetMin = padding.top + graphHeight - (0.8 / maxRatio) * graphHeight;
  const yDanger = padding.top + graphHeight - (1.4 / maxRatio) * graphHeight;

  return (
    <div
      className="card-mobile"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-elevation-1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(204, 255, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon)',
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Tren Beban Kerja &amp; Rasio ACWR (28 Hari)
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pemantauan beban akut (7 hari) terhadap beban kronis (28 hari) secara longitudinal
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(204, 255, 0, 0.25)', border: '1px solid var(--accent-neon)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Sweet Spot (0.8 - 1.4)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(239, 68, 68, 0.3)', border: '1px solid var(--color-danger)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Bahaya (&gt; 1.4)</span>
          </div>
        </div>
      </div>

      {/* Empty-history state: no sessions logged yet */}
      {history.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Belum ada data latihan
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
            Catat sesi pertama Anda di tab Workout &amp; Workload. Grafik tren ACWR akan terbentuk setelah Anda mencatat latihan (minimal 21 hari untuk rasio yang bermakna).
          </div>
          {onNavigateToLogger && (
            <Button variant="primary" onClick={onNavigateToLogger} style={{ marginTop: '0.25rem' }}>
              Catat sesi pertama
            </Button>
          )}
        </div>
      ) : (
      <>
      {/* SVG Interactive Chart Canvas */}
      <div
        className="trends-chart"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          position: 'relative',
          overflowX: 'auto',
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', minWidth: '550px', height: 'auto', display: 'block' }}
        >
          {/* Sweet Spot Band (0.8 - 1.4) */}
          <rect
            x={padding.left}
            y={yDanger}
            width={graphWidth}
            height={Math.max(0, ySweetMin - yDanger)}
            fill="rgba(204, 255, 0, 0.06)"
          />

          {/* Horizontal Reference Lines */}
          <line
            x1={padding.left}
            y1={ySweetMin}
            x2={svgWidth - padding.right}
            y2={ySweetMin}
            stroke="rgba(204, 255, 0, 0.3)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text x={svgWidth - padding.right + 4} y={ySweetMin + 3} style={{ fill: 'var(--text-muted)' }} fontSize="12">
            0.8
          </text>

          <line
            x1={padding.left}
            y1={yDanger}
            x2={svgWidth - padding.right}
            y2={yDanger}
            stroke="rgba(239, 68, 68, 0.4)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text x={svgWidth - padding.right + 4} y={yDanger + 3} style={{ fill: 'var(--color-danger)' }} fontSize="12">
            1.4
          </text>

          {/* Area fill */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#acwr-gradient)"
              opacity="0.25"
            />
          )}

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="acwr-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-neon)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--accent-neon)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* ACWR Trend Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              style={{ stroke: 'var(--accent-neon)' }}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={idx === points.length - 1 ? 4 : 2}
              fill={idx === points.length - 1 ? 'var(--text-primary)' : 'var(--accent-neon)'}
              style={{ stroke: 'var(--bg-primary)' }}
              strokeWidth="1.5"
            />
          ))}

          {/* X-axis date labels (every 7 days) */}
          {points.filter((_, idx) => idx % 7 === 0 || idx === points.length - 1).map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={svgHeight - 10}
              style={{ fill: 'var(--text-muted)' }}
              fontSize="12"
              textAnchor="middle"
            >
              {p.data.tanggal.slice(5)}
            </text>
          ))}
        </svg>
      </div>

      {/* Mobile-only scroll hint for the wide chart */}
      <div
        className="scroll-hint-mobile"
        style={{ display: 'none', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}
      >
        Geser grafik ke samping untuk melihat seluruh 28 hari
      </div>

      {/* Summary Metrics Bar: Acute vs Chronic */}
      <div
        className="trends-metrics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
          gap: '0.75rem',
        }}
      >
        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Beban Akut Terkini (7 Hari)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {currentACWR.acuteLoad} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pts/hari</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Kelelahan sistemik jangka pendek (fatigue)
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Beban Kronis Terkini (28 Hari)
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {currentACWR.chronicLoad} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pts/hari</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-neon)', marginTop: '0.2rem' }}>
            Tingkat kebugaran dasar struktural (fitness)
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Rasio ACWR Saat Ini
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: currentACWR.status === 'sweet_spot' ? 'var(--accent-neon)' : currentACWR.status === 'warning' ? 'var(--color-warning)' : currentACWR.status === 'danger' ? 'var(--color-danger)' : 'var(--color-info)' }}>
            {currentACWR.ratio}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', textTransform: 'capitalize' }}>
            Zona: {currentACWR.status.replace('_', ' ')}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};




