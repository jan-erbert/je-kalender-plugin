# Changelog

Alle Änderungen am Plugin „JE Kalender“ werden in diesem Dokument aufgeführt.

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
