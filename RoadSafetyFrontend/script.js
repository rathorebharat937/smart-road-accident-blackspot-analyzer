// Global Variables
let map2d; // Leaflet map
let map3d; // Mapbox GL map
let heatmapLayer;
let markersLayer;
let riskChart;
let blackspotsData = [];
let heatmapVisible = true;
let markersVisible = true;
let currentView = '2d';
let mapboxMarkers = [];
let isMap3dInitialized = false;
let userLocationMarker = null; // Marker for user's current location

// India center coordinates
const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_ZOOM = 5;

// Mapbox Access Token (replace with your actual token)
mapboxgl.accessToken = 'pk.eyJ1IjoicmF0aG9yZWJoYXJhdDkzNyIsImEiOiJjbW1jMTcwdXIwMW9pMndwbGd0bGdveGM3In0.EyCps2yB9QvmUv8JksPkjw';

// Initialize Dashboard
function initializeDashboard() {
    initialize2DMap();
    setupEventListeners();
    fetchAndProcessData();
}

// Initialize 2D Leaflet Map
function initialize2DMap() {
    map2d = L.map('map').setView(INDIA_CENTER, INDIA_ZOOM);

    // OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map2d);

    // Initialize layers
    markersLayer = L.layerGroup().addTo(map2d);
}

// Initialize 3D Mapbox GL Map (lazy initialization)
function initialize3DMap() {
    if (isMap3dInitialized) return;

    try {
        // Initialize with high-resolution satellite imagery
        map3d = new mapboxgl.Map({
            container: 'map3d-container',
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [78.9629, 20.5937], // India center
            zoom: 4.2,
            pitch: 0, // Start flat for clear view
            bearing: -20,
            antialias: true,
            preserveDrawingBuffer: true
        });

        // Add navigation controls
        map3d.addControl(new mapboxgl.NavigationControl());

        // Wait for style to load, then set projection and add atmosphere
        map3d.on('style.load', () => {
            // Set globe projection after style loads
            map3d.setProjection('globe');

            // Add realistic atmospheric fog for satellite dashboard look
            map3d.setFog({
                'color': 'rgba(255, 255, 255, 0.8)',
                'high-color': 'rgba(135, 206, 235, 0.7)',
                'space-color': 'rgba(10, 25, 47, 1)',
                'horizon-blend': 0.02,
                'star-intensity': 0.1
            });

            // Add professional lighting configuration
            map3d.setLight({
                'anchor': 'map',
                'color': 'rgba(255, 255, 255, 1)',
                'intensity': 0.8,
                'position': [1.5, 90, 60]
            });

            console.log('3D Globe atmosphere, lighting, and projection configured');
        });

        // Wait for map to fully load, then add terrain, grid, and markers
        map3d.on('load', () => {
            // Add high-resolution terrain for realistic Earth
            map3d.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.terrain-rgb',
                'tileSize': 512,
                'maxzoom': 14
            });

            map3d.setTerrain({
                'source': 'mapbox-dem',
                'exaggeration': 1.5
            });

            // Add country boundaries for geographic context
            map3d.addSource('country-boundaries', {
                'type': 'vector',
                'url': 'mapbox://mapbox.country-boundaries-v1'
            });

            map3d.addLayer({
                'id': 'country-borders',
                'type': 'line',
                'source': 'country-boundaries',
                'source-layer': 'country_boundaries',
                'paint': {
                    'line-color': 'rgba(255, 255, 255, 0.8)',
                    'line-width': 0.5
                },
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                }
            });

            // Add risk intensity grid overlay
            addRiskGridLayer();

            // Add grid interaction
            map3d.on('click', 'risk-grid', handleGridClick);

            isMap3dInitialized = true;
            if (blackspotsData.length > 0) {
                add3DMarkers(blackspotsData);
                updateRiskGrid(blackspotsData);
            }

            console.log('3D Globe initialized successfully with satellite analytics dashboard');
        });

        // Handle resize properly
        map3d.on('resize', () => {
            map3d.resize();
        });

        // Add error handling for globe rendering
        map3d.on('error', (e) => {
            console.error('Mapbox 3D Globe error:', e);
        });

    } catch (error) {
        console.error('Error initializing 3D globe:', error);
        showMapboxError();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // View toggle buttons
    document.getElementById('view2d').addEventListener('click', () => switchView('2d'));
    document.getElementById('view3d').addEventListener('click', () => switchView('3d'));

    // Action buttons
    document.getElementById('resetView').addEventListener('click', resetMapView);
    document.getElementById('toggleHeatmap').addEventListener('click', toggleHeatmap);
    document.getElementById('toggleMarkers').addEventListener('click', toggleMarkers);
    document.getElementById('useMyLocation').addEventListener('click', useMyLocation);

    // Add lighting toggle button if it exists
    const lightingBtn = document.getElementById('toggleLighting');
    if (lightingBtn) {
        lightingBtn.addEventListener('click', toggleLighting);
    }
}

