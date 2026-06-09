(function () {
    document.addEventListener("DOMContentLoaded", function () {
        const select = document.getElementById("je_geocoding_provider");
        const openCageRow = document.querySelector("tr.je-opencage");
        const googleRow = document.querySelector("tr.je-google-geocode");

        if (!select || !openCageRow || !googleRow) {
            return;
        }

        function updateVisibility() {
            const isGoogle = select.value === "google";

            openCageRow.style.display = isGoogle ? "none" : "";
            googleRow.style.display = isGoogle ? "" : "none";
        }

        select.addEventListener("change", updateVisibility);
        updateVisibility();
    });
}());
