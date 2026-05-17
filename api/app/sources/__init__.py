"""Registre des collecteurs LeakX. Ajouter ici toute nouvelle source."""
from .base import Collector
from .cert_fr import CertFrCollector
from .cisa_kev import CisaKevCollector
from .nvd import NvdCollector
from .ransomware_live import RansomwareLiveCollector

ALL_COLLECTORS: list[type[Collector]] = [
    CertFrCollector,
    CisaKevCollector,
    NvdCollector,
    RansomwareLiveCollector,
]
