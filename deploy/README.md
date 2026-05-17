# Déploiement de LeakX

Runbook pour mettre l'API LeakX en ligne sur l'instance Scaleway
(Ubuntu 24.04, Paris). Toutes les commandes sont à exécuter en SSH,
en `root` (ou préfixées de `sudo`).

## Architecture

```
Internet ──HTTPS──> Caddy (TLS auto) ──HTTP──> uvicorn 127.0.0.1:8000 (API LeakX)
                                                      │
                                              PostgreSQL (local)
   timers systemd : collecte des sources (30 min) · livraison webhooks (2 min)
```

## Prérequis

- Instance Ubuntu 24.04 avec accès SSH root.
- Domaine `leakx.fr` — accès à la zone DNS.

---

## 1. DNS

Crée un enregistrement **A** : `api.leakx.fr` → IP publique de l'instance.

```sh
dig +short api.leakx.fr     # doit renvoyer l'IP de l'instance
```

Attends que ça résolve avant l'étape Caddy (sinon pas de certificat TLS).

## 2. Paquets système

```sh
apt update && apt install -y python3-venv python3-pip postgresql git curl

# Caddy (dépôt officiel)
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```

## 3. Utilisateur applicatif

```sh
useradd --system --create-home --home-dir /opt/leakx --shell /usr/sbin/nologin leakx
```

## 4. Récupération du code

```sh
cd /opt/leakx
sudo -u leakx git clone https://github.com/K3E9X/LeakX.git .
sudo -u leakx git -C /opt/leakx checkout claude/github-repo-setup-7qf4I
```

## 5. PostgreSQL

```sh
sudo -u postgres psql -c "CREATE USER leakx WITH PASSWORD 'CHOISIS_UN_MOT_DE_PASSE';"
sudo -u postgres psql -c "CREATE DATABASE leakx OWNER leakx;"
```

> **Base managée Scaleway** (recommandée avant les premiers vrais clients —
> sauvegardes automatiques) : saute cette étape et utilise, à l'étape 7,
> l'URL de connexion fournie par Scaleway dans `LEAKX_DATABASE_URL`.

## 6. Environnement Python

```sh
cd /opt/leakx/api
sudo -u leakx python3 -m venv .venv
sudo -u leakx .venv/bin/pip install -r requirements.txt
```

## 7. Configuration

```sh
cd /opt/leakx/api
sudo -u leakx cp ../deploy/.env.example .env
sudo -u leakx nano .env          # renseigne le mot de passe DB et LEAKX_ABUSECH_KEY
chmod 600 .env && chown leakx:leakx .env
```

Le schéma de base est créé automatiquement au premier démarrage (`init_db`).

## 8. Services systemd

```sh
cp /opt/leakx/deploy/leakx-*.service /opt/leakx/deploy/leakx-*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now leakx-api.service
systemctl enable --now leakx-collectors.timer leakx-webhooks.timer
systemctl start leakx-collectors.service     # première collecte immédiate
```

## 9. Caddy (reverse proxy + TLS)

```sh
cp /opt/leakx/deploy/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
```

## 10. Vérification

```sh
curl https://api.leakx.fr/health        # {"status":"ok"}
curl https://api.leakx.fr/v1/sources     # le registre des 8 sources
systemctl status leakx-api               # doit être "active (running)"
```

## 11. Première organisation + clé API

```sh
cd /opt/leakx/api
sudo -u leakx .venv/bin/python scripts/bootstrap_org.py --name "Veridata SAS" --plan pro
```

Note la clé `lkx_live_…` affichée (une seule fois).

---

## Mises à jour

```sh
cd /opt/leakx && sudo -u leakx git pull
cd api && sudo -u leakx .venv/bin/pip install -r requirements.txt
systemctl restart leakx-api
```

## Exploitation

```sh
journalctl -u leakx-api -f               # logs de l'API
journalctl -u leakx-collectors --since today
systemctl list-timers 'leakx-*'          # prochaines exécutions
```

## Limites connues

- Le schéma est créé via `SQLModel.create_all` ; prévoir **Alembic** pour les
  évolutions de schéma futures.
- L'API tourne en un seul processus (le rate limiting est en mémoire). Passage
  multi-workers → nécessite Redis pour le rate limiting partagé.
- Sauvegardes : si PostgreSQL est local, mettre en place un `pg_dump` planifié
  vers Scaleway Object Storage — ou migrer vers la base managée.
