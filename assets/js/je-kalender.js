document.addEventListener("DOMContentLoaded", function () {
    const calendarContainer = document.getElementById("je-google-calendar");
    if (!calendarContainer) return;

    const calendarId = calendarContainer.getAttribute("data-calendar-id");
    const apiKey = typeof JEKalenderData !== "undefined" ? JEKalenderData.apiKey : null;
    const maxResults = calendarContainer.getAttribute("data-max") || 125;

    // Dynamisch DOM-Elemente erzeugen
    calendarContainer.innerHTML = `
        <h2>📅 Nächste Events</h2>

         <div class="calendar-filters" style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px;">
        <label for="event-search" style="display: flex; align-items: center; gap: 6px;">
            🔍
            <input type="text" id="event-search" placeholder="Nach Event suchen..." style="flex: 1; min-width: 200px;">
        </label>

        <label for="category-filter" style="display: flex; align-items: center; gap: 6px;">
            📁
            <select id="category-filter">
                <option value="Alle">Alle</option>
            </select>
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

    const validCategories = [
        "Lauftraining", "Jugendliche", "Erwachsene", "Kinder",
        "Schwimmtraining", "Triathlon", "Krafttraining",
        "Wettkampf", "Sportabzeichen"
    ];

    let allEvents = [];
    let filteredEvents = [];
    let allCategories = new Set();
    let currentPage = 1;
    const eventsPerPage = 15;

    async function fetchEvents() {
        const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${new Date().toISOString()}&orderBy=startTime&singleEvents=true&maxResults=${maxResults}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                processEvents(data.items);
            } else {
                eventList.innerHTML = "<li>❌ Keine kommenden Events gefunden.</li>";
            }
        } catch (err) {
            console.error("❌ Fehler beim Abrufen der Events:", err);
            eventList.innerHTML = "<li>⚠️ Fehler beim Laden der Events.</li>";
        }
    }

    function processEvents(events) {
        allEvents = events.map(event => {
            if (!event.start || (!event.start.dateTime && !event.start.date)) return null;

            const title = event.summary || "";
            let description = event.description || "";
            const isAllDay = !event.start.dateTime;
            const startDate = new Date(event.start.dateTime || event.start.date);
            const location = event.location || "";

            const { categories, sanitizedDesc } = extractCategories(description);
            description = sanitizedDesc;

            return {
                title,
                description,
                startDate,
                location,
                categories: Array.isArray(categories) ? categories : [],
                isAllDay
            };
        }).filter(e => e !== null);

        if (allEvents.length === 0) {
            eventList.innerHTML = "<li>❌ Keine kommenden Events gefunden.</li>";
            return;
        }

        updateCategoryDropdown();
        filterAndRenderEvents();
    }

    function extractCategories(text) {
        const bracketRegex = /\[([^\]]+)\]/gi;
        let match;
        let finalCategories = [];
        let sanitizedText = text;

        while ((match = bracketRegex.exec(text)) !== null) {
            match[1].split(",").forEach(cat => {
                const clean = cat.trim().toLowerCase();
                const matchOriginal = validCategories.find(valid => valid.toLowerCase() === clean);
                if (matchOriginal) {
                    finalCategories.push(matchOriginal);
                    allCategories.add(matchOriginal);
                }
            });
        }

        sanitizedText = sanitizedText.replace(bracketRegex, "").trim();
        return { categories: finalCategories, sanitizedDesc: sanitizedText };
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
            if (onlyCompetition && !event.categories.includes("Wettkampf")) return false;
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

            if (event.location) {
                setTimeout(() => {
                    geocodeAddress(event.location, "map-" + index);
                }, 300);
            }
        });

        attachToggles();
        updatePagination();
    }

    function attachToggles() {
        document.querySelectorAll(".event-header").forEach(header => {
            header.addEventListener("click", function () {
                const i = this.getAttribute("data-index");
                const box = document.getElementById("event-details-" + i);
                box.style.display = box.style.display === "none" ? "block" : "none";
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

    async function geocodeAddress(address, mapId) {
        try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
            const data = await res.json();
    
            if (data.status !== "OK") {
                document.getElementById(mapId).innerHTML =
                    "<p style='color:red;'>⚠️ Adresse nicht gefunden.</p>";
                return;
            }
    
            const { lat, lng } = data.results[0].geometry.location;
            const map = new google.maps.Map(document.getElementById(mapId), {
                center: { lat, lng },
                zoom: 15,
            });
    
            // 📦 Lade Marker-Bibliothek asynchron
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    
            new AdvancedMarkerElement({
                map,
                position: { lat, lng },
            });
    
        } catch (err) {
            console.error("Geocoding-Fehler:", err);
            document.getElementById(mapId).innerHTML =
                "<p style='color:red;'>⚠️ Karte konnte nicht geladen werden.</p>";
        }
    }
    
    
    fetchEvents();
});
