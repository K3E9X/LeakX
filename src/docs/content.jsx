// Docs content — sections, prose, code samples

const { useState, useEffect, useRef, useMemo } = React;

// ============== Sidebar nav structure ==============
const DOCS_NAV = [
  { group: "Pour commencer", items: [
    { id: "introduction",     label: "Introduction" },
    { id: "quickstart",       label: "Quickstart" },
    { id: "authentication",   label: "Authentification" },
    { id: "rate-limits",      label: "Rate limits" },
  ]},
  { group: "API · Endpoints", items: [
    { id: "search",   label: "Recherche",        method: "post" },
    { id: "monitors", label: "Monitors",         method: "get" },
    { id: "create-monitor", label: "Créer un monitor", method: "post" },
    { id: "leaks",    label: "Récupérer un leak", method: "get" },
    { id: "delete-monitor", label: "Supprimer un monitor", method: "del" },
  ]},
  { group: "Événements", items: [
    { id: "webhooks",         label: "Webhooks" },
    { id: "verify-signature", label: "Vérifier la signature" },
  ]},
  { group: "SDKs", items: [
    { id: "sdk-python",       label: "Python" },
    { id: "sdk-go",           label: "Go" },
    { id: "sdk-js",           label: "JavaScript / TS" },
  ]},
];
window.DOCS_NAV = DOCS_NAV;

// ============== Code samples ==============
// Each sample is { lang, label, code, response? }

