// Dashboard widgets: extra icons, sparkline, donut, chart, KPI, etc.
const { useState, useEffect, useRef, useMemo, useContext } = React;

// Extra icons that complement src/icons.jsx
Object.assign(window.Icon, {
  grid: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/>
      <path d="M10 21a2 2 0 0 0 4 0"/>
    </svg>
  ),
  alert: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3 2 21h20L12 3z"/>
      <path d="M12 10v4M12 17.5v.01"/>
    </svg>
  ),
  plug: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 2v6M15 2v6"/>
      <rect x="6" y="8" width="12" height="6" rx="2"/>
      <path d="M12 14v4a4 4 0 0 1-4 4"/>
    </svg>
  ),
  key: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="8" cy="15" r="4"/>
      <path d="m10.8 12 9.2-9M16 5l3 3M14 7l3 3"/>
    </svg>
  ),
  users: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="8" r="3.5"/>
      <path d="M2 21c0-3.5 3-6.5 7-6.5s7 3 7 6.5"/>
      <circle cx="17" cy="6" r="2.5"/>
      <path d="M16 13c3 0 6 2 6 5"/>
    </svg>
  ),
  cog: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
    </svg>
  ),
  refresh: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 7M21 3v4h-4M21 12a9 9 0 0 1-15 6.7L3 17M3 21v-4h4"/>
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
    </svg>
  ),
  filter: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 5h16l-7 9v6l-2-1v-5L4 5z"/>
    </svg>
  ),
  ext: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 4h6v6M20 4 10 14M5 5h5M5 14v5h14"/>
    </svg>
  ),
  back: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m15 6-6 6 6 6"/>
    </svg>
  ),
  three_dots: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>
    </svg>
  ),
  copy: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="8" y="8" width="13" height="13" rx="2"/>
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
    </svg>
  ),
  send: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m4 12 17-9-9 18-2-7-6-2z"/>
    </svg>
  ),
});

