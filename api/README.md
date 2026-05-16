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

# Lancer l'API
uvicorn app.main:app --reload

# Lancer les collecteurs (récupère les sources réelles)
python scripts/run_collectors.py

# Hors-ligne : rejouer des réponses locales (ID=CHEMIN, répétable)
python scripts/run_collectors.py \
  --fixture cert_fr=tests/fixtures/cert_fr_sample.xml \
  --fixture ransomware_live=tests/fixtures/ransomware_live_sample.json

# Tests
pytest
```

## Endpoints

| Méthode | Chemin | Description |
|---|---|---|
| `GET`    | `/health` | Sonde de vie |
| `GET`    | `/v1/sources` | Registre public des sources |
| `GET`    | `/v1/leaks` | Observations (filtres `category`, `severity`, pagination) |
| `GET`    | `/v1/leaks/{id}` | Détail d'une observation + sa source |
| `POST`   | `/v1/search` | Recherche par entité |
| `POST`   | `/v1/monitors` | Créer un monitor (domaine → vérification DNS TXT) |
| `GET`    | `/v1/monitors` | Lister les monitors (filtres `org_id`, `type`, `status`) |
| `GET`    | `/v1/monitors/{id}` | Détail d'un monitor |
| `POST`   | `/v1/monitors/{id}/verify` | Lancer la vérification DNS TXT d'un domaine |
| `DELETE` | `/v1/monitors/{id}` | Supprimer un monitor |

**KYB** : un monitor `domain` reste `verifying` jusqu'à ce qu'un quorum de
résolveurs DNS voie l'enregistrement `leakx-verification=<token>`. Un monitor
`email` doit relever d'un domaine déjà vérifié. C'est le garde-fou anti-doxxing.

Les réponses suivent l'enveloppe standard `{"data", "meta"}` / `{"error"}`
décrite dans `CLAUDE.md §6`.

## Collecteurs

Chaque source est un `Collector` (`app/sources/`). Collecteurs branchés :

- **CERT-FR** — avis, alertes et rapports CTI du CERT national (ANSSI), source officielle.
- **ransomware.live** — revendications publiques de victimes ransomware.

Pour en ajouter un : créer la classe, l'enregistrer dans `app/sources/__init__.py`.

> La collecte réelle nécessite un accès réseau sortant. Les environnements
> d'exécution restreints peuvent bloquer les appels — utiliser alors
> `--fixture` pour valider la chaîne de traitement de bout en bout.
