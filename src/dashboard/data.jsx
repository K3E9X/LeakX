// Dashboard mock data — French CTI for a fictional company "Veridata SAS"

const ORG = {
  name: "Veridata SAS",
  domain: "veridata.fr",
  logo: "V",
  plan: "Pro",
};
window.ORG = ORG;

const USER = {
  name: "Camille Roux",
  role: "RSSI",
  initials: "CR",
};
window.USER = USER;

const EXPOSURE = {
  score: 67, // out of 100
  tier: "med", // high | med | low
  delta: -4,   // vs last week
  breakdown: [
    { label: "Identifiants",    value: 78, sev: "crit" },
    { label: "Stealer logs",    value: 64, sev: "warn" },
    { label: "Marque & VIP",    value: 41, sev: "warn" },
    { label: "Réseau / Surface", value: 22, sev: "ok"   },
  ],
};
window.EXPOSURE = EXPOSURE;

const KPIS = [
  { label: "Nouvelles fuites (7j)", value: "47",   delta: "+12 vs 7j",   trend: "up",   spark: [3,5,2,8,4,9,7,12,9,6,4,11,8,5] },
  { label: "Identifiants exposés", value: "1 284", delta: "+38 cette semaine", trend: "up",   spark: [40,42,45,44,48,52,55,58,60,62,64,68,71,74] },
  { label: "Alertes critiques ouvertes", value: "8", delta: "−3 vs hier",  trend: "down", spark: [12,14,15,11,10,9,11,10,8,9,8,7,8,8] },
  { label: "MTTR moyen", value: "4 h 12", delta: "−42 min",     trend: "down", spark: [9,8,8,7,7,6,6,5,5,5,4.5,4.4,4.3,4.2] },
];
window.KPIS = KPIS;

// 28-day exposure timeline (two series: new credentials, new mentions)
const TIMELINE = (() => {
  const days = 28;
  const arr = [];
  let cred = 32, ment = 18;
  for (let i = 0; i < days; i++) {
    cred = Math.max(8, cred + (Math.random() - 0.5) * 18);
    ment = Math.max(4, ment + (Math.random() - 0.5) * 12);
    // spike around day 18-19
    if (i === 17) cred += 35;
    if (i === 18) cred += 18;
    if (i === 21) ment += 22;
    arr.push({ day: i, cred: Math.round(cred), ment: Math.round(ment) });
  }
  return arr;
})();
window.TIMELINE = TIMELINE;

// alerts feed
const ALERTS = [
  { sev: "high", title: "47 identifiants @veridata.fr trouvés dans un stealer Lumma", source: "Stealer · Lumma · log#a4f2", time: "il y a 14 min", id: "lk-001" },
  { sev: "high", title: "Mention de « Veridata » sur le leak site Akira", source: "Ransomware · Akira", time: "il y a 1 h", id: "lk-002" },
  { sev: "med",  title: "Sous-domaine api-staging.veridata.fr exposé sur Shodan", source: "Surface · Shodan", time: "il y a 3 h", id: "lk-003" },
  { sev: "med",  title: "Vente d'accès RDP « FR construction » sur XSS.is — pivot possible", source: "Dark web · XSS.is", time: "il y a 5 h", id: "lk-004" },
  { sev: "high", title: "Cookies de session O365 du CFO trouvés dans StealC log", source: "Stealer · StealC · CFO", time: "hier 18:42", id: "lk-005" },
  { sev: "low",  title: "Combolist de 1.2M emails — 18 correspondances veridata.fr", source: "Combolist · Telegram", time: "hier 09:11", id: "lk-006" },
  { sev: "med",  title: "Typosquatting détecté : veridota.fr enregistré il y a 2 jours", source: "Brand · DNS watch", time: "hier 08:24", id: "lk-007" },
];
window.ALERTS = ALERTS;

// sources volume (last 24h)
const SOURCES_24H = [
  { name: "Stealer logs", count: 18, sev: "high", ico: "stealer" },
  { name: "Telegram FR",  count: 11, sev: "med",  ico: "telegram" },
  { name: "Dark web",     count: 7,  sev: "med",  ico: "dark" },
  { name: "Combolists",   count: 6,  sev: "low",  ico: "combo" },
  { name: "Paste sites",  count: 3,  sev: "low",  ico: "paste" },
  { name: "Ransomware",   count: 2,  sev: "high", ico: "ransom" },
];
window.SOURCES_24H = SOURCES_24H;

