"""Contrat commun à tous les collecteurs de sources."""
from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod

from ..models import Source
from ..schemas import NormalizedFinding


class Collector(ABC):
    """Un collecteur transforme une source externe en `NormalizedFinding`.

    Chaque sous-classe expose `source` (métadonnées du registre) et implémente
    `collect`.
    """

    source: Source

    @abstractmethod
    def collect(self, payload: object | None = None) -> list[NormalizedFinding]:
        """Récupère et normalise les observations.

        `payload` permet d'injecter une réponse déjà téléchargée (tests, ou
        exécution hors-ligne) au lieu de déclencher un appel réseau.
        """


def dedup_hash(source_id: str, finding: NormalizedFinding) -> str:
    """Empreinte stable rendant les collectes répétées idempotentes."""
    key = f"{source_id}|{finding.category}|{finding.entity}|{finding.source_ref}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()