// Fetch Data and Process
function fetchAndProcessData() {
    fetch("http://localhost:8080/api/blackspots")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("No data received from backend");
            }
            blackspotsData = data;
            processLoadedData(data);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            blackspotsData = []; // Clear any existing data
            showErrorMessage();
            // Don't process any data when backend fails
        });
}

// Process Loaded Data
function processLoadedData(data) {
    console.log(`Loaded ${data.length} blackspots`);

    // Create 2D elements
    createHeatmap(data);
    createMarkers(data);

    // Create 3D elements if 3D map is initialized
    if (isMap3dInitialized) {
        add3DMarkers(data);
    }

    // Update dashboard
    updateAnalytics(data);
    createRiskChart(data);
    addLegends();
}

// Switch between 2D and 3D views with cinematic animation
function switchView(view) {
    if (currentView === view) return;

    currentView = view;

    // Update button states
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`view${view}`).classList.add('active');

    // Switch map containers with smooth transition
    const map2dContainer = document.getElementById('map2d');
    const map3dContainer = document.getElementById('map3d');

    if (view === '2d') {
        map2dContainer.classList.add('active');
        map3dContainer.classList.remove('active');

        // Sync 3D view to 2D view
        if (map3d && isMap3dInitialized) {
            const center = map3d.getCenter();
            const zoom = map3d.getZoom();
            map2d.setView([center.lat, center.lng], zoom);
        }

        // Show heatmap control
        document.getElementById('toggleHeatmap').style.display = 'inline-flex';

        // Refresh 2D map with proper timing
        setTimeout(() => {
            map2d.invalidateSize();
        }, 200);

    } else {
        map2dContainer.classList.remove('active');
        map3dContainer.classList.add('active');

        // Initialize 3D map if not already done
        if (!isMap3dInitialized) {
            initialize3DMap();
        }

        // Sync 2D view to 3D view
        if (map2d) {
            const center = map2d.getCenter();
            const zoom = map2d.getZoom();
            if (map3d && isMap3dInitialized) {
                map3d.setCenter([center.lng, center.lat]);
                map3d.setZoom(zoom);
            }
        }

        // Hide heatmap control (not supported in 3D)
        document.getElementById('toggleHeatmap').style.display = 'none';

        // Refresh 3D map with proper timing for globe rendering
        setTimeout(() => {
            if (map3d && isMap3dInitialized) {
                map3d.resize();
                // Trigger cinematic animation to India
                performCinematicTransition();
            }
        }, 200);
    }
}

// Cinematic Camera Transition Animation
function performCinematicTransition() {
    if (!map3d || !isMap3dInitialized) return;

    // Start from global view
    map3d.flyTo({
        center: [0, 0], // Global center
        zoom: 1.8,
        pitch: 0,
        bearing: 0,
        speed: 0.8,
        curve: 1.6,
        easing: t => t * (2 - t) // Smooth easing
    });

    // After reaching global view, fly to India
    setTimeout(() => {
        map3d.flyTo({
            center: [78.9629, 20.5937], // India center
            zoom: 5,
            pitch: 60,
            bearing: -20,
            speed: 0.8,
            curve: 1.6,
            easing: t => t * (2 - t) // Smooth easing
        });
    }, 2000);
}

// Reset Map View to India with Cinematic Animation
function resetMapView() {
    if (currentView === '2d') {
        map2d.setView(INDIA_CENTER, INDIA_ZOOM);
    } else if (currentView === '3d' && map3d && isMap3dInitialized) {
        // Perform cinematic transition to India
        performCinematicTransition();
    }
}

// Toggle Lighting for 3D Globe
function toggleLighting() {
    if (!map3d || !isMap3dInitialized) return;

    const currentLight = map3d.getLight();
    const newIntensity = currentLight.intensity === 0.8 ? 0.3 : 0.8;

    map3d.setLight({
        ...currentLight,
        'intensity': newIntensity
    });

    console.log(`Lighting intensity set to ${newIntensity}`);
}

// Create Heatmap Layer (2D only)
function createHeatmap(data) {
    if (!map2d) return;

    const heatData = data.map(location => {
        const intensity = calculateHeatIntensity(location);
        return [location.latitude, location.longitude, intensity];
    });

    if (heatmapLayer) {
        map2d.removeLayer(heatmapLayer);
    }

    heatmapLayer = L.heatLayer(heatData, {
        radius: 60,
        blur: 40,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.4,
        gradient: {
            0.0: '#0066ff',
            0.2: '#00ccff',
            0.4: '#00ff66',
            0.5: '#66ff00',
            0.6: '#ffcc00',
            0.75: '#ff6600',
            0.9: '#ff3300',
            1.0: '#cc0000'
        }
    }).addTo(map2d);
}

