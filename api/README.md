# LeakX API

Backend de la plateforme LeakX. Conçu autour d'une règle unique : **aucune
observation n'est stockée sans source citable** (`source_id` + `source_ref`).
C'est la marque de fabrique du projet — information officielle et vérifiable.

## Stack

- FastAPI + SQLModel (Pydantic v2)
- SQLite en développement, PostgreSQL en production (`LEAKX_DATABASE_URL`)

## Démarrage

```sh
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Créer une organisation + sa première clé API (affichée une seule fois)
python scripts/bootstrap_org.py --name "Mon organisation"

# Lancer l'API
uvicorn app.main:app --reload

# Lancer les collecteurs (récupère les sources réelles)
python scripts/run_collectors.py

# Hors-ligne : rejouer des réponses locales (ID=CHEMIN, répétable)
python scripts/run_collectors.py \
  --fixture cert_fr=tests/fixtures/cert_fr_sample.xml \
  --fixture cisa_kev=tests/fixtures/cisa_kev_sample.json \
  --fixture ransomware_live=tests/fixtures/ransomware_live_sample.json

# Tests
pytest
```

## Endpoints

| Méthode | Chemin | Auth | Description |
|---|---|---|---|
| `GET`    | `/health` | — | Sonde de vie |
| `GET`    | `/v1/sources` | — | Registre public des sources |
| `GET`    | `/v1/leaks` | clé | Observations (filtres `category`, `severity`, pagination) |
| `GET`    | `/v1/leaks/{id}` | clé | Détail d'une observation + sa source |
| `POST`   | `/v1/search` | clé | Recherche par entité (limitée au périmètre vérifié) |
| `POST`   | `/v1/monitors` | clé écriture | Créer un monitor (domaine → vérification DNS TXT) |
| `GET`    | `/v1/monitors` | clé | Lister ses monitors (filtres `type`, `status`) |
| `GET`    | `/v1/monitors/{id}` | clé | Détail d'un monitor |
| `POST`   | `/v1/monitors/{id}/verify` | clé écriture | Lancer la vérification DNS TXT |
| `DELETE` | `/v1/monitors/{id}` | clé écriture | Supprimer un monitor |
| `GET`    | `/v1/keys` | clé | Lister ses clés API |
| `POST`   | `/v1/keys` | clé écriture | Générer une clé (token affiché une seule fois) |
| `DELETE` | `/v1/keys/{id}` | clé écriture | Révoquer une clé |

**Authentification** : header `Authorization: Bearer lkx_<type>_…`. Trois types
de clés — `live`, `test`, `readonly` (les clés `readonly` ne peuvent pas muter).
Le secret est haché en Argon2id, jamais stocké en clair.

**Rate limiting** : chaque tier (`community` / `pro` / `enterprise`) a un débit
par minute et un quota mensuel (cf. CLAUDE.md §5). Les réponses portent les
headers `X-RateLimit-Limit/-Remaining/-Reset` ; un dépassement de débit renvoie
`429 rate_limited` (+ `Retry-After`), un quota mensuel épuisé `402 payment_required`.
Les clés `test` ne consomment pas le quota mensuel.

**KYB** : un monitor `domain` reste `verifying` jusqu'à ce qu'un quorum de
résolveurs DNS voie l'enregistrement `leakx-verification=<token>`. Un monitor
`email` doit relever d'un domaine déjà vérifié. La recherche hors périmètre
vérifié est rejetée (`403 outside_scope`). C'est le garde-fou anti-doxxing.

Les réponses suivent l'enveloppe standard `{"data", "meta"}` / `{"error"}`
décrite dans `CLAUDE.md §6`.

## Collecteurs

Chaque source est un `Collector` (`app/sources/`). Collecteurs branchés :

- **CERT-FR** — avis, alertes et rapports CTI du CERT national (ANSSI), source officielle.
- **CISA KEV** — vulnérabilités activement exploitées (catalogue officiel CISA).
- **ransomware.live** — revendications publiques de victimes ransomware.

Pour en ajouter un : créer la classe, l'enregistrer dans `app/sources/__init__.py`.

> La collecte réelle nécessite un accès réseau sortant. Les environnements
> d'exécution restreints peuvent bloquer les appels — utiliser alors
> `--fixture` pour valider la chaîne de traitement de bout en bout.
