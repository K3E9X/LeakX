// Top sections: Nav + Hero (search + result + terminal)
const { useState, useEffect, useRef, useMemo, useContext } = React;

function Nav() {
  const { t, lang, setLang } = useContext(window.I18nContext);
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="#top" aria-label="LeakX">
          <span className="brand-mark"><window.Icon.logo/></span>
          <span><b>Leak</b><span className="brand-x">X</span></span>
        </a>
        <nav className="nav-links" aria-label="primary">
          <a className="nav-link" href="#product">{t.nav.product}</a>
          <a className="nav-link" href="#sources">{t.nav.sources}</a>
          <a className="nav-link" href="#pricing">{t.nav.pricing}</a>
          <a className="nav-link" href="#sov">{t.nav.sovereignty}</a>
          <a className="nav-link" href="Docs.html">{t.nav.docs}</a>
        </nav>
        <div className="nav-right">
          <div className="lang-toggle" role="tablist" aria-label="Language">
            <button className={lang === "fr" ? "on" : ""} onClick={() => setLang("fr")}>FR</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
          <a className="btn btn-ghost" href="Dashboard.html">{t.nav.login}</a>
          <a className="btn btn-primary" href="Signup.html">{t.nav.signup}</a>
        </div>
      </div>
    </header>);

}
window.Nav = Nav;

const SEARCH_TYPES = [
{ id: "email", iconKey: "mail", hintKey: "hint_email" },
{ id: "domain", iconKey: "globe", hintKey: "hint_domain" },
{ id: "username", iconKey: "user", hintKey: "hint_username" },
{ id: "phone", iconKey: "phone", hintKey: "hint_phone" },
{ id: "company", iconKey: "building", hintKey: "hint_company" },
{ id: "ip", iconKey: "network", hintKey: "hint_ip" }];


function SearchCard({ onResult }) {
  const { t, lang } = useContext(window.I18nContext);
  const [type, setType] = useState("email");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  function run(v) {
    const target = (v || value).trim();
    if (!target) return;
    setBusy(true);
    setTimeout(() => {
      const data = window.MOCK_RESULTS[type][lang];
      onResult({ ...data, queriedTarget: target });
      setBusy(false);
    }, 650);
  }

  const examples = window.HINT_EXAMPLES[type] || [];

  return (
    <div className="search-card">
      <div className="search-tabs" role="tablist">
        {SEARCH_TYPES.map((s) => {
          const I = window.Icon[s.iconKey];
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={type === s.id}
              className={"search-tab" + (type === s.id ? " on" : "")}
              onClick={() => {setType(s.id);setValue("");}}>
              
              <I /> {t.hero[s.hintKey]}
            </button>);

        })}
      </div>
      <div className="search-body">
        <div className="search-input-row">
          <input
            className="search-input"
            placeholder={t.hero.placeholder[type]}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {if (e.key === "Enter") run();}}
            aria-label={t.hero[SEARCH_TYPES.find((s) => s.id === type).hintKey]} />
          
          <button className="btn btn-primary btn-lg" onClick={() => run()} disabled={busy}>
            {busy ? "…" : <React.Fragment><window.Icon.search style={{ width: 14, height: 14 }} /> {t.hero.cta_scan}</React.Fragment>}
          </button>
        </div>
        <div className="search-hints">
          <span style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)", alignSelf: "center", marginRight: 4 }}>
            {t.hero.try_examples}
          </span>
          {examples.map((ex) =>
          <button key={ex} className="hint-chip" onClick={() => {setValue(ex);run(ex);}}>{ex}</button>
          )}
        </div>
      </div>
    </div>);

}
window.SearchCard = SearchCard;