// Calculate heat intensity based on accident data
function calculateHeatIntensity(location) {
    let intensity = 0.05;

    const accidentWeight = Math.min(location.totalAccidents / 80, 0.5);
    intensity += accidentWeight;

    const deathWeight = Math.min(location.deaths / 30, 0.25);
    intensity += deathWeight;

    if (location.riskLevel === "High") {
        intensity += 0.15;
    } else if (location.riskLevel === "Medium") {
        intensity += 0.08;
    }

    const nightRatio = location.nightAccidents / location.totalAccidents;
    if (nightRatio > 0.4) {
        intensity += 0.1;
    }

    const rainRatio = location.rainAccidents / location.totalAccidents;
    if (rainRatio > 0.3) {
        intensity += 0.07;
    }

    intensity = Math.pow(intensity, 0.8);

    return Math.min(intensity, 1.0);
}

// Create Enhanced Markers (2D)
function createMarkers(data) {
    if (!map2d || !markersLayer) return;

    // Clear existing markers
    markersLayer.clearLayers();

    data.forEach(location => {
        const color = getRiskColor(location.riskLevel);
        const reason = getPrimaryRiskCause(location);
        const recommendation = getSmartRecommendation(location);

        const marker = L.circleMarker([location.latitude, location.longitude], {
            radius: getMarkerSize(location.totalAccidents),
            fillColor: color,
            color: "#fff",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8
        });

        const popupContent = createEnhancedPopup(location, reason, recommendation);
        marker.bindPopup(popupContent, {
            maxWidth: 350,
            className: 'custom-popup'
        });

        markersLayer.addLayer(marker);
    });
}

// Add 3D Markers to Mapbox
function add3DMarkers(data) {
    if (!map3d || !isMap3dInitialized) return;

    // Clear existing markers
    mapboxMarkers.forEach(marker => marker.remove());
    mapboxMarkers = [];

    data.forEach(location => {
        const color = getRiskColor(location.riskLevel);
        const reason = getPrimaryRiskCause(location);
        const recommendation = getSmartRecommendation(location);

        const popupContent = createEnhancedPopup(location, reason, recommendation);

        // Create proper Mapbox marker with fixed coordinates
        const marker = new mapboxgl.Marker({
            color: color,
            scale: getMarkerSize(location.totalAccidents) / 8 // Scale based on accident count
        })
            .setLngLat([location.longitude, location.latitude]) // Fixed coordinates
            .setPopup(new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                className: 'mapbox-accident-popup'
            }).setHTML(popupContent))
            .addTo(map3d);

        mapboxMarkers.push(marker);
    });

    console.log(`Added ${data.length} fixed markers to 3D globe`);
}

// Add Risk Grid Layer for Analytics Dashboard
function addRiskGridLayer() {
    // Generate risk grid GeoJSON data
    const gridData = generateRiskGrid(blackspotsData);

    map3d.addSource('risk-grid', {
        'type': 'geojson',
        'data': gridData
    });

    map3d.addLayer({
        'id': 'risk-grid',
        'type': 'fill',
        'source': 'risk-grid',
        'paint': {
            'fill-color': [
                'case',
                ['==', ['get', 'riskLevel'], 'High'],
                'rgba(231, 76, 60, 0.6)', // Red
                ['==', ['get', 'riskLevel'], 'Medium'],
                'rgba(243, 156, 18, 0.6)', // Orange
                ['==', ['get', 'riskLevel'], 'Low'],
                'rgba(241, 196, 15, 0.6)', // Yellow
                'rgba(255, 255, 255, 0.3)' // Default
            ],
            'fill-outline-color': 'rgba(255, 255, 255, 0.2)',
            'fill-opacity': 0.7
        },
        'layout': {
            'visibility': 'visible'
        }
    });

    console.log('Risk grid layer added to 3D globe');
}

// Generate Risk Grid GeoJSON from accident data
function generateRiskGrid(data) {
    const gridSize = 2; // Grid cell size in degrees
    const grid = {};

    // Process accident data to calculate grid cell risk
    data.forEach(location => {
        const lat = Math.floor(location.latitude / gridSize) * gridSize;
        const lng = Math.floor(location.longitude / gridSize) * gridSize;
        const key = `${lat},${lng}`;

        if (!grid[key]) {
            grid[key] = {
                lat: lat,
                lng: lng,
                totalAccidents: 0,
                totalDeaths: 0,
                totalARI: 0,
                locations: [],
                riskLevel: 'Low'
            };
        }

        grid[key].totalAccidents += location.totalAccidents;
        grid[key].totalDeaths += location.deaths;
        grid[key].totalARI += location.ari;
        grid[key].locations.push(location);

        // Calculate risk level based on total accidents and deaths
        if (grid[key].totalAccidents > 50 || grid[key].totalDeaths > 10) {
            grid[key].riskLevel = 'High';
        } else if (grid[key].totalAccidents > 20 || grid[key].totalDeaths > 5) {
            grid[key].riskLevel = 'Medium';
        }
    });

    // Convert to GeoJSON format
    const features = Object.values(grid).map(cell => ({
        type: 'Feature',
        properties: {
            riskLevel: cell.riskLevel,
            totalAccidents: cell.totalAccidents,
            totalDeaths: cell.totalDeaths,
            avgARI: cell.totalARI / cell.locations.length,
            city: cell.locations[0]?.city || 'Unknown'
        },
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [cell.lng, cell.lat],
                [cell.lng + gridSize, cell.lat],
                [cell.lng + gridSize, cell.lat + gridSize],
                [cell.lng, cell.lat + gridSize],
                [cell.lng, cell.lat]
            ]]
        }
    }));

    return {
        type: 'FeatureCollection',
        features: features
    };
}

