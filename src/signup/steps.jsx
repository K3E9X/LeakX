// Signup step components
const { useState, useEffect, useRef, useMemo } = React;

const PLANS = [
  {
    id: "community",
    name: "Communautaire",
    desc: "1 email + 1 domaine surveillés · alertes hebdo · 10 recherches/mois",
    price_m: 0, price_y: 0,
    badge: null,
    steps: ["account"], // skips domain + payment
  },
  {
    id: "pro",
    name: "Pro",
    desc: "25 domaines · temps réel · API + webhooks · 14 jours d'essai sans CB",
    price_m: 149, price_y: 127,
    badge: "Populaire",
    steps: ["account", "domain", "payment"],
  },
  {
    id: "enterprise",
    name: "Entreprise",
    desc: "SSO · SOC dédié · intégrations sur mesure · onboarding accompagné",
    price_m: null, price_y: null,
    badge: null,
    steps: ["account", "contact"],
  },
];
window.SIGNUP_PLANS = PLANS;

const ROLES = ["RSSI / CISO", "SOC analyst", "DevOps / SRE", "DPO / Compliance", "Dirigeant", "Autre"];
window.SIGNUP_ROLES = ROLES;

// ================== Step: Plan picker ==================
function StepPlan({ state, setState, next }) {
  const [yearly, setYearly] = useState(state.yearly);

  function pick(id) {
    setState(s => ({ ...s, plan: id, yearly }));
  }

  useEffect(() => {
    setState(s => ({ ...s, yearly }));
  }, [yearly]);

  return (
    <div>
      <div className="step-eyebrow">Étape 1 / 3</div>
      <h1 className="step-title">Choisissez votre formule.</h1>
      <p className="step-sub">Vous pouvez changer ou résilier à tout moment depuis le portail client. Pas de carte requise pour démarrer en Communautaire ou en essai Pro.</p>

      <div className="bill-toggle">
        <button className={!yearly ? "on" : ""} onClick={() => setYearly(false)}>Mensuel</button>
        <button className={yearly ? "on" : ""} onClick={() => setYearly(true)}>Annuel <span className="save">−15%</span></button>
      </div>

      <div className="plan-list">
        {PLANS.map(p => {
          const price = yearly ? p.price_y : p.price_m;
          const isFree = price === 0;
          const isContact = price === null;
          return (
            <button key={p.id} className={"plan-card" + (state.plan === p.id ? " on" : "")} onClick={() => pick(p.id)} type="button">
              <span className="radio"></span>
              <div className="info">
                <div className="name">
                  {p.name}
                  {p.badge && <span className="badge">{p.badge}</span>}
                </div>
                <div className="desc">{p.desc}</div>
              </div>
              <div className="price">
                {isContact ? (
                  <span className="quote">Sur devis</span>
                ) : isFree ? (
                  <React.Fragment>
                    <div className="amount">Gratuit</div>
                    <div className="period">pour toujours</div>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <div className="amount">€{price}</div>
                    <div className="period">/ mois {yearly ? "· annuel" : ""}</div>
                  </React.Fragment>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="step-actions">
        <a className="btn-back" href="index.html"><window.Icon.back/> Retour à l'accueil</a>
        <button className="btn-primary-cta" onClick={next} disabled={!state.plan}>
          Continuer <window.Icon.arrow/>
        </button>
      </div>
    </div>
  );
}
window.StepPlan = StepPlan;

// ================== Step: Account info ==================
function StepAccount({ state, setState, next, back }) {
  const [form, setForm] = useState(state.account || { email: "", password: "", first: "", last: "", company: "", role: "" });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function submit(e) {
    e && e.preventDefault();
    setState(s => ({ ...s, account: form }));
    next();
  }

  const valid = form.email && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8 && form.first && form.last && form.role;

  const plan = PLANS.find(p => p.id === state.plan);
  const isContact = state.plan === "enterprise";

  return (
    <form onSubmit={submit}>
      <div className="step-eyebrow">Étape 2 / 3 · {plan.name}</div>
      <h1 className="step-title">{isContact ? "Quelques infos pour vous rappeler." : "Créons votre compte."}</h1>
      <p className="step-sub">
        {isContact
          ? "Notre équipe vous recontacte sous 24h ouvrées avec une démo personnalisée et un devis adapté à votre périmètre."
          : "Email professionnel uniquement. Aucun email perso ni jetable n'est accepté (Gmail, Outlook, etc.)."}
      </p>

      <div className="field-grid">
        <div className="field">
          <label>Prénom <span className="req">*</span></label>
          <input type="text" placeholder="Camille" value={form.first} onChange={e => set("first", e.target.value)} required/>
        </div>
        <div className="field">
          <label>Nom <span className="req">*</span></label>
          <input type="text" placeholder="Roux" value={form.last} onChange={e => set("last", e.target.value)} required/>
        </div>
        <div className="field full">
          <label>Email professionnel <span className="req">*</span></label>
          <input type="email" placeholder="camille.roux@entreprise.fr" value={form.email} onChange={e => set("email", e.target.value)} required/>
          {form.email && /(gmail|outlook|hotmail|yahoo|protonmail)\./i.test(form.email) && (
            <span className="err">Adresse professionnelle requise — utilisez votre email d'entreprise.</span>
          )}
        </div>
        {!isContact && (
          <div className="field full">
            <label>Mot de passe <span className="req">*</span></label>
            <input type="password" placeholder="Au moins 8 caractères" value={form.password} onChange={e => set("password", e.target.value)} required minLength={8}/>
            <span className="hint">12+ caractères recommandés · 2FA activable après inscription</span>
          </div>
        )}
        <div className="field full">
          <label>Société</label>
          <input type="text" placeholder="Veridata SAS" value={form.company} onChange={e => set("company", e.target.value)}/>
        </div>
        <div className="field full">
          <label>Rôle <span className="req">*</span></label>
          <div className="role-grid">
            {ROLES.map(r => (
              <button type="button" key={r} className={"role-pick" + (form.role === r ? " on" : "")} onClick={() => set("role", r)}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button type="button" className="btn-back" onClick={back}><window.Icon.back/> Retour</button>
        <button type="submit" className="btn-primary-cta" disabled={!valid}>
          {isContact ? "Envoyer ma demande" : (state.plan === "community" ? "Créer mon compte" : "Continuer")} <window.Icon.arrow/>
        </button>
      </div>
    </form>
  );
}
window.StepAccount = StepAccount;

// ================== Step: Domain verification ==================
function StepDomain({ state, setState, next, back }) {
  const [domain, setDomain] = useState(state.domain || "");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);

  const token = useMemo(() => {
    if (!domain) return "leakx-verify-" + Math.random().toString(36).slice(2, 12);
    return "leakx-verify-" + btoa(domain).replace(/=/g, "").slice(0, 10).toLowerCase();
  }, [domain]);

  function copyToken() {
    navigator.clipboard.writeText(`leakx-verification=${token}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  function check() {
    setVerifying(true);
    setVerified(false);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 2200);
  }

  function submit() {
    setState(s => ({ ...s, domain, domainVerified: verified || true }));
    next();
  }

  return (
    <div>
      <div className="step-eyebrow">Étape 2.5 / 3</div>
      <h1 className="step-title">Vérifiez votre domaine.</h1>
      <p className="step-sub">Pour empêcher toute utilisation abusive, nous demandons de prouver que vous administrez bien le domaine que vous voulez surveiller. Ajoutez un enregistrement TXT à votre DNS.</p>

      <div className="field full">
        <label>Domaine à surveiller <span className="req">*</span></label>
        <input
          type="text"
          placeholder="entreprise.fr"
          value={domain}
          onChange={e => setDomain(e.target.value.trim().toLowerCase().replace(/^https?:\/\//, ""))}
        />
        <span className="hint">Sans http:// ni www · les sous-domaines seront automatiquement détectés</span>
      </div>

      {domain && (
        <React.Fragment>
          <p style={{marginTop: 24, marginBottom: 8, fontSize: 13.5, color: "var(--text-mute)"}}>
            Ajoutez cet enregistrement TXT à la zone DNS de <strong style={{color: "var(--text)"}}>{domain}</strong> :
          </p>
          <div className="dns-record">
            <div className="dns-row">
              <span className="key">Type</span>
              <span className="val">TXT</span>
              <span></span>
            </div>
            <div className="dns-row">
              <span className="key">Nom / Host</span>
              <span className="val">@ <span style={{color: "var(--text-faint)"}}>(ou {domain})</span></span>
              <span></span>
            </div>
            <div className="dns-row">
              <span className="key">Valeur</span>
              <span className="val">leakx-verification={token}</span>
              <button className={"copy-btn" + (copied ? " copied" : "")} onClick={copyToken} title="Copier">
                {copied ? <window.Icon.check style={{width: 14, height: 14}}/> : <window.Icon.copy style={{width: 14, height: 14}}/>}
              </button>
            </div>
            <div className="dns-row">
              <span className="key">TTL</span>
              <span className="val">3600 <span style={{color: "var(--text-faint)"}}>(1h, peut être plus court)</span></span>
              <span></span>
            </div>
          </div>

          {!verifying && !verified && (
            <button className="btn-primary-cta" onClick={check} style={{marginTop: 8}}>
              <window.Icon.refresh/> Vérifier maintenant
            </button>
          )}

          {verifying && (
            <div className="verify-state checking">
              <div className="ico"><div className="spinner"></div></div>
              <div className="body">
                <div className="title">Vérification en cours…</div>
                <div className="sub">dig TXT {domain} · résolution depuis 3 résolveurs (FR · DE · NL)</div>
              </div>
            </div>
          )}

          {verified && (
            <div className="verify-state ok">
              <div className="ico"><window.Icon.check style={{width: 18, height: 18}}/></div>
              <div className="body">
                <div className="title">Domaine vérifié ✓</div>
                <div className="sub">TXT trouvé sur 3/3 résolveurs · périmètre activé · {domain}</div>
              </div>
            </div>
          )}
        </React.Fragment>
      )}

      <p style={{marginTop: 20, fontSize: 12.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)"}}>
        ⓘ La propagation DNS peut prendre quelques minutes. Pas envie d'attendre ? Vous pouvez ignorer cette étape — votre périmètre sera activé dès la vérification réussie en arrière-plan.
      </p>

      <div className="step-actions">
        <button type="button" className="btn-back" onClick={back}><window.Icon.back/> Retour</button>
        <div style={{display: "flex", gap: 10}}>
          <button className="btn-back" onClick={submit} style={{padding: "12px 16px"}}>Ignorer pour l'instant</button>
          <button className="btn-primary-cta" onClick={submit} disabled={!verified}>
            Continuer vers le paiement <window.Icon.arrow/>
          </button>
        </div>
      </div>
    </div>
  );
}
window.StepDomain = StepDomain;

// ================== Step: Payment ==================
function detectCardBrand(num) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mc";
  if (/^3[47]/.test(n)) return "amex";
  return null;
}

function formatCardNumber(v) {
  const n = v.replace(/\s/g, "").replace(/[^\d]/g, "").slice(0, 19);
  return n.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
function formatExpiry(v) {
  const n = v.replace(/[^\d]/g, "").slice(0, 4);
  if (n.length <= 2) return n;
  return n.slice(0, 2) + " / " + n.slice(2);
}

function StepPayment({ state, setState, next, back }) {
  const [form, setForm] = useState({ name: "", num: "", exp: "", cvc: "", country: "FR" });
  const [processing, setProcessing] = useState(false);

  const plan = PLANS.find(p => p.id === state.plan);
  const price = state.yearly ? plan.price_y : plan.price_m;
  const total = state.yearly ? price * 12 : price;
  const vat = Math.round(total * 0.2 * 100) / 100;
  const totalTtc = Math.round((total + vat) * 100) / 100;

  const brand = detectCardBrand(form.num);
  const valid = form.name && form.num.replace(/\s/g, "").length >= 13 && /^\d{2} \/ \d{2}$/.test(form.exp) && form.cvc.length >= 3;

  function pay(e) {
    e && e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setState(s => ({ ...s, payment: form }));
      next();
    }, 1800);
  }

  return (
    <form onSubmit={pay}>
      <div className="step-eyebrow">Étape 3 / 3 · {plan.name}</div>
      <h1 className="step-title">Validez le paiement.</h1>
      <p className="step-sub">Vous ne serez débité qu'à la fin de votre essai de 14 jours. Annulation possible à tout moment depuis le portail client Stripe.</p>

      <div className="pay-grid">
        <div>
          <div className="field-grid">
            <div className="field full">
              <label>Nom sur la carte <span className="req">*</span></label>
              <input type="text" placeholder="Camille Roux" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}/>
            </div>
            <div className="field full">
              <label>Numéro de carte <span className="req">*</span></label>
              <div className="card-input">
                <input type="text" placeholder="4242 4242 4242 4242" value={form.num} onChange={e => setForm(f => ({...f, num: formatCardNumber(e.target.value)}))} inputMode="numeric"/>
                <span className={"brand-ico " + (brand || "")}>{brand ? (brand === "mc" ? "" : brand.toUpperCase()) : "•••"}</span>
              </div>
              <span className="hint">Mode démo · utilisez 4242 4242 4242 4242 (carte de test Stripe)</span>
            </div>
            <div className="field">
              <label>Expiration <span className="req">*</span></label>
              <input type="text" placeholder="MM / AA" value={form.exp} onChange={e => setForm(f => ({...f, exp: formatExpiry(e.target.value)}))} inputMode="numeric"/>
            </div>
            <div className="field">
              <label>CVC <span className="req">*</span></label>
              <input type="text" placeholder="123" value={form.cvc} onChange={e => setForm(f => ({...f, cvc: e.target.value.replace(/[^\d]/g, "").slice(0, 4)}))} inputMode="numeric"/>
            </div>
            <div className="field full">
              <label>Pays de facturation <span className="req">*</span></label>
              <select value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))}>
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="LU">Luxembourg</option>
                <option value="CH">Suisse</option>
                <option value="DE">Allemagne</option>
                <option value="NL">Pays-Bas</option>
                <option value="ES">Espagne</option>
                <option value="IT">Italie</option>
              </select>
            </div>
          </div>

          <p className="stripe-attribution">
            <window.Icon.lock style={{width: 12, height: 12}}/>
            Paiement sécurisé via <strong>Stripe</strong> · PCI DSS niveau 1 · 3-D Secure 2 · LeakX ne stocke jamais votre numéro de carte
          </p>
        </div>

        <div className="summary">
          <h3>Récapitulatif</h3>
          <div className="summary-row">
            <span>Formule</span><span className="v">{plan.name}</span>
          </div>
          <div className="summary-row">
            <span>Période</span><span className="v">{state.yearly ? "Annuel" : "Mensuel"}</span>
          </div>
          <div className="summary-row">
            <span>{state.yearly ? `12 × €${price}` : `1 × €${price}`}</span>
            <span className="v">€{total}</span>
          </div>
          <div className="summary-row">
            <span>TVA (20%)</span><span className="v">€{vat}</span>
          </div>
          <div className="summary-row tot">
            <span>Total TTC</span><span className="v">€{totalTtc}</span>
          </div>
          <div className="summary-row" style={{fontSize: 12, color: "var(--ok)", marginTop: 0, paddingTop: 4}}>
            <span>Essai 14 jours · débit le {new Date(Date.now() + 14 * 86400000).toLocaleDateString("fr-FR")}</span>
          </div>
          <div className="badge-secure">
            <window.Icon.shield/>
            <span>Hébergé en France · RGPD natif · rétention 30j</span>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button type="button" className="btn-back" onClick={back}><window.Icon.back/> Retour</button>
        <button type="submit" className="btn-primary-cta" disabled={!valid || processing}>
          {processing ? (
            <React.Fragment><div className="spinner" style={{borderTopColor: "#fff"}}></div> Validation Stripe…</React.Fragment>
          ) : (
            <React.Fragment><window.Icon.lock/> Démarrer l'essai · €{totalTtc} après 14j</React.Fragment>
          )}
        </button>
      </div>
    </form>
  );
}
window.StepPayment = StepPayment;

// ================== Step: Success ==================
function StepSuccess({ state }) {
  const apiKey = useMemo(() => "lkx_live_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 14), []);
  const plan = PLANS.find(p => p.id === state.plan);
  const isContact = state.plan === "enterprise";
  const [copied, setCopied] = useState(false);

  function copyKey() {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  if (isContact) {
    return (
      <div>
        <div className="success-hero">
          <div className="ico"><window.Icon.check/></div>
          <h1>Demande reçue, on s'occupe du reste.</h1>
          <p>Un de nos consultants vous rappelle sous 24h ouvrées pour cadrer votre périmètre, démontrer la plateforme et établir un devis adapté.</p>
        </div>
        <div style={{textAlign: "center", marginTop: 24}}>
          <a className="btn-primary-cta" href="index.html">Retour à l'accueil</a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="success-hero">
        <div className="ico"><window.Icon.check/></div>
        <h1>Bienvenue dans LeakX, {state.account.first}.</h1>
        <p>Votre compte <strong style={{color: "var(--text)"}}>{plan.name}</strong> est actif. Premier scan en cours sur <strong style={{color: "var(--text)"}}>{state.domain || state.account.email}</strong> — résultats dans le dashboard dans quelques secondes.</p>
      </div>

      <div className="api-key-box">
        <div className="lbl">Votre clé API · à conserver précieusement</div>
        <div className="key-row">
          <span className="key">{apiKey}</span>
          <button className={"copy-btn" + (copied ? " copied" : "")} onClick={copyKey} style={{width: 32, height: 32}}>
            {copied ? <window.Icon.check style={{width: 14, height: 14}}/> : <window.Icon.copy style={{width: 14, height: 14}}/>}
          </button>
        </div>
        <div className="warn-note">
          <window.Icon.shield style={{width: 12, height: 12}}/>
          Cette clé n'apparaîtra qu'une seule fois. Stockez-la dans votre coffre-fort (Vault, 1Password, etc.).
        </div>
      </div>

      <div className="next-steps">
        <a className="next-step" href="Dashboard.html">
          <span className="ico-sm"><window.Icon.grid/></span>
          <span className="t">Ouvrir le dashboard</span>
          <span className="d">Voir vos premières alertes</span>
        </a>
        <a className="next-step" href="#docs">
          <span className="ico-sm"><window.Icon.key/></span>
          <span className="t">Documentation API</span>
          <span className="d">SDK Python · Go · curl</span>
        </a>
        <a className="next-step" href="#integrations">
          <span className="ico-sm"><window.Icon.plug/></span>
          <span className="t">Intégrer Slack / SIEM</span>
          <span className="d">Webhooks signés HMAC</span>
        </a>
      </div>
    </div>
  );
}
window.StepSuccess = StepSuccess;
