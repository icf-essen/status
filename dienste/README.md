# Dienst-Konfiguration (Corporate Design)

Gesicherte Fassungen der Design-Einstellungen, die in den Diensten selbst hinterlegt sind.
Dieser Ordner wird **nicht** ausgeliefert (im Gegensatz zu `design/`).

| Datei | Wo eingetragen |
|---|---|
| `authentik/brand.css` | Authentik → System → Brands → Custom CSS |
| `glpi/icf.scss` | VM 105: `/var/lib/glpi/files/_themes/` → Einrichtung → Allgemein → Standardwerte → Farbpalette „ICF Essen“ |
| `vaultwarden/user.vaultwarden.scss.hbs` | VM 102: `/opt/vaultwarden/vw-data/templates/scss/` (Container: `/data/templates/scss/`) |

### Vaultwarden

Die `.hbs`-Datei wird aus `user.vaultwarden.scss.vorlage` erzeugt – die Bilder aus `design/`
werden dabei eingebettet, weil Vaultwardens Content-Security-Policy keine Bilder von fremden
Domains erlaubt. Nach Änderungen an Vorlage oder Bildern:

```bash
python3 dienste/vaultwarden/erzeugen.py
```

Danach die Datei auf VM 102 kopieren und den Container neu starten (Vaultwarden hält das CSS
im Speicher). Lässt sich die Datei nicht übersetzen, nutzt Vaultwarden automatisch sein
Standard-Design und schreibt „Compiling the Vaultwarden SCSS styles failed“ ins Log.
