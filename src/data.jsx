// Live mock data for the terminal feed and search results

const TERMINAL_FEED = {
  fr: [
    { sev: "high", time: "now",   text: ["Stealer log RedLine — ", { mute: "238 credentials @atos.net" }], src: "stealer" },
    { sev: "med",  time: "12s",   text: ["Nouveau dump combolist — ", { mute: "1.2M emails, sources mixtes" }], src: "combo" },
    { sev: "high", time: "34s",   text: ["LockBit 4.0 — ", { mute: "ajout victime « groupe-cosmétique-fr »" }], src: "ransom" },
    { sev: "low",  time: "51s",   text: ["Telegram @breachfr — ", { mute: "vente DB e-commerce mobilier" }], src: "telegram" },
    { sev: "med",  time: "1m",    text: ["XSS.is — ", { mute: "thread initial access banque privée FR" }], src: "dark" },
    { sev: "high", time: "1m 22s",text: ["Lumma stealer — ", { mute: "457 credentials @assurance-*.fr" }], src: "stealer" },
    { sev: "low",  time: "2m",    text: ["Pastebin — ", { mute: "AKIA... fuite GitHub indexée" }], src: "paste" },
    { sev: "med",  time: "2m 14s",text: ["RaidForums clone — ", { mute: "vente accès RDP collectivité" }], src: "dark" },
    { sev: "high", time: "3m",    text: ["StealC — ", { mute: "cookies de session O365 entreprise CAC40" }], src: "stealer" },
  ],
  en: [
    { sev: "high", time: "now",   text: ["RedLine stealer log — ", { mute: "238 credentials @atos.net" }], src: "stealer" },
    { sev: "med",  time: "12s",   text: ["New combolist dump — ", { mute: "1.2M emails, mixed sources" }], src: "combo" },
    { sev: "high", time: "34s",   text: ["LockBit 4.0 — ", { mute: "new victim « fr-cosmetic-group »" }], src: "ransom" },
    { sev: "low",  time: "51s",   text: ["Telegram @breachfr — ", { mute: "DB sale, furniture e-commerce" }], src: "telegram" },
    { sev: "med",  time: "1m",    text: ["XSS.is — ", { mute: "initial access thread, FR private bank" }], src: "dark" },
    { sev: "high", time: "1m 22s",text: ["Lumma stealer — ", { mute: "457 credentials @insurance-*.fr" }], src: "stealer" },
    { sev: "low",  time: "2m",    text: ["Pastebin — ", { mute: "AKIA... leaked GitHub indexed" }], src: "paste" },
    { sev: "med",  time: "2m 14s",text: ["RaidForums clone — ", { mute: "RDP access for sale, gov body" }], src: "dark" },
    { sev: "high", time: "3m",    text: ["StealC — ", { mute: "O365 session cookies, CAC40 firm" }], src: "stealer" },
  ],
};
window.TERMINAL_FEED = TERMINAL_FEED;

