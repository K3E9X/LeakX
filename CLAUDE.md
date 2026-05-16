# LeakX — guide pour Claude Code

> **Tu travailles sur LeakX**, une plateforme française de Cyber Threat Intelligence (CTI) souveraine, focalisée sur les fuites de données (leaks) touchant les organisations francophones. Ce document est ta source de vérité produit + technique. Lis-le entièrement avant toute action.

---

## 0 · Contexte produit (à comprendre avant tout)

### Mission
LeakX agrège et restitue en temps quasi-réel les fuites de données qui touchent une organisation : credentials volés via stealer logs (RedLine, Lumma, StealC), mentions sur le dark web francophone (BHF, XSS.is, Exploit.in), vente de bases sur Telegram, leak sites de ransomware (LockBit, Akira…), combolists, paste sites.

### Cibles clients
- **Communautaire (gratuit)** : indépendants, freelances, associations — surveillance d'1 email + 1 domaine.
- **Pro (149€/mois, 127€/mois annuel)** : PME, ETI, équipes RSSI/SOC — jusqu'à 25 domaines, API, alertes temps réel, essai 14 jours sans CB.
- **Entreprise (sur devis)** : CAC40, OIV, OSE, MSSP — SSO SAML/SCIM, RBAC fin, intégrations sur mesure, export S3 long terme, hébergement Scaleway souverain.

### Différenciants clés
1. **Souveraineté FR** : hébergement Scaleway Paris/Amsterdam, contrat de droit français, **aucun transfert hors UE** (pas de Cloud Act).
2. **Rétention 30 jours max** côté LeakX (principe de minimisation RGPD). Pour conservation longue → export S3 vers le tenant client (option Entreprise).
3. **Focus francophone** : couverture intensive des forums et canaux Telegram FR (4 100+ canaux surveillés).
4. **API native** + SDKs Python, Go, JS dès le tier Pro.

### Concurrents à surveiller
- International : Flare, KELA, Cyble, IntelX, Recorded Future, HaveIBeenPwned (gratuit).
- France/UE : CybelAngel, Sekoia, Tehtris.

### Ce qu'on N'EST PAS et ne sera PAS
- ❌ Pas un outil de doxxing : tout client doit prouver qu'il administre le périmètre cherché (KYB obligatoire).
- ❌ Pas un acheteur de données auprès de criminels : on ingère uniquement des corpus déjà publics/semi-publics.
- ❌ Pas SecNumCloud qualifié soi-même (au début) : on peut être *"hébergé sur infrastructure SecNumCloud"* via Scaleway, mais pas plus.
- ❌ Pas un outil de pentest ni un proxy d'attaque.

---

## 1 · État actuel du projet (ce qui existe)

Le repo contient un **prototype haute-fidélité React+HTML** (pas encore Next.js), couvrant tout le parcours utilisateur :

| Fichier HTML | Contenu | État |
|---|---|---|
| `index.html` | Landing page bilingue FR/EN (hero, stats, sources, how it works, use cases, pricing 3-tiers, souveraineté, FAQ, CTA, footer) | ✅ design final |
| `Dashboard.html` | Espace client connecté (sidebar, topbar, vue d'ensemble, identités, fuites, détail enrichi d'un leak) | ✅ design final |
| `Signup.html` | Tunnel d'inscription multi-étapes (plan → compte → vérification domaine TXT DNS → paiement Stripe → succès avec API key) | ✅ design final |
| `Docs.html` | Documentation API publique (intro, quickstart, auth, endpoints, webhooks, SDKs) | ✅ design final |
| `Logos.html` | Exploration logo (à archiver, plus utile) | 🗄️ référence |

### Stack frontend actuel (à migrer)
- React 18 chargé en CDN + JSX inline via `@babel/standalone`
- Pas de bundler, pas de TypeScript
- CSS vanilla avec variables CSS (design tokens)
- Le frontend et la direction artistique sont figés (faits par Claude Design) — **ne pas y toucher**, on travaille le fond