const codeSamples = {
  quickstart: {
    title: "Premier appel",
    blocks: [
      {
        langs: [
          { id: "curl", label: "cURL", code:
`curl https://api.leakx.fr/v1/search \\
  -H "Authorization: Bearer lkx_live_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "email",
    "value": "ceo@veridata.fr"
  }'` },
          { id: "py", label: "Python", code:
`import leakx

client = leakx.Client(api_key="lkx_live_••••••••")

results = client.search(
    type="email",
    value="ceo@veridata.fr",
)

for leak in results:
    print(leak.id, leak.severity, leak.source)` },
          { id: "go", label: "Go", code:
`package main

import (
    "fmt"
    "github.com/leakx/leakx-go"
)

func main() {
    c := leakx.New("lkx_live_••••••••")
    res, err := c.Search(leakx.SearchInput{
        Type:  "email",
        Value: "ceo@veridata.fr",
    })
    if err != nil { panic(err) }
    for _, lk := range res.Leaks {
        fmt.Println(lk.ID, lk.Severity, lk.Source)
    }
}` },
          { id: "js", label: "JS / TS", code:
`import { LeakX } from "@leakx/sdk";

const lx = new LeakX({ apiKey: "lkx_live_••••••••" });

const res = await lx.search({
  type: "email",
  value: "ceo@veridata.fr",
});

res.leaks.forEach(l => {
  console.log(l.id, l.severity, l.source);
});` },
        ],
        response: {
          status: "200 OK",
          code:
`{
  "query": {
    "type": "email",
    "value": "ceo@veridata.fr"
  },
  "summary": {
    "total": 7,
    "by_severity": { "high": 3, "med": 2, "low": 2 },
    "stealer_logs": 2
  },
  "leaks": [
    {
      "id": "lk_2tQv7nE4mAxC9bRy",
      "severity": "high",
      "source": "stealer:lumma",
      "collected_at": "2026-05-16T14:42:00Z",
      "entity": "veridata.fr"
    }
  ]
}`
        }
      }
    ]
  },

  authentication: {
    title: "Auth header",
    blocks: [{
      langs: [
        { id: "curl", label: "cURL", code:
`curl https://api.leakx.fr/v1/monitors \\
  -H "Authorization: Bearer lkx_live_a4f2c..."` },
        { id: "py", label: "Python", code:
`import leakx
# La clé peut aussi être lue depuis LEAKX_API_KEY
client = leakx.Client(api_key="lkx_live_a4f2c...")` },
        { id: "js", label: "JS / TS", code:
`const lx = new LeakX({
  apiKey: process.env.LEAKX_API_KEY,
});` },
      ]
    }]
  },

  search: {
    title: "POST /v1/search",
    blocks: [{
      langs: [
        { id: "curl", label: "cURL", code:
`curl https://api.leakx.fr/v1/search \\
  -H "Authorization: Bearer lkx_live_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "domain",
    "value": "veridata.fr",
    "severity": ["high", "med"],
    "since": "2026-01-01",
    "limit": 50
  }'` },
        { id: "py", label: "Python", code:
`from leakx import Client

client = Client()
res = client.search(
    type="domain",
    value="veridata.fr",
    severity=["high", "med"],
    since="2026-01-01",
    limit=50,
)
print(f"{res.summary.total} leaks trouvés")` },
        { id: "go", label: "Go", code:
`res, _ := c.Search(leakx.SearchInput{
    Type:     "domain",
    Value:    "veridata.fr",
    Severity: []string{"high", "med"},
    Since:    "2026-01-01",
    Limit:    50,
})
fmt.Println(res.Summary.Total, "leaks")` },
      ],
      response: {
        status: "200 OK",
        code:
`{
  "query": { "type": "domain", "value": "veridata.fr" },
  "summary": {
    "total": 142,
    "by_severity": { "high": 47, "med": 71, "low": 24 }
  },
  "page": { "limit": 50, "offset": 0, "next": "..." },
  "leaks": [
    {
      "id": "lk_2tQv7nE4mAxC9bRy",
      "severity": "high",
      "source": "stealer:lumma",
      "entity": "veridata.fr",
      "collected_at": "2026-05-16T14:42:00Z",
      "blast_radius": {
        "credentials": 47,
        "cookies": 3,
        "services": 12
      }
    }
  ]
}`
      }
    }]
  },

  monitors: {
    title: "GET /v1/monitors",
    blocks: [{
      langs: [
        { id: "curl", label: "cURL", code:
`curl https://api.leakx.fr/v1/monitors \\
  -H "Authorization: Bearer lkx_live_••••••••"` },
        { id: "py", label: "Python", code:
`monitors = client.monitors.list()
for m in monitors:
    print(m.id, m.value, m.exposure_score)` },
      ],
      response: {
        status: "200 OK",
        code:
`{
  "monitors": [
    {
      "id": "mon_8FjK2sQp",
      "type": "domain",
      "value": "veridata.fr",
      "exposure_score": 67,
      "active_alerts": 8,
      "last_scan": "2026-05-16T15:00:00Z"
    },
    {
      "id": "mon_4xL9zwM7",
      "type": "vip",
      "value": "Marc Bernier",
      "exposure_score": 84,
      "active_alerts": 12
    }
  ]
}`
      }
    }]
  },

  "create-monitor": {
    title: "POST /v1/monitors",
    blocks: [{
      langs: [
        { id: "curl", label: "cURL", code:
`curl https://api.leakx.fr/v1/monitors \\
  -H "Authorization: Bearer lkx_live_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "domain",
    "value": "veridata.fr",
    "alert_channels": ["slack", "webhook"],
    "min_severity": "med"
  }'` },
        { id: "py", label: "Python", code:
`monitor = client.monitors.create(
    type="domain",
    value="veridata.fr",
    alert_channels=["slack", "webhook"],
    min_severity="med",
)` },
      ],
      response: {
        status: "201 Created",
        code:
`{
  "id": "mon_8FjK2sQp",
  "type": "domain",
  "value": "veridata.fr",
  "status": "verifying",
  "verification": {
    "method": "dns_txt",
    "record": "leakx-verification=abc123..."
  }
}`
      }
    }]
  },

  leaks: {
    title: "GET /v1/leaks/:id",
    blocks: [{
      langs: [
        { id: "curl", label: "cURL", code:
`curl https://api.leakx.fr/v1/leaks/lk_2tQv7nE4mAxC9bRy \\
  -H "Authorization: Bearer lkx_live_••••••••"` },
        { id: "py", label: "Python", code:
`leak = client.leaks.retrieve("lk_2tQv7nE4mAxC9bRy")
print(leak.evidence)
for ioc in leak.iocs:
    print(ioc.type, ioc.value)` },
      ],
      response: {
        status: "200 OK",
        code:
`{
  "id": "lk_2tQv7nE4mAxC9bRy",
  "title": "Stealer Lumma — 47 credentials @veridata.fr",
  "severity": "high",
  "source": "stealer:lumma",
  "collected_at": "2026-05-16T14:42:00Z",
  "kill_chain": [...],
  "iocs": [
    { "type": "sha256", "value": "9c1a3f7b...", "confidence": 95 },
    { "type": "ip", "value": "185.220.101.42", "confidence": 96 }
  ],
  "mitre": ["T1555.003", "T1539"],
  "blast_radius": { "credentials": 47, "cookies": 3, "services": 12 }
}`
      }
    }]
  },

  "delete-monitor": {
    title: "DELETE /v1/monitors/:id",
    blocks: [{
      langs: [
        { id: "curl", label: "cURL", code:
`curl -X DELETE https://api.leakx.fr/v1/monitors/mon_8FjK2sQp \\
  -H "Authorization: Bearer lkx_live_••••••••"` },
        { id: "py", label: "Python", code:
`client.monitors.delete("mon_8FjK2sQp")` },
      ],
      response: {
        status: "204 No Content",
        code: "(no body)"
      }
    }]
  },

  webhooks: {
    title: "Payload Webhook",
    blocks: [{
      langs: [
        { id: "json", label: "Payload", code:
`POST https://votre-app.fr/webhooks/leakx
Content-Type: application/json
X-LeakX-Signature: t=1747402080,v1=a4f2c...

{
  "id": "evt_3rTk8mNq",
  "type": "leak.detected",
  "created_at": "2026-05-16T14:43:00Z",
  "data": {
    "leak": {
      "id": "lk_2tQv7nE4mAxC9bRy",
      "severity": "high",
      "entity": "veridata.fr"
    }
  }
}` },
      ]
    }]
  },

  "verify-signature": {
    title: "Vérification HMAC SHA-256",
    blocks: [{
      langs: [
        { id: "py", label: "Python", code:
`import hmac, hashlib, time

def verify_signature(payload, header, secret):
    parts = dict(p.split("=") for p in header.split(","))
    timestamp = parts["t"]
    if abs(time.time() - int(timestamp)) > 300:
        return False  # > 5 min, on rejette

    signed = f"{timestamp}.{payload}"
    expected = hmac.new(
        secret.encode(),
        signed.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, parts["v1"])` },
        { id: "go", label: "Go", code:
`func VerifySignature(payload, header, secret string) bool {
    parts := parseHeader(header)
    ts, _ := strconv.ParseInt(parts["t"], 10, 64)
    if time.Now().Unix() - ts > 300 {
        return false
    }
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write([]byte(parts["t"] + "." + payload))
    expected := hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(expected), []byte(parts["v1"]))
}` },
        { id: "js", label: "JS / TS", code:
`import crypto from "node:crypto";

export function verifySignature(payload, header, secret) {
  const parts = Object.fromEntries(
    header.split(",").map(p => p.split("="))
  );
  if (Date.now()/1000 - +parts.t > 300) return false;

  const signed = \`\${parts.t}.\${payload}\`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signed)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(parts.v1),
  );
}` },
      ]
    }]
  },

  "rate-limits": {
    title: "Limites par tier",
    blocks: [{
      langs: [
        { id: "tab", label: "Limites", code:
`Tier                Requests / minute   Daily quota    Burst
─────────────────   ─────────────────   ────────────   ──────
Communautaire             10                100            20
Pro                       60             10 000           300
Entreprise              illimité        illimité       illimité

Headers de réponse :
  X-RateLimit-Limit:     60
  X-RateLimit-Remaining: 47
  X-RateLimit-Reset:     1747402140

Si dépassement : HTTP 429 Too Many Requests
  Retry-After: 23` },
      ]
    }]
  },

  "sdk-python": {
    title: "pip install leakx",
    blocks: [{
      langs: [
        { id: "sh", label: "Shell", code:
`pip install leakx
# ou avec poetry
poetry add leakx
# ou uv
uv add leakx` },
        { id: "py", label: "Python", code:
`from leakx import Client

client = Client(api_key="lkx_live_...")

# Recherche
res = client.search(type="email", value="ceo@veridata.fr")

# Monitors
mon = client.monitors.create(type="domain", value="veridata.fr")
client.monitors.delete(mon.id)

# Streaming d'événements
for event in client.events.stream():
    print(event.type, event.data)` },
      ]
    }]
  },

  "sdk-go": {
    title: "go get github.com/leakx/leakx-go",
    blocks: [{
      langs: [
        { id: "sh", label: "Shell", code:
`go get github.com/leakx/leakx-go@latest` },
        { id: "go", label: "Go", code:
`import "github.com/leakx/leakx-go"

c := leakx.New(os.Getenv("LEAKX_API_KEY"))

res, err := c.Search(leakx.SearchInput{
    Type:  "email",
    Value: "ceo@veridata.fr",
})

monitor, _ := c.Monitors.Create(leakx.MonitorInput{
    Type:  "domain",
    Value: "veridata.fr",
})

events, _ := c.Events.Stream(context.Background())
for ev := range events {
    fmt.Println(ev.Type, ev.Data)
}` },
      ]
    }]
  },

  "sdk-js": {
    title: "npm install @leakx/sdk",
    blocks: [{
      langs: [
        { id: "sh", label: "Shell", code:
`npm install @leakx/sdk
# ou
pnpm add @leakx/sdk
# ou
bun add @leakx/sdk` },
        { id: "js", label: "TS", code:
`import { LeakX } from "@leakx/sdk";

const lx = new LeakX({ apiKey: process.env.LEAKX_API_KEY! });

const res = await lx.search({
  type: "email",
  value: "ceo@veridata.fr",
});

// Stream d'événements en temps réel
for await (const event of lx.events.stream()) {
  console.log(event.type, event.data);
}` },
      ]
    }]
  },
};
window.DOCS_CODE = codeSamples;

