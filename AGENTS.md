# AGENTS.md

Projektspezifische Arbeitsregeln fuer das WordPress-Plugin **JE Kalender**.

Diese Datei ergaenzt die globale `AGENTS.md`. Allgemeine Regeln zu kleinen Schritten, Git, Sicherheit, Tests, Secrets und sauberem Arbeiten gelten weiterhin und werden hier nicht wiederholt.

---

## 1. Projektkontext

- Das Projekt ist ein WordPress-Plugin fuer die Anzeige von Google-Kalender-Veranstaltungen.
- Einstiegspunkt ist `je-kalender.php`.
- Fachmodule liegen unter `includes/`.
- Frontend-Assets liegen aktuell in `je-kalender.js` und `google-calendar.css`.
- Admin-JavaScript liegt aktuell in `je-kalender-admin.js`.
- Bestehende WordPress-Konventionen haben Vorrang vor eigenen Framework-Strukturen.

Wichtige Bereiche:

```text
includes/
+-- shortcodes.php  Shortcodes fuer Kalenderausgaben
+-- assets.php      Bedingtes Laden der Frontend-Assets
+-- admin.php       Admin-Menue und Einstellungsseite
+-- ajax.php        Server-seitige API-Proxies und Caching
+-- functions.php   Hilfsfunktionen fuer Konfiguration und API-Keys
+-- install.php     Aktivierungshook fuer kuenftige Migrationen
```

---

## 2. Architektur und Dateigrenzen

- `je-kalender.php` soll langfristig moeglichst schlank bleiben.
- Neue Logik bevorzugt in ein passendes Modul unter `includes/` legen.
- Keine neue Unterstruktur einfuehren, wenn die bestehende Struktur ausreicht.
- Admin-Menues, Hooks und Registrierungen nur dort verschieben, wo die Abhaengigkeiten klar bleiben.
- Shortcode-Ausgabe, Asset-Registrierung und Einstellungslogik nicht unnoetig vermischen.
- Gemeinsame Hilfsfunktionen nur dann auslagern, wenn sie wirklich mehrfach genutzt werden.

---

## 3. WordPress-Sicherheit

Bei jeder Aenderung an Formularen, AJAX-Endpunkten oder gespeicherten Optionen pruefen:

- Nonces mit `wp_nonce_field()`, `wp_verify_nonce()` oder `check_ajax_referer()`.
- Capabilities mit WordPress-Rechten wie `manage_options` pruefen.
- Eingaben passend sanitizen, z. B. `sanitize_text_field()`, `sanitize_textarea_field()`, `intval()`, `array_map()`.
- Ausgaben passend escapen, z. B. `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()`.
- Keine API-Keys, Tokens oder vollstaendige Secret-Werte ausgeben.
- Admin-AJAX-Endpunkte immer mit Capability-Check und Nonce absichern.

---

## 4. API-Keys und Kalenderlogik

- API-Key-Logik nicht unnoetig veraendern.
- Konstanten aus `wp-config.php` haben Vorrang vor gespeicherten Optionen.
- Bestehende Optionsnamen mit Prefix `je_kalender_` beibehalten.
- Google Calendar API, Google Geocoding und OpenCage getrennt behandeln.
- Frontend-Zugriffe auf externe APIs bevorzugt ueber die WordPress-AJAX-Proxies fuehren.
- Fehler bei externen API-Aufrufen nachvollziehbar behandeln und nicht still verschlucken.
- Keine Secrets in Logs, HTML, JavaScript-Debugausgaben oder Dokumentation ausgeben.

---

## 5. PHP-Stil

- PHP-Funktionen bekommen kurze deutsche Docblocks, wenn sie neu angelegt oder wesentlich geaendert werden.
- WordPress-Funktionen und Hooks im bestehenden Stil halten.
- Fruehe Rueckgaben sind bevorzugt, wenn sie Verschachtelung reduzieren.
- Keine produktiven `var_dump()`, `print_r()` oder Debug-Ausgaben im finalen Code.
- Inline-Kommentare nur fuer echte Fachlogik oder nicht offensichtliche Randfaelle.
- PHP-Dateien mit `defined('ABSPATH') || exit;` schuetzen, sofern sie direkt ladbare Pluginmodule sind.
- Projektlokale PHP-Tools werden ueber Composer verwaltet.
- `composer run lint` prueft PHP-Syntax.
- `composer run phpcs` prueft projektlokal definierte PHPCS-Regeln.
- `composer run phpcbf` darf fuer automatisch reparierbare PHPCS-Befunde genutzt werden, aber nicht als blinde Gesamtformatierung fuer das ganze historische Projekt.
- Das aktuelle `phpcs.xml.dist` ist bewusst auf Sicherheit, WordPress-relevante Checks und Kompatibilitaet fokussiert; reine Stilregeln werden nur schrittweise verschaerft.

