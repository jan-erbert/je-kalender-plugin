# Changelog

Alle Änderungen am Plugin „JE Kalender“ werden in diesem Dokument aufgeführt.

## [1.1.3] - 2026-06-09

### Hinzugefügt

- Fallback-Links zu OpenStreetMap und Google Maps, wenn die eingebettete Karte nicht geladen werden kann.
- Button zum Leeren des Kalender- und Geocoding-Caches auf der Einstellungsseite.

## [1.1.2] - 2026-06-09

### Geändert

- Google Calendar API-Aufrufe laufen jetzt über einen WordPress-AJAX-Proxy statt direkt aus dem Browser.
- Geocoding-Aufrufe für OpenCage und Google laufen jetzt serverseitig über WordPress-AJAX.
- API-Keys werden nicht mehr an das Frontend lokalisiert.
- Kalender-Events werden per WordPress Transient kurzzeitig gecacht.
- Geocoding-Ergebnisse werden per WordPress Transient längerfristig gecacht.
- Serverseitige API-Anfragen senden den Website-Referrer mit, damit vorhandene referrerbasierte Google-API-Keys weiter funktionieren.
- Sichere Debug-Details für serverseitige API-Fehler ergänzt, um Google-/Hosting-Probleme gezielt einzugrenzen.
- AJAX-Fehlerdetails können bei Bedarf gezielt über `JE_KALENDER_DEBUG` sichtbar gemacht werden.
- Google-Calendar-Proxy normalisiert Kalender-IDs und verwendet UTC-Zeitstempel im `Z`-Format.
- README um Hinweise zu serverseitigem Proxy, Cache-Dauer und Debug-Modus ergänzt.

## [1.1.1] - 2026-06-09

### Geändert

- Plugin-Hauptdatei weiter verschlankt und Admin- sowie Asset-Logik in eigene Include-Dateien ausgelagert.
- Frontend-Assets werden regulär nur noch auf Seiten mit Kalender-Shortcodes geladen.
- Shortcodes fordern ihre Frontend-Assets zusätzlich als Fallback an, damit Einbindungen außerhalb normaler Beitragsinhalte robuster bleiben.
- API-Key-Helfer für OpenCage und Google Geocoding ergänzt.
- Admin-Logik zur Anzeige der Geocoding-Felder null-sicherer gemacht.
- Breitenbegrenzung der Kalenderansicht nach der Container-Umstellung stabilisiert.
- Mobile Filterdarstellung nach der Umstellung auf eindeutige Container-IDs wieder klassenbasiert angebunden.
- Inline-Script der Einstellungsseite in ein eigenes Admin-Asset ausgelagert.
- Ungenutzte Neuanlage der historischen Antrags-Tabelle und Capability aus der Aktivierungslogik entfernt; bestehende Daten werden nicht gelöscht.

## [1.1.0] - 2026-06-09

### Geändert

- Pluginstruktur bereinigt: gemeinsame Hilfsfunktionen werden jetzt über `includes/functions.php` geladen.
- Shortcode-Ausgaben verwenden eindeutige Container-IDs und Klassen, damit mehrere Kalenderbereiche auf einer Seite stabiler funktionieren.
- Frontend-Rendering der Kalenderdaten überarbeitet, sodass Titel, Beschreibung und Standort nicht mehr ungefiltert per HTML eingefügt werden.
- Inline-Debug-Ausgaben im Frontend entfernt.
- Geocoding-Anfragen für Karten werden erst nach aktiver Kartenzustimmung ausgelöst.

### Behoben

- Aktivierungslogik aus `includes/install.php` wird jetzt über die Plugin-Hauptdatei registriert.
- Doppelte Definition von `je_kalender_get_calendar_id()` bereinigt.
- Kalender-ID berücksichtigt jetzt wieder die Konstante `JE_KALENDER_CALENDAR_ID` vor der gespeicherten Option.
- Einstellungswerte werden beim Speichern sanitisiert; der Geocoding-Anbieter ist auf `opencage` und `google` begrenzt.

## [1.0.4] - 2025-09-22

### Geändert

- Die Anzeige der Karte klappt nun korrekt auf Mobilen Endgeräten und Firefox

## [1.0.3] - 2025-06-03

### Geändert

- Die Anzeige der Event-Kategorien erfolgt jetzt mit korrekter Großschreibung (z. B. "Wettkampf, Erwachsene" statt "wettkampf, erwachsene")
- Die Filter- und Matchinglogik bleibt dabei weiterhin kleinschreibungsunabhängig (case-insensitive)

## [1.0.2] – 2025-06-01

### Geändert

- Neue Option zur Auswahl des Geocoding-Dienstes im Backend (Google Maps oder OpenCage)
- Google Maps Geocoding API vollständig integriert und optional nutzbar (präzisere Ortserkennung)
- OpenCage API Key wird nur angezeigt, wenn „OpenCage“ ausgewählt ist; analog für Google
- Geocoding-Fehlerbehandlung verbessert, inkl. Logging der API-Antwort
- Parsingfehler beim Standort behoben: Es wurde teilweise irrtümlich die Beschreibung statt der Adresse geokodiert (DOM-Selektor korrigiert)

## Technisch

- Geocoding-Aufrufe automatisch basierend auf Backend-Auswahl angepasst
- Leaflet-Karte verwendet weiterhin OpenStreetMap als Basiskarte

## [1.0.1] – 2025-05-31

## Technisch

- API Keys werden per wp_localize_script differenziert übergeben

## [1.0.0] – 2025-05-31

### Hinzugefügt

- Erste stabile Version mit Google Kalender Integration
- Unterstützung für Leaflet-Karten mit OpenCage Geocoding
- Datenschutzeinwilligung für Kartendarstellung (localStorage-basiert)
- [google_calendar] Shortcode für vollständige Eventlisten mit Filter
- [google_calendar_filtered] Shortcode für gefilterte Listen z. B. auf Startseite
- Unterstützung für manuelle oder per `wp-config.php` gesetzte API Keys
- Optimiertes Kartenverhalten: nur bei Bedarf geladen
- Paginierung, Kategorie-Filter, Suchfunktion, Stil

## [0.9.0] – 2025-05-24

### Hinzugefügt

- Grundstruktur für Google Kalender Integration
- Basisversion des Shortcodes `[google_calendar]`
- Erste Entwürfe für Admin-Einstellungen

### Geändert

- Umstellung der API-Abfrage auf GET `/events` mit dynamischer calendarId
- Wechsel auf OpenMaps statt GoogleMaps

## [0.8.0] – 2025-05-15

### Hinzugefügt

- Pluginstruktur erstellt (je-kalender.php, includes/, js/, css/)
- Dummy-Einbindung für zukünftige Google Kalender Funktion
- Platzhalter für Kartenanzeige mit Leaflet
