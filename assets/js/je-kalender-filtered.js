document.addEventListener("DOMContentLoaded", function () {
    const calendarId = jeKalender.calendarId;
    const apiKey = jeKalender.apiKey;
    const selectedCategory = jeKalender.category;
    const maxEvents = parseInt(jeKalender.maxEvents, 10);

    const eventList = document.getElementById("gcal-filtered-events");

    async function fetchEvents() {
        const cacheKey = "je_kalender_filtered_events";
        const cacheExpiry = 5 * 60 * 1000;

        const cached = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(cacheKey + "_time");

        if (cached && cacheTime && (Date.now() - cacheTime) < cacheExpiry) {
            const data = JSON.parse(cached);
            processEvents(data);
            return;
        }

        const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${new Date().toISOString()}&orderBy=startTime&singleEvents=true&maxResults=125`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.items) {
                sessionStorage.setItem(cacheKey, JSON.stringify(data.items));
                sessionStorage.setItem(cacheKey + "_time", Date.now());
                processEvents(data.items);
                document.getElementById("je-google-calendar").querySelector("p").remove();
            } else {
                eventList.innerHTML = "<li>❌ Keine kommenden Events gefunden.</li>";
            }
        } catch (err) {
            console.error("❌ Fehler beim Abrufen der Events:", err);
            eventList.innerHTML = "<li>⚠️ Fehler beim Laden der Events.</li>";
        }
    }

    function processEvents(events) {
        const allEvents = events.map(event => {
            if (!event.start || (!event.start.dateTime && !event.start.date)) {
                return null;
            }
            const title = event.summary || "";
            let description = event.description || "";
            const isAllDay = !event.start.dateTime;
            const startDate = new Date(event.start.dateTime || event.start.date);
            const location = event.location || "";
            const { categories, sanitizedDesc } = extractCategories(description);
            description = sanitizedDesc;

            return { title, description, startDate, location, categories, isAllDay };
        }).filter(ev => ev !== null);

        if (allEvents.length === 0) {
            eventList.innerHTML = "<li>❌ Keine kommenden Events gefunden.</li>";
            return;
        }

        let filtered = allEvents;
        if (selectedCategory) {
            filtered = allEvents.filter(event => event.categories.includes(selectedCategory));
        }

        renderEvents(filtered.slice(0, maxEvents));
    }

    function extractCategories(text) {
        const bracketRegex = /\[([^\]]+)\]/gi;
        let match;
        let finalCategories = [];
        let sanitizedText = text;

        while ((match = bracketRegex.exec(text)) !== null) {
            let bracketContent = match[1];
            bracketContent.split(",").forEach(cat => {
                let catTrimmed = cat.trim();
                if (catTrimmed) {
                    finalCategories.push(catTrimmed);
                }
            });
        }

        sanitizedText = sanitizedText.replace(bracketRegex, "").trim();

        return { categories: finalCategories, sanitizedDesc: sanitizedText };
    }

    function renderEvents(events) {
        eventList.innerHTML = "";

        events.forEach((event, index) => {
            const li = document.createElement("li");
            li.className = "event-item";

            const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            let dateStr = event.startDate.toLocaleDateString('de-DE', options);

            if (!event.isAllDay) {
                let timeStr = event.startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                dateStr += ` - ${timeStr} Uhr`;
            }

            li.innerHTML = `
                <div class="event-header" data-index="${index}">
                    <strong>📌 ${event.title}</strong><br>
                    📅 ${dateStr}
                </div>
                <div class="event-details" id="event-details-${index}" style="display: none;">
                    ${event.categories.length ? `<p><strong>🔹 Kategorie:</strong> ${event.categories.join(", ")}</p>` : ""}
                    ${event.description ? `<p><strong>📝 Beschreibung:</strong><br>${event.description}</p>` : ""}
                    ${event.location ? `<p><strong>📍 Standort:</strong> ${event.location}</p>` : ""}
                </div>
            `;

            eventList.appendChild(li);
        });

        addEventClickHandlers();
    }

    function addEventClickHandlers() {
        document.querySelectorAll(".event-header").forEach(header => {
            header.addEventListener("click", function () {
                const index = this.getAttribute("data-index");
                const details = document.getElementById(`event-details-${index}`);
                details.style.display = details.style.display === "none" ? "block" : "none";
            });
        });
    }

    fetchEvents();
});
