# JE Kalender

**Autor:** Jan Erbert  
**Lizenz:** MIT  
**Requires at least:** WordPress 5.8  
**Tested up to:** 6.5  
**Tags:** kalender, google calendar, leaflet, veranstaltungen, events, karte

---

## 📋 Beschreibung

**JE Kalender** ist ein WordPress-Plugin zur einfachen Einbindung eines öffentlichen Google Kalenders auf deiner Webseite – ergänzt um eine optisch ansprechende Eventliste mit Filter- und Kartendarstellung via OpenStreetMap (Leaflet) oder optional Google Geocoding.

Ideal für Vereine, Organisationen oder Gruppen, die Veranstaltungen auf einfache Weise veröffentlichen möchten.

---

## 🚀 Features

- ✅ Anzeige kommender Events aus einem Google Kalender
- 🔍 Suchfunktion & Kategoriefilter
- 🗂 Unterstützung von Event-Kategorien via [Kategorie1, Kategorie2]
- 🗺 Leaflet-Integration für Kartenanzeige (OpenStreetMap)
- 🗺 Alternativ: Google Geocoding API für präzisere Standortauflösung
- 🔐 Datenschutzkonforme Karteneinbindung mit Nutzer-Zustimmung
- 📱 Responsives Design
- 🧭 Karten-Fallback mit Links zu OpenStreetMap und Google Maps
- 🛠 Admin-Seite mit Einstellung für:
  - Google Kalender-ID
  - Google API Key (für Kalenderdaten)
  - Wahl zwischen OpenCage oder Google Geocoding
  - Je nach Auswahl: API Key für OpenCage oder Google Geocoding
- 🔧 Fallback über `wp-config.php` für API Keys
- ⚡ Serverseitiger API-Proxy mit Cache für Kalender- und Geocoding-Anfragen
- 🧹 Cache kann im Backend manuell geleert werden

---

## 🧩 Shortcodes

### 🔹 Standard-Kalender

```shortcode
[google_calendar]
```

→ Zeigt kommende Events bis zum konfigurierten Serverlimit, durchsuch- und filterbar

Der Hauptkalender laedt initial nur eine begrenzte Eventmenge und erweitert den Cache beim Weiterblaettern automatisch. Die maximal ladbare Anzahl kann bei Bedarf gezielt begrenzt werden:

```shortcode
[google_calendar max="500"]
```

### 🔹 Gefilterter Kalender (z. B. Leichtathletik)

```shortcode
[google_calendar_filtered category="leichtathletik" max="3"]
```

→ Zeigt nur Events mit passender Kategorie, maximal 3 Einträge

---

## 🗺 Kartenanzeige

Die Standort-Karten werden nur geladen, wenn ein Event geöffnet wird und der Nutzer aktiv zustimmt.  
Je nach Auswahl im Backend erfolgt das Geocoding über **OpenCage** (kostenlos) oder **Google Maps Geocoding API** (deutlich präziser, ggf. kostenpflichtig -> Anfragen Limit beachten!).

---

## ⚙️ Technische Hinweise

Kalender- und Geocoding-Anfragen laufen über WordPress-AJAX. API Keys werden dadurch nicht mehr direkt im Frontend ausgegeben.

Standard-Caches:

- Kalender-Events: 30 Minuten
- Geocoding-Ergebnisse: 30 Tage

Der Event-Cache wird pro Kalender aufgebaut und fuer kleinere oder gleich grosse `max`-Abrufe wiederverwendet. Wenn eine groessere Eventmenge angefordert wird, kann der Cache innerhalb des Serverlimits erweitert werden.

Gefilterte Kalender durchsuchen standardmaessig den konfigurierten Event-Pool und zeigen danach nur die per `max` gewuenschte Anzahl Treffer an. So koennen seltenere Kategorien wie Wettkaempfe weiter in die Zukunft gefunden werden, ohne pro Besucher neu bei Google abzufragen.

Die Cache-Dauer kann bei Bedarf über Konstanten in `wp-config.php` angepasst werden:

```php
define('JE_KALENDER_EVENTS_CACHE_TTL', 30 * MINUTE_IN_SECONDS);
define('JE_KALENDER_GEOCODING_CACHE_TTL', 30 * DAY_IN_SECONDS);
```

Die initiale Event-Anzahl fuer den Hauptkalender und die maximal abrufbare Event-Anzahl sind standardmaessig auf 150 bzw. 1000 begrenzt und koennen angepasst werden:

```php
define('JE_KALENDER_EVENTS_INITIAL_RESULTS', 150);
define('JE_KALENDER_EVENTS_MAX_RESULTS', 1000);
```

Für gezielte Fehlersuche kann der Debug-Modus aktiviert werden:

```php
define('JE_KALENDER_DEBUG', true);
```

---

## 🧪 ToDos für nächste Versionen

- ⏳ Gutenberg Block für Kalender

---

## 📝 Lizenz

MIT License – frei für private und kommerzielle Nutzung.

---

## 🤝 Mitwirken

Du hast eine Idee, einen Bug gefunden oder möchtest helfen?  
→ [Issue erstellen](https://github.com/dein-benutzername/je-kalender/issues)
