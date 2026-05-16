// Screen: Leaks list (the detail view is in screens-leak-detail.jsx)

function ScreenLeaks({ goTo }) {
  const [sev, setSev] = useState("all");
  const [status, setStatus] = useState("all");
  const [src, setSrc] = useState("all");
  const [q, setQ] = useState("");

  const filtered = window.LEAKS.filter(l =>
    (sev === "all" || l.sev === sev) &&
    (status === "all" || l.status === status) &&
    (src === "all" || l.source === src) &&
    (q === "" || (l.title + " " + l.entity).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Fuites</h1>
          <p className="page-sub">{filtered.length} résultats sur {window.LEAKS.length} · périmètre veridata.fr</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline"><window.Icon.filter/> Filtres avancés</button>
          <button className="btn btn-outline"><window.Icon.download/> Exporter (CSV)</button>
        </div>
      </div>

      <div className="tbl-wrap">
        <div className="tbl-controls">
          <span className="card-meta" style={{marginRight: 4}}>Sévérité :</span>
          {[["all", "Toutes"], ["high", "Critique"], ["med", "Modéré"], ["low", "Faible"]].map(([id, label]) => (
            <button key={id} className={"chip" + (sev === id ? " on" : "")} onClick={() => setSev(id)}>{label}</button>
          ))}
          <span style={{width: 1, height: 18, background: "var(--border)", margin: "0 8px"}}></span>
          <span className="card-meta" style={{marginRight: 4}}>Statut :</span>
          {[["all", "Tous"], ["open", "Ouvert"], ["progress", "En cours"], ["resolved", "Résolu"]].map(([id, label]) => (
            <button key={id} className={"chip" + (status === id ? " on" : "")} onClick={() => setStatus(id)}>{label}</button>
          ))}
          <div className="tbl-search">
            <window.Icon.search style={{width: 14, height: 14}}/>
            <input placeholder="Rechercher dans les fuites…" value={q} onChange={e => setQ(e.target.value)}/>
          </div>
        </div>
        <div style={{display: "flex", padding: "12px 16px", gap: 6, borderBottom: "1px solid var(--border)", flexWrap: "wrap"}}>
          <span className="card-meta" style={{marginRight: 4, alignSelf: "center"}}>Source :</span>
          {[["all", "Toutes"], ["stealer", "Stealer logs"], ["telegram", "Telegram"], ["dark", "Dark web"], ["ransom", "Ransomware"], ["combo", "Combolist"], ["paste", "Paste"], ["brand", "Brand"]].map(([id, label]) => (
            <button key={id} className={"chip" + (src === id ? " on" : "")} onClick={() => setSrc(id)}>{label}</button>
          ))}
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width: 130}}>Date</th>
              <th style={{width: 90}}>Sévérité</th>
              <th>Titre</th>
              <th style={{width: 160}}>Source</th>
              <th style={{width: 180}}>Entité</th>
              <th style={{width: 100}}>Statut</th>
              <th style={{width: 40}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => {
              const SrcI = window.srcIcon(l.source);
              return (
                <tr key={l.id} className="row-click" onClick={() => goTo("leak-detail", l.id)}>
                  <td className="col-mono col-mute">{l.date}</td>
                  <td><window.SevPill sev={l.sev}/></td>
                  <td>{l.title}</td>
                  <td>
                    <span className="tag">
                      <SrcI style={{width: 11, height: 11}}/> {l.source_name}
                    </span>
                  </td>
                  <td className="col-mono col-mute">{l.entity}</td>
                  <td><window.StatusPill status={l.status}/></td>
                  <td><window.Icon.arrow style={{width: 14, height: 14, color: "var(--text-faint)"}}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{marginTop: 14, fontSize: 12, color: "var(--text-faint)", fontFamily: "var(--font-mono)"}}>
        ▾ Cliquer sur une ligne pour ouvrir le détail de la fuite et le plan de remédiation.
      </p>
    </div>
  );
}
window.ScreenLeaks = ScreenLeaks;
