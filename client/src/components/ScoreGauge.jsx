// Jauge circulaire SVG du score global sur 100.

const NOTE_COLOR = {
  A: '#16a34a',
  B: '#65a30d',
  C: '#d97706',
  D: '#ea580c',
  E: '#dc2626',
};

export default function ScoreGauge({ total, note }) {
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, total)) / 100;
  const dash = circumference * progress;
  const color = NOTE_COLOR[note] || '#64748b';

  return (
    <div className="gauge">
      <svg viewBox="0 0 200 200" width="200" height="200" aria-label={`Score ${total} sur 100`}>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="16" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 100 100)"
        />
        <text x="100" y="92" textAnchor="middle" className="gauge-value" fill={color}>
          {total}
        </text>
        <text x="100" y="118" textAnchor="middle" className="gauge-unit">
          sur 100
        </text>
      </svg>
      <div className="gauge-note" style={{ background: color }}>
        Note {note}
      </div>
    </div>
  );
}
