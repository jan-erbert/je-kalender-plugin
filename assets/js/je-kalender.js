document.addEventListener("DOMContentLoaded", function () {
    const calendarId = jeKalender.calendarId;
    const apiKey = jeKalender.apiKey;

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
        const cacheKey = "je_kalender_events";
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
        allEvents = events.map(event => {
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

        updateCategoryDropdown();
        filterAndRenderEvents();
    }

    function extractCategories(text) {
        const bracketRegex = /\[([^\]]+)\]/gi;
        let match;
        let finalCategories = [];
        let sanitizedText = text;

        while ((match = bracketRegex.exec(text)) !== null) {
            let bracketContent = match[1];
            bracketContent.split(",").forEach(cat => {
                let catTrimmed = cat.trim().toLowerCase();
                const validCatOriginal = validCategories.find(valid => valid.toLowerCase() === catTrimmed);
                if (validCatOriginal) {
                    finalCategories.push(validCatOriginal);
                }
            });
        }

        sanitizedText = sanitizedText.replace(bracketRegex, "").trim();
        finalCategories.forEach(cat => allCategories.add(cat));

        return { categories: finalCategories, sanitizedDesc: sanitizedText };
    }

    function updateCategoryDropdown() {
        allCategories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        categoryFilter.addEventListener("change", filterAndRenderEvents);
        searchInput.addEventListener("input", filterAndRenderEvents);
        competitionCheckbox.addEventListener("change", filterAndRenderEvents);
    }

    function filterAndRenderEvents() {
        const selectedCategory = categoryFilter.value;
        const searchQuery = searchInput.value.toLowerCase();
        const onlyShowCompetition = competitionCheckbox.checked;

        filteredEvents = allEvents.filter(event => {
            if (selectedCategory !== "Alle" && !event.categories.includes(selectedCategory)) {
                return false;
            }
            if (onlyShowCompetition && !event.categories.includes("Wettkampf")) {
                return false;
            }
            if (searchQuery && !event.title.toLowerCase().includes(searchQuery)) {
                return false;
            }
            return true;
        });

        currentPage = 1;
        renderEvents();
    }

    function renderEvents() {
        eventList.innerHTML = "";

        const startIndex = (currentPage - 1) * eventsPerPage;
        const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);

        paginatedEvents.forEach((event, index) => {
            const eventElement = document.createElement("li");
            eventElement.className = "event-item";

            const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            let formattedDate = event.startDate.toLocaleDateString('de-DE', options);

            if (!event.isAllDay) {
                formattedDate += ` - ${event.startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;
            }

            eventElement.innerHTML = `
                <div class="event-header" data-index="${index}">
                    <strong>${event.title}</strong><br>
                    📅 ${formattedDate}
                </div>
                <div class="event-details" id="event-details-${index}" style="display: none;">
                    <p><strong>🔹 Kategorie:</strong> ${event.categories.join(", ")}</p>
                    ${event.description ? `<p><strong>📝 Beschreibung:</strong><br>${event.description}</p>` : ""}
                    ${event.location ? `<p><strong>📍 Standort:</strong> ${event.location}</p>` : ""}
                </div>
            `;

            eventList.appendChild(eventElement);
        });

        addEventClickHandlers();
        updatePagination();
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

    function updatePagination() {
        const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
        pageInfo.textContent = `Seite ${currentPage} von ${totalPages}`;
        prevPageBtn.disabled = (currentPage === 1);
        nextPageBtn.disabled = (currentPage >= totalPages);
    }

    prevPageBtn.addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            renderEvents();
        }
    });

    nextPageBtn.addEventListener("click", function () {
        if (currentPage < Math.ceil(filteredEvents.length / eventsPerPage)) {
            currentPage++;
            renderEvents();
        }
    });

    fetchEvents();
});
