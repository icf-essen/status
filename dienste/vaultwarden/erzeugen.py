#!/usr/bin/env python3
"""Erzeugt user.vaultwarden.scss.hbs aus der Vorlage und bettet die Bilder aus design/ ein.

Warum eingebettet: Vaultwarden erlaubt per Content-Security-Policy nur Bilder von der
eigenen Domain oder als data:-URI. Links auf design.icf-essen.de würden blockiert.

Aufruf im Repo-Hauptverzeichnis:  python3 dienste/vaultwarden/erzeugen.py
"""
import base64, pathlib, re

hier = pathlib.Path(__file__).resolve().parent
design = hier.parent.parent / "design"
mime = {".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png"}

def einbetten(treffer):
    datei = design / treffer.group(1)
    daten = base64.b64encode(datei.read_bytes()).decode()
    return f'url("data:{mime[datei.suffix]};base64,{daten}")'

vorlage = (hier / "user.vaultwarden.scss.vorlage").read_text(encoding="utf-8")
ergebnis = re.sub(r"@@([\w.-]+)@@", einbetten, vorlage)
ziel = hier / "user.vaultwarden.scss.hbs"
ziel.write_text(ergebnis, encoding="utf-8")
print(f"{ziel.name} erzeugt ({len(ergebnis) // 1024} KB)")