---

## 6. JavaScript und CSS

- Bestehende Frontend-UI nicht ohne Auftrag grundlegend umgestalten.
- JavaScript fuer Kalender-, Filter- oder Kartenlogik moeglichst gezielt erweitern.
- Bestehende IDs, Klassen und Shortcode-Datenattribute nicht ohne Migrationsgrund aendern.
- CSS nur gezielt erweitern; keine globalen Theme-Styles unnoetig ueberschreiben.
- Externe CDN-Abhaengigkeiten nicht erweitern, ohne kurz zu begruenden, warum sie noetig sind.

---

## 7. Plugin-Daten und Optionen

- Bestehende Optionsnamen beibehalten, solange keine Migration vorgesehen ist.
- Neue Optionen klar mit Prefix `je_kalender_` benennen.
- Gespeicherte Arrays strukturiert halten und beim Lesen defensiv pruefen.
- Aenderungen an Capabilities, Optionen oder gespeicherten Daten muessen rueckwaertskompatibel bleiben, sofern nichts anderes vereinbart ist.

---

## 8. Dokumentation und Versionierung

- Bei relevanten Feature- oder Bugfix-Aenderungen `CHANGELOG.md` aktualisieren.
- Plugin-Version in `je-kalender.php` und Dokumentation konsistent halten, wenn eine Versionsaenderung Teil der Aufgabe ist.
- `README.md` nur aktualisieren, wenn sich Nutzerverhalten, Installation, Konfiguration oder Featureumfang aendern.
- Keine rechtlichen, Datenschutz- oder Compliance-Aussagen ergaenzen, ohne dass sie fachlich belegt oder ausdruecklich gewuenscht sind.

---

## 9. SFTP und lokale Entwicklungsumgebung

- SFTP-Zugangsdaten gehoeren nicht ins Repository.
- `.vscode/sftp.json` bleibt lokal ignoriert und darf keine Secrets in Antworten oder Commits bringen.
- Fuer teilbare VS-Code-Konfigurationen nur unkritische Einstellungen versionieren.
- Deploy-/Sync-Einstellungen duerfen keine produktiven Daten loeschen oder ueberschreiben, ohne dass dies ausdruecklich bestaetigt wurde.
- Sync-Richtung ist ausschliesslich lokal nach remote. Keine Remote-Dateien als Quelle fuer lokalen Code verwenden, ausser der Nutzer fordert dies ausdruecklich.
- Remote-Pfad fuer dieses Plugin: `/www/htdocs/w019c007/lauffreunde-naheland.jan-erbert.de/wp-content/plugins/je-kalender-plugin`.
- Beim SFTP-/Server-Sync immer lokale Ausschluesse beachten: `.git`, `.vscode`, `.agents`, `.codex`, `vendor`, `node_modules`, `wiki`, Logs, ZIPs und lokale Cache-Dateien.
- Nach einem manuellen SFTP-/Server-Sync eine kurze Kontrolle melden: Anzahl Uploads, Loeschungen, fehlende Dateien und extra Remote-Dateien.

---

## 10. Validierung

Nach Aenderungen passend pruefen:

```bash
git status
git diff
composer run lint
composer run phpcs
```

Wenn Composer-Abhaengigkeiten fehlen, zuerst ausfuehren:

```bash
composer install
```

Wenn `php` oder Composer lokal nicht verfuegbar ist, dies offen nennen und mindestens Diff sowie betroffene Kontrollfluesse manuell pruefen.

Bei WordPress-spezifischen Aenderungen zusaetzlich im Adminbereich testen:

- Plugin aktivieren.
- Einstellungsseite oeffnen.
- Kalender-Shortcode testen.
- Gefilterten Kalender-Shortcode testen.
- Kartenanzeige mit Einwilligung testen.
