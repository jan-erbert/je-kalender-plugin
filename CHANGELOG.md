# Changelog

Alle Änderungen am Plugin „JE Kalender“ werden in diesem Dokument aufgeführt.

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
