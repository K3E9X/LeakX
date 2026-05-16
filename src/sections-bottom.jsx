// Bottom sections: Pricing, Sovereignty (France map), FAQ, CTA, Footer

function Pricing() {
  const { t, lang } = useContext(window.I18nContext);
  const [yearly, setYearly] = useState(true);
  const plans = t.pricing.plans;
  const ctaMap = { cta_free: t.pricing.cta_free, cta_pro: t.pricing.cta_pro, cta_ent: t.pricing.cta_ent };

  return (
    <section className="section" id="pricing">
      <div className="container">
        <div className="section-head" style={{marginBottom: 32}}>
          <span className="kicker">{t.pricing.kicker}</span>
          <h2>{t.pricing.h}</h2>
          <p className="section-sub">{t.pricing.sub}</p>
        </div>
        <div className="pricing-toggle" role="tablist">
          <button className={!yearly ? "on" : ""} onClick={() => setYearly(false)}>{t.pricing.monthly}</button>
          <button className={yearly ? "on" : ""} onClick={() => setYearly(true)}>
            {t.pricing.yearly} <span className="save mono">{t.pricing.save}</span>
          </button>
        </div>
        <div className="plans">
          {plans.map((p, i) => {
            const price = yearly ? p.price_y : p.price_m;
            const isFree = price === 0;
            const isContact = price === null;
            return (
              <div key={i} className={"plan" + (p.featured ? " featured" : "")}>
                {p.featured && <span className="plan-badge mono">{t.pricing.featured}</span>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-desc">{p.desc}</div>
                <div className="plan-price">
                  {isContact ? (
                    <span className="quote">{t.pricing.contact}</span>
                  ) : isFree ? (
                    <React.Fragment>
                      <span className="amount">€0</span>
                      <span className="period">{lang === "fr" ? "pour toujours" : "forever"}</span>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <span className="amount">€{price}</span>
                      <span className="period">{t.pricing.month}{yearly ? (lang === "fr" ? " · facturé annuellement" : " · billed yearly") : ""}</span>
                    </React.Fragment>
                  )}
                </div>
                <div className="plan-cta">
                  <a className={"btn " + (p.featured ? "btn-primary" : "btn-outline") + " btn-lg"} href={"Signup.html?plan=" + ({cta_free: "community", cta_pro: "pro", cta_ent: "enterprise"}[p.cta])}>
                    {ctaMap[p.cta]} <window.Icon.arrow style={{width: 14, height: 14}} />
                  </a>
                </div>
                <ul className="plan-features">
                  {p.features.map((f, k) => (
                    <li key={k} className={f[1] ? "" : "muted"}>
                      {f[1] ? <window.Icon.check /> : <window.Icon.x />}
                      <span>{f[0]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
window.Pricing = Pricing;

// minimal France silhouette (approximate hexagone shape)
function FranceMap() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      {/* outer halo */}
      <defs>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(59,130,246,0.35)"/>
          <stop offset="60%" stopColor="rgba(59,130,246,0.08)"/>
          <stop offset="100%" stopColor="rgba(59,130,246,0)"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#halo)"/>
      {/* France approximate silhouette (hexagone) */}
      <path
        d="M88 24 L112 26 L130 36 L142 56 L160 74 L170 96 L162 118 L168 142 L150 156 L132 172 L108 176 L86 170 L62 174 L48 156 L40 134 L34 110 L42 86 L36 64 L52 46 L70 34 Z"
        fill="rgba(59,130,246,0.06)"
        stroke="rgba(59,130,246,0.5)"
        strokeWidth="1"
      />
      {/* POPs */}
      {[
        { x: 100, y: 70, label: "Paris" },
        { x: 70,  y: 130, label: "Bordeaux" },
        { x: 130, y: 140, label: "Marseille" },
        { x: 140, y: 100, label: "Lyon" },
        { x: 95,  y: 165, label: "Toulouse" },
      ].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="8" fill="rgba(59,130,246,0.15)">
            <animate attributeName="r" values="6;12;6" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.3}s`}/>
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.3}s`}/>
          </circle>
          <circle cx={p.x} cy={p.y} r="3" fill="#60a5fa"/>
          <text x={p.x + 7} y={p.y + 3} fontSize="7" fontFamily="JetBrains Mono, monospace" fill="rgba(230,233,242,0.7)">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function Sovereignty() {
  const { t } = useContext(window.I18nContext);
  return (
    <section className="section" id="sov">
      <div className="container">
        <div className="section-head">
          <span className="kicker">{t.sov.kicker}</span>
        </div>
        <div className="sov-band">
          <div>
            <h3 className="display">{t.sov.h}</h3>
            <p>{t.sov.sub}</p>
            <div className="badges">
              {t.sov.badges.map((b, i) => (
                <span className="badge" key={i}><span className="dot"></span>{b}</span>
              ))}
            </div>
          </div>
          <div className="sov-map" aria-label={t.sov.map_label}>
            <FranceMap />
          </div>
        </div>
      </div>
    </section>
  );
}
window.Sovereignty = Sovereignty;

function FAQ() {
  const { t } = useContext(window.I18nContext);
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head">
          <span className="kicker">{t.faq.kicker}</span>
          <h2>{t.faq.h}</h2>
        </div>
        <div className="faq-list">
          {t.faq.items.map((item, i) => (
            <div className={"faq-item" + (open === i ? " open" : "")} key={i}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{item.q}</span>
                <window.Icon.chev className="chev" />
              </button>
              <div className="faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.FAQ = FAQ;

function FinalCTA() {
  const { t } = useContext(window.I18nContext);
  return (
    <section className="section" style={{paddingTop: 0}}>
      <div className="container">
        <div style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, var(--surface) 60%)",
          border: "1px solid var(--accent)",
          borderRadius: 16,
          padding: "48px 40px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <h2 style={{maxWidth: "22ch", margin: "0 auto 12px"}}>{t.cta.h}</h2>
          <p style={{color: "var(--text-mute)", fontSize: 16, maxWidth: "56ch", margin: "0 auto 28px"}}>{t.cta.sub}</p>
          <div style={{display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center"}}>
            <a className="btn btn-primary btn-lg" href="Signup.html">{t.cta.primary} <window.Icon.arrow style={{width: 14, height: 14}} /></a>
            <a className="btn btn-outline btn-lg" href="#demo">{t.cta.secondary}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
window.FinalCTA = FinalCTA;

function Footer() {
  const { t } = useContext(window.I18nContext);
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <a className="brand" href="#top" style={{marginBottom: 14, display: "inline-flex"}}>
              <span className="brand-mark"><window.Icon.logo/></span>
              <span><b>Leak</b><span className="brand-x">X</span></span>
            </a>
            <p style={{color: "var(--text-mute)", maxWidth: "32ch", fontSize: 13.5, marginTop: 8}}>{t.footer.tag}</p>
            <div className="badges" style={{marginTop: 18}}>
              <span className="badge"><span className="dot"></span>Scaleway · Paris</span>
              <span className="badge"><span className="dot"></span>RGPD</span>
            </div>
          </div>
          <div className="footer-col">
            <h4>{t.footer.product}</h4>
            <ul>{t.footer.links.product.map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
          </div>
          <div className="footer-col">
            <h4>{t.footer.company}</h4>
            <ul>{t.footer.links.company.map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
          </div>
          <div className="footer-col">
            <h4>{t.footer.legal}</h4>
            <ul>{t.footer.links.legal.map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
          </div>
        </div>
        <div className="footer-bot">
          <span>{t.footer.copy}</span>
          <span>v 0.42.0 · build 2026.05.16</span>
        </div>
      </div>
    </footer>
  );
}
window.Footer = Footer;