### Backend (`api/`) — amorcé
- FastAPI + SQLModel (Pydantic v2), SQLite en dev / PostgreSQL en prod
- Modèle de données **provenance-first** : `source_id` + `source_ref` obligatoires sur chaque observation
- Endpoints branchés sur de vraies données : lecture (`/v1/sources`, `/v1/leaks`, `/v1/search`) + KYB (`/v1/monitors` + vérification de domaine par DNS TXT) + clés API (`/v1/keys`)
- Authentification Bearer : clés `lkx_{live,test,readonly}_…`, secret haché Argon2id, recherche hors périmètre rejetée (`403 outside_scope`)
- Collecteurs : `CERT-FR` (avis officiels ANSSI), `ransomware.live` (revendications de victimes ransomware)
- Cron de purge 30 jours implémenté (`purge_expired`)
- Voir `api/README.md`

### **À faire** côté design (optionnel, peuvent attendre)
- [ ] Page **404** dédiée
- [ ] Page **Login** standalone (actuellement le bouton "Connexion" pointe sur le Dashboard)
- [ ] Pages **légales** : mentions légales, CGU, politique de confidentialité, RGPD (templates CNIL adaptables)
- [ ] Page **Status** publique (`status.leakx.fr` style)
- [ ] **Pricing comparator** côte à côte vs HaveIBeenPwned / IntelX
- [ ] **Onboarding tour** dans le dashboard (1ère connexion)
- [ ] **Empty states** dans le dashboard (clients sans leak)
- [ ] **Page intégrations détaillées** (Splunk, Sentinel, TheHive, etc.)
- [ ] Détails des écrans placeholders du dashboard (Alertes, Stealer logs, Telegram, Dark web, Ransomware, Intégrations, API, Équipe, Paramètres)

---

## 2 · Architecture cible (pour la migration)

### Monorepo recommandé
```
leakx-platform/
├── apps/
│   ├── web/                   # Next.js 15 (App Router, RSC, Server Actions)
│   │   ├── app/
│   │   │   ├── (marketing)/   # /, /docs, /pricing, /legal/*
│   │   │   ├── (auth)/        # /signup, /login
│   │   │   ├── (app)/         # /dashboard, /dashboard/leaks/[id]
│   │   │   └── api/           # routes proxy vers l'API Go
│   │   └── components/
│   ├── api/                   # Go (Fiber ou Echo) ou Python (FastAPI)
│   │   ├── cmd/
│   │   ├── internal/
│   │   │   ├── auth/          # JWT, Bearer tokens, KYB
│   │   │   ├── search/        # OpenSearch queries
│   │   │   ├── monitors/      # CRUD + DNS verification
│   │   │   ├── alerts/        # webhook delivery
│   │   │   ├── billing/       # Stripe webhooks
│   │   │   └── retention/     # cron purge >30j
│   │   └── migrations/
│   ├── collectors/            # Workers OSINT (Python)
│   │   ├── telegram/          # Telethon → Telegram FR channels
│   │   ├── darkweb/           # Tor headless → BHF, XSS.is, Exploit.in
│   │   ├── stealer/           # Ingestion corpus stealer logs
│   │   ├── paste/             # Pastebin, Doxbin, ghost
│   │   ├── ransomware/        # Tor scrapers leak sites
│   │   └── normalizer/        # STIX 2.1, dédup, scoring
│   └── docs/                  # MkDocs ou Mintlify pour docs publiques
├── packages/
│   ├── ui/                    # Composants React partagés (extraits du proto)
│   ├── sdk-ts/                # SDK TypeScript publié sur npm
│   ├── sdk-py/                # SDK Python publié sur PyPI
│   └── sdk-go/                # SDK Go
├── infra/
│   ├── scaleway/              # Terraform pour Scaleway
│   └── k8s/                   # Manifests Kapsule (Scaleway K8s)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── RGPD.md
│   └── ADR/                   # Architecture Decision Records
└── CLAUDE.md                  # ce fichier
```

### Stack technique recommandée

