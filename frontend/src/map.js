document.addEventListener("DOMContentLoaded", async function () {
    const mapContainer = document.getElementById("map");
    mapContainer.innerHTML = "<p>Loading map data...</p>";

    try {
        const response = await fetch(`${API_BASE_URL}/get-map-data`);
        if (!response.ok) throw new Error("Failed to fetch map data");
        const data = await response.json();

        mapContainer.innerHTML = "";  // Clear loading text
        initializeMap(data);
    } catch (error) {
        console.error("Error fetching map data:", error);
        mapContainer.innerHTML = "<p>Error loading map data.</p>";
    }
});

function initializeMap(geojsonData) {
    const map = L.map("map").setView([37.7749, -122.4194], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    L.geoJSON(geojsonData).addTo(map);
}