// ============== Section content (prose) ==============
window.DOCS_SECTIONS = {
  introduction: {
    crumb: ["Pour commencer", "Introduction"],
    title: "Documentation API LeakX",
    sub: "Une API REST simple, signée, RGPD-native pour intégrer le renseignement sur les fuites de données directement dans vos outils.",
    badges: ["v1.4.0", "REST · JSON", "Stable", "Hébergé en France"],
    body: ({Icon}) => (<>
      <h2>Vue d'ensemble</h2>
      <p>
        L'API LeakX donne accès programmatique à l'ensemble de la plateforme :
        recherche de fuites, gestion des monitors, alertes temps réel et webhooks signés.
        Elle est conçue pour s'intégrer aux SIEM, SOAR et outils maison des équipes SOC.
      </p>

      <h2>Conventions</h2>
      <ul>
        <li><strong>Base URL</strong> : <code>https://api.leakx.fr/v1</code></li>
        <li><strong>Format</strong> : JSON UTF-8, requêtes et réponses</li>
        <li><strong>Auth</strong> : Bearer token via <code>Authorization</code></li>
        <li><strong>Versioning</strong> : préfixe <code>/v1</code> dans l'URL, breaking changes annoncés 6 mois à l'avance</li>
        <li><strong>Dates</strong> : ISO 8601 UTC (<code>2026-05-16T14:42:00Z</code>)</li>
        <li><strong>IDs</strong> : préfixe par ressource (<code>lk_</code>, <code>mon_</code>, <code>evt_</code>, etc.)</li>
      </ul>

      <div className="callout">
        <Icon.shield className="ico"/>
        <div>
          <strong>Souveraineté.</strong> Tous les appels API atterrissent sur nos POPs Scaleway en France.
          Aucune donnée ne transite hors UE. La rétention est plafonnée à 30 jours côté LeakX —
          si vous voulez plus, utilisez l'export S3 vers votre tenant.
        </div>
      </div>
    </>),
  },

  quickstart: {
    crumb: ["Pour commencer", "Quickstart"],
    title: "Quickstart",
    sub: "Premier appel API en 30 secondes. Utilisez votre clé `lkx_live_...` obtenue à l'inscription.",
    body: ({Icon}) => (<>
      <h2>1 · Obtenez une clé API</h2>
      <p>
        Après votre inscription, copiez la clé <code>lkx_live_•••</code> affichée
        sur la page de succès (visible une seule fois) ou régénérez-en une depuis
        le dashboard, section <strong>API & clés</strong>.
      </p>

      <h2>2 · Faites votre premier appel</h2>
      <p>
        Recherchez par email, domaine, pseudo, téléphone, IP ou nom de société.
        L'API renvoie un résumé d'exposition + les fuites correspondantes.
      </p>

      <div className="callout warn">
        <Icon.alert className="ico"/>
        <div>
          <strong>KYB obligatoire.</strong> Les recherches sur des entités hors de votre périmètre
          vérifié sont rejetées avec un <code>403 outside_scope</code>. Validez vos domaines via DNS TXT
          dans le dashboard avant tout appel en production.
        </div>
      </div>

      <h2>3 · Recevez les alertes en temps réel</h2>
      <p>
        Configurez un webhook depuis le dashboard pour recevoir un événement
        <code>leak.detected</code> dès qu'une fuite touche votre périmètre.
        Voir <a href="#webhooks">Webhooks</a> pour le format et la vérification de signature.
      </p>
    </>),
  },

  authentication: {
    crumb: ["Pour commencer", "Authentification"],
    title: "Authentification",
    sub: "Toutes les requêtes API authentifiées via un Bearer token. Pas d'OAuth, pas de session, pas de cookie.",
    body: ({Icon}) => (<>
      <h2>Header requis</h2>
      <p>
        Passez votre clé en header <code>Authorization: Bearer lkx_live_•••</code>.
        Une clé absente ou invalide retourne un <code>401 unauthorized</code>.
      </p>

      <h2>Types de clés</h2>
      <ul>
        <li><strong><code>lkx_live_</code></strong> : production · toutes les requêtes facturées + comptées dans le quota</li>
        <li><strong><code>lkx_test_</code></strong> : test sandbox · données fictives, quota gratuit, ne dépense pas</li>
        <li><strong><code>lkx_readonly_</code></strong> : lecture seule (recherche + monitors GET) · pour exports BI / dashboards</li>
      </ul>

      <h2>Rotation & révocation</h2>
      <p>
        Les clés sont stockées hashées (Argon2id) côté LeakX — elles ne sont visibles
        qu'à la création. Si vous perdez une clé, révoquez-la depuis le dashboard et
        régénérez-en une nouvelle.
      </p>

      <div className="callout danger">
        <Icon.lock className="ico"/>
        <div>
          <strong>Jamais en clair côté client.</strong> N'embarquez pas une clé <code>lkx_live_</code>
          dans un app mobile, un front web ou un repo public. Utilisez un proxy backend
          + JWT scopés si vous voulez exposer la recherche côté navigateur.
        </div>
      </div>
    </>),
  },

  "rate-limits": {
    crumb: ["Pour commencer", "Rate limits"],
    title: "Rate limits & quotas",
    sub: "Les limites s'appliquent par clé API et par minute, avec un quota mensuel global.",
    body: ({Icon}) => (<>
      <h2>Limites par tier</h2>
      <p>
        Chaque réponse inclut les headers <code>X-RateLimit-Limit</code>,
        <code>X-RateLimit-Remaining</code> et <code>X-RateLimit-Reset</code>.
        En cas de dépassement, vous recevez un <code>429 Too Many Requests</code>
        avec un header <code>Retry-After</code> en secondes.
      </p>

      <div className="callout">
        <Icon.bolt className="ico"/>
        <div>
          <strong>Backoff exponentiel.</strong> En cas de 429, attendez la valeur de
          <code>Retry-After</code> puis doublez ce délai à chaque tentative jusqu'à 60s.
          Tous nos SDKs implémentent cette logique automatiquement.
        </div>
      </div>

      <h2>Pour des besoins plus élevés</h2>
      <p>
        Les clients <strong>Entreprise</strong> bénéficient de limites illimitées,
        avec un SLA 99,95% et une astreinte 24/7. Contactez-nous pour cadrer.
      </p>
    </>),
  },

  search: {
    crumb: ["API", "Recherche"],
    title: "Recherche de fuites",
    sub: "Lancer une recherche sur l'ensemble des sources collectées par LeakX : stealer logs, dark web, Telegram, paste, combolists, ransomware leak sites.",
    body: ({Icon}) => (<>
      <div className="endpoint">
        <span className="method post">POST</span>
        <span className="path">https://api.leakx.fr/v1/<span className="param">search</span></span>
      </div>

      <h2>Paramètres du body</h2>
      <div className="params">
        <div className="params-row head">
          <span>Paramètre</span><span>Type</span><span>Description</span>
        </div>
        <div className="params-row">
          <span className="name">type<span className="req">*</span></span>
          <span className="type">string</span>
          <span className="desc">Type de cible : <code>email</code>, <code>domain</code>, <code>username</code>, <code>phone</code>, <code>company</code>, <code>ip</code>.</span>
        </div>
        <div className="params-row">
          <span className="name">value<span className="req">*</span></span>
          <span className="type">string</span>
          <span className="desc">Valeur à rechercher. Doit être inclus dans votre périmètre vérifié.</span>
        </div>
        <div className="params-row">
          <span className="name">severity</span>
          <span className="type">string[]</span>
          <span className="desc">Filtre par sévérité : <code>high</code>, <code>med</code>, <code>low</code>. Par défaut, toutes.</span>
        </div>
        <div className="params-row">
          <span className="name">since</span>
          <span className="type">date</span>
          <span className="desc">Date ISO 8601. Borne basse de la fenêtre (max 30 jours en arrière, rétention LeakX).</span>
        </div>
        <div className="params-row">
          <span className="name">limit</span>
          <span className="type">int</span>
          <span className="desc">Nombre de résultats par page (1–100, défaut 25).</span>
        </div>
      </div>
    </>),
  },

  monitors: {
    crumb: ["API", "Monitors"],
    title: "Lister les monitors",
    sub: "Récupère tous les monitors actifs sur votre compte, avec leur exposure score et nombre d'alertes ouvertes.",
    body: ({Icon}) => (<>
      <div className="endpoint">
        <span className="method get">GET</span>
        <span className="path">https://api.leakx.fr/v1/<span className="param">monitors</span></span>
      </div>

      <h2>Paramètres de requête</h2>
      <div className="params">
        <div className="params-row head">
          <span>Paramètre</span><span>Type</span><span>Description</span>
        </div>
        <div className="params-row">
          <span className="name">type</span>
          <span className="type">string</span>
          <span className="desc">Filtre par type : <code>domain</code>, <code>email</code>, <code>vip</code>, <code>brand</code>, <code>ip</code>, <code>repo</code>.</span>
        </div>
        <div className="params-row">
          <span className="name">status</span>
          <span className="type">string</span>
          <span className="desc"><code>active</code>, <code>paused</code>, <code>verifying</code>. Par défaut tous.</span>
        </div>
      </div>
    </>),
  },

  "create-monitor": {
    crumb: ["API", "Créer un monitor"],
    title: "Créer un monitor",
    sub: "Ajoute une nouvelle entité à votre périmètre de surveillance. Une vérification DNS TXT est requise pour les domaines.",
    body: ({Icon}) => (<>
      <div className="endpoint">
        <span className="method post">POST</span>
        <span className="path">https://api.leakx.fr/v1/<span className="param">monitors</span></span>
      </div>

      <h2>Body</h2>
      <div className="params">
        <div className="params-row head">
          <span>Paramètre</span><span>Type</span><span>Description</span>
        </div>
        <div className="params-row">
          <span className="name">type<span className="req">*</span></span>
          <span className="type">string</span>
          <span className="desc">Type d'entité à surveiller.</span>
        </div>
        <div className="params-row">
          <span className="name">value<span className="req">*</span></span>
          <span className="type">string</span>
          <span className="desc">Valeur (domaine, email, etc.). Pour un domaine, déclenche une vérification DNS TXT.</span>
        </div>
        <div className="params-row">
          <span className="name">alert_channels</span>
          <span className="type">string[]</span>
          <span className="desc"><code>email</code>, <code>slack</code>, <code>teams</code>, <code>webhook</code>. Configurables dans le dashboard.</span>
        </div>
        <div className="params-row">
          <span className="name">min_severity</span>
          <span className="type">string</span>
          <span className="desc">Seuil minimum d'alerte : <code>low</code>, <code>med</code>, <code>high</code>. Défaut : <code>med</code>.</span>
        </div>
      </div>
    </>),
  },

  leaks: {
    crumb: ["API", "Récupérer un leak"],
    title: "Récupérer une fuite",
    sub: "Obtenir le détail complet d'une fuite : preuves brutes, IOCs, kill chain, mapping MITRE, identités affectées et profil du threat actor.",
    body: ({Icon}) => (<>
      <div className="endpoint">
        <span className="method get">GET</span>
        <span className="path">https://api.leakx.fr/v1/leaks/<span className="param">:id</span></span>
      </div>

      <h2>Données retournées</h2>
      <ul>
        <li><strong>iocs</strong> : tableau d'indicateurs (SHA256, domain, IP, URL, btc, telegram handle…)</li>
        <li><strong>kill_chain</strong> : reconstruction Lockheed Martin (8 étapes)</li>
        <li><strong>mitre</strong> : techniques MITRE ATT&CK observées</li>
        <li><strong>actor</strong> : profil reconstitué du vendor (handles, canaux, sophistication)</li>
        <li><strong>evidence</strong> : extrait normalisé STIX 2.1 (masques selon votre tier)</li>
        <li><strong>related</strong> : fuites corrélées (même victime, vendor, TTP)</li>
      </ul>
    </>),
  },

  "delete-monitor": {
    crumb: ["API", "Supprimer un monitor"],
    title: "Supprimer un monitor",
    sub: "Désactive immédiatement la surveillance d'une entité. L'historique de leaks reste consultable pendant 30 jours.",
    body: ({Icon}) => (<>
      <div className="endpoint">
        <span className="method del">DELETE</span>
        <span className="path">https://api.leakx.fr/v1/monitors/<span className="param">:id</span></span>
      </div>

      <h2>Effets</h2>
      <ul>
        <li>Les collecteurs cessent immédiatement la corrélation sur cette entité</li>
        <li>Aucune nouvelle alerte ne sera émise</li>
        <li>L'historique reste accessible 30 jours via <code>GET /v1/leaks</code> avec le filtre <code>monitor_id</code></li>
        <li>Le slot revient dans votre quota (Pro : 25 monitors)</li>
      </ul>
    </>),
  },

  webhooks: {
    crumb: ["Événements", "Webhooks"],
    title: "Webhooks",
    sub: "Recevez les événements en temps réel directement sur votre endpoint. Chaque payload est signé HMAC SHA-256 pour garantir l'authenticité.",
    body: ({Icon}) => (<>
      <h2>Types d'événements</h2>
      <ul>
        <li><code>leak.detected</code> — nouvelle fuite identifiée sur votre périmètre</li>
        <li><code>leak.resolved</code> — fuite marquée comme résolue (force-reset effectué, etc.)</li>
        <li><code>monitor.verified</code> — domaine validé après vérification DNS TXT</li>
        <li><code>actor.observed</code> — un threat actor surveillé revient en activité</li>
        <li><code>quota.warning</code> — vous atteignez 80% de votre quota mensuel</li>
      </ul>

      <div className="callout">
        <Icon.bolt className="ico"/>
        <div>
          <strong>Livraison fiable.</strong> Si votre endpoint répond autre chose qu'un 2xx,
          nous retentons avec backoff exponentiel pendant 24h (max 12 tentatives).
          Tous les events échoués sont consultables dans le dashboard.
        </div>
      </div>
    </>),
  },

  "verify-signature": {
    crumb: ["Événements", "Vérifier la signature"],
    title: "Vérifier la signature HMAC",
    sub: "Chaque webhook est signé avec votre secret partagé. Vérifiez la signature avant de traiter le payload pour vous prémunir des replays.",
    body: ({Icon}) => (<>
      <h2>Format du header</h2>
      <p>
        Le header <code>X-LeakX-Signature</code> a la forme :
        <code>t=&lt;timestamp&gt;,v1=&lt;hmac_sha256_hex&gt;</code>
      </p>

      <h2>Algorithme</h2>
      <ul>
        <li>Concaténez <code>t</code> + <code>"."</code> + payload JSON brut</li>
        <li>Calculez HMAC SHA-256 avec votre webhook secret</li>
        <li>Comparez en <strong>temps constant</strong> avec la valeur de <code>v1</code></li>
        <li>Rejetez si <code>t</code> a plus de 5 minutes (protection replay)</li>
      </ul>

      <div className="callout danger">
        <Icon.shield className="ico"/>
        <div>
          <strong>Comparaison sécurisée.</strong> Utilisez <code>hmac.compare_digest</code> (Python),
          <code>crypto.timingSafeEqual</code> (Node), ou <code>hmac.Equal</code> (Go).
          Une comparaison <code>==</code> classique est vulnérable au timing attack.
        </div>
      </div>
    </>),
  },

  "sdk-python": {
    crumb: ["SDKs", "Python"],
    title: "SDK Python",
    sub: "Library Python officielle, compatible 3.9+. Type-safe, async-friendly, streaming d'événements via SSE.",
    body: ({Icon}) => (<>
      <h2>Installation</h2>
      <p>Disponible sur PyPI sous le nom <code>leakx</code>.</p>

      <h2>Configuration</h2>
      <p>
        La clé peut être passée à l'instanciation ou lue depuis la variable d'environnement
        <code>LEAKX_API_KEY</code>. Le client utilise <code>httpx</code> sous le capot
        et supporte les opérations sync et async.
      </p>

      <h2>Fonctionnalités</h2>
      <ul>
        <li>Auto-retry sur 429 avec backoff exponentiel</li>
        <li>Pagination automatique via générateurs</li>
        <li>Streaming d'événements via SSE / WebSocket</li>
        <li>Validation Pydantic des entrées/sorties</li>
        <li>Compatible <code>asyncio</code> et synchrone</li>
      </ul>
    </>),
  },

  "sdk-go": {
    crumb: ["SDKs", "Go"],
    title: "SDK Go",
    sub: "Library Go idiomatique, zero-dep, context-aware. Disponible sur le proxy Go modules.",
    body: ({Icon}) => (<>
      <h2>Installation</h2>
      <p>
        Le module suit le versioning Go classique. Importez depuis
        <code>github.com/leakx/leakx-go</code>.
      </p>

      <h2>Caractéristiques</h2>
      <ul>
        <li>Aucune dépendance externe (stdlib uniquement)</li>
        <li>Supporte <code>context.Context</code> partout</li>
        <li>Streaming via channels typés</li>
        <li>Goroutine-safe, pooling de connections HTTP/2</li>
        <li>Retry automatique sur 429 et 5xx idempotents</li>
      </ul>
    </>),
  },

  "sdk-js": {
    crumb: ["SDKs", "JavaScript / TS"],
    title: "SDK JavaScript / TypeScript",
    sub: "Library universelle Node 18+, Deno, Bun et edge runtimes (Cloudflare Workers, Vercel Edge). Typings TS complets.",
    body: ({Icon}) => (<>
      <h2>Installation</h2>
      <p>
        Publié sur npm sous <code>@leakx/sdk</code>. ESM et CJS supportés.
      </p>

      <h2>Compatibilité</h2>
      <ul>
        <li>Node.js ≥ 18 (fetch natif)</li>
        <li>Deno, Bun (out of the box)</li>
        <li>Cloudflare Workers, Vercel Edge Functions</li>
        <li>Pas conçu pour le navigateur — utilisez un proxy backend</li>
      </ul>

      <div className="callout warn">
        <Icon.alert className="ico"/>
        <div>
          <strong>Côté navigateur.</strong> N'utilisez jamais le SDK directement dans le browser :
          votre clé <code>lkx_live_</code> serait exposée. Mettez en place un endpoint backend
          qui proxy les requêtes, ou utilisez des JWT scopés générés à la demande.
        </div>
      </div>
    </>),
  },
};