| Couche | Choix | Pourquoi |
|---|---|---|
| Frontend | **Next.js 15** + App Router + Tailwind v4 | RSC pour SEO/perf, server actions pour mutations, écosystème |
| Backend API | **Go (Fiber/Echo)** _ou_ **Python (FastAPI)** | Go pour perf/concurrence, FastAPI pour vélocité + écosystème ML |
| DB métier | **PostgreSQL** (Scaleway Managed) | Standard, tooling, JSONB pour métadonnées |
| Search / analytique | **PostgreSQL** (`tsvector` + `pg_trgm`) au lancement ; **ClickHouse** auto-hébergé Scaleway en montée en charge | Éviter d'opérer un 2ᵉ datastore en solo. ClickHouse ensuite : colonne, TTL natif = rétention 30 j, idéal ingestion massive. OpenSearch seulement si la recherche fuzzy devient un besoin produit. ClickHouse Cloud exclu (AWS/GCP → casse la souveraineté) |
| Cache + queues | **Redis** + **NATS** | Cache, rate-limiting, pub/sub pour les alertes |
| Object storage | **Scaleway Object Storage** (S3-compat) | Raw payloads, exports clients, conformité localisation |
| Auth | **Clerk** ou **WorkOS** | SSO SAML/SCIM pour Entreprise sans réinventer |
| Billing | **Stripe** | Tarifs catalogue, portail client, webhooks |
| Monitoring | **Grafana Cloud** + **Loki** + **Tempo** | Tout-en-un, logs+metrics+traces |
| Errors | **Sentry** | Self-host EU si besoin compliance |
| CI/CD | **GitHub Actions** + **Scaleway Container Registry** | Standard |
| IaC | **Terraform** | Provisionning reproductible |

### Conventions de code
- **TypeScript strict** partout en frontend (`"strict": true`, pas de `any`)
- **ESLint + Prettier** (config Anthropic-style, single quotes JS, tabs OFF)
- **Conventional Commits** : `feat(api): add /v1/monitors GET endpoint`
- **Branches** : `main` (protégée, déploiement prod) + feature branches → PR avec review
- **Tests** : Vitest pour TS, pytest pour Python, table-driven en Go. Couverture min 70% sur la logique métier
- **API versioning** : `/v1`, breaking changes annoncés 6 mois à l'avance
- **IDs préfixés par ressource** : `lk_` (leak), `mon_` (monitor), `evt_` (event), `usr_`, `org_`, `key_`

---

## 3 · Design system (à respecter à la migration)

### Couleurs (CSS custom properties, voir `src/styles.css`)
```css
--bg: #07090f;          /* page background */
--bg-2: #0a0e1a;        /* secondary bg (sidebars) */
--surface: #0f1320;     /* cards */
--surface-2: #131829;   /* nested */
--surface-3: #1a2034;   /* interactive surfaces */
--border: #1f2638;
--border-strong: #2a3450;
--text: #e6e9f2;
--text-mute: #8a93a6;
--text-faint: #5b6477;

--accent: #9658f7;      /* VIOLET — primary (boutons, CTAs, icônes) */
--accent-hi: #a875ff;   /* lighter violet (hovers, accents) */
--violet: #9658f7;      /* alias */
--violet-hi: #a875ff;

--blue: #3b82f6;        /* SECONDARY blue */
--title-blue: #588df7;  /* SECTION TITLES (h1, h2 .page-title) */

--danger: #ef4444;
--critical: #f43f5e;
--warn: #f59e0b;
--ok: #10b981;
```

**Règle d'or de la palette** :
- **Violet `#9658f7`** = action, identité de marque (boutons primaires, CTAs, accents `.accent`, logo, badges)
- **Bleu `#588df7`** = titres de section (`h1`, `h2`, `.page-title`)
- **Critical/red** = alertes high severity uniquement
- **Warn/amber** = medium severity
- **Ok/green** = success states, low severity
- **Pas** de gradient flashy en background autre que ceux déjà définis (halos radial-gradient)

### Typographie
- **Display** : `Space Grotesk` (titres, marques, prix)
- **Body** : `Manrope` (paragraphes, UI)
- **Mono** : `JetBrains Mono` (code, données techniques, dates, IDs)
- ⚠️ **Ne JAMAIS utiliser** : Inter, Roboto, Arial, system-ui pour les titres

