// Screen: Vue d'ensemble (Overview)

function ScreenOverview({ goTo }) {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Vue d'ensemble</h1>
          <p className="page-sub">Posture d'exposition de {window.ORG.name} · mis à jour il y a 14 min</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline"><window.Icon.refresh/> Rafraîchir</button>
          <button className="btn btn-outline"><window.Icon.download/> Export</button>
          <button className="btn btn-primary"><window.Icon.bolt style={{width: 14, height: 14}}/> Run scan</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid cols-4" style={{marginBottom: 16}}>
        {window.KPIS.map((k, i) => <window.KPI key={i} {...k}/>)}
      </div>

      {/* Score + Timeline */}
      <div className="grid col-1-2" style={{marginBottom: 16}}>
        <window.ExposureScore/>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Exposition · 28 derniers jours</div>
              <div className="card-meta">Volume agrégé par source · échantillonnage 1 j</div>
            </div>
            <div style={{display: "flex", gap: 6}}>
              <button className="chip on" style={{
                fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 8px",
                borderRadius: 6, background: "var(--surface-3)", color: "var(--text)", border: 0
              }}>28 j</button>
              <button className="chip" style={{
                fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 8px",
                borderRadius: 6, color: "var(--text-mute)", background: "transparent", border: 0
              }}>90 j</button>
              <button className="chip" style={{
                fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 8px",
                borderRadius: 6, color: "var(--text-mute)", background: "transparent", border: 0
              }}>1 an</button>
            </div>
          </div>
          <window.TimelineChart/>
        </div>
      </div>

      {/* Alerts + Sources 24h */}
      <div className="grid col-2-1">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Alertes critiques récentes</div>
              <div className="card-meta">7 ouvertes · 1 en cours</div>
            </div>
            <a className="card-link" onClick={() => goTo("leaks")}>Voir toutes →</a>
          </div>
          <div className="alert-list">
            {window.ALERTS.map((a, i) => (
              <window.AlertRow key={i} a={a} onClick={() => goTo("leak-detail", a.id)}/>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Sources · 24h</div>
              <div className="card-meta">Volume par source</div>
            </div>
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: 10}}>
            {window.SOURCES_24H.map((s, i) => {
              const I = window.Icon[s.ico] || window.Icon.dark;
              const maxC = Math.max(...window.SOURCES_24H.map(x => x.count));
              const w = (s.count / maxC) * 100;
              return (
                <div key={i} style={{display: "grid", gridTemplateColumns: "28px 1fr 36px", gap: 10, alignItems: "center"}}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: "var(--surface-3)", color: "var(--accent-hi)",
                    display: "grid", placeItems: "center"
                  }}>
                    <I style={{width: 14, height: 14}}/>
                  </div>
                  <div>
                    <div style={{fontSize: 12.5, marginBottom: 4}}>{s.name}</div>
                    <div style={{height: 4, background: "var(--bg)", borderRadius: 3, overflow: "hidden"}}>
                      <div style={{
                        height: "100%", width: w + "%",
                        background: s.sev === "high" ? "var(--critical)" : s.sev === "med" ? "var(--warn)" : "var(--accent-hi)",
                        borderRadius: 3
                      }}></div>
                    </div>
                  </div>
                  <div className="mono" style={{textAlign: "right", fontSize: 12, color: "var(--text)"}}>{s.count}</div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)"}}>
            <div className="card-meta" style={{marginBottom: 6}}>Top types compromis (7 j)</div>
            <div style={{display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8}}>
              <span className="tag">O365 · 38</span>
              <span className="tag">GitLab · 24</span>
              <span className="tag">VPN · 17</span>
              <span className="tag">CRM · 12</span>
              <span className="tag">AWS · 9</span>
              <span className="tag">+ 14</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.ScreenOverview = ScreenOverview;