// Handle Grid Cell Click Interaction
function handleGridClick(e) {
    const features = map3d.queryRenderedFeatures(e.point, { layers: ['risk-grid'] });

    if (features.length > 0) {
        const feature = features[0];
        const props = feature.properties;

        const popupContent = `
            <div class="grid-popup">
                <h3>🚦 Risk Grid Analysis</h3>
                <div class="grid-info">
                    <p><strong>City:</strong> ${props.city}</p>
                    <p><strong>ARI Score:</strong> ${props.avgARI?.toFixed(2) || 'N/A'}</p>
                    <p><strong>Total Accidents:</strong> ${props.totalAccidents}</p>
                    <p><strong>Risk Level:</strong> 
                        <span class="risk-badge ${props.riskLevel.toLowerCase()}">${props.riskLevel}</span>
                    </p>
                </div>
            </div>
        `;

        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map3d);
    }
}

// Update Risk Grid with new data
function updateRiskGrid(data) {
    if (!map3d || !isMap3dInitialized) return;

    const gridData = generateRiskGrid(data);
    map3d.getSource('risk-grid')?.setData(gridData);
}

// Get risk color
function getRiskColor(riskLevel) {
    switch(riskLevel) {
        case "High": return "#e74c3c";
        case "Medium": return "#f39c12";
        case "Low": return "#27ae60";
        default: return "#95a5a6";
    }
}

// Get marker size based on accident count
function getMarkerSize(totalAccidents) {
    if (totalAccidents > 50) return 18;
    if (totalAccidents > 20) return 14;
    if (totalAccidents > 10) return 10;
    return 8;
}

// Get primary risk cause
function getPrimaryRiskCause(location) {
    const nightRatio = location.nightAccidents / location.totalAccidents;
    const rainRatio = location.rainAccidents / location.totalAccidents;
    const deathRatio = location.deaths / location.totalAccidents;

    if (nightRatio > 0.4) return "Poor Street Lighting";
    if (rainRatio > 0.3) return "Rain & Slippery Roads";
    if (location.roadType === "Highway") return "Highway Overspeeding";
    if (deathRatio > 0.2) return "High Fatality Severity";
    return "High Traffic Density";
}

// Get smart recommendation
function getSmartRecommendation(location) {
    const nightRatio = location.nightAccidents / location.totalAccidents;
    const rainRatio = location.rainAccidents / location.totalAccidents;
    const deathRatio = location.deaths / location.totalAccidents;

    if (nightRatio > 0.4) {
        return "🔦 Install LED street lights with motion sensors and improve visibility";
    }
    if (rainRatio > 0.3) {
        return "🌧️ Improve road drainage, install anti-skid surfaces, and add warning signs";
    }
    if (location.roadType === "Highway") {
        return "📷 Deploy speed cameras and install rumble strips at critical points";
    }
    if (deathRatio > 0.2) {
        return "🚑 Strengthen emergency response protocols and add medical facilities";
    }
    return "🚦 Implement intelligent traffic monitoring and signal optimization";
}

// Create enhanced popup content
function createEnhancedPopup(location, reason, recommendation) {
    return `
        <div class="popup-content">
            <div class="popup-header">
                <div class="popup-title">${location.city}</div>
                <div class="popup-subtitle">${location.state}</div>
            </div>
            
            <div class="popup-section">
                <div class="popup-section-title">Risk Assessment</div>
                <div class="popup-stat">
                    <span class="popup-stat-label">Risk Level:</span>
                    <span class="risk-indicator ${location.riskLevel.toLowerCase()}">${location.riskLevel}</span>
                </div>
                <div class="popup-stat">
                    <span class="popup-stat-label">ARI Score:</span>
                    <span class="popup-stat-value">${location.ari.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="popup-section">
                <div class="popup-section-title">Accident Statistics</div>
                <div class="popup-stat">
                    <span class="popup-stat-label">Total Accidents:</span>
                    <span class="popup-stat-value">${location.totalAccidents}</span>
                </div>
                <div class="popup-stat">
                    <span class="popup-stat-label">Fatalities:</span>
                    <span class="popup-stat-value">${location.deaths}</span>
                </div>
                <div class="popup-stat">
                    <span class="popup-stat-label">Night Accidents:</span>
                    <span class="popup-stat-value">${location.nightAccidents} (${((location.nightAccidents/location.totalAccidents)*100).toFixed(1)}%)</span>
                </div>
                <div class="popup-stat">
                    <span class="popup-stat-label">Rain Accidents:</span>
                    <span class="popup-stat-value">${location.rainAccidents} (${((location.rainAccidents/location.totalAccidents)*100).toFixed(1)}%)</span>
                </div>
                <div class="popup-stat">
                    <span class="popup-stat-label">Road Type:</span>
                    <span class="popup-stat-value">${location.roadType}</span>
                </div>
            </div>
            
            <div class="popup-section">
                <div class="popup-section-title">Primary Risk Cause</div>
                <div class="popup-stat">
                    <span class="popup-stat-value">${reason}</span>
                </div>
            </div>
            
            <div class="recommendation">
                <strong>💡 Smart Recommendation:</strong><br>
                ${recommendation}
            </div>
        </div>
    `;
}

