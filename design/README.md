# ICF Essen – Design-Dateien

Zentrale Ablage für Logo, Favicon, Hintergründe, Schrift und Farben aller Dienste
(Authentik, Nextcloud, Vaultwarden, GLPI, Statusseite …). Next Step Rad ist ausgenommen.

Ausgeliefert vom Front-Caddy (CT 110) unter **https://design.icf-essen.de/**
aus dem Verzeichnis `/srv/icf-design`. Dieses Verzeichnis im Repo ist die Quelle.

| Datei | Verwendung |
|---|---|
| `icf-logo-weiss.svg` / `.png` | Logo auf dunklem Grund (Anmeldeseiten) |
| `icf-navbar-logo.png` | Logo für Kopfzeilen (364×180) |
| `icf-favicon.svg`, `icf-favicon-512.png`, `favicon.ico` | Favicon: weißes Logo auf Petrol |
| `hintergrund-desktop.jpg` / `.webp` | Hintergrund Querformat (Canva „IT ICF Hintergrund Desktop“, Seite 4) |
| `hintergrund-handy.jpg` / `.webp` | Hintergrund Hochformat (Canva „IT ICF Hintergrund Handy“, Seite 5) |
| `icf-design.css` | Farben als CSS-Variablen + Schrift „ICF Glitch“ |
| `fonts/` | Rubik Glitch (SIL Open Font License) |
| `glpi/pics/favicon.ico` | Favicon für helpdesk.icf-essen.de – vom Front-Caddy statt der GLPI-Datei ausgeliefert |
| `vaultwarden/images/` | Favicon-Satz für vault.icf-essen.de – der Front-Caddy liefert ihn statt der Bitwarden-Dateien aus (gleiche Pfade wie im Web-Vault) |

Farben: Primär Cyan `#22d3ee` (auf Cyan dunkle Schrift `#0b2230`), Hintergrund Petrol `#0f4159`.

## Aktualisieren

Auf einem Proxmox-Node (z. B. `pve1`):

```bash
git clone --depth 1 https://github.com/icf-essen/status /tmp/icf-status
tar -C /tmp/icf-status/design -czf /tmp/icf-design.tar.gz .
pct push 110 /tmp/icf-design.tar.gz /tmp/icf-design.tar.gz
pct exec 110 -- sh -c 'mkdir -p /srv/icf-design && tar -xzf /tmp/icf-design.tar.gz -C /srv/icf-design && chmod -R a+rX /srv/icf-design && rm /tmp/icf-design.tar.gz'
rm -rf /tmp/icf-status /tmp/icf-design.tar.gz
```
