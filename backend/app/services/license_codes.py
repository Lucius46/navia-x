from __future__ import annotations

import secrets


ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_license_code() -> str:
    groups = ["".join(secrets.choice(ALPHABET) for _ in range(4)) for _ in range(3)]
    return f"NAVIA-{'-'.join(groups)}"
