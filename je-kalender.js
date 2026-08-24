(function () {
    window.JEKalenderData = window.JEKalenderData || {};

    const pluginData = window.JEKalenderData;
    const validCategories = [
        "lauftraining",
        "jugendliche",
        "erwachsene",
        "kinder",
        "schwimmtraining",
        "triathlon",
        "krafttraining",
        "wettkampf",
        "sportabzeichen",
    ];

    function clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    function createElement(tagName, className, text) {
        const element = document.createElement(tagName);

        if (className) {
            element.className = className;
        }

        if (typeof text === "string") {
            element.textContent = text;
        }

        return element;
    }

    function appendTextWithStrong(parent, label, text) {
        const paragraph = createElement("p");
        const strong = createElement("strong", "", label);

        paragraph.appendChild(strong);
        paragraph.appendChild(document.createTextNode(text));
        parent.appendChild(paragraph);
    }

    function showMessage(container, message) {
        clearElement(container);

        const item = container.tagName.toLowerCase() === "ul"
            ? createElement("li", "", message)
            : createElement("p", "", message);

        container.appendChild(item);
    }

    function createExternalLink(url, label) {
        const link = createElement("a", "", label);

        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        return link;
    }

    function showMapFallback(mapContainer, address, message) {
        clearElement(mapContainer);

        const wrapper = createElement("div", "je-map-fallback");
        const text = createElement("p", "", message || "Karte konnte nicht geladen werden.");
        const actions = createElement("p", "je-map-fallback-actions");
        const encodedAddress = encodeURIComponent(address);

        actions.appendChild(
            createExternalLink(
                "https://www.openstreetmap.org/search?query=" + encodedAddress,
                "Adresse in OpenStreetMap öffnen"
            )
        );
        actions.appendChild(document.createTextNode(" "));
        actions.appendChild(
            createExternalLink(
                "https://www.google.com/maps/search/?api=1&query=" + encodedAddress,
                "Adresse in Google Maps öffnen"
            )
        );

        wrapper.appendChild(text);
        wrapper.appendChild(actions);
        mapContainer.appendChild(wrapper);
    }

    function getMapConsent() {
        try {
            return localStorage.getItem("jeKalender_map_consent") === "true";
        } catch (error) {
            return false;
        }
    }

    function setMapConsent() {
        try {
            localStorage.setItem("jeKalender_map_consent", "true");
        } catch (error) {
            // Ohne localStorage bleibt die Zustimmung nur fuer den aktuellen Klick gueltig.
        }
    }

    function createConsentBox(mapContainer, providerName, onAccept) {
        if (!mapContainer) {
            return;
        }

        const provider = providerName || pluginData.geocoder || "opencage";
        const providerLabel = provider === "google" ? "Google Maps" : "OpenStreetMap";

        if (getMapConsent()) {
            onAccept();
            return;
        }

        clearElement(mapContainer);

        const box = createElement("div", "je-map-consent");
        const text = createElement(
            "p",
            "",
            "Zur Anzeige der Karte werden Daten von " + providerLabel + " geladen."
        );
        const button = createElement("button", "consent-map-button", "Karte anzeigen");

        button.type = "button";
        button.addEventListener("click", function () {
            setMapConsent();
            clearElement(mapContainer);
            onAccept();
        });

        box.appendChild(text);
        box.appendChild(button);
        mapContainer.appendChild(box);
    }

    async function fetchAjax(params) {
        if (pluginData.debug) {
            params.set("debug", "1");
        }

        const url = pluginData.ajaxUrl + "?" + params.toString();
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || !data.success) {
            const message = data && data.data && data.data.message
                ? data.data.message
                : "Anfrage konnte nicht geladen werden.";

            const error = new Error(message);
            error.details = data;

            if (pluginData.debug && window.console && window.console.error) {
                window.console.error("JE Kalender AJAX Fehler:", data);
            }

            throw error;
        }

        return data.data;
    }

    async function resolveCoordinates(address) {
        const params = new URLSearchParams({
            action: "je_kalender_geocode",
            nonce: pluginData.nonce || "",
            address,
        });

        return fetchAjax(params);
    }

    function geocodeAddress(address, mapContainer) {
        const provider = pluginData.geocoder || "opencage";

        createConsentBox(mapContainer, provider, async function () {
            try {
                if (typeof L === "undefined" || !L.map) {
                    showMapFallback(mapContainer, address, "Karte konnte nicht geladen werden.");
                    return;
                }

                const coordinates = await resolveCoordinates(address);
                const map = L.map(mapContainer).setView([coordinates.lat, coordinates.lng], 15);

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: "&copy; OpenStreetMap",
                    maxZoom: 19,
                }).addTo(map);
                L.marker([coordinates.lat, coordinates.lng]).addTo(map);

                mapContainer._leaflet_map = map;
            } catch (error) {
                showMapFallback(mapContainer, address, "Karte konnte nicht geladen werden.");
            }
        });
    }

    function capitalizeWords(str) {
        return str.replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
    }

    function extractCategories(text) {
        const bracketRegex = /\[([^\]]+)\]/gi;
        const categories = [];
        let match;

        while ((match = bracketRegex.exec(text)) !== null) {
            match[1].split(",").forEach(function (category) {
                const clean = category.trim().toLowerCase();

                if (validCategories.includes(clean)) {
                    categories.push(clean);
                }
            });
        }

        return {
            categories,
            sanitizedDesc: text.replace(bracketRegex, "").trim(),
        };
    }

    function normalizeEvent(event) {
        if (!event.start || (!event.start.dateTime && !event.start.date)) {
            return null;
        }

        const extracted = extractCategories(event.description || "");

        return {
            title: event.summary || "Unbenanntes Event",
            description: extracted.sanitizedDesc,
            startDate: new Date(event.start.dateTime || event.start.date),
            location: event.location || "",
            categories: extracted.categories,
            isAllDay: !event.start.dateTime,
        };
    }

    function formatEventDate(event) {
        const dateOptions = {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        };
        let formattedDate = event.startDate.toLocaleDateString("de-DE", dateOptions);

        if (!event.isAllDay) {
            formattedDate += " - " + event.startDate.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
            }) + " Uhr";
        }

        return formattedDate;
    }

    function buildEventItem(event, index, includePin) {
        const item = createElement("li", "event-item");
        const header = createElement("div", "event-header");
        const title = createElement("strong", "", (includePin ? "📌 " : "") + event.title);
        const details = createElement("div", "event-details");

        header.dataset.index = String(index);
        header.appendChild(title);
        header.appendChild(document.createElement("br"));
        header.appendChild(document.createTextNode("📅 " + formatEventDate(event)));

        details.hidden = true;
        details.dataset.location = event.location;

        if (event.categories.length) {
            appendTextWithStrong(
                details,
                "🔹 Kategorie: ",
                event.categories.map(capitalizeWords).join(", ")
            );
        }

        if (event.description) {
            appendTextWithStrong(details, "📝 Beschreibung: ", event.description);
        }

        if (event.location) {
            appendTextWithStrong(details, "📍 Standort: ", event.location);
            details.appendChild(createElement("div", "event-map"));
        }

        item.appendChild(header);
        item.appendChild(details);

        return item;
    }

    function attachToggles(container) {
        container.querySelectorAll(".event-header").forEach(function (header) {
            header.addEventListener("click", function () {
                const details = header.nextElementSibling;
                const mapContainer = details ? details.querySelector(".event-map") : null;
                const wasHidden = details ? details.hidden : false;

                if (!details) {
                    return;
                }

                details.hidden = !wasHidden;

                if (wasHidden && mapContainer && !mapContainer.classList.contains("map-loaded")) {
                    const locationText = details.dataset.location || "";

                    if (locationText) {
                        geocodeAddress(locationText, mapContainer);
                        mapContainer.classList.add("map-loaded");
                    }
                }

                if (wasHidden && mapContainer && mapContainer._leaflet_map) {
                    mapContainer._leaflet_map.invalidateSize();
                }
            });
        });
    }

    async function fetchCalendarEvents(maxResults) {
        const params = new URLSearchParams({
            action: "je_kalender_events",
            nonce: pluginData.nonce || "",
            max: String(maxResults),
        });
        const data = await fetchAjax(params);

        return {
            complete: Boolean(data.complete),
            items: Array.isArray(data.items) ? data.items : [],
        };
    }

    function buildFullCalendarLayout(container) {
        clearElement(container);

        const containerId = container.id || "je-google-calendar";
        const headline = createElement("h2", "", "📅 Nächste Events");
        const filters = createElement("div", "calendar-filters");
        const searchLabel = createElement("label", "calendar-search-label");
        const searchInput = createElement("input");
        const categoryLabel = createElement("label", "calendar-category-label");
        const categoryFilter = createElement("select");
        const competitionLabel = createElement("label", "competition-filter");
        const competitionCheckbox = createElement("input");
        const eventList = createElement("ul", "je-kalender-events");
        const pagination = createElement("div", "je-kalender-pagination");
        const prevPageBtn = createElement("button", "", "⬅️ Zurück");
        const pageInfo = createElement("span", "page-info");
        const nextPageBtn = createElement("button", "", "Weiter ➡️");
        const allOption = createElement("option", "", "Alle");

        searchInput.type = "text";
        searchInput.id = containerId + "-event-search";
        searchInput.placeholder = "Nach Event suchen...";
        categoryFilter.id = containerId + "-category-filter";
        categoryFilter.appendChild(allOption);
        competitionCheckbox.type = "checkbox";
        competitionCheckbox.id = containerId + "-competition-checkbox";
        prevPageBtn.type = "button";
        nextPageBtn.type = "button";
        prevPageBtn.disabled = true;
        searchLabel.htmlFor = searchInput.id;
        categoryLabel.htmlFor = categoryFilter.id;
        competitionLabel.htmlFor = competitionCheckbox.id;

        searchLabel.appendChild(document.createTextNode("🔍 "));
        searchLabel.appendChild(searchInput);
        categoryLabel.appendChild(document.createTextNode("📁 "));
        categoryLabel.appendChild(categoryFilter);
        competitionLabel.appendChild(competitionCheckbox);
        competitionLabel.appendChild(document.createTextNode(" Nur Wettkämpfe anzeigen"));

        filters.appendChild(searchLabel);
        filters.appendChild(categoryLabel);
        filters.appendChild(competitionLabel);

        pagination.appendChild(prevPageBtn);
        pagination.appendChild(pageInfo);
        pagination.appendChild(nextPageBtn);

        container.appendChild(headline);
        container.appendChild(filters);
        container.appendChild(eventList);
        container.appendChild(pagination);

        return {
            categoryFilter,
            competitionCheckbox,
            eventList,
            nextPageBtn,
            pageInfo,
            prevPageBtn,
            searchInput,
        };
    }

    async function initFullCalendar(container, maxResults, initialResults) {
        const elements = buildFullCalendarLayout(container);
        const allCategories = new Set();
        let allEvents = [];
        let filteredEvents = [];
        let currentPage = 1;
        let loadedLimit = Math.min(maxResults, initialResults);
        let isComplete = false;
        let isLoading = false;
        const eventsPerPage = 15;

        function updateCategoryDropdown() {
            allCategories.forEach(function (category) {
                const option = createElement("option", "", capitalizeWords(category));

                option.value = category;
                elements.categoryFilter.appendChild(option);
            });
        }

        function updatePagination() {
            const totalPages = Math.max(1, Math.ceil(filteredEvents.length / eventsPerPage));

            elements.pageInfo.textContent = "Seite " + currentPage + " von " + totalPages;
            elements.prevPageBtn.disabled = currentPage === 1;
            elements.nextPageBtn.disabled = currentPage >= totalPages && (isComplete || loadedLimit >= maxResults);
        }

        function renderEvents() {
            clearElement(elements.eventList);

            const start = (currentPage - 1) * eventsPerPage;
            const paginated = filteredEvents.slice(start, start + eventsPerPage);

            if (!paginated.length) {
                elements.eventList.appendChild(createElement("li", "", "Keine passenden Events gefunden."));
                updatePagination();
                return;
            }

            paginated.forEach(function (event, index) {
                elements.eventList.appendChild(buildEventItem(event, index, false));
            });

            attachToggles(elements.eventList);
            updatePagination();
        }

        function rebuildEvents(items, selectedCategory) {
            allCategories.clear();
            allEvents = items.map(normalizeEvent).filter(function (event) {
                return event !== null;
            });

            clearElement(elements.categoryFilter);
            elements.categoryFilter.appendChild(createElement("option", "", "Alle"));

            allEvents.forEach(function (event) {
                event.categories.forEach(function (category) {
                    allCategories.add(category);
                });
            });

            updateCategoryDropdown();

            if (selectedCategory && Array.from(elements.categoryFilter.options).some(function (option) {
                return option.value === selectedCategory;
            })) {
                elements.categoryFilter.value = selectedCategory;
            }
        }

        async function loadEvents(targetLimit) {
            if (isLoading) {
                return false;
            }

            isLoading = true;
            try {
                const selectedCategory = elements.categoryFilter.value;
                const data = await fetchCalendarEvents(targetLimit);

                loadedLimit = Math.max(loadedLimit, targetLimit);
                isComplete = data.complete || loadedLimit >= maxResults;
                rebuildEvents(data.items, selectedCategory);

                return true;
            } finally {
                isLoading = false;
            }
        }

        function filterAndRenderEvents() {
            const selectedCategory = elements.categoryFilter.value;
            const searchQuery = elements.searchInput.value.toLowerCase();
            const onlyCompetition = elements.competitionCheckbox.checked;

            filteredEvents = allEvents.filter(function (event) {
                if (selectedCategory !== "Alle" && !event.categories.includes(selectedCategory)) {
                    return false;
                }

                if (onlyCompetition && !event.categories.includes("wettkampf")) {
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

        async function filterAndRenderEventsWithBackfill() {
            filterAndRenderEvents();

            while (
                filteredEvents.length < eventsPerPage
                && !isComplete
                && loadedLimit < maxResults
                && (elements.categoryFilter.value !== "Alle" || elements.competitionCheckbox.checked)
            ) {
                const nextLimit = Math.min(maxResults, loadedLimit + initialResults);
                const previousLimit = loadedLimit;
                const loaded = await loadEvents(nextLimit);

                if (!loaded || previousLimit === loadedLimit) {
                    break;
                }

                filterAndRenderEvents();
            }
        }

        elements.categoryFilter.addEventListener("change", filterAndRenderEventsWithBackfill);
        elements.searchInput.addEventListener("input", filterAndRenderEvents);
        elements.competitionCheckbox.addEventListener("change", filterAndRenderEventsWithBackfill);
        elements.prevPageBtn.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                renderEvents();
            }
        });
        elements.nextPageBtn.addEventListener("click", async function () {
            if (currentPage < Math.ceil(filteredEvents.length / eventsPerPage)) {
                currentPage++;
                renderEvents();
                return;
            }

            if (!isComplete && loadedLimit < maxResults) {
                const nextLimit = Math.min(maxResults, loadedLimit + initialResults);
                const nextPage = currentPage + 1;

                await loadEvents(nextLimit);
                filterAndRenderEvents();

                if (nextPage <= Math.ceil(filteredEvents.length / eventsPerPage)) {
                    currentPage = nextPage;
                    renderEvents();
                }
            }
        });

        try {
            await loadEvents(loadedLimit);

            if (!allEvents.length) {
                showMessage(elements.eventList, "Keine kommenden Events gefunden.");
                return;
            }

            filterAndRenderEvents();
        } catch (error) {
            showMessage(elements.eventList, "Fehler beim Laden der Events.");
        }
    }

    async function initFilteredCalendar(container) {
        const category = (container.dataset.category || "").trim().toLowerCase();
        const maxEvents = parseInt(container.dataset.max || "3", 10);
        const configuredLimit = parseInt(pluginData.eventsMaxResults || "1000", 10);
        const searchLimit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 1000;
        const fetchLimit = Math.max(maxEvents, searchLimit);

        try {
            const data = await fetchCalendarEvents(fetchLimit);
            const events = data.items.map(normalizeEvent).filter(function (event) {
                return event !== null;
            });
            let filtered = events;

            if (category) {
                filtered = events.filter(function (event) {
                    return event.categories.some(function (eventCategory) {
                        return eventCategory.toLowerCase() === category;
                    });
                });
            }

            filtered = filtered.slice(0, maxEvents);
            clearElement(container);

            if (!filtered.length) {
                container.appendChild(createElement("li", "", "Keine passenden Events gefunden."));
                return;
            }

            filtered.forEach(function (event, index) {
                container.appendChild(buildEventItem(event, index, true));
            });

            attachToggles(container);
        } catch (error) {
            showMessage(container, "Fehler beim Laden der Events.");
        }
    }

    function initCalendar(container) {
        const calendarId = container.dataset.calendarId || "";
        const maxResults = parseInt(container.dataset.max || "50", 10);
        const initialResults = parseInt(container.dataset.initial || "150", 10);

        if (!calendarId || !pluginData.ajaxUrl || !pluginData.nonce) {
            showMessage(container, "Kalender-Konfiguration fehlt.");
            return;
        }

        if (container.classList.contains("gcal-filtered-events")) {
            initFilteredCalendar(container);
            return;
        }

        initFullCalendar(container, maxResults, initialResults);
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll(".je-google-calendar, .gcal-filtered-events").forEach(initCalendar);
    });

    window.createConsentBox = function (mapId, providerName, onAccept) {
        const mapContainer = typeof mapId === "string" ? document.getElementById(mapId) : mapId;

        createConsentBox(mapContainer, providerName, onAccept);
    };
}());