// Update Analytics Dashboard
function updateAnalytics(data) {
    const totalBlackspots = data.length;
    const highRiskZones = data.filter(d => d.riskLevel === "High").length;
    const mediumRiskZones = data.filter(d => d.riskLevel === "Medium").length;
    const lowRiskZones = data.filter(d => d.riskLevel === "Low").length;

    animateValue('totalBlackspots', 0, totalBlackspots, 1500);
    animateValue('highRiskZones', 0, highRiskZones, 1500);
    animateValue('mediumRiskZones', 0, mediumRiskZones, 1500);
    animateValue('lowRiskZones', 0, lowRiskZones, 1500);
}

// Animate counter
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

// Create Risk Distribution Chart
function createRiskChart(data) {
    const ctx = document.getElementById('riskChart');
    if (!ctx) return;

    const riskCounts = {
        High: data.filter(d => d.riskLevel === "High").length,
        Medium: data.filter(d => d.riskLevel === "Medium").length,
        Low: data.filter(d => d.riskLevel === "Low").length
    };

    if (riskChart) {
        riskChart.destroy();
    }

    riskChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
                label: 'Number of Blackspots',
                data: [riskCounts.High, riskCounts.Medium, riskCounts.Low],
                backgroundColor: [
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(243, 156, 18, 0.8)',
                    'rgba(39, 174, 96, 0.8)'
                ],
                borderColor: [
                    'rgba(231, 76, 60, 1)',
                    'rgba(243, 156, 18, 1)',
                    'rgba(39, 174, 96, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    borderRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Add Legends (2D only)
function addLegends() {
    if (!map2d) return;

    // Risk Level Legend
    const riskLegend = L.control({position: 'bottomright'});

    riskLegend.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        div.innerHTML = `
            <h4>Risk Levels</h4>
            <div class="legend-item">
                <div class="legend-color" style="background: #e74c3c;"></div>
                <span>High Risk</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #f39c12;"></div>
                <span>Medium Risk</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #27ae60;"></div>
                <span>Low Risk</span>
            </div>
        `;
        return div;
    };

    riskLegend.addTo(map2d);

    // Heatmap Legend
    const heatmapLegend = L.control({position: 'bottomleft'});

    heatmapLegend.onAdd = function () {
        const div = L.DomUtil.create('div', 'heatmap-legend');
        div.innerHTML = `
            <h4>Accident Density</h4>
            <div class="heatmap-gradient"></div>
            <div class="heatmap-labels">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Critical</span>
            </div>
        `;
        return div;
    };

    heatmapLegend.addTo(map2d);
}

// Toggle Heatmap (2D only)
function toggleHeatmap() {
    if (currentView !== '2d' || !map2d || !heatmapLayer) return;

    const btn = document.getElementById('toggleHeatmap');

    if (heatmapVisible) {
        map2d.removeLayer(heatmapLayer);
        btn.classList.remove('active');
    } else {
        heatmapLayer.addTo(map2d);
        btn.classList.add('active');
    }

    heatmapVisible = !heatmapVisible;
}

// Toggle Markers (both 2D and 3D)
function toggleMarkers() {
    const btn = document.getElementById('toggleMarkers');

    if (markersVisible) {
        if (currentView === '2d' && map2d && markersLayer) {
            map2d.removeLayer(markersLayer);
        } else if (currentView === '3d' && map3d && isMap3dInitialized) {
            mapboxMarkers.forEach(marker => marker.remove());
        }
        btn.classList.remove('active');
    } else {
        if (currentView === '2d' && map2d && markersLayer) {
            markersLayer.addTo(map2d);
        } else if (currentView === '3d' && map3d && isMap3dInitialized) {
            add3DMarkers(blackspotsData);
        }
        btn.classList.add('active');
    }

    markersVisible = !markersVisible;
}

// Use My Location - Geolocation functionality
function useMyLocation() {
    const btn = document.getElementById('useMyLocation');
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        showLocationError('Geolocation is not supported by your browser');
        return;
    }

    // Show loading state
    btn.disabled = true;
    btn.innerHTML = '🔄 Getting Location...';
    btn.style.opacity = '0.7';

    // Get current position
    navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Restore button state
            btn.disabled = false;
            btn.innerHTML = '📍 Use My Location';
            btn.style.opacity = '1';

            // Center map to user location
            centerMapToLocation(latitude, longitude);
            
            // Add user location marker with risk assessment
            addUserLocationMarker(latitude, longitude, accuracy);
            
            console.log(`Location found: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (accuracy: ${accuracy.toFixed(0)}m)`);
        },
        // Error callback
        (error) => {
            // Restore button state
            btn.disabled = false;
            btn.innerHTML = '📍 Use My Location';
            btn.style.opacity = '1';

            // Handle different error types
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    showLocationError('Location access denied. Please enable location permissions in your browser settings.');
                    break;
                case error.POSITION_UNAVAILABLE:
                    showLocationError('Location information is unavailable. Please check your GPS or network connection.');
                    break;
                case error.TIMEOUT:
                    showLocationError('Location request timed out. Please try again.');
                    break;
                default:
                    showLocationError('An unknown error occurred while getting your location.');
                    break;
            }
        },
        // Options
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
        }
    );
}

