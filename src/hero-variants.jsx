// Hero variants — exposed via Tweaks
// Variant B: Counter · C: France map · D: Terminal full-bleed
// (Variant A "Search" is the original Hero in sections-top.jsx)

// ----- shared bits -----
function useTicker(start, intervalMs = 700) {
  const [n, setN] = useState(start);
  useEffect(() => {
    const id = setInterval(() => {
      setN(x => x + Math.floor(Math.random() * 4) + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, []);
  return n;
}

function useCountUp(target, dur = 1800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf;
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.floor(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

// ============== Variant B: Counter ==============
function HeroCounter() {
  const { t, lang } = useContext(window.I18nContext);
  const TARGET = 21438219;
  const animated = useCountUp(TARGET);
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setExtra(x => x + Math.floor(Math.random() * 4) + 1);
    }, 700);
    return () => clearInterval(id);
  }, []);
  const display = animated + extra;
  const [result, setResult] = useState(null);
  const isFR = lang === "fr";

  return (
    <section className="hero hero-counter" id="top">
      <div className="container" style={{textAlign: "center", position: "relative"}}>
        <div className="hero-eyebrow" style={{margin: "0 auto 36px", display: "inline-flex"}}>
          <span className="dot"></span>
          <span>{t.hero.eyebrow}</span>
        </div>

        <div className="counter-mega mono">
          {display.toLocaleString(isFR ? "fr-FR" : "en-US")}
        </div>
        <h1 className="counter-headline">
          {isFR
            ? <>identifiants français <span className="accent">déjà compromis</span></>
            : <>French credentials <span className="accent">already compromised</span></>}
        </h1>
        <p className="lede" style={{margin: "0 auto 40px", textAlign: "center"}}>
          {isFR
            ? "Volumétrie agrégée sur les 90 derniers jours — stealer logs, forums dark web FR, canaux Telegram, ransomware leak sites. Votre exposition est-elle quelque part dans ce nombre ?"
            : "Aggregated volume over the last 90 days — stealer logs, FR dark web forums, Telegram channels, ransomware leak sites. Is your exposure somewhere in this number?"}
        </p>

        <div style={{maxWidth: 680, margin: "0 auto"}}>
          <window.SearchCard onResult={setResult}/>
          {result && <window.ResultPanel result={result}/>}
        </div>

        <div className="counter-mini-stats">
          <div><span className="mono">{(482106).toLocaleString(isFR ? "fr-FR" : "en-US")}</span><br/>{isFR ? "stealer logs" : "stealer logs"}</div>
          <div><span className="mono">{(1846).toLocaleString(isFR ? "fr-FR" : "en-US")}</span><br/>{isFR ? "sources actives" : "active sources"}</div>
          <div><span className="mono">{(4117).toLocaleString(isFR ? "fr-FR" : "en-US")}</span><br/>{isFR ? "canaux Telegram FR" : "FR Telegram channels"}</div>
          <div><span className="mono">{(112)}</span><br/>{isFR ? "groupes ransomware" : "ransomware groups"}</div>
        </div>
      </div>
    </section>
  );
}
window.HeroCounter = HeroCounter;

// ============== Variant C: France map ==============
const HOTSPOTS = [
  { x: 100, y: 70,  label: "Paris",     count: 14238, sev: "high" },
  { x: 70,  y: 130, label: "Bordeaux",  count: 1841,  sev: "med" },
  { x: 140, y: 100, label: "Lyon",      count: 4912,  sev: "high" },
  { x: 130, y: 145, label: "Marseille", count: 3287,  sev: "med" },
  { x: 95,  y: 168, label: "Toulouse",  count: 1402,  sev: "med" },
  { x: 145, y: 70,  label: "Strasbourg",count: 892,   sev: "low" },
  { x: 80,  y: 90,  label: "Rennes",    count: 671,   sev: "low" },
  { x: 110, y: 105, label: "Clermont",  count: 412,   sev: "low" },
  { x: 156, y: 130, label: "Nice",      count: 1129,  sev: "med" },
  { x: 120, y: 55,  label: "Lille",     count: 2384,  sev: "med" },
];

function HeroMap() {
  const { t, lang } = useContext(window.I18nContext);
  const [active, setActive] = useState(0);
  const [result, setResult] = useState(null);
  const isFR = lang === "fr";

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % HOTSPOTS.length), 1800);
    return () => clearInterval(id);
  }, []);

  const cur = HOTSPOTS[active];
  const total = HOTSPOTS.reduce((s, h) => s + h.count, 0);

  return (
    <section className="hero hero-map" id="top">
      <div className="container">
        <div className="hero-map-grid">
          <div className="map-panel">
            <div className="map-head">
              <span className="dot"></span>
              <span>{isFR ? "Carte d'exposition · live" : "Exposure map · live"}</span>
              <span className="mono" style={{marginLeft: "auto", color: "var(--text-mute)"}}>
                {total.toLocaleString(isFR ? "fr-FR" : "en-US")} {isFR ? "victimes / 90j" : "victims / 90d"}
              </span>
            </div>
            <div className="map-svg-wrap">
              <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <radialGradient id="map-halo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(150,88,247,0.35)"/>
                    <stop offset="60%" stopColor="rgba(150,88,247,0.08)"/>
                    <stop offset="100%" stopColor="rgba(150,88,247,0)"/>
                  </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="92" fill="url(#map-halo)"/>
                {/* France silhouette */}
                <path
                  d="M88 24 L112 26 L130 36 L142 56 L160 74 L170 96 L162 118 L168 142 L150 156 L132 172 L108 176 L86 170 L62 174 L48 156 L40 134 L34 110 L42 86 L36 64 L52 46 L70 34 Z"
                  fill="rgba(150,88,247,0.06)"
                  stroke="rgba(150,88,247,0.5)"
                  strokeWidth="1.2"
                />
                {/* Hotspots */}
                {HOTSPOTS.map((h, i) => {
                  const color = h.sev === "high" ? "#fb7185" : h.sev === "med" ? "#fbbf24" : "#a875ff";
                  const isActive = i === active;
                  const r = h.sev === "high" ? 4 : h.sev === "med" ? 3.5 : 2.8;
                  return (
                    <g key={i} onMouseEnter={() => setActive(i)} style={{cursor: "pointer"}}>
                      <circle cx={h.x} cy={h.y} r={r * 2} fill={color} opacity={isActive ? 0.4 : 0.15}>
                        <animate attributeName="r" values={`${r};${r * 3};${r}`} dur="2.4s" repeatCount="indefinite" begin={`${i * 0.25}s`}/>
                        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.25}s`}/>
                      </circle>
                      <circle cx={h.x} cy={h.y} r={r} fill={color} stroke={isActive ? "#fff" : "transparent"} strokeWidth="1"/>
                    </g>
                  );
                })}
              </svg>

              <div className="map-callout">
                <div className="mono" style={{fontSize: 11, color: "var(--text-faint)"}}>● {cur.label}</div>
                <div className="mono callout-num" style={{color: cur.sev === "high" ? "#fb7185" : cur.sev === "med" ? "#fbbf24" : "var(--accent-hi)"}}>
                  {cur.count.toLocaleString(isFR ? "fr-FR" : "en-US")}
                </div>
                <div className="mono" style={{fontSize: 10, color: "var(--text-mute)"}}>{isFR ? "identifiants / 90j" : "credentials / 90d"}</div>
              </div>
            </div>
            <div className="map-legend">
              <span><span className="sw" style={{background: "#fb7185"}}></span>{isFR ? "Critique" : "Critical"}</span>
              <span><span className="sw" style={{background: "#fbbf24"}}></span>{isFR ? "Modéré" : "Medium"}</span>
              <span><span className="sw" style={{background: "#a875ff"}}></span>{isFR ? "Faible" : "Low"}</span>
            </div>
          </div>

          <div>
            <div className="hero-eyebrow">
              <span className="dot"></span>
              <span>{t.hero.eyebrow}</span>
            </div>
            <h1>
              {t.hero.title_a} <br />
              {t.hero.title_b} <span className="accent">{t.hero.title_c}</span>
            </h1>
            <p className="lede">{t.hero.lede}</p>
            <window.SearchCard onResult={setResult}/>
            {result && <window.ResultPanel result={result}/>}
            <div className="hero-trust">
              <span><window.Icon.shield/> {t.hero.trust_1}</span>
              <span><window.Icon.bolt/> {t.hero.trust_3}</span>
              <span><window.Icon.lock/> {t.hero.trust_4}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
window.HeroMap = HeroMap;

// ============== Variant D: Terminal full-bleed ==============
function HeroTerminal() {
  const { t, lang } = useContext(window.I18nContext);
  const [result, setResult] = useState(null);
  const isFR = lang === "fr";

  return (
    <section className="hero hero-terminal" id="top">
      <div className="container">
        <div className="terminal-hero-head">
          <div className="hero-eyebrow" style={{marginBottom: 18}}>
            <span className="dot"></span>
            <span>{t.hero.eyebrow}</span>
          </div>
          <h1>
            {t.hero.title_a}{" "}
            {t.hero.title_b} <span className="accent">{t.hero.title_c}</span>
          </h1>
          <p className="lede" style={{maxWidth: "70ch"}}>{t.hero.lede}</p>
        </div>

        <div className="terminal-full-wrap">
          <window.Terminal/>
          <div className="terminal-glow"></div>
        </div>

        <div className="terminal-cta-row">
          <div style={{maxWidth: 720, width: "100%"}}>
            <window.SearchCard onResult={setResult}/>
            {result && <window.ResultPanel result={result}/>}
          </div>
        </div>
      </div>
    </section>
  );
}
window.HeroTerminal = HeroTerminal;