// monitored identities (employees, VIPs, domains, repos)
const IDENTITIES = [
  { type: "Domaine",    name: "veridata.fr",                kind: "domain",    exposure: 78, status: "open",     alerts: 47, last: "il y a 14 min" },
  { type: "Domaine",    name: "*.veridata.fr (12 sous-domaines)", kind: "domain", exposure: 62, status: "progress", alerts: 9, last: "il y a 1 h" },
  { type: "VIP",        name: "Camille Roux", sub: "RSSI",  kind: "person",    exposure: 51, status: "progress", alerts: 3, last: "il y a 2 h" },
  { type: "VIP",        name: "Marc Bernier", sub: "CFO",   kind: "person",    exposure: 84, status: "open",     alerts: 12, last: "hier 18:42" },
  { type: "VIP",        name: "Sophie Latour", sub: "CEO",  kind: "person",    exposure: 39, status: "resolved", alerts: 0, last: "il y a 3 jours" },
  { type: "Employé",    name: "support@veridata.fr",         kind: "email",     exposure: 91, status: "open",     alerts: 18, last: "hier 22:11" },
  { type: "Employé",    name: "admin@veridata.fr",           kind: "email",     exposure: 73, status: "open",     alerts: 7, last: "hier 14:33" },
  { type: "Marque",     name: "« Veridata »",                kind: "brand",     exposure: 41, status: "progress", alerts: 5, last: "il y a 1 h" },
  { type: "Marque",     name: "« Veridata SAS »",            kind: "brand",     exposure: 19, status: "resolved", alerts: 1, last: "il y a 2 jours" },
  { type: "IP",         name: "203.0.113.0/24",              kind: "ip",        exposure: 22, status: "open",     alerts: 2, last: "hier 11:08" },
  { type: "Repo",       name: "github.com/veridata-sas",     kind: "repo",      exposure: 14, status: "resolved", alerts: 0, last: "il y a 5 jours" },
];
window.IDENTITIES = IDENTITIES;

// flat leaks list
const LEAKS = [
  { id: "lk-001", date: "2026-05-16 14:42", title: "Stealer Lumma — 47 credentials @veridata.fr", source: "stealer", source_name: "Lumma stealer", sev: "high", status: "open", entity: "veridata.fr", entity_kind: "domain" },
  { id: "lk-002", date: "2026-05-16 13:38", title: "Mention « Veridata » sur leak site Akira", source: "ransom", source_name: "Akira (RaaS)", sev: "high", status: "open", entity: "Veridata SAS", entity_kind: "brand" },
  { id: "lk-003", date: "2026-05-16 11:54", title: "api-staging.veridata.fr — Citrix Gateway exposé", source: "dark", source_name: "Shodan", sev: "med", status: "progress", entity: "api-staging.veridata.fr", entity_kind: "domain" },
  { id: "lk-004", date: "2026-05-16 09:21", title: "Vente accès RDP — XSS.is thread #84221", source: "dark", source_name: "XSS.is", sev: "med", status: "open", entity: "Veridata SAS", entity_kind: "brand" },
  { id: "lk-005", date: "2026-05-15 18:42", title: "StealC — session O365 + cookies du CFO", source: "stealer", source_name: "StealC", sev: "high", status: "open", entity: "Marc Bernier", entity_kind: "person" },
  { id: "lk-006", date: "2026-05-15 09:11", title: "Combolist 1.2M — 18 correspondances @veridata.fr", source: "combo", source_name: "Telegram @breachfr", sev: "low", status: "progress", entity: "veridata.fr", entity_kind: "domain" },
  { id: "lk-007", date: "2026-05-15 08:24", title: "Typosquatting : veridota.fr enregistré", source: "brand", source_name: "DNS watch", sev: "med", status: "progress", entity: "Veridata SAS", entity_kind: "brand" },
  { id: "lk-008", date: "2026-05-14 22:11", title: "RedLine — support@veridata.fr · 4 services compromis", source: "stealer", source_name: "RedLine", sev: "high", status: "open", entity: "support@veridata.fr", entity_kind: "email" },
  { id: "lk-009", date: "2026-05-14 16:02", title: "Pastebin — extrait config Ansible Veridata", source: "paste", source_name: "Pastebin", sev: "med", status: "open", entity: "veridata.fr", entity_kind: "domain" },
  { id: "lk-010", date: "2026-05-14 12:48", title: "Telegram @leakforum_fr — vente DB CRM", source: "telegram", source_name: "Telegram", sev: "low", status: "open", entity: "veridata.fr", entity_kind: "domain" },
  { id: "lk-011", date: "2026-05-13 11:33", title: "RedLine — admin@veridata.fr · AWS keys", source: "stealer", source_name: "RedLine", sev: "high", status: "progress", entity: "admin@veridata.fr", entity_kind: "email" },
  { id: "lk-012", date: "2026-05-13 08:07", title: "BHF — recherche d'employé Veridata (initial access)", source: "dark", source_name: "BHF", sev: "low", status: "resolved", entity: "Veridata SAS", entity_kind: "brand" },
];
window.LEAKS = LEAKS;