// Center map to user location
function centerMapToLocation(latitude, longitude) {
    if (currentView === '2d' && map2d) {
        map2d.setView([latitude, longitude], 15);
    } else if (currentView === '3d' && map3d && isMap3dInitialized) {
        map3d.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            speed: 2,
            curve: 1.4,
            easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        });
    }
}

// Add user location marker with risk analysis
function addUserLocationMarker(latitude, longitude, accuracy) {
    // Remove existing user location marker
    if (userLocationMarker) {
        if (currentView === '2d' && map2d) {
            if (userLocationMarker.accuracyCircle) map2d.removeLayer(userLocationMarker.accuracyCircle);
            if (userLocationMarker.riskZone) map2d.removeLayer(userLocationMarker.riskZone);
            map2d.removeLayer(userLocationMarker);
        } else if (currentView === '3d' && userLocationMarker.remove) {
            userLocationMarker.remove();
        }
    }

    // Fetch risk assessment from backend
    fetchRiskAssessment(latitude, longitude)
        .then(riskData => {
            if (currentView === '2d' && map2d) {
                addUserLocationMarker2D(latitude, longitude, accuracy, riskData);
            } else if (currentView === '3d' && map3d && isMap3dInitialized) {
                addUserLocationMarker3D(latitude, longitude, accuracy, riskData);
            }
        })
        .catch(error => {
            console.warn('Risk assessment failed, showing fallback:', error);
            // Fallback to risk unavailable message
            if (currentView === '2d' && map2d) {
                addUserLocationMarker2D(latitude, longitude, accuracy, null);
            } else if (currentView === '3d' && map3d && isMap3dInitialized) {
                addUserLocationMarker3D(latitude, longitude, accuracy, null);
            }
        });
}

// Fetch risk assessment from backend API
async function fetchRiskAssessment(latitude, longitude) {
    try {
        const response = await fetch(`http://localhost:8080/api/risk?lat=${latitude}&lon=${longitude}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data) {
            return {
                ari: data.ari || 0,
                riskLevel: data.riskLevel || 'LOW',
                cause: getPrimaryRiskCause(data) || 'Unknown risk factors'
            };
        } else {
            return null; // No data found for this location
        }
    } catch (error) {
        console.error('Error fetching risk assessment:', error);
        return null;
    }
}

// Add user location marker for 2D map with risk visualization
function addUserLocationMarker2D(latitude, longitude, accuracy, riskData) {
    // Always provide risk data (fallback if null)
    if (!riskData) {
        riskData = {
            ari: 10,
            riskLevel: 'LOW',
            cause: 'No accident-prone zones detected nearby'
        };
    }
    
    const riskConfig = getRiskConfig(riskData.riskLevel);
    
    // Create accuracy circle (subtle, GPS precision)
    const accuracyCircle = L.circle([latitude, longitude], {
        radius: accuracy,
        fillColor: '#4285F4',
        fillOpacity: 0.05,
        color: '#4285F4',
        weight: 1,
        opacity: 0.3
    });

    // Always create risk zone overlay (safe zone for fallback)
    const zoneRadius = Math.max(100, Math.min(300, riskData.ari * 3)); // Scale with ARI
    const riskZone = L.circle([latitude, longitude], {
        radius: zoneRadius,
        fillColor: riskConfig.color,
        fillOpacity: riskData.riskLevel === 'LOW' && riskData.ari === 10 ? 0.1 : 0.2, // Lighter for safe zone
        color: riskConfig.color,
        weight: riskData.riskLevel === 'LOW' && riskData.ari === 10 ? 1 : 2, // Thinner for safe zone
        opacity: riskData.riskLevel === 'LOW' && riskData.ari === 10 ? 0.4 : 0.6, // More subtle for safe zone
        className: 'risk-zone-circle'
    });

    // Add glowing effect for high risk only
    if (riskData.riskLevel === 'HIGH') {
        addGlowEffect(riskZone);
    }

    // Create user location marker with risk-based color
    const userIcon = L.divIcon({
        className: 'user-location-risk-marker',
        html: `
            <div style="
                background: ${riskConfig.color}; 
                width: 24px; 
                height: 24px; 
                border-radius: 50%; 
                border: 3px solid white; 
                box-shadow: ${riskData.riskLevel === 'HIGH' ? '0 0 20px ' + riskConfig.color + ', 0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.4)'};
                z-index: 1000;
                animation: ${riskData.riskLevel === 'HIGH' ? 'risk-pulse 2s infinite' : 'none'};
            "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    userLocationMarker = L.marker([latitude, longitude], { icon: userIcon });

    // Create risk analysis popup
    const popupContent = createRiskPopupContent(riskData);
    userLocationMarker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'risk-analysis-popup',
        autoPan: true
    }).openPopup();

    // Add elements to map with smooth animations
    accuracyCircle.addTo(map2d);
    if (riskZone) {
        riskZone.addTo(map2d);
    }
    userLocationMarker.addTo(map2d);

    // Store references for cleanup
    userLocationMarker.accuracyCircle = accuracyCircle;
    userLocationMarker.riskZone = riskZone;

    // Smooth zoom to show risk area
    setTimeout(() => {
        map2d.setView([latitude, longitude], 15, {
            animate: true,
            duration: 1
        });
    }, 300);
}

