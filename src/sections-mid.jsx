// Mid sections: Stats, Sources, How it works, Use cases

function useCountUp(target, dur = 1400) {
  const [v, setV] = useState(0);
  const startTime = useRef(null);
  useEffect(() => {
    let raf;
    function tick(ts) {
      if (!startTime.current) startTime.current = ts;
      const p = Math.min(1, (ts - startTime.current) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.floor(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

function StatNum({ value, format }) {
  const n = useCountUp(value);
  return <span>{format ? format(n) : n.toLocaleString("fr-FR")}</span>;
}

function Stats() {
  const { t, lang } = useContext(window.I18nContext);
  const stats = [
  { label: t.stats.a_label, value: 21438219, delta: "+ 4.2% / 24h" },
  { label: t.stats.b_label, value: 482106, delta: "+ 1 240 / h" },
  { label: t.stats.c_label, value: 1846, delta: lang === "fr" ? "+ 12 cette semaine" : "+ 12 this week" },
  { label: t.stats.d_label, value: 4117, delta: lang === "fr" ? "100% francophone" : "100% French-speaking" }];

  return (
    <section className="section" id="product">
      <div className="container">
        <div className="section-head">
          <span className="kicker">{t.stats.kicker}</span>
          <h2>{t.stats.h}</h2>
          <p className="section-sub">{t.stats.sub}</p>
        </div>
        <div className="stats-row">
          {stats.map((s, i) =>
          <div className="stat" key={i}>
              <div className="stat-label"><span className="live"></span> {s.label}</div>
              <div className="stat-value mono">
                <StatNum value={s.value} format={(n) => n.toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} />
              </div>
              <div className="stat-delta">↗ {s.delta}</div>
            </div>
          )}
        </div>
      </div>
    </section>);

}
window.Stats = Stats;

function Sources() {
  const { t } = useContext(window.I18nContext);
  return (
    <section className="section" id="sources" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="section-head">
          <span className="kicker">{t.sources.kicker}</span>
          <h2>{t.sources.h}</h2>
          <p className="section-sub">{t.sources.sub}</p>
        </div>
        <div className="sources-strip">
          {t.sources.items.map((s, i) => {
            const I = window.Icon[s.ico] || window.Icon.globe;
            return (
              <div className="source-card" key={i}>
                <div className="ico"><I /></div>
                <div className="name">{s.name}</div>
                <div className="meta">{s.meta}</div>
              </div>);

          })}
        </div>
      </div>
    </section>);

}
window.Sources = Sources;

function HowItWorks() {
  const { t } = useContext(window.I18nContext);
  return (
    <section className="section" id="how">
      <div className="container">
        <div className="section-head">
          <span className="kicker">{t.how.kicker}</span>
          <h2>{t.how.h}</h2>
          <p className="section-sub">{t.how.sub}</p>
        </div>
        <div className="steps">
          {t.how.steps.map((s, i) =>
          <div className="step" key={i}>
              <span className="step-num mono">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          )}
        </div>
      </div>
    </section>);

}
window.HowItWorks = HowItWorks;

function UseCases() {
  const { t } = useContext(window.I18nContext);
  return (
    <section className="section" id="usecases" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="section-head">
          <span className="kicker">{t.use.kicker}</span>
          <h2>{t.use.h}</h2>
        </div>
        <div className="usecases">
          {t.use.items.map((u, i) => {
            const I = window.Icon[u.ico] || window.Icon.shield;
            return (
              <div className="usecase" key={i}>
                <div className="ico-lg"><I /></div>
                <h3>{u.t}</h3>
                <p>{u.d}</p>
                <ul>
                  {u.li.map((row, k) =>
                  <li key={k}><window.Icon.check /> {row}</li>
                  )}
                </ul>
              </div>);

          })}
        </div>
      </div>
    </section>);

}
window.UseCases = UseCases;