// Detail of a single leak (Lumma stealer log #a4f2)
const LEAK_DETAIL = {
  id: "lk-001",
  title: "Stealer Lumma — log #a4f2 · 47 credentials @veridata.fr",
  source: "Lumma stealer · log batch a4f2-2026-05",
  collected: "2026-05-16 14:42 UTC+2",
  first_seen: "Discord channel privé — vendor « marlow »",
  malware_family: "Lumma C2 v4.6",
  victim_country: "France",
  victim_os: "Windows 10 22H2 · Chrome 124",
  sev: "high",
  status: "open",
  entity: "veridata.fr",
  blast_radius: "47 employés · 12 services · 3 cookies de session encore valides",
  evidence: `[Lumma stealer · log #a4f2]
SOFT:                  Chrome 124.0.6367.119
OS:                    Windows 10 Pro 22H2 (build 19045)
HWID:                  ${'A'.repeat(8)}-${'F'.repeat(4)}-91A2
COUNTRY:               FR
COLLECTED:             2026-05-16 14:42

[PASSWORDS] (extrait — 47 entrées au total)
URL:                   https://portal.veridata.fr/login
USER:                  m.bernier@veridata.fr
PW:                    ████████████████  (déchiffré, tier Pro+)

URL:                   https://o365.veridata.fr
USER:                  m.bernier@veridata.fr
PW:                    ████████████████

URL:                   https://gitlab.veridata.fr
USER:                  m.bernier
PW:                    ████████████████

[COOKIES] (3 sessions actives)
host:                  .login.microsoftonline.com
name:                  ESTSAUTHPERSISTENT
value:                 ████████████████████████████ (TTL 12 j)

host:                  .veridata.fr
name:                  _veridata_session
value:                 ████████████████████████████`,
  timeline: [
    { time: "2026-05-16 14:42", title: "Détection LeakX",         desc: "Match identifié dans le log a4f2 — domaine veridata.fr.", crit: true,  active: true },
    { time: "2026-05-16 14:43", title: "Alerte critique émise",   desc: "Webhook Slack #soc-alerts + email à l'équipe SOC.",       crit: false, active: false },
    { time: "2026-05-16 14:45", title: "Enrichissement HUMINT",   desc: "Vendor « marlow » identifié sur 4 canaux Telegram.",      crit: false, active: false },
    { time: "2026-05-16 14:58", title: "Notification utilisateurs",desc: "47 utilisateurs notifiés via portail self-service.",    crit: false, active: false },
    { time: "2026-05-16 15:02", title: "Force-reset Entra ID",    desc: "Playbook automatisé — révocation tokens en cours.",      crit: false, active: false },
  ],
  affected: [
    { name: "Marc Bernier", role: "CFO",          email: "m.bernier@veridata.fr", services: 8, cookies: 2 },
    { name: "Léa Garnier",  role: "Resp. compta", email: "l.garnier@veridata.fr", services: 5, cookies: 1 },
    { name: "Hugo Petit",   role: "DevOps",        email: "h.petit@veridata.fr",   services: 7, cookies: 0 },
    { name: "+ 44 autres",  role: "",              email: "",                       services: 0, cookies: 0, more: true },
  ],

  // ---------- Kill chain (Lockheed Martin + custom) ----------
  kill_chain: [
    { id: "recon",    label: "Reconnaissance",   sub: "Ciblage francophone B2B",        date: "2026-03 → 2026-05", state: "done", actor: "marlow",  ioc: 4 },
    { id: "weapon",   label: "Armement",         sub: "Lumma v4.6 + builder custom",     date: "2026-04-22",         state: "done", actor: "marlow",  ioc: 2 },
    { id: "deliver",  label: "Livraison",        sub: "Crack Adobe sur YouTube SEO",      date: "2026-05-10 → 14",    state: "done", actor: "—",       ioc: 6 },
    { id: "exploit",  label: "Exploitation",     sub: "Exec local par utilisateur",       date: "2026-05-14",         state: "done", actor: "victime", ioc: 3 },
    { id: "c2",       label: "Command & Control", sub: "C2 Lumma → host EU-Lithuania",    date: "2026-05-14 16:02",   state: "done", actor: "marlow",  ioc: 5 },
    { id: "exfil",    label: "Exfiltration",      sub: "238 credentials + 3 cookies",     date: "2026-05-14 16:08",   state: "done", actor: "marlow",  ioc: 7 },
    { id: "monet",    label: "Monétisation",      sub: "Vente sur Telegram @breachfr",    date: "2026-05-16 12:30",   state: "done", actor: "marlow",  ioc: 2, leakx: true },
    { id: "post",     label: "Post-exploitation", sub: "Risque : bypass MFA via cookies", date: "À surveiller",        state: "next", actor: "?",       ioc: 0 },
  ],

  // ---------- IOCs ----------
  iocs: [
    { type: "sha256",  value: "9c1a3f7b8d4e6c2a5f9b1d3e7c8f4a6b2d9e1f5c3a7b8d2e4f6c9a1b3d5e7f2c", desc: "Lumma stealer payload", conf: 95 },
    { type: "sha256",  value: "f2e8d4b6c1a3e9f7b5d2c8a4f6e1b3d9c7a5f2e4b8d6c1a3f9e7b5d2c8a4f6e1", desc: "Builder Lumma v4.6", conf: 92 },
    { type: "domain",  value: "free-adobe-2026.xyz",               desc: "Page de phishing / dropper",  conf: 90 },
    { type: "domain",  value: "marlow-shop.onion",                  desc: "Vente directe (Tor)",          conf: 88 },
    { type: "ip",      value: "185.220.101.42",                     desc: "C2 Lumma · EU-LT",             conf: 96 },
    { type: "ip",      value: "192.42.116.179",                     desc: "Tor exit utilisé",             conf: 70 },
    { type: "url",     value: "https://free-adobe-2026.xyz/setup.exe", desc: "Dropper URL",               conf: 94 },
    { type: "email",   value: "marlow.shop@protonmail.com",         desc: "Contact vendeur",              conf: 75 },
    { type: "btc",     value: "bc1qxy2kgdygjrsqtzq2n0yrf249...",    desc: "Wallet réception paiements",  conf: 82 },
    { type: "tg",      value: "@breachfr_marlow",                   desc: "Canal Telegram vente",         conf: 91 },
  ],

  // ---------- MITRE ATT&CK techniques used ----------
  mitre: [
    { id: "T1583.001", tac: "Resource Dev", name: "Acquire Infrastructure: Domains", used: true },
    { id: "T1566.002", tac: "Initial Access", name: "Phishing: Spearphishing Link", used: true },
    { id: "T1204.002", tac: "Execution", name: "User Execution: Malicious File", used: true },
    { id: "T1555.003", tac: "Credential Access", name: "Credentials from Web Browsers", used: true, key: true },
    { id: "T1539",     tac: "Credential Access", name: "Steal Web Session Cookie",      used: true, key: true },
    { id: "T1552.001", tac: "Credential Access", name: "Credentials In Files",          used: true },
    { id: "T1071.001", tac: "Command & Control", name: "Application Layer: Web Protocols", used: true },
    { id: "T1041",     tac: "Exfiltration", name: "Exfiltration Over C2 Channel",       used: true },
    { id: "T1567.002", tac: "Exfiltration", name: "Exfiltration to Cloud Storage",      used: false },
    { id: "T1078.004", tac: "Persistence",  name: "Valid Accounts: Cloud Accounts",     used: false, next: true },
  ],

  // ---------- Threat actor profile ----------
  actor: {
    handle: "marlow",
    aka: ["marlow_shop", "@breachfr_marlow", "marlow.shop"],
    first_seen: "Avril 2024",
    last_active: "Il y a 38 min",
    confidence: 92,
    sophistication: "Intermédiaire",
    motivation: "Lucrative",
    region: "Europe de l'Est (probable)",
    bio: "Vendeur historique de logs Lumma et StealC, spécialisé sur cibles francophones B2B. Réputation positive sur 4 forums (47 retours vendeur). Tarif moyen : 0,8 € / log B2B, 0,2 € / log B2C. Inactivité du week-end (probable opérateur unique).",
    channels: [
      { name: "@breachfr_marlow",     type: "telegram", followers: "2.4k", verified: true },
      { name: "XSS.is · u/marlow",    type: "forum",    rep: "+47 / -2",   verified: true },
      { name: "marlow-shop.onion",   type: "shop",     status: "online",  verified: true },
      { name: "BHF · marlow_2024",   type: "forum",    rep: "+18 / -0",   verified: false },
    ],
    recent_listings: [
      { date: "2026-05-16", title: "Batch a4f2 · 12 400 logs FR", price: "9 920 €" },
      { date: "2026-05-11", title: "Logs FR finance · 850 entrées", price: "680 €" },
      { date: "2026-05-04", title: "Combolist FR e-commerce · 4 200", price: "120 €" },
      { date: "2026-04-28", title: "RDP accès TPE/PME FR (3 ventes)", price: "1 400 €" },
    ],
  },

  // ---------- Related leaks ----------
  related: [
    { id: "lk-005", title: "StealC — session O365 + cookies du CFO",        sev: "high", source: "stealer", reason: "Même victime (Marc Bernier)", date: "il y a 1 j" },
    { id: "lk-011", title: "RedLine — admin@veridata.fr · AWS keys",         sev: "high", source: "stealer", reason: "Même périmètre · pattern Lumma similaire", date: "il y a 3 j" },
    { id: "lk-006", title: "Combolist 1.2M — 18 correspondances @veridata.fr", sev: "low",  source: "combo",   reason: "Sortie du même vendor « marlow »", date: "hier" },
    { id: "lk-009", title: "Pastebin — extrait config Ansible Veridata",     sev: "med",  source: "paste",   reason: "Référencé dans le même thread XSS.is", date: "il y a 2 j" },
  ],

  // ---------- SOC notes ----------
  notes: [
    { author: "Camille Roux", role: "RSSI",     when: "il y a 12 min", text: "Force-reset déclenché sur les 47 comptes. Surveillance accrue pendant 72h." },
    { author: "Antoine Mira", role: "SOC L2",   when: "il y a 28 min", text: "Cookies ESTSAUTH révoqués via Entra ID. CFO contacté téléphone pour rotation MDP manuelle." },
    { author: "LeakX bot",    role: "Auto",     when: "il y a 1 h",    text: "Corrélation auto : 3 logs supplémentaires détectés du même batch a4f2 → ouvre lk-013, lk-014, lk-015." },
  ],
};
window.LEAK_DETAIL = LEAK_DETAIL;

// Sidebar nav structure
const SIDE_NAV = [
  { group: "Surveillance", items: [
    { id: "overview",   label: "Vue d'ensemble",  icon: "grid" },
    { id: "identities", label: "Identités",       icon: "user", count: 11 },
    { id: "leaks",      label: "Fuites",          icon: "alert", count: 47, alert: true },
    { id: "alerts",     label: "Alertes",         icon: "bell", count: 8, alert: true },
  ]},
  { group: "Sources", items: [
    { id: "stealer",  label: "Stealer logs", icon: "stealer" },
    { id: "telegram", label: "Telegram",     icon: "telegram" },
    { id: "darkweb",  label: "Dark web",     icon: "dark" },
    { id: "ransom",   label: "Ransomware",   icon: "ransom" },
  ]},
  { group: "Configuration", items: [
    { id: "integrations", label: "Intégrations", icon: "plug" },
    { id: "api",          label: "API & clés",   icon: "key" },
    { id: "team",         label: "Équipe",       icon: "users" },
    { id: "settings",     label: "Paramètres",   icon: "cog" },
  ]},
];
window.SIDE_NAV = SIDE_NAV;
