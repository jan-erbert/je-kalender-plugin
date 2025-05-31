function createConsentBox(mapId, onAccept) {
    const container = document.getElementById(mapId);
    if (!container) return;

    const consentGiven = localStorage.getItem("jeKalender_map_consent") === "true";
    if (consentGiven) {
        onAccept();
        return;
    }

    container.innerHTML = `
        <div style="border: 1px solid #ccc; padding: 16px; background: #f9f9f9; border-radius: 6px;">
            <p>🛡️ Zur Anzeige der Karte werden Daten von <strong>OpenStreetMap</strong> geladen. Dabei können personenbezogene Daten (z. B. IP-Adresse) übertragen werden.</p>
            <button class="consent-map-button" style="margin-top: 10px;">Karte anzeigen</button>
        </div>
    `;

    container.querySelector(".consent-map-button").addEventListener("click", () => {
        localStorage.setItem("jeKalender_map_consent", "true");
        container.innerHTML = "";
        onAccept();
    });
}


async function geocodeAddress(address, mapId, geoKey) {

    try {
        const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${geoKey}`);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            document.getElementById(mapId).innerHTML = "<p style='color:red;'>⚠️ Adresse nicht gefunden.</p>";
            return;
        }

        const { lat, lng } = data.results[0].geometry;

        createConsentBox(mapId, () => {
            const map = L.map(mapId).setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);
            L.marker([lat, lng]).addTo(map);
            document.getElementById(mapId)._leaflet_map = map;
        });

    } catch (err) {
        console.error("Geocoding-Fehler:", err);
        document.getElementById(mapId).innerHTML = "<p style='color:red;'>⚠️ Karte konnte nicht geladen werden.</p>";
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const container = document.getElementById("je-google-calendar") || document.getElementById("gcal-filtered-events");
    if (!container) return;
    const filteredCalendarContainer = document.getElementById("gcal-filtered-events");

    const isFiltered = container.id === "gcal-filtered-events";
    const googleApiKey = typeof JEKalenderData !== "undefined" ? JEKalenderData.googleKey : null;
    const geoKey = typeof JEKalenderData !== "undefined" ? JEKalenderData.geoKey : null;

    const mapId = typeof JEKalenderData !== "undefined" ? JEKalenderData.mapId : (typeof JEKalenderDataFiltered !== "undefined" ? JEKalenderDataFiltered.mapId : null);
    const calendarId = container.getAttribute("data-calendar-id");
    const maxResults = parseInt(container.getAttribute("data-max") || "50", 10);
    const selectedCategory = isFiltered ? container.getAttribute("data-category")?.trim().toLowerCase() || "" : null;

    if (!calendarId || !googleApiKey) {
        console.error("❌ calendarId oder apiKey fehlen.");
        return;
    }

    const validCategories = [
        "lauftraining", "jugendliche", "erwachsene", "kinder",
        "schwimmtraining", "triathlon", "krafttraining",
        "wettkampf", "sportabzeichen"
    ];

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

    // =========================
    // VOLLSTÄNDIGER KALENDER
    // =========================
    if (!isFiltered) {
        const calendarId = container.getAttribute("data-calendar-id");
        const maxResults = container.getAttribute("data-max") || 125;

        container.innerHTML = `
            <h2>📅 Nächste Events</h2>
            <div class="calendar-filters" style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px;">
                <label for="event-search" style="display: flex; align-items: center; gap: 6px;">
                    🔍 <input type="text" id="event-search" placeholder="Nach Event suchen..." style="flex: 1; min-width: 200px;">
                </label>
                <label for="category-filter" style="display: flex; align-items: center; gap: 6px;">
                    📁 <select id="category-filter"><option value="Alle">Alle</option></select>
                </label>
                <label class="competition-filter">
                    <input type="checkbox" id="competition-checkbox"> Nur Wettkämpfe anzeigen
                </label>
            </div>
            <ul id="events"></ul>
            <div id="pagination">
                <button id="prev-page" disabled>⬅️ Zurück</button>
                <span id="page-info"></span>
                <button id="next-page">Weiter ➡️</button>
            </div>
        `;

        const eventList = document.getElementById("events");
        const categoryFilter = document.getElementById("category-filter");
        const searchInput = document.getElementById("event-search");
        const prevPageBtn = document.getElementById("prev-page");
        const nextPageBtn = document.getElementById("next-page");
        const pageInfo = document.getElementById("page-info");
        const competitionCheckbox = document.getElementById("competition-checkbox");
        let allEvents = [], filteredEvents = [], allCategories = new Set(), currentPage = 1;
        const eventsPerPage = 15;

        async function fetchFullEvents() {
            const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${googleApiKey}&timeMin=${new Date().toISOString()}&orderBy=startTime&singleEvents=true&maxResults=${maxResults}`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.items && data.items.length > 0) {
                    processFullEvents(data.items);
                } else {
                    eventList.innerHTML = "<li>❌ Keine kommenden Events gefunden.</li>";
                }
            } catch (err) {
                console.error("❌ Fehler beim Abrufen der Events:", err);
                eventList.innerHTML = "<li>⚠️ Fehler beim Laden der Events.</li>";
            }
        }

        function processFullEvents(events) {
            allEvents = events.map(event => {
                if (!event.start || (!event.start.dateTime && !event.start.date)) return null;

                const title = event.summary || "";
                let description = event.description || "";
                const isAllDay = !event.start.dateTime;
                const startDate = new Date(event.start.dateTime || event.start.date);
                const location = event.location || "";

                const { categories, sanitizedDesc } = extractCategories(description);
                description = sanitizedDesc;

                return { title, description, startDate, location, categories, isAllDay };
            }).filter(e => e !== null);

            if (allEvents.length === 0) {
                eventList.innerHTML = "<li>❌ Keine kommenden Events gefunden.</li>";
                return;
            }

            allEvents.forEach(ev => ev.categories.forEach(cat => allCategories.add(cat)));
            updateCategoryDropdown();
            filterAndRenderEvents();
        }

        function updateCategoryDropdown() {
            allCategories.forEach(cat => {
                const option = document.createElement("option");
                option.value = cat;
                option.textContent = cat;
                categoryFilter.appendChild(option);
            });

            categoryFilter.addEventListener("change", filterAndRenderEvents);
            searchInput.addEventListener("input", filterAndRenderEvents);
            competitionCheckbox.addEventListener("change", filterAndRenderEvents);
        }

        function filterAndRenderEvents() {
            const selectedCategory = categoryFilter.value;
            const searchQuery = searchInput.value.toLowerCase();
            const onlyCompetition = competitionCheckbox.checked;

            filteredEvents = allEvents.filter(event => {
                if (selectedCategory !== "Alle" && !event.categories.includes(selectedCategory)) return false;
                if (onlyCompetition && !event.categories.includes("wettkampf")) return false;
                if (searchQuery && !event.title.toLowerCase().includes(searchQuery)) return false;
                return true;
            });

            currentPage = 1;
            renderEvents();
        }

        function renderEvents() {
            eventList.innerHTML = "";

            const start = (currentPage - 1) * eventsPerPage;
            const paginated = filteredEvents.slice(start, start + eventsPerPage);

            paginated.forEach((event, index) => {
                const eventEl = document.createElement("li");
                eventEl.className = "event-item";

                const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                let formattedDate = event.startDate.toLocaleDateString('de-DE', dateOptions);
                if (!event.isAllDay) {
                    formattedDate += ` - ${event.startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;
                }

                eventEl.innerHTML = `
                    <div class="event-header" data-index="${index}">
                        <strong>${event.title}</strong><br>📅 ${formattedDate}
                    </div>
                    <div class="event-details" id="event-details-${index}" style="display:none;">
                        <p><strong>🔹 Kategorie:</strong> ${event.categories.join(", ")}</p>
                        ${event.description ? `<p><strong>📝 Beschreibung:</strong><br>${event.description}</p>` : ""}
                        ${event.location ? `<p><strong>📍 Standort:</strong> ${event.location}</p><div class="event-map" id="map-${index}"></div>` : ""}
                    </div>
                `;

                eventList.appendChild(eventEl);

            });

            attachToggles();
            updatePagination();
        }

        function attachToggles() {
            document.querySelectorAll(".event-header").forEach(header => {
                header.addEventListener("click", function () {
                    const i = this.getAttribute("data-index");
                    const box = document.getElementById(`event-details-${i}`);
                    const mapContainer = document.getElementById(`map-${i}`);

                    const wasHidden = box.style.display === "none";
                    box.style.display = wasHidden ? "block" : "none";

                    if (wasHidden && mapContainer && !mapContainer.classList.contains("map-loaded")) {
                        // Nur beim ersten Öffnen laden
                        const locationText = mapContainer?.parentElement?.querySelector("p strong + br")?.nextSibling?.textContent?.trim()
                            || mapContainer?.previousElementSibling?.textContent?.trim()
                            || "";
                        if (locationText) {
                            geocodeAddress(locationText, `map-${i}`, geoKey);
                            mapContainer.classList.add("map-loaded"); // Nur einmal pro Map
                        }
                    }

                    // Leaflet-Fix bei erneutem Öffnen
                    if (wasHidden && mapContainer && mapContainer._leaflet_map) {
                        mapContainer._leaflet_map.invalidateSize();
                    }
                });
            });
        }

        function updatePagination() {
            const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
            pageInfo.textContent = `Seite ${currentPage} von ${totalPages}`;
            prevPageBtn.disabled = (currentPage === 1);
            nextPageBtn.disabled = (currentPage >= totalPages);
        }

        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderEvents();
            }
        });

        nextPageBtn.addEventListener("click", () => {
            if (currentPage < Math.ceil(filteredEvents.length / eventsPerPage)) {
                currentPage++;
                renderEvents();
            }
        });

        fetchFullEvents();
    }

    // =========================
    // GEFILTERTER KALENDER
    // =========================
    else {
        const calendarId = filteredCalendarContainer.getAttribute("data-calendar-id");
        const category = filteredCalendarContainer.getAttribute("data-category")?.trim().toLowerCase() || "";
        const maxEvents = parseInt(filteredCalendarContainer.getAttribute("data-max") || "3", 10);

        async function fetchFilteredEvents() {
            const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${googleApiKey}&timeMin=${new Date().toISOString()}&orderBy=startTime&singleEvents=true&maxResults=100`;
            try {
                const res = await fetch(url);
                const data = await res.json();

                if (!data.items || data.items.length === 0) {
                    filteredCalendarContainer.innerHTML = "<li>❌ Keine kommenden Events gefunden.</li>";
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
                    filteredCalendarContainer.innerHTML = "<li>⚠️ Keine passenden Events gefunden.</li>";
                    return;
                }

                renderFilteredEvents(filtered);
            } catch (err) {
                console.error("❌ Fehler beim Abrufen der Events:", err);
                filteredCalendarContainer.innerHTML = "<li>⚠️ Fehler beim Laden der Events.</li>";
            }
        }

        function renderFilteredEvents(events) {
            filteredCalendarContainer.innerHTML = "";

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
                        <strong>📌 ${ev.title}</strong><br>📅 ${dateStr}
                    </div>
                    <div class="event-details" id="event-details-${i}" style="display:none;">
                        ${ev.categories.length ? `<p><strong>🔹 Kategorie:</strong> ${ev.categories.join(", ")}</p>` : ""}
                        ${ev.description ? `<p><strong>📝 Beschreibung:</strong><br>${ev.description}</p>` : ""}
                        ${ev.location ? `<p><strong>📍 Standort:</strong> ${ev.location}</p><div class="event-map" id="map-${i}"></div>` : ""}
                    </div>
                `;

                filteredCalendarContainer.appendChild(li);

            });

            attachToggles();
        }

        function attachToggles() {
            document.querySelectorAll(".event-header").forEach(header => {
                header.addEventListener("click", function () {
                    const i = this.getAttribute("data-index");
                    const box = document.getElementById(`event-details-${i}`);
                    const mapContainer = document.getElementById(`map-${i}`);

                    const wasHidden = box.style.display === "none";
                    box.style.display = wasHidden ? "block" : "none";

                    if (wasHidden && mapContainer && !mapContainer.classList.contains("map-loaded")) {
                        const locationText = mapContainer?.previousElementSibling?.textContent?.trim() || "";
                        if (locationText) {
                            geocodeAddress(locationText, `map-${i}`, geoKey);
                            mapContainer.classList.add("map-loaded");
                        }
                    }

                    if (wasHidden && mapContainer && mapContainer._leaflet_map) {
                        mapContainer._leaflet_map.invalidateSize();
                    }
                });
            });
        }


        fetchFilteredEvents();
    }
});