// Add user location marker for 3D map with risk visualization
function addUserLocationMarker3D(latitude, longitude, accuracy, riskData) {
    // Always provide risk data (fallback if null)
    if (!riskData) {
        riskData = {
            ari: 10,
            riskLevel: 'LOW',
            cause: 'No accident-prone zones detected nearby'
        };
    }
    
    const riskConfig = getRiskConfig(riskData.riskLevel);
    
    // Create Mapbox marker with risk-based color and scale
    const markerScale = riskData.riskLevel === 'HIGH' ? 1.6 : riskData.riskLevel === 'MEDIUM' ? 1.4 : 1.2;
    
    userLocationMarker = new mapboxgl.Marker({
        color: riskConfig.color,
        scale: markerScale
    })
        .setLngLat([longitude, latitude])
        .setPopup(new mapboxgl.Popup({
            offset: 25,
            maxWidth: "280px",
            anchor: "bottom",
            closeButton: true,
            className: 'risk-analysis-popup-3d'
        }).setHTML(createRiskPopupContent(riskData)))
        .addTo(map3d);

    // Open popup automatically with animation
    setTimeout(() => {
        userLocationMarker.getPopup().addTo(map3d);
    }, 300);

    // Add 3D risk visualization if available
    if (riskData && map3d && isMap3dInitialized) {
        add3DRiskZone(latitude, longitude, riskData);
    }
}

// Get risk configuration (colors, labels, etc.)
function getRiskConfig(riskLevel) {
    switch (riskLevel) {
        case 'HIGH':
            return {
                color: '#e74c3c',
                label: 'High Risk',
                bgColor: '#e74c3c20',
                borderColor: '#e74c3c'
            };
        case 'MEDIUM':
            return {
                color: '#f39c12',
                label: 'Medium Risk',
                bgColor: '#f39c1220',
                borderColor: '#f39c12'
            };
        case 'LOW':
            return {
                color: '#27ae60',
                label: 'Low Risk',
                bgColor: '#27ae6020',
                borderColor: '#27ae60'
            };
        default:
            return {
                color: '#95a5a6',
                label: 'Unknown',
                bgColor: '#95a5a620',
                borderColor: '#95a5a6'
            };
    }
}

// Create risk analysis popup content
function createRiskPopupContent(riskData) {
    // If no risk data, provide fallback data
    if (!riskData) {
        riskData = {
            ari: 10,
            riskLevel: 'LOW',
            cause: 'No accident-prone zones detected nearby'
        };
    }

    const riskConfig = getRiskConfig(riskData.riskLevel);
    
    return `
        <div class="ws-popup">
            <div class="ws-header">
                <div class="ws-icon" style="background: ${riskConfig.color};">🚦</div>
                <div>
                    <h3>Risk Analysis</h3>
                    <p>Current Location</p>
                </div>
            </div>
            
            <div class="ws-body" style="background: ${riskConfig.bgColor}; border-left-color: ${riskConfig.borderColor};">
                <div class="ws-row">
                    <span class="ws-badge" style="background: ${riskConfig.color};">${riskConfig.label}</span>
                    <div class="ws-ari">
                        <div class="ws-ari-value" style="color: ${riskConfig.color};">${riskData.ari.toFixed(1)}</div>
                        <div class="ws-ari-label">ARI Score</div>
                    </div>
                </div>
                
                <div class="ws-divider"></div>
                
                <div class="ws-cause">
                    <strong>🚨 Primary Cause:</strong>
                    <p>${riskData.cause}</p>
                </div>
            </div>
            
            <div class="ws-footer">
                <strong>💡 Safety Tip:</strong> ${getSafetyTip(riskData.riskLevel)}
            </div>
            
            <div class="ws-note">
                Based on available dataset
            </div>
        </div>
    `;
}

// Get safety tip based on risk level
function getSafetyTip(riskLevel) {
    switch (riskLevel) {
        case 'HIGH':
            return 'Exercise extreme caution. Consider alternative routes.';
        case 'MEDIUM':
            return 'Stay alert and follow traffic rules carefully.';
        case 'LOW':
            return 'Normal conditions. Maintain standard safety precautions.';
        default:
            return 'Always drive safely and be aware of surroundings.';
    }
}