// ---------- Sparkline ----------
function Sparkline({ data, color = "var(--accent-hi)", width = 70, height = 24 }) {
  if (!data || !data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - ((v - min) / range) * (height - 2) - 1}`).join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: "block"}}>
      <path d={area} fill={color} opacity="0.15"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
window.Sparkline = Sparkline;

// ---------- KPI card ----------
function KPI({ label, value, delta, trend, spark }) {
  const trendColor = trend === "up" ? "var(--critical)" : trend === "down" ? "var(--ok)" : "var(--accent-hi)";
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value mono">{value}</div>
      <div className={"kpi-delta " + (trend || "neutral")}>
        {trend === "up" ? "▲" : trend === "down" ? "▼" : "·"} {delta}
      </div>
      {spark && (
        <div className="kpi-spark">
          <Sparkline data={spark} color={trendColor} width={84} height={28}/>
        </div>
      )}
    </div>
  );
}
window.KPI = KPI;

// ---------- Donut ----------
function Donut({ value, max = 100, size = 140, stroke = 12, color }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = c * (1 - pct);
  const trackColor = "var(--surface-3)";
  const gradId = "donut-grad-" + value;
  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color || "var(--warn)"}/>
          <stop offset="100%" stopColor={color || "var(--critical)"}/>
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke}/>
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
      />
    </svg>
  );
}
window.Donut = Donut;

// ---------- Exposure score block ----------
function ExposureScore() {
  const e = window.EXPOSURE;
  const tierColor = e.tier === "high" ? "var(--critical)" : e.tier === "med" ? "var(--warn)" : "var(--ok)";
  const tierLabel = e.tier === "high" ? "Critique" : e.tier === "med" ? "Modérée" : "Faible";
  return (
    <div className="card score-card">
      <div className="score-donut">
        <Donut value={e.score} color={tierColor}/>
        <div className="center">
          <div>
            <span className="v">{e.score}</span>
            <span className="lbl">Score d'exposition</span>
          </div>
        </div>
      </div>
      <div className="score-side">
        <span className={"score-tier " + e.tier}>
          <span style={{width: 5, height: 5, borderRadius: "50%", background: "currentColor", boxShadow: "0 0 4px currentColor"}}></span>
          Exposition {tierLabel}
        </span>
        <h2>{window.ORG.name} · {window.ORG.domain}</h2>
        <p>Score recalculé toutes les 15 min sur l'ensemble des sources. {e.delta < 0 ? `▼ ${Math.abs(e.delta)} pts` : `▲ ${e.delta} pts`} sur les 7 derniers jours.</p>
        <div className="score-breakdown">
          {e.breakdown.map((b, i) => (
            <div className={"score-row " + b.sev} key={i}>
              <span className="lbl">{b.label}</span>
              <span className="bar"><span style={{width: b.value + "%"}}></span></span>
              <span className="v mono">{b.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.ExposureScore = ExposureScore;

// ---------- Timeline chart ----------
function TimelineChart() {
  const data = window.TIMELINE;
  const W = 760, H = 220, pad = { t: 20, r: 16, b: 28, l: 36 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const max = Math.max(...data.map(d => Math.max(d.cred, d.ment))) * 1.1;
  const xs = (i) => pad.l + (i / (data.length - 1)) * cw;
  const ys = (v) => pad.t + ch - (v / max) * ch;

  const credPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(d.cred).toFixed(1)}`).join(" ");
  const credArea = `${credPath} L ${xs(data.length - 1).toFixed(1)} ${ys(0).toFixed(1)} L ${xs(0).toFixed(1)} ${ys(0).toFixed(1)} Z`;
  const mentPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(d.ment).toFixed(1)}`).join(" ");

  // Y axis ticks
  const ticks = 4;
  const tickVals = Array.from({length: ticks + 1}, (_, i) => Math.round((max / ticks) * i));

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="credGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* y grid */}
        {tickVals.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeDasharray="2 4"/>
            <text x={pad.l - 8} y={ys(v) + 4} fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--text-faint)" textAnchor="end">{v}</text>
          </g>
        ))}
        {/* x labels (5 ticks) */}
        {[0, 7, 14, 21, 27].map(i => (
          <text key={i} x={xs(i)} y={H - 8} fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--text-faint)" textAnchor="middle">J−{27 - i}</text>
        ))}
        {/* cred area */}
        <path d={credArea} fill="url(#credGrad)"/>
        <path d={credPath} fill="none" stroke="var(--accent-hi)" strokeWidth="1.8" strokeLinejoin="round"/>
        {/* ment line */}
        <path d={mentPath} fill="none" stroke="#fbbf24" strokeWidth="1.6" strokeDasharray="4 3" strokeLinejoin="round"/>
        {/* highlight spike */}
        <circle cx={xs(17)} cy={ys(data[17].cred)} r="4" fill="var(--accent-hi)" stroke="var(--bg-2)" strokeWidth="2"/>
        <text x={xs(17)} y={ys(data[17].cred) - 10} fontSize="10" fontFamily="JetBrains Mono, monospace" fill="var(--accent-hi)" textAnchor="middle">spike Lumma</text>
      </svg>
      <div className="chart-legend">
        <div className="li"><span className="sw" style={{background: "var(--accent-hi)"}}></span>Identifiants exposés / jour</div>
        <div className="li"><span className="sw" style={{background: "#fbbf24"}}></span>Mentions marque / jour</div>
      </div>
    </div>
  );
}
window.TimelineChart = TimelineChart;

// ---------- Alert row ----------
function AlertRow({ a, onClick }) {
  const sevClass = a.sev || "med";
  return (
    <div className="alert-row" onClick={onClick}>
      <div className={"alert-ico " + sevClass}>
        <window.Icon.alert/>
      </div>
      <div className="alert-body">
        <div className="title">{a.title}</div>
        <div className="meta">{a.source}</div>
      </div>
      <div className="alert-time">{a.time}</div>
    </div>
  );
}
window.AlertRow = AlertRow;

// ---------- SevPill ----------
function SevPill({ sev, label }) {
  const cls = sev || "info";
  const labels = { high: "Critique", med: "Modéré", low: "Faible", crit: "Critique", info: "Info" };
  return (
    <span className={"sev-pill " + cls}>
      <span className="d"></span>{label || labels[sev] || sev}
    </span>
  );
}
window.SevPill = SevPill;

function StatusPill({ status }) {
  const labels = { open: "Ouvert", progress: "En cours", resolved: "Résolu" };
  return <span className={"status-pill " + status}><span className="d"></span>{labels[status]}</span>;
}
window.StatusPill = StatusPill;

// ---------- Source icon picker ----------
function srcIcon(name) {
  const map = { stealer: "stealer", telegram: "telegram", dark: "dark", ransom: "ransom", paste: "paste", combo: "combo", brand: "brand" };
  return window.Icon[map[name]] || window.Icon.alert;
}
window.srcIcon = srcIcon;