// Mock search results keyed by target type
const MOCK_RESULTS = {
  email: {
    fr: {
      target: "jean.dupont@entreprise.fr",
      summary: { breaches: 7, stealer: 2, telegram: 3, severity: "Élevée" },
      rows: [
        { date: "2026-04-12", name: "Stealer log RedLine — mot de passe Office 365 + cookies session", tag: "high", tagLabel: "Critique" },
        { date: "2026-02-03", name: "Breach corpus « collection-77 » — hash bcrypt + sel", tag: "med", tagLabel: "Modéré" },
        { date: "2025-11-28", name: "Telegram @leakforum_fr — combolist 230k entrées", tag: "med", tagLabel: "Modéré" },
        { date: "2025-09-14", name: "LinkedIn 2024 — email + numéro de poste", tag: "low", tagLabel: "Faible" },
        { date: "2025-06-02", name: "DropMail — fuite plateforme RH (tier Pro)", tag: "blur", tagLabel: "Verrouillé" },
      ],
    },
    en: {
      target: "jane.doe@company.fr",
      summary: { breaches: 7, stealer: 2, telegram: 3, severity: "High" },
      rows: [
        { date: "2026-04-12", name: "RedLine stealer log — Office 365 password + session cookies", tag: "high", tagLabel: "Critical" },
        { date: "2026-02-03", name: "Breach corpus « collection-77 » — bcrypt hash + salt", tag: "med", tagLabel: "Medium" },
        { date: "2025-11-28", name: "Telegram @leakforum_fr — 230k entry combolist", tag: "med", tagLabel: "Medium" },
        { date: "2025-09-14", name: "LinkedIn 2024 — email + job title", tag: "low", tagLabel: "Low" },
        { date: "2025-06-02", name: "DropMail — HR platform leak (Pro tier)", tag: "blur", tagLabel: "Locked" },
      ],
    },
  },
  domain: {
    fr: {
      target: "entreprise.fr",
      summary: { breaches: 142, stealer: 38, telegram: 11, severity: "Très élevée" },
      rows: [
        { date: "2026-04-22", name: "47 comptes employés exposés via stealer Lumma", tag: "high", tagLabel: "Critique" },
        { date: "2026-04-10", name: "Mention sur ransomware leak site « Akira »", tag: "high", tagLabel: "Critique" },
        { date: "2026-03-18", name: "DNS — sous-domaine compromis pointé typosquatting", tag: "med", tagLabel: "Modéré" },
        { date: "2026-02-01", name: "Telegram — credentials @comptable.entreprise.fr", tag: "med", tagLabel: "Modéré" },
        { date: "2025-12-09", name: "Code source partiel sur paste (tier Pro)", tag: "blur", tagLabel: "Verrouillé" },
      ],
    },
    en: {
      target: "company.fr",
      summary: { breaches: 142, stealer: 38, telegram: 11, severity: "Very high" },
      rows: [
        { date: "2026-04-22", name: "47 employee accounts exposed via Lumma stealer", tag: "high", tagLabel: "Critical" },
        { date: "2026-04-10", name: "Mention on « Akira » ransomware leak site", tag: "high", tagLabel: "Critical" },
        { date: "2026-03-18", name: "DNS — compromised subdomain → typosquatting", tag: "med", tagLabel: "Medium" },
        { date: "2026-02-01", name: "Telegram — credentials @finance.company.fr", tag: "med", tagLabel: "Medium" },
        { date: "2025-12-09", name: "Partial source code on paste (Pro tier)", tag: "blur", tagLabel: "Locked" },
      ],
    },
  },
  username: {
    fr: {
      target: "@jdupont",
      summary: { breaches: 3, stealer: 1, telegram: 0, severity: "Modérée" },
      rows: [
        { date: "2025-08-14", name: "Forum FR — pseudo réutilisé sur Reddit + DB Disqus", tag: "med", tagLabel: "Modéré" },
        { date: "2025-07-02", name: "Steam 2023 — fuite handle + email associé", tag: "low", tagLabel: "Faible" },
        { date: "2024-11-19", name: "Stealer log — historique navigation (tier Pro)", tag: "blur", tagLabel: "Verrouillé" },
      ],
    },
    en: {
      target: "@jdoe",
      summary: { breaches: 3, stealer: 1, telegram: 0, severity: "Medium" },
      rows: [
        { date: "2025-08-14", name: "FR forum — handle reused on Reddit + Disqus DB", tag: "med", tagLabel: "Medium" },
        { date: "2025-07-02", name: "Steam 2023 — handle + linked email leak", tag: "low", tagLabel: "Low" },
        { date: "2024-11-19", name: "Stealer log — browsing history (Pro tier)", tag: "blur", tagLabel: "Locked" },
      ],
    },
  },
  phone: {
    fr: {
      target: "+33 6 12 34 56 78",
      summary: { breaches: 4, stealer: 0, telegram: 2, severity: "Modérée" },
      rows: [
        { date: "2026-01-20", name: "Combolist Telegram — numéro + email associé", tag: "med", tagLabel: "Modéré" },
        { date: "2025-09-11", name: "Doctolib — données patient hors-périmètre", tag: "high", tagLabel: "Critique" },
        { date: "2025-04-03", name: "Facebook 2021 — fuite globale", tag: "low", tagLabel: "Faible" },
      ],
    },
    en: {
      target: "+33 6 12 34 56 78",
      summary: { breaches: 4, stealer: 0, telegram: 2, severity: "Medium" },
      rows: [
        { date: "2026-01-20", name: "Telegram combolist — number + linked email", tag: "med", tagLabel: "Medium" },
        { date: "2025-09-11", name: "Doctolib — off-perimeter patient data", tag: "high", tagLabel: "Critical" },
        { date: "2025-04-03", name: "Facebook 2021 — global leak", tag: "low", tagLabel: "Low" },
      ],
    },
  },
  company: {
    fr: {
      target: "Société exemple SAS",
      summary: { breaches: 28, stealer: 12, telegram: 6, severity: "Élevée" },
      rows: [
        { date: "2026-04-29", name: "Initial access broker — vente RDP citrix interne", tag: "high", tagLabel: "Critique" },
        { date: "2026-03-15", name: "Mention sur forum XSS — recherche d'employé pivot", tag: "med", tagLabel: "Modéré" },
        { date: "2026-01-08", name: "Stealer log — 12 comptes administrateurs", tag: "high", tagLabel: "Critique" },
        { date: "2025-12-02", name: "Telegram — facturation reproduite (phishing)", tag: "med", tagLabel: "Modéré" },
      ],
    },
    en: {
      target: "Example Company SAS",
      summary: { breaches: 28, stealer: 12, telegram: 6, severity: "High" },
      rows: [
        { date: "2026-04-29", name: "Initial access broker — internal Citrix RDP sale", tag: "high", tagLabel: "Critical" },
        { date: "2026-03-15", name: "XSS forum mention — looking for pivot employee", tag: "med", tagLabel: "Medium" },
        { date: "2026-01-08", name: "Stealer log — 12 admin accounts", tag: "high", tagLabel: "Critical" },
        { date: "2025-12-02", name: "Telegram — invoices replicated (phishing)", tag: "med", tagLabel: "Medium" },
      ],
    },
  },
  ip: {
    fr: {
      target: "203.0.113.0/24",
      summary: { breaches: 6, stealer: 2, telegram: 1, severity: "Modérée" },
      rows: [
        { date: "2026-04-25", name: "Shodan — exposition Citrix Gateway non patchée", tag: "high", tagLabel: "Critique" },
        { date: "2026-02-28", name: "Tor exit — scan agressif vers ce /24", tag: "med", tagLabel: "Modéré" },
        { date: "2025-12-14", name: "Liste C2 historique — IP éphémère trojan", tag: "low", tagLabel: "Faible" },
      ],
    },
    en: {
      target: "203.0.113.0/24",
      summary: { breaches: 6, stealer: 2, telegram: 1, severity: "Medium" },
      rows: [
        { date: "2026-04-25", name: "Shodan — unpatched Citrix Gateway exposed", tag: "high", tagLabel: "Critical" },
        { date: "2026-02-28", name: "Tor exit — aggressive scan towards /24", tag: "med", tagLabel: "Medium" },
        { date: "2025-12-14", name: "Historical C2 list — trojan ephemeral IP", tag: "low", tagLabel: "Low" },
      ],
    },
  },
};
window.MOCK_RESULTS = MOCK_RESULTS;

// Example values for hint chips
const HINT_EXAMPLES = {
  email: ["jean.dupont@entreprise.fr", "ceo@cac40.fr"],
  domain: ["entreprise.fr", "*.gouv.fr"],
  username: ["@jdupont", "leaker_x"],
  phone: ["+33 6 12 34 56 78"],
  company: ["Société exemple SAS"],
  ip: ["203.0.113.0/24", "AS3215"],
};
window.HINT_EXAMPLES = HINT_EXAMPLES;
