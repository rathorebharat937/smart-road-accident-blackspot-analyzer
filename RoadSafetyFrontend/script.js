// Initialize Map (India Center)
var map = L.map('map').setView([22.9734, 78.6569], 5);

// OpenStreetMap Tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Fetch Data
fetch("http://localhost:8080/api/blackspots")
    .then(response => response.json())
    .then(data => {

        data.forEach(location => {

            // 🎨 Risk Color
            let color;
            if (location.riskLevel === "High") {
                color = "#e53935"; // red
            } else if (location.riskLevel === "Medium") {
                color = "#fb8c00"; // orange
            } else {
                color = "#43a047"; // green
            }

            // 🧠 Intelligent Reason Logic
            let reason;

            if (location.nightAccidents > location.totalAccidents * 0.4) {
                reason = "Poor Street Lighting";
            } else if (location.rainAccidents > location.totalAccidents * 0.3) {
                reason = "Rain / Slippery Roads";
            } else if (location.roadType === "Highway") {
                reason = "Overspeeding on Highway";
            } else if (location.deaths > location.totalAccidents * 0.2) {
                reason = "High Fatality Severity Zone";
            } else {
                reason = "High Traffic Density";
            }

            // 🔴 Bigger Attractive Markers
            L.circleMarker([location.latitude, location.longitude], {
                radius: 12,
                fillColor: color,
                color: "#000",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85
            }).addTo(map)
              .bindPopup(`
                <div style="font-size:14px;">
                    <b style="font-size:16px;">${location.city}</b><br>
                    <b>State:</b> ${location.state}<br>
                    <b>Risk Level:</b> ${location.riskLevel}<br>
                    <b>ARI:</b> ${location.ari.toFixed(2)}<br>
                    <b>Total Accidents:</b> ${location.totalAccidents}<br>
                    <b>Deaths:</b> ${location.deaths}<br>
                    <b>Primary Risk Cause:</b> ${reason}
                </div>
              `);
        });

        // 📌 Add Legend
        var legend = L.control({position: 'bottomright'});

        legend.onAdd = function () {
            var div = L.DomUtil.create('div', 'legend');
            div.innerHTML += "<h4>Risk Level</h4>";
            div.innerHTML += "<i style='background:#e53935'></i> High<br>";
            div.innerHTML += "<i style='background:#fb8c00'></i> Medium<br>";
            div.innerHTML += "<i style='background:#43a047'></i> Low<br>";
            return div;
        };

        legend.addTo(map);

    })
    .catch(error => console.error("Error fetching data:", error));