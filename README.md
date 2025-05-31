# JE Kalender

**Autor:** Jan Erbert  
**Lizenz:** MIT  
**Requires at least:** WordPress 5.8  
**Tested up to:** 6.5  
**Tags:** kalender, google calendar, leaflet, veranstaltungen, events, karte

---

## 📋 Beschreibung

**JE Kalender** ist ein WordPress-Plugin zur einfachen Einbindung eines öffentlichen Google Kalenders auf deiner Webseite – ergänzt um eine optisch ansprechende Eventliste mit Filter- und Kartendarstellung via OpenStreetMap (Leaflet).

Ideal für Vereine, Organisationen oder Gruppen, die Veranstaltungen auf einfache Weise veröffentlichen möchten.

---

## 🚀 Features

- ✅ Anzeige kommender Events aus einem Google Kalender
- 🔍 Suchfunktion & Kategoriefilter
- 🗂 Unterstützung von Event-Kategorien via [Kategorie1, Kategorie2]
- 🗺 Leaflet-Integration für Kartenanzeige (OpenStreetMap)
- 🔐 Datenschutzkonforme Karteneinbindung mit Nutzer-Zustimmung
- 📱 Responsives Design
- 🛠 Admin-Seite mit Einstellung für:
  - Google Kalender-ID
  - Google API Key (für Kalenderdaten)
  - OpenCage API Key (für Geocoding / Karten)
- 🔧 Fallback über `wp-config.php` für API Keys

---

## 🧩 Shortcodes

### 🔹 Standard-Kalender

```shortcode
[google_calendar]
```

→ Zeigt alle kommenden Events, durchsuch- und filterbar

### 🔹 Gefilterter Kalender (z. B. Leichtathletik)

```shortcode
[google_calendar_filtered category="leichtathletik" max="3"]
```

→ Zeigt nur Events mit passender Kategorie, maximal 3 Einträge

---

## 🗺 Kartenanzeige

Die Standort-Karten werden nur geladen, wenn ein Event geöffnet wird und der Nutzer aktiv zustimmt.  
Dazu wird OpenCage Geocoding verwendet (API Key erforderlich).

---

## 🧪 ToDos für nächste Versionen

- ⏳ Fallback bei fehlgeschlagenem Geocoding (Google Maps-Link?)
- ⏳ Gutenberg Block für Kalender

---

## 📝 Lizenz

MIT License – frei für private und kommerzielle Nutzung.

---

## 🤝 Mitwirken

Du hast eine Idee, einen Bug gefunden oder möchtest helfen?  
→ [Issue erstellen](https://github.com/dein-benutzername/je-kalender/issues)
