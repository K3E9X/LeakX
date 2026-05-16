"""Registre des collecteurs LeakX. Ajouter ici toute nouvelle source."""
from .base import Collector
from .ransomware_live import RansomwareLiveCollector

ALL_COLLECTORS: list[type[Collector]] = [
    RansomwareLiveCollector,
]
