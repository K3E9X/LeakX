// Screen: Identités

function ScreenIdentities({ goTo }) {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const types = ["all", "Domaine", "Employé", "VIP", "Marque", "IP", "Repo"];

  const filtered = window.IDENTITIES.filter(i =>
    (type === "all" || i.type === type) &&
    (status === "all" || i.status === status) &&
    (q === "" || (i.name + " " + (i.sub || "")).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Identités surveillées</h1>
          <p className="page-sub">{window.IDENTITIES.length} entités · périmètre {window.ORG.domain} · tier {window.ORG.plan}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline"><window.Icon.download/> Export</button>
          <button className="btn btn-primary"><window.Icon.user style={{width: 14, height: 14}}/> Ajouter une identité</button>
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-controls">
          <span className="card-meta" style={{marginRight: 4}}>Type :</span>
          {types.map(t => (
            <button key={t} className={"chip" + (type === t ? " on" : "")} onClick={() => setType(t)}>
              {t === "all" ? "Tous" : t}
            </button>
          ))}
          <span style={{width: 1, height: 18, background: "var(--border)", margin: "0 8px"}}></span>
          <span className="card-meta" style={{marginRight: 4}}>Statut :</span>
          {[["all", "Tous"], ["open", "Ouvert"], ["progress", "En cours"], ["resolved", "Résolu"]].map(([id, label]) => (
            <button key={id} className={"chip" + (status === id ? " on" : "")} onClick={() => setStatus(id)}>{label}</button>
          ))}
          <div className="tbl-search">
            <window.Icon.search style={{width: 14, height: 14}}/>
            <input placeholder="Rechercher…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width: 90}}>Type</th>
              <th>Identité</th>
              <th style={{width: 180}}>Exposition</th>
              <th style={{width: 110}}>Alertes</th>
              <th style={{width: 110}}>Statut</th>
              <th style={{width: 130}}>Dernière activité</th>
              <th style={{width: 40}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((id, i) => {
              const kindIcon = {
                domain: "globe", person: "user", email: "mail",
                brand: "brand", ip: "network", repo: "paste",
              }[id.kind];
              const I = window.Icon[kindIcon] || window.Icon.user;
              const sev = id.exposure >= 70 ? "high" : id.exposure >= 40 ? "med" : "low";
              const sevColor = sev === "high" ? "var(--critical)" : sev === "med" ? "var(--warn)" : "var(--ok)";
              return (
                <tr key={i} className="row-click" onClick={() => goTo("leaks")}>
                  <td><span className="tag">{id.type}</span></td>
                  <td>
                    <div className="id-cell">
                      <div className="id-avatar" style={{color: "var(--accent-hi)"}}><I style={{width: 14, height: 14}}/></div>
                      <div>
                        <div className="name">{id.name}</div>
                        {id.sub && <div className="sub">{id.sub}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{display: "flex", alignItems: "center", gap: 10}}>
                      <span className="mono" style={{fontSize: 12, color: sevColor, width: 28, textAlign: "right"}}>{id.exposure}</span>
                      <div style={{flex: 1, height: 6, background: "var(--bg)", borderRadius: 3, overflow: "hidden", maxWidth: 110}}>
                        <div style={{height: "100%", width: id.exposure + "%", background: sevColor, borderRadius: 3}}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {id.alerts > 0 ? (
                      <span className="mono" style={{fontSize: 12, color: id.alerts >= 10 ? "#fb7185" : "var(--text)"}}>{id.alerts} ouvertes</span>
                    ) : (
                      <span className="col-mute">—</span>
                    )}
                  </td>
                  <td><window.StatusPill status={id.status}/></td>
                  <td className="col-mono col-mute">{id.last}</td>
                  <td><window.Icon.arrow style={{width: 14, height: 14, color: "var(--text-faint)"}}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
window.ScreenIdentities = ScreenIdentities;