function ResultPanel({ result }) {
  const { t, lang } = useContext(window.I18nContext);
  if (!result) return null;
  const sum = result.summary;
  return (
    <div className="result">
      <div className="result-head">
        <div className="target mono">
          {lang === "fr" ? "Cible :" : "Target:"} <em>{result.queriedTarget || result.target}</em>
        </div>
        <div className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
          {lang === "fr" ? "Scan terminé en 0.42s" : "Scan completed in 0.42s"}
        </div>
      </div>
      <div className="result-summary">
        <div className="rs crit">
          <div className="rs-label">{lang === "fr" ? "Fuites" : "Leaks"}</div>
          <div className="rs-value">{sum.breaches}</div>
        </div>
        <div className="rs warn">
          <div className="rs-label">{lang === "fr" ? "Stealer logs" : "Stealer logs"}</div>
          <div className="rs-value">{sum.stealer}</div>
        </div>
        <div className="rs">
          <div className="rs-label">Telegram</div>
          <div className="rs-value">{sum.telegram}</div>
        </div>
        <div className="rs">
          <div className="rs-label">{lang === "fr" ? "Sévérité" : "Severity"}</div>
          <div className="rs-value" style={{ fontSize: 18, marginTop: 6 }}>{sum.severity}</div>
        </div>
      </div>
      <div className="result-rows">
        {result.rows.map((r, i) =>
        <div key={i} className="rr">
            <div className="rr-date">{r.date}</div>
            <div className="rr-name">{r.tag === "blur" ? <span style={{ filter: "blur(4px)" }}>{r.name}</span> : r.name}</div>
            <div className={"rr-tag " + r.tag}>{r.tagLabel}</div>
          </div>
        )}
      </div>
    </div>);

}
window.ResultPanel = ResultPanel;

function Terminal() {
  const { t, lang } = useContext(window.I18nContext);
  const baseFeed = window.TERMINAL_FEED[lang];
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 3000);
    return () => clearInterval(id);
  }, []);

  // rotate visible feed so it "breathes"
  const feed = useMemo(() => {
    const out = [];
    for (let i = 0; i < 9; i++) {
      out.push(baseFeed[(i + tick) % baseFeed.length]);
    }
    return out;
  }, [tick, baseFeed]);

  return (
    <div className="terminal" aria-label="Live leak feed">
      <div className="terminal-head">
        <span className="dots"><span></span><span></span><span></span></span>
        <span style={{ marginLeft: 6 }}>{t.terminal.title}</span>
        <span style={{ marginLeft: "auto", color: "var(--ok)" }}>● live</span>
      </div>
      <div className="terminal-body">
        {feed.map((row, i) =>
        <div className="term-line" key={i + "-" + tick}>
            <span className="term-time">{i === 0 ? lang === "fr" ? "à l'instant" : "just now" : row.time}</span>
            <span className={"term-sev " + row.sev}>{row.sev.toUpperCase()}</span>
            <span className="term-text">
              {row.text.map((seg, k) =>
            typeof seg === "string" ?
            <span key={k}>{seg}</span> :
            <span key={k} className="muted">{seg.mute}</span>
            )}
            </span>
            <span className="term-src">{row.src}</span>
          </div>
        )}
      </div>
    </div>);

}
window.Terminal = Terminal;

function Hero() {
  const { heroVariant } = useContext(window.I18nContext);
  if (heroVariant === "counter") return <window.HeroCounter/>;
  if (heroVariant === "map") return <window.HeroMap/>;
  if (heroVariant === "terminal") return <window.HeroTerminal/>;
  return <HeroSearch/>;
}
window.Hero = Hero;

function HeroSearch() {
  const { t } = useContext(window.I18nContext);
  const [result, setResult] = useState(null);

  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero-grid">
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
            <SearchCard onResult={setResult} />
            {result && <ResultPanel result={result} />}
            <div className="hero-trust">
              <span><window.Icon.shield /> {t.hero.trust_1}</span>
              <span><window.Icon.shield /> {t.hero.trust_2}</span>
              <span><window.Icon.bolt /> {t.hero.trust_3}</span>
              <span><window.Icon.lock /> {t.hero.trust_4}</span>
            </div>
          </div>
          <div>
            <Terminal />
          </div>
        </div>
      </div>
    </section>);

}
window.HeroSearch = HeroSearch;