// Add glowing effect for high risk zones
function addGlowEffect(circle) {
    let glowRadius = circle.options.radius;
    let growing = true;
    
    const animate = () => {
        if (growing) {
            glowRadius += 1;
            if (glowRadius >= circle.options.radius + 20) growing = false;
        } else {
            glowRadius -= 1;
            if (glowRadius <= circle.options.radius) growing = true;
        }
        
        circle.setRadius(glowRadius);
        
        if (userLocationMarker && userLocationMarker.riskZone === circle) {
            requestAnimationFrame(animate);
        }
    };
    
    animate();
}

// Add 3D risk zone visualization
function add3DRiskZone(latitude, longitude, riskData) {
    // This could be extended for 3D risk zones
    console.log('3D risk zone added for:', riskData);
}

// Show location error with user-friendly message
function showLocationError(message) {
    // Create a more user-friendly error display
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 300px;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
            <strong>Location Error</strong>
        </div>
        <div style="margin-bottom: 10px;">${message}</div>
        <button onclick="this.parentElement.remove()" style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        ">Dismiss</button>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(errorDiv);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 8000);
}

// Update Analytics for Error State
function updateAnalyticsForError() {
    // Update analytics sidebar to show connection error
    const totalElement = document.getElementById('totalBlackspots');
    const highElement = document.getElementById('highRiskZones');
    const mediumElement = document.getElementById('mediumRiskZones');
    const lowElement = document.getElementById('lowRiskZones');
    
    if (totalElement) totalElement.textContent = '---';
    if (highElement) highElement.textContent = '---';
    if (mediumElement) mediumElement.textContent = '---';
    if (lowElement) lowElement.textContent = '---';
    
    // Clear the chart if it exists
    const ctx = document.getElementById('riskChart');
    if (ctx && riskChart) {
        riskChart.destroy();
        riskChart = null;
    }
}

// Show Error Message
function showErrorMessage() {
    const mapContainer = document.getElementById('map2d');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="loading" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 80px; margin-bottom: 20px;">🔌</div>
                    <h2 style="color: white; margin-bottom: 20px; font-size: 28px;">
                        Backend Connection Required
                    </h2>
                    <div style="background: rgba(231, 76, 60, 0.9); color: white; padding: 15px; border-radius: 10px; margin: 20px 0; font-weight: 600;">
                        ❌ Cannot connect to backend server at localhost:8080
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.9); color: #2c3e50; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left;">
                        <h3 style="margin-top: 0; color: #e74c3c;">🚀 Quick Start Steps:</h3>
                        <ol style="margin: 10px 0; padding-left: 20px;">
                            <li><strong>Navigate to backend folder:</strong><br>
                            <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">cd roadsafety</code></li>
                            <li><strong>Start the backend server:</strong><br>
                            <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">mvn spring-boot:run</code></li>
                            <li><strong>Wait for server to start (look for "Started RoadsafetyApplication")</strong></li>
                            <li><strong>Refresh this page</strong></li>
                        </ol>
                        <p style="margin: 15px 0; color: #7f8c8d;"><strong>💡 Tip:</strong> Make sure Java 17+ and Maven are installed</p>
                    </div>
                    <button onclick="location.reload()" style="background: #27ae60; color: white; border: none; padding: 12px 30px; border-radius: 25px; font-size: 16px; cursor: pointer; margin-top: 10px;">
                        🔄 Retry Connection
                    </button>
                </div>
            </div>
        `;
    }
    
    // Also update analytics to show error state
    updateAnalyticsForError();
}

// Show Mapbox Error
function showMapboxError() {
    const map3dContainer = document.getElementById('map3d');
    if (map3dContainer) {
        map3dContainer.innerHTML = `
            <div class="loading">
                <div>
                    <p style="margin-top: 20px; color: #e74c3c; font-weight: 600;">
                        ❌ Unable to load 3D map. Please check your Mapbox token.
                    </p>
                    <p style="margin-top: 10px; color: #7f8c8d;">
                        Replace the Mapbox access token in script.js with your own token
                    </p>
                </div>
            </div>
        `;
    }
}

// Set initial button states
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('toggleHeatmap').classList.add('active');
    document.getElementById('toggleMarkers').classList.add('active');

    // Initialize dashboard
    initializeDashboard();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') {
        toggleHeatmap();
    } else if (e.key === 'm' || e.key === 'M') {
        toggleMarkers();
    } else if (e.key === '2') {
        switchView('2d');
    } else if (e.key === '3') {
        switchView('3d');
    } else if (e.key === 'r' || e.key === 'R') {
        resetMapView();
    }
});

// Export functions for debugging
window.roadSafetyDashboard = {
    map2d,
    map3d,
    heatmapLayer,
    markersLayer,
    blackspotsData,
    currentView,
    switchView,
    resetMapView,
    toggleHeatmap,
    toggleMarkers,
    refreshData: () => {
        fetchAndProcessData();
    }
};