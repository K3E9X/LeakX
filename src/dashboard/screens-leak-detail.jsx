// Rich Leak Detail screen — kill chain, IOCs, MITRE, threat actor, related, notes

function KillChain({ steps }) {
  return (
    <div className="killchain">
      <div className="card-head" style={{marginBottom: 16}}>
        <div>
          <div className="card-title">Chaîne d'attaque · Lockheed Martin Kill Chain</div>
          <div className="card-meta">Reconstituée à partir de 12 IOCs et de la chronologie observée</div>
        </div>
        <span className="tag" style={{color: "var(--ok)"}}>● 7/8 étapes confirmées</span>
      </div>
      <div className="kc-track">
        {steps.map((s, i) => (
          <div key={s.id} className={"kc-step " + s.state + (s.leakx ? " leakx" : "")}>
            <div className="kc-dot">{i + 1}</div>
            <div className="kc-label">{s.label}</div>
            <div className="kc-sub">{s.sub}</div>
            <div className="kc-date">{s.date}</div>
            <div style={{marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)"}}>
              {s.actor !== "—" && s.actor !== "?" && `acteur · ${s.actor}`}
              {s.ioc > 0 && <span> · {s.ioc} IOCs</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IocCopy({ value }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }).catch(() => {});
  }
  return (
    <button className={"ioc-copy" + (copied ? " copied" : "")} onClick={copy} title="Copier">
      {copied ? <window.Icon.check style={{width: 12, height: 12}}/> : <window.Icon.copy/>}
    </button>
  );
}

function IocsTable({ iocs }) {
  const [q, setQ] = useState("");
  const filtered = iocs.filter(i =>
    q === "" || (i.value + " " + i.desc + " " + i.type).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="det-section">
      <div className="card-head">
        <div>
          <div className="card-title">Indicateurs de compromission</div>
          <div className="card-meta">{iocs.length} IOCs extraits · format STIX 2.1 disponible</div>
        </div>
        <div className="tbl-search" style={{padding: "6px 10px"}}>
          <window.Icon.search style={{width: 14, height: 14}}/>
          <input placeholder="Filtrer…" value={q} onChange={e => setQ(e.target.value)} style={{width: 140}}/>
        </div>
      </div>
      <div style={{border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden"}}>
        <table className="ioc-tbl">
          <thead>
            <tr>
              <th style={{width: 80}}>Type</th>
              <th>Valeur</th>
              <th>Description</th>
              <th style={{width: 110}}>Confiance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i, k) => (
              <tr key={k}>
                <td><span className="ioc-type">{i.type}</span></td>
                <td>
                  <span className="ioc-value">
                    <span style={{flex: 1, minWidth: 0}}>{i.value}</span>
                    <IocCopy value={i.value}/>
                  </span>
                </td>
                <td style={{color: "var(--text-mute)", fontSize: 12}}>{i.desc}</td>
                <td>
                  <span className="ioc-conf">
                    <span className="bar"><span style={{width: i.conf + "%"}}></span></span>
                    <span style={{color: "var(--text)"}}>{i.conf}%</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MitreGrid({ mitre }) {
  const tactics = [...new Set(mitre.map(m => m.tac))];
  return (
    <div className="det-section">
      <div className="card-head">
        <div>
          <div className="card-title">MITRE ATT&CK · techniques observées</div>
          <div className="card-meta">{mitre.filter(m => m.used).length} techniques confirmées · {mitre.filter(m => m.next).length} attendue(s) en post-exploitation</div>
        </div>
        <a className="card-link">Voir matrice complète →</a>
      </div>
      <div className="mitre-grid">
        {mitre.map(m => (
          <div key={m.id} className={"mitre-cell" + (m.used ? " used" : "") + (m.key ? " key" : "") + (m.next ? " next" : "")}>
            <div className="mitre-id">{m.id}{m.next && " · attendu"}</div>
            <div className="mitre-name">{m.name}</div>
            <div className="mitre-tac">{m.tac}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)"}}>
        ★ technique pivot · — déjà observée · ‒ ‒ attendue
      </div>
    </div>
  );
}

function ActorCard({ actor }) {
  return (
    <div className="det-section">
      <div className="card-head" style={{marginBottom: 24}}>
        <div>
          <div className="card-title">Profil du threat actor</div>
          <div className="card-meta">Reconstruit par corrélation OSINT · confiance {actor.confidence}%</div>
        </div>
        <a className="card-link">Voir tous les leaks de cet acteur →</a>
      </div>
      <div className="actor-card">
        <div className="actor-avatar">m</div>
        <div className="actor-info">
          <h3>« <span className="handle">{actor.handle}</span> »</h3>
          <div className="aka">aka {actor.aka.join(" · ")}</div>
          <div className="actor-meta">
            <div className="mb"><div className="l">Première activité</div><div className="v">{actor.first_seen}</div></div>
            <div className="mb"><div className="l">Dernière activité</div><div className="v" style={{color: "var(--ok)"}}>● {actor.last_active}</div></div>
            <div className="mb"><div className="l">Sophistication</div><div className="v">{actor.sophistication}</div></div>
            <div className="mb"><div className="l">Région estimée</div><div className="v">{actor.region}</div></div>
          </div>
          <p className="actor-bio">{actor.bio}</p>

          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start"}}>
            <div>
              <div className="card-meta" style={{marginBottom: 8}}>Canaux opérés</div>
              <div className="actor-channels">
                {actor.channels.map((c, i) => {
                  const icoMap = { telegram: "telegram", forum: "dark", shop: "globe" };
                  const I = window.Icon[icoMap[c.type]] || window.Icon.dark;
                  return (
                    <div className="actor-chan" key={i}>
                      <I className="ico"/>
                      <span className="name">{c.name}</span>
                      {c.verified && <span className="verified">✓ vérifié</span>}
                      <span className="meta">{c.followers || c.rep || c.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="card-meta" style={{marginBottom: 8}}>Annonces récentes</div>
              <div className="listings">
                {actor.recent_listings.map((l, i) => (
                  <div className="listing" key={i}>
                    <div className="d">{l.date}</div>
                    <div>{l.title}</div>
                    <div className="p">{l.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedLeaks({ items, goTo }) {
  return (
    <div className="det-section">
      <div className="card-head">
        <div>
          <div className="card-title">Fuites reliées</div>
          <div className="card-meta">Corrélées par victime, vendor ou TTP</div>
        </div>
      </div>
      <div className="related-grid">
        {items.map(r => {
          const SrcI = window.srcIcon(r.source);
          return (
            <div className="related-card" key={r.id} onClick={() => goTo("leak-detail", r.id)}>
              <div className="top">
                <window.SevPill sev={r.sev}/>
                <span className="tag" style={{fontSize: 10}}><SrcI style={{width: 10, height: 10}}/> {r.source}</span>
              </div>
              <div className="reason">{r.reason}</div>
              <div className="title">{r.title}</div>
              <div className="when">{r.date}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExportBox() {
  return (
    <div className="card">
      <div className="card-head" style={{marginBottom: 12}}>
        <div className="card-title">Exporter</div>
      </div>
      <div className="export-grid">
        <button className="export-btn"><span>STIX 2.1</span><span className="ext">.json</span></button>
        <button className="export-btn"><span>MISP Event</span><span className="ext">.json</span></button>
        <button className="export-btn"><span>OpenIOC</span><span className="ext">.xml</span></button>
        <button className="export-btn"><span>CSV</span><span className="ext">.csv</span></button>
        <button className="export-btn" style={{gridColumn: "span 2"}}>
          <span>Rapport PDF détaillé</span>
          <window.Icon.download/>
        </button>
      </div>
    </div>
  );
}

function NotesBox() {
  const [notes, setNotes] = useState(window.LEAK_DETAIL.notes);
  const [draft, setDraft] = useState("");
  function send() {
    if (!draft.trim()) return;
    setNotes([
      ...notes,
      { author: window.USER.name, role: window.USER.role, when: "à l'instant", text: draft.trim() },
    ]);
    setDraft("");
  }
  return (
    <div className="card">
      <div className="card-head" style={{marginBottom: 12}}>
        <div className="card-title">Notes SOC · {notes.length}</div>
      </div>
      <div className="notes-list">
        {notes.map((n, i) => (
          <div className={"note" + (n.role === "Auto" ? " bot" : "")} key={i}>
            <div className="avatar">
              {n.role === "Auto" ? "🤖" : n.author.split(" ").map(x => x[0]).join("").slice(0, 2)}
            </div>
            <div className="body">
              <div className="head">
                <span className="who">{n.author}</span>
                <span className="role">{n.role}</span>
                <span className="when">{n.when}</span>
              </div>
              <div className="text">{n.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="note-compose">
        <textarea
          placeholder="Ajouter une note pour l'équipe…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
        />
        <div className="row">
          <span className="hint">⌘+Entrée pour envoyer</span>
          <button className="btn btn-primary" style={{padding: "5px 12px", fontSize: 12}} onClick={send}>
            <window.Icon.send style={{width: 12, height: 12}}/> Publier
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================================================
function ScreenLeakDetail({ goTo, leakId }) {
  const d = window.LEAK_DETAIL;
  const [tab, setTab] = useState("evidence");

  return (
    <div>
      <a className="back-link" onClick={() => goTo("leaks")}>
        <window.Icon.back/> Retour aux fuites
      </a>

      {/* Header */}
      <div className="detail-head">
        <div className="ico"><window.Icon.stealer/></div>
        <div style={{flex: 1, minWidth: 0}}>
          <h1>{d.title}</h1>
          <div className="meta">
            <span>{d.source}</span>
            <span>Collecté {d.collected}</span>
            <span>Famille {d.malware_family}</span>
            <span>Pays victime {d.victim_country}</span>
          </div>
        </div>
        <div style={{display: "flex", alignItems: "center", gap: 8, flexShrink: 0}}>
          <window.SevPill sev="high"/>
          <window.StatusPill status="open"/>
          <button className="icon-btn"><window.Icon.three_dots/></button>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="grid cols-3" style={{marginBottom: 16}}>
        <div className="kpi" style={{padding: 14}}>
          <div className="kpi-label">Identifiants exposés</div>
          <div className="kpi-value mono" style={{fontSize: 24}}>47</div>
        </div>
        <div className="kpi" style={{padding: 14}}>
          <div className="kpi-label">Cookies de session</div>
          <div className="kpi-value mono" style={{fontSize: 24, color: "var(--critical)"}}>3</div>
          <div className="kpi-delta up">▲ Encore valides</div>
        </div>
        <div className="kpi" style={{padding: 14}}>
          <div className="kpi-label">Services compromis</div>
          <div className="kpi-value mono" style={{fontSize: 24}}>12</div>
        </div>
      </div>

      {/* Kill chain full width */}
      <KillChain steps={d.kill_chain}/>

      {/* Main grid */}
      <div className="detail">
        {/* Main column */}
        <div>
          <div className="card">
            <div className="tabs">
              <button className={"tab" + (tab === "evidence" ? " on" : "")} onClick={() => setTab("evidence")}>Preuve brute</button>
              <button className={"tab" + (tab === "affected" ? " on" : "")} onClick={() => setTab("affected")}>Identités affectées ({d.affected.length - 1}+)</button>
              <button className={"tab" + (tab === "context" ? " on" : "")} onClick={() => setTab("context")}>Contexte HUMINT</button>
            </div>

            {tab === "evidence" && (
              <div>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8, flexWrap: "wrap"}}>
                  <span className="card-meta">Extrait normalisé · mots de passe et cookies hachés selon votre niveau d'accréditation</span>
                  <button className="btn btn-outline" style={{padding: "6px 10px", fontSize: 12}}>
                    <window.Icon.download style={{width: 12, height: 12}}/> STIX 2.1
                  </button>
                </div>
                <div className="evidence" dangerouslySetInnerHTML={{__html: highlightEvidence(d.evidence)}}/>
                <p style={{marginTop: 10, fontSize: 11.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)"}}>
                  ⓘ Les valeurs déchiffrées sont disponibles via l'API en exposant le hash SHA-256 du log. Conservé 30 jours puis purge automatique.
                </p>
              </div>
            )}

            {tab === "affected" && (
              <table className="tbl" style={{marginTop: -10}}>
                <thead>
                  <tr>
                    <th>Identité</th>
                    <th style={{width: 120}}>Rôle</th>
                    <th style={{width: 100}}>Services</th>
                    <th style={{width: 100}}>Cookies</th>
                    <th style={{width: 110}}></th>
                  </tr>
                </thead>
                <tbody>
                  {d.affected.map((a, i) => (
                    <tr key={i} className="row-click">
                      <td>
                        <div className="id-cell">
                          <div className="id-avatar">{a.more ? "…" : a.name.split(" ").map(s => s[0]).join("").slice(0, 2)}</div>
                          <div>
                            <div className="name">{a.name}</div>
                            {a.email && <div className="sub">{a.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="col-mute">{a.role || "—"}</td>
                      <td className="col-mono">{a.more ? "—" : a.services}</td>
                      <td className="col-mono" style={{color: a.cookies > 0 ? "var(--critical)" : "var(--text-mute)"}}>{a.more ? "—" : a.cookies}</td>
                      <td>
                        {!a.more && <button className="btn btn-outline" style={{padding: "5px 10px", fontSize: 11.5}}>Force reset</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "context" && (
              <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                <div className="evidence" style={{whiteSpace: "normal", maxHeight: "none"}}>
                  <p style={{margin: 0}}>
                    <strong style={{color: "var(--accent-hi)"}}>Vendor « marlow »</strong> opère depuis avril 2024 sur 4 canaux Telegram privés
                    et un thread fermé sur XSS.is. Vendeur historique de logs Lumma et StealC, spécialisé sur les cibles francophones.
                    Le batch <span style={{color: "var(--text)"}}>a4f2-2026-05</span> contient ~12 400 logs, dont 47 attribuables à veridata.fr.
                  </p>
                  <p style={{margin: "12px 0 0"}}>
                    Le log #a4f2-9831 (Marc Bernier · CFO) présente une <strong style={{color: "var(--critical)"}}>session ESTSAUTH persistante</strong> de 12 jours.
                    Risque de bypass MFA. Recommandation : révocation immédiate des refresh tokens via Entra ID.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* IOCs */}
          <IocsTable iocs={d.iocs}/>

          {/* MITRE */}
          <MitreGrid mitre={d.mitre}/>

          {/* Threat Actor */}
          <ActorCard actor={d.actor}/>

          {/* Related */}
          <RelatedLeaks items={d.related} goTo={goTo}/>
        </div>

        {/* Right column */}
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <div className="card">
            <div className="card-head" style={{marginBottom: 18}}>
              <div className="card-title">Chronologie LeakX</div>
            </div>
            <div className="timeline">
              {d.timeline.map((t, i) => (
                <div className={"tl-item" + (t.crit ? " crit" : "") + (t.active ? " active" : "")} key={i}>
                  <div className="tl-time">{t.time}</div>
                  <div className="tl-title">{t.title}</div>
                  <div className="tl-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head" style={{marginBottom: 14}}>
              <div className="card-title">Plan de remédiation</div>
            </div>
            <div className="actions-stack">
              <a className="action-row">
                <span className="ico"><window.Icon.lock/></span>
                <span className="lbl">Force reset des 47 comptes</span>
                <window.Icon.arrow className="arr" style={{width: 14, height: 14}}/>
              </a>
              <a className="action-row">
                <span className="ico"><window.Icon.refresh/></span>
                <span className="lbl">Révoquer les 3 sessions O365</span>
                <window.Icon.arrow className="arr" style={{width: 14, height: 14}}/>
              </a>
              <a className="action-row">
                <span className="ico"><window.Icon.shield/></span>
                <span className="lbl">Lancer scan EDR sur les postes</span>
                <window.Icon.arrow className="arr" style={{width: 14, height: 14}}/>
              </a>
              <a className="action-row">
                <span className="ico"><window.Icon.bell/></span>
                <span className="lbl">Notifier les 47 collaborateurs</span>
                <window.Icon.arrow className="arr" style={{width: 14, height: 14}}/>
              </a>
              <a className="action-row">
                <span className="ico"><window.Icon.ext/></span>
                <span className="lbl">Créer ticket TheHive</span>
                <window.Icon.arrow className="arr" style={{width: 14, height: 14}}/>
              </a>
            </div>
          </div>

          <div className="card">
            <div className="card-head" style={{marginBottom: 10}}>
              <div className="card-title">Rayon d'impact</div>
            </div>
            <p style={{fontSize: 13, color: "var(--text-mute)", margin: 0, lineHeight: 1.55}}>{d.blast_radius}</p>
          </div>

          <ExportBox/>

          <NotesBox/>
        </div>
      </div>
    </div>
  );
}
window.ScreenLeakDetail = ScreenLeakDetail;

// helper to colorize the raw evidence block
function highlightEvidence(txt) {
  return txt
    .replace(/(^|\n)(\w[\w\s]*:)/g, '$1<span class="field">$2</span>')
    .replace(/(PW:\s+)(████+)/g, '$1<span class="pw">$2</span>')
    .replace(/(value:\s+)(████+)/g, '$1<span class="cookie">$2</span>')
    .replace(/(m\.bernier@veridata\.fr|m\.bernier)/g, '<span class="user">$1</span>');
}
