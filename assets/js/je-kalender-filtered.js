document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("gcal-filtered-events");
    if (!container) return;

    const apiKey = typeof JEKalenderData !== "undefined" ? JEKalenderData.apiKey : null;
    const calendarId = container.getAttribute("data-calendar-id");
    const category   = container.getAttribute("data-category")?.trim().toLowerCase() || "";
    const maxEvents  = parseInt(container.getAttribute("data-max") || "3", 10);

    const validCategories = [
        "lauftraining", "jugendliche", "erwachsene", "kinder",
        "schwimmtraining", "triathlon", "krafttraining",
        "wettkampf", "sportabzeichen"
    ];

    async function fetchEvents() {
        const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`
            + `?key=${apiKey}&timeMin=${new Date().toISOString()}`
            + `&orderBy=startTime&singleEvents=true&maxResults=100`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (!data.items || data.items.length === 0) {
                container.innerHTML = "<li>❌ Keine kommenden Events gefunden.</li>";
                return;
            }

            const events = data.items.map(ev => {
                if (!ev.start || (!ev.start.dateTime && !ev.start.date)) return null;

                const title = ev.summary || "Unbenanntes Event";
                let description = ev.description || "";
                const isAllDay = !ev.start.dateTime;
                const startDate = new Date(ev.start.dateTime || ev.start.date);
                const location = ev.location || "";

                const { categories, sanitizedDesc } = extractCategories(description);
                description = sanitizedDesc;

                return { title, description, startDate, location, categories, isAllDay };
            }).filter(e => e !== null);

            let filtered = events;
            if (category) {
                filtered = events.filter(ev =>
                    ev.categories.some(c => c.toLowerCase() === category)
                );
            }

            filtered = filtered.slice(0, maxEvents);

            if (filtered.length === 0) {
                container.innerHTML = "<li>⚠️ Keine passenden Events gefunden.</li>";
                return;
            }

            renderEvents(filtered);

        } catch (err) {
            console.error("❌ Fehler beim Abrufen der Events:", err);
            container.innerHTML = "<li>⚠️ Fehler beim Laden der Events.</li>";
        }
    }

    function extractCategories(text) {
        const bracketRegex = /\[([^\]]+)\]/gi;
        let match;
        let categories = [];
        let sanitizedText = text;

        while ((match = bracketRegex.exec(text)) !== null) {
            match[1].split(",").forEach(cat => {
                const clean = cat.trim().toLowerCase();
                if (validCategories.includes(clean)) {
                    categories.push(clean);
                }
            });
        }

        sanitizedText = sanitizedText.replace(bracketRegex, "").trim();
        return { categories, sanitizedDesc: sanitizedText };
    }

    function renderEvents(events) {
        container.innerHTML = "";

        events.forEach((ev, i) => {
            const li = document.createElement("li");
            li.className = "event-item";

            const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            let dateStr = ev.startDate.toLocaleDateString('de-DE', options);

            if (!ev.isAllDay) {
                const timeStr = ev.startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                dateStr += ` - ${timeStr} Uhr`;
            }

            li.innerHTML = `
                <div class="event-header" data-index="${i}">
                    <strong>📌 ${ev.title}</strong><br>
                    📅 ${dateStr}
                </div>
                <div class="event-details" id="event-details-${i}" style="display:none;">
                    ${ev.categories.length ? `<p><strong>🔹 Kategorie:</strong> ${ev.categories.join(", ")}</p>` : ""}
                    ${ev.description ? `<p><strong>📝 Beschreibung:</strong><br>${ev.description}</p>` : ""}
                    ${ev.location ? `<p><strong>📍 Standort:</strong> ${ev.location}</p><div class="event-map" id="map-${i}"></div>` : ""}
                </div>
            `;

            container.appendChild(li);

            if (ev.location) {
                setTimeout(() => {
                    geocodeAddress(ev.location, `map-${i}`);
                }, 300);
            }
        });

        attachToggles();
    }

    function attachToggles() {
        document.querySelectorAll(".event-header").forEach(header => {
            header.addEventListener("click", function () {
                const i = this.getAttribute("data-index");
                const box = document.getElementById(`event-details-${i}`);
                box.style.display = box.style.display === "none" ? "block" : "none";
            });
        });
    }

    function geocodeAddress(address, mapId) {
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === "OK") {
                    const { lat, lng } = data.results[0].geometry.location;
                    const map = new google.maps.Map(document.getElementById(mapId), {
                        center: { lat, lng },
                        zoom: 15
                    });
                    new google.maps.marker.AdvancedMarkerElement({
                        position: { lat, lng },
                        map: map
                    });
                    
                } else {
                    document.getElementById(mapId).innerHTML = "<p style='color:red;'>⚠️ Adresse nicht gefunden.</p>";
                }
            })
            .catch(() => {
                document.getElementById(mapId).innerHTML = "<p style='color:red;'>⚠️ Karte konnte nicht geladen werden.</p>";
            });
    }

    fetchEvents();
});