### Logo
- Source de vérité : `assets/logo.svg`
- Concept : **L et X en négatif intégral** dans un carré violet dégradé (#a875ff → #6d28d9), `fill-rule="evenodd"`
- Composant React équivalent : `Icon.logo` dans `src/icons.jsx`
- Utilisé : nav landing, footer landing, sidebar dashboard, sidebar docs, favicon

### Spacing & radius
- Padding container : `clamp(20px, 4vw, 56px)` (variable `--pad`, ajustable via Tweak densité)
- Radius standard : `8px` (boutons), `10-12px` (cards), `14-16px` (cards XL)
- Gap standard : `8/12/16/24px`

### Composants clés (à porter en `packages/ui`)
- `Nav` (landing)
- `SearchCard` (multi-type : email, domain, username, phone, company, ip)
- `ResultPanel` (résultats de search avec rows de leaks)
- `Terminal` (live feed rotatif)
- `Pricing` (3 tiers + toggle mensuel/annuel)
- `FranceMap` (SVG hexagone + hotspots animés)
- `Sidebar` (dashboard et docs)
- `KillChain` (8 étapes horizontales Lockheed Martin)
- `MitreGrid` (techniques ATT&CK)
- `ActorCard` (profil threat actor)
- `CodeBlock` (multi-lang tabs + copy + syntax highlight safe)
- `KPI` (label + value mono + delta + sparkline)
- `Donut` (exposure score)
- `SevPill` / `StatusPill` (tags colorés)
- `Stepper` (multi-step signup)
- `TweaksPanel` (le panneau d'admin tweaks, optionnel en prod)

---

## 4 · Bilinguisme FR/EN

- Dictionnaire complet dans `src/i18n.jsx` (objet `I18N.fr` et `I18N.en`)
- Toggle en nav (landing seulement), persisté via Tweaks
- **Le français est la langue par défaut et l'expérience prioritaire** (marché cible : France)
- L'anglais est traduit *par* les francophones (pas en anglais natif) — adapter le ton (sobre, institutionnel, pas hype)
- À la migration vers Next.js : utiliser **`next-intl`** ou **i18n routing** (`/fr/...`, `/en/...`)

---

## 5 · Flux métier critiques

### Signup tunnel (cf. `Signup.html`)
1. Choix du plan (Communautaire / Pro / Entreprise) + toggle mensuel/annuel
2. Compte : prénom, nom, email pro (**rejet gmail/outlook/hotmail/yahoo/protonmail**), mot de passe ≥8c, société, rôle
3. **(Pro uniquement)** Vérification de domaine via TXT DNS : valeur `leakx-verification=<token>`, vérification depuis 3 résolveurs FR/DE/NL, validité 5 min pour replay protection
4. **(Pro uniquement)** Paiement Stripe : essai 14 jours sans CB requise au démarrage, débit J+14 sauf annulation
5. Succès : API key révélée **une seule fois**, format `lkx_live_<22 chars>`

### KYB (Know Your Business) — CRITIQUE pour ne pas devenir un outil de doxxing
- Tout monitor de type `domain` doit passer la vérification DNS TXT avant activation
- Tout monitor de type `email` doit appartenir à un domaine déjà vérifié
- Tout monitor de type `vip` / `brand` doit être validé manuellement par notre équipe (KYB enterprise)
- Tout monitor de type `ip` doit avoir le whois associé au domaine du client OU validation manuelle
- L'API rejette toute recherche hors périmètre avec `403 outside_scope`

### Rétention 30 jours (CRITIQUE pour le RGPD)
- **Tout** ce qui est ingéré dans la DB métier doit avoir un `expires_at = now() + 30 days`
- Un **cron de purge** tourne quotidiennement et supprime tout ce qui est expiré
- Les clients Entreprise peuvent activer un **export S3** vers leur tenant pour conserver plus longtemps (responsabilité côté client)
- **Aucune exception**, même pour les clés de chiffrement de cookies de session (qui sont d'ailleurs les plus sensibles)
- Le warning de rétention apparaît dans le détail d'un leak : *"Conservé 30 jours puis purge automatique"*

### Authentication (cf. `Docs.html#authentication`)
- Bearer token via header `Authorization: Bearer lkx_live_xxx`
- 3 types de clés :
  - `lkx_live_` — production, comptée dans le quota, peut être révoquée
  - `lkx_test_` — sandbox, données fictives, gratuit
  - `lkx_readonly_` — recherche + GET monitors seulement
- Stockage : **Argon2id** côté backend, jamais en clair après création
- Rotation : possible à tout moment depuis le dashboard

### Webhooks (cf. `Docs.html#webhooks` + `#verify-signature`)
- Header : `X-LeakX-Signature: t=<timestamp>,v1=<hmac_sha256_hex>`
- Algo : HMAC SHA-256 sur `<timestamp>.<payload_brut>`
- Replay protection : rejeter si `t` > 5 min
- Comparaison **temps constant** obligatoire (`hmac.compare_digest`, `timingSafeEqual`, etc.)
- Retry avec backoff exponentiel pendant 24h, max 12 tentatives
- Events : `leak.detected`, `leak.resolved`, `monitor.verified`, `actor.observed`, `quota.warning`

### Rate limits
| Tier | RPM | Quota mensuel | Burst |
|---|---|---|---|
| Communautaire | 10 | 100 | 20 |
| Pro | 60 | 10 000 | 300 |
| Entreprise | illimité | illimité | illimité |

- Headers de réponse : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- En dépassement : HTTP 429 + `Retry-After: <seconds>`
- Les SDKs implémentent le backoff automatique

---

## 6 · API REST (contrats à implémenter)

Base URL : `https://api.leakx.fr/v1`

### Endpoints (cf. `Docs.html` pour le détail)
```
POST   /v1/search                   # Recherche multi-type
GET    /v1/monitors                 # Liste des monitors
POST   /v1/monitors                 # Créer un monitor (avec DNS verif si domain)
GET    /v1/monitors/:id             # Récupérer un monitor
DELETE /v1/monitors/:id             # Supprimer

GET    /v1/leaks                    # Liste paginée des leaks du périmètre
GET    /v1/leaks/:id                # Détail enrichi (IOCs, kill chain, MITRE, actor)
POST   /v1/leaks/:id/resolve        # Marquer comme résolu

GET    /v1/alerts                   # Alertes ouvertes
PATCH  /v1/alerts/:id               # Update status

GET    /v1/identities               # Entités surveillées
POST   /v1/identities               # Ajouter

POST   /v1/webhooks                 # Créer un webhook
GET    /v1/webhooks                 # Liste
DELETE /v1/webhooks/:id

GET    /v1/keys                     # Liste des API keys
POST   /v1/keys                     # Générer une nouvelle clé
DELETE /v1/keys/:id                 # Révoquer

GET    /v1/usage                    # Quota consommé du mois en cours

GET    /v1/events                   # SSE stream pour temps réel
```

### Format de réponse standard
```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_xxx",
    "duration_ms": 42
  }
}
```

### Format d'erreur
```json
{
  "error": {
    "code": "outside_scope",
    "message": "The queried entity is not in your verified perimeter.",
    "request_id": "req_xxx"
  }
}
```

### Codes d'erreur métier
- `unauthorized` (401) — clé manquante/invalide
- `forbidden` (403) — accès refusé
- `outside_scope` (403) — entité hors périmètre vérifié
- `not_found` (404)
- `rate_limited` (429)
- `validation_error` (422)
- `payment_required` (402) — quota dépassé, upgrade nécessaire
- `internal_error` (500)

---

## 7 · Mock data (à remplacer)

Toutes les données fictives sont centralisées dans :
- `src/data.jsx` — feed terminal, résultats de search, hint examples (landing)
- `src/dashboard/data.jsx` — ORG, USER, EXPOSURE, KPIS, TIMELINE, ALERTS, IDENTITIES, LEAKS, LEAK_DETAIL avec kill chain + IOCs + MITRE + actor + related + notes
- `src/docs/content.jsx` — code samples par endpoint + section prose

L'organisation fictive utilisée partout : **Veridata SAS** (`veridata.fr`), utilisateur **Camille Roux (RSSI)**. Si tu changes ces valeurs, change-les partout en cohérence.

Le vendor d'exemple dans le détail d'un leak : **« marlow »** — vendeur historique Lumma/StealC francophone. Sert d'archétype pour le profil threat actor.

---

## 8 · Tweaks (panneau admin dev)

Le panneau Tweaks (toolbar en haut à droite en mode dev) expose :
- **Langue** : `fr` / `en`
- **Couleur d'accent** : 5 swatches (violet par défaut, bleu, cyan, vert, rose)
- **Densité** : `compact` / `regular` / `comfy` (ajuste `--pad`)
- **Variante du hero** : `search` (défaut) / `counter` (compteur géant) / `map` (carte FR) / `terminal` (full-bleed)

**Décision produit** : on garde la variante `search` en production. Les autres variantes sont des A/B tests potentiels après l'alpha.

À la migration :
- Soit retirer le `TweaksPanel` du build prod (env flag)
- Soit le garder derrière un feature flag `admin`

---

## 9 · Conformité & légal (NE PAS SAUTER)

Ces étapes sont **obligatoires** avant le 1er client payant :

### À faire J0–J30
0. ☐ **Nom de domaine** — vérifier l'absence de marque déposée (recherche INPI) et la disponibilité, puis acheter `leakx.fr` (prioritaire) + `.com` en défensif, via un registrar FR (Scaleway Domains / OVH / Gandi). **Prérequis** à la vérification KYB DNS TXT, aux emails `dpo@`/`privacy@leakx.fr`, au TLS et au déploiement public. ~15 €/an.
1. ☐ Avocat privacy — adapter templates CGU + Politique de confidentialité (Doctrine, LegalPlace, ~500€)
2. ☐ Registre RGPD (template CNIL gratuit) — 1 journée à remplir
3. ☐ DPO externe mutualisé — Dastra ou DPO-Consulting (~200€/mois)
4. ☐ Mention du DPO sur le site (footer)
5. ☐ Cookies banner conforme CNIL (Axeptio ou maison)
6. ☐ Email de support `privacy@leakx.fr` + `dpo@leakx.fr`
7. ☐ Politique de retention écrite et publiée
8. ☐ Stripe : passer en mode prod, fournir KBIS, RIB

### Garanties techniques à coder/documenter
- ☐ **Hash Argon2id** pour les API keys (jamais en clair après création)
- ☐ **Mots de passe leakés stockés HASHÉS** dans notre DB (SHA-256 minimum, jamais en clair sauf si présentation transitoire via API authentifiée Pro+)
- ☐ **AES-256 au repos** (Scaleway Object Storage + Postgres chiffrement)
- ☐ **TLS 1.3** en transit minimum
- ☐ **Audit log immuable** (chaque action sensible : création monitor, accès API key, export → log signé)
- ☐ **Isolation par tenant** (row-level security Postgres + bucket S3 dédié pour Entreprise)
- ☐ **Cron de purge 30 jours** + traçabilité de la suppression

### Articles de loi pertinents
- **Art. 4 RGPD** (définitions : donnée personnelle inclut un email)
- **Art. 6 RGPD** (base légale : intérêt légitime pour la sécurité)
- **Art. 32 RGPD** (sécurité du traitement)
- **Art. 226-22 Code pénal** (sanctions pour atteinte aux données — important : ne JAMAIS stocker un mot de passe en clair)
- **Loi Godfrain** (intrusion système — on ne tente JAMAIS de pénétrer un système)
- **Directive NIS2** (s'applique aux clients OIV/OSE — préparer un DDQ standard)

---

## 10 · Roadmap technique (3-6-12 mois)

### Sprint 1-2 (semaines 1-4) — Migration du frontend
- Setup monorepo (Turborepo ou Bun workspaces)
- Next.js 15 + App Router + Tailwind v4 + shadcn/ui (porter les composants du proto)
- next-intl pour FR/EN
- Auth Clerk ou WorkOS (mode test)
- Tunnel signup en server actions

### Sprint 3-4 — Backend de base
- Go (Fiber) ou Python (FastAPI) — choisir et coller
- Postgres Scaleway + migrations (Goose ou Alembic)
- Auth Bearer + KYB DNS TXT
- 1ers endpoints : POST /search (mock), GET /monitors, POST /monitors

### Sprint 5-6 — 1er collector
- **Stealer logs publics** : ingestion de corpus achetés/trouvés (Lumma, RedLine)
- Parser → normalisation STIX 2.1 → indexation OpenSearch
- POST /search devient réel

### Sprint 7-8 — Stripe + UX dashboard
- Stripe billing 3 tiers + webhook handler + portail client
- Dashboard fonctionnel : vue d'ensemble (KPI temps réel), liste leaks
- Alertes email basiques

### Sprint 9-10 — Telegram + Webhooks
- Collector Telegram (Telethon) sur 50-100 canaux FR
- Webhook handler + signature HMAC + retry
- SDK Python + Go (publier sur PyPI, proxy Go modules)

### Sprint 11-12 — Polish + alpha
- Dark web minimal (Tor headless scraper sur 3-4 forums) — c'est là le vrai défi technique
- 5 alpha testers RSSI
- Sentry, Grafana, alertes prod

### Mois 6-9 — GA + premiers ARR
- Stripe prod, ouverture publique
- Vendre à 5-10 clients Pro
- 1ère vente Entreprise (cible : MSSP)

### Mois 9-18 — Scale
- Intégrations natives Splunk, Sentinel, TheHive, Cortex
- Embaucher 1 OSINT analyst + 1 sales
- Préparer une seed (~2M€ post-CA traction)

---

## 11 · Décisions techniques déjà prises (Architecture Decision Records mentaux)

| Décision | Raison |
|---|---|
| **Hébergement Scaleway** (Paris/Amsterdam) | Souveraineté FR, prix raisonnable, K8s managed correct, marketing-friendly |
| **Pas SecNumCloud au lancement** | Trop cher (200-500k€, 12-18 mois). On y va à la croissance, pour Entreprise. |
| **Rétention 30 jours** | RGPD-friendly + différenciant marketing fort + réduit la surface d'attaque + réduit le coût stockage |
| **Violet primaire #9658f7** | Différencie du bleu corporate générique de tous les concurrents CTI |
| **Pas d'app mobile** au lancement | Notre cible bosse sur desktop. Responsive suffit. |
| **Pas de free trial Pro sans CB → CB obligatoire** ⚠️ **À DÉCIDER** | Le mock dit "essai 14j sans CB". Vérifier si on garde — avec CB obligatoire, conversion meilleure mais friction plus élevée |
| **3 tiers seulement** | Plus de tiers = paradoxe du choix. Communautaire/Pro/Entreprise = standard SaaS. |
| **Bearer token, pas OAuth** | Simplicité + pas de besoin de scopes utilisateur (juste org-level) |
| **API REST, pas GraphQL** | Simplicité d'intégration SIEM/SOAR, écosystème curl/Postman/SDKs plus mature |
| **Pas de white-label** au lancement | Garder le focus produit. Reconsidérer après 50 clients Pro. |
| **Doctrine de collecte : sources publiques gratuites + API de fournisseurs légitimes uniquement** | Zéro achat de données à des acteurs criminels (recel, art. 321-1 CP). Préserve la base légale RGPD et la marque. |
| **Positionnement « information officielle, sourcée, vérifiable »** | Chaque observation cite sa source (`source_ref`). Différencie du CTI « trust us » non sourcé. Marque de fabrique du projet. |
| **Pilier « Dark web » rétrogradé** | Pas d'auto-scraping de forums criminels (risque légal + non « officiel »). Devient une couche d'enrichissement attribuée, via flux partenaire si besoin. |
| **Backend solo : FastAPI + PostgreSQL seul au lancement** | Pas d'OpenSearch / NATS / K8s tant que le volume ne le force pas. Réduit le burn pré-revenu. |
| **Modèle de données « provenance-first »** | `source_id` + `source_ref` obligatoires. Si une donnée n'est pas citable, elle n'est pas stockée. |
| **Base : PostgreSQL seul au lancement ; ClickHouse en montée en charge (pas OpenSearch)** | Postgres `pg_trgm` couvre la recherche scopée par KYB. ClickHouse ensuite : TTL natif = rétention, colonne = compression + ingestion massive, auto-hébergé Scaleway pour la souveraineté. |
| **Domaine `leakx.fr` acheté en Étape 0 (immédiat)** | Prérequis technique (KYB DNS, emails, TLS) et défensif. Registrar FR. Vérifier la marque (INPI) avant achat. |

---

## 12 · Style de code attendu

### Frontend (TypeScript)
- Composants en **PascalCase**, fichiers en **kebab-case** (`leak-detail.tsx`)
- Hooks préfixés `use*` dans `src/hooks/`
- Types/interfaces préfixés rien (pas de `IUser`), utiliser `type` ou `interface` selon le besoin
- Server Components par défaut, `"use client"` seulement quand nécessaire
- Pas de prop drilling > 2 niveaux → contexte ou composition

### Backend Go
- Packages alignés sur le domaine (`internal/search`, `internal/monitors`)
- Erreurs sentinelles dans chaque package (`var ErrNotFound = errors.New(...)`)
- Context-aware partout (`ctx context.Context` premier param)
- Pas de `panic` en handler HTTP

### Backend Python (si choisi)
- Pydantic v2 pour validation
- FastAPI avec routers par domaine
- SQLAlchemy 2.0 syntaxe, ou SQLModel
- `ruff` + `mypy` strict

### Tests
- Tests d'intégration > tests unitaires (sauf logique métier complexe)
- Fixtures par domaine, pas par fichier
- Pas de mock pour les tests d'intégration backend → testcontainers (Postgres, Redis)

### Commits
- `feat(api): add /v1/search endpoint with Pydantic validation`
- `fix(web): correct hero counter animation race condition`
- `chore(deps): bump next from 15.0 to 15.1`
- `docs(claude): update retention policy section`

---

## 13 · Quand poser des questions à l'utilisateur

**Demande systématiquement avant** :
- ☐ Toute décision qui touche au légal/RGPD/contractuel
- ☐ Choix d'un provider tiers (Stripe vs Lemon Squeezy, Clerk vs WorkOS, etc.)
- ☐ Définition d'un pricing différent du mock actuel
- ☐ Ajout d'une feature majeure non listée ici (un module mobile, une IA générative, etc.)
- ☐ Modification du logo, des couleurs principales, ou de la marque

**Ne demande PAS** :
- Détails d'implémentation (choix de lib mineure, style de code)
- Ajout d'un endpoint déjà décrit dans Docs.html
- Refactoring qui ne change pas le comportement
- Tests, types, validation — fais-le par défaut

---

## 14 · Ressources & inspirations

- **xleak.io** — la référence à dépasser sur le tier Pro (visual identity, pricing)
- **Flare.io** — référence enterprise (intégrations, profondeur d'analyse)
- **CybelAngel** — concurrent FR direct, regarder leur positionnement
- **IntelX.io** — référence Google-style search
- **HaveIBeenPwned** — référence gratuit/communauté
- **STIX 2.1 spec** — pour la normalisation des IOCs (https://docs.oasis-open.org/cti/stix/v2.1)
- **MITRE ATT&CK** — pour le mapping techniques (https://attack.mitre.org)

---

## 15 · Glossaire (jargon CTI à connaître)

- **CTI** : Cyber Threat Intelligence
- **IOC** : Indicator of Compromise (hash, IP, domaine, etc.)
- **TTPs** : Tactics, Techniques and Procedures (mapping MITRE)
- **Stealer log** : output d'un infostealer (RedLine, Lumma, StealC) contenant credentials, cookies, infos système d'un poste compromis
- **Combolist** : listes d'identifiants (email:password) issues de breaches multiples
- **Paste site** : Pastebin, Doxbin, ghostbin, etc. — sites de partage de texte
- **Leak site** : site Tor d'un groupe ransomware listant ses victimes
- **C2** : Command & Control (serveur d'un malware)
- **Kill chain** : reconstruction des étapes d'une attaque (Lockheed Martin, 7-8 étapes)
- **Blast radius** : rayon d'impact d'une fuite (nb d'identités, services, comptes affectés)
- **DDQ** : Due Diligence Questionnaire (questionnaire fournisseur entreprise)
- **OIV/OSE** : Opérateurs d'Importance Vitale / Opérateurs de Services Essentiels (loi française)
- **RSSI / CISO** : Responsable Sécurité Système d'Information / Chief Information Security Officer
- **MSSP** : Managed Security Service Provider
- **SOC** : Security Operations Center
- **SOAR** : Security Orchestration, Automation, and Response (Cortex XSOAR, etc.)
- **SIEM** : Security Information and Event Management (Splunk, Sentinel, Elastic, etc.)
- **KYB** : Know Your Business (équivalent KYC pour les entreprises)

---

## 16 · Tu travailles en mode "compagnon de RSSI", pas "agence créative"

Le ton produit de LeakX est **sobre, technique, factuel, institutionnel**.
- ❌ Pas d'hyperboles ("la meilleure plateforme du monde")
- ❌ Pas d'emojis dans l'UI sauf rares cas (✓, ✗, ·)
- ❌ Pas de jargon marketing creux
- ✅ Chiffres précis, sources nommées (RedLine, Lumma, XSS.is)
- ✅ Promesses tenables et défendables juridiquement
- ✅ Reconnaissance des limites quand pertinent

Quand tu écris du copy, demande-toi : *"un RSSI de CAC40 me prendrait-il au sérieux en lisant ça ?"*

---

## Fin

Bonne chance. Lis ce fichier au début de chaque session. Si tu changes quelque chose de structurel, **mets à jour CE fichier** avant de fermer ta session.

Pour toute question stratégique : `support@leakx.fr` (futur — à créer).
