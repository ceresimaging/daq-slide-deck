// GIS longitude wraparound demo for slide 12-gis-demo.html

function initGISDemo() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.log('Leaflet not loaded yet, retrying...');
        setTimeout(initGISDemo, 200);
        return;
    }

    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.log('Map container not found');
        return;
    }

    // Clear any existing map
    if (window.gisMap) {
        window.gisMap.remove();
        window.gisMap = null;
    }

    try {
        // International Date Line area (where the real wraparound happens)
        const DATELINE_CENTER = [0.0, 180.0]; // Equator at 180° longitude

        // Map with world copy jump disabled initially, centered on the International Date Line
        const map = L.map('map', {
            center: DATELINE_CENTER,
            zoom: 4,
            worldCopyJump: false
        });
        window.gisMap = map; // Store reference for cleanup

        // OSM tiles with attribution
        let tiles = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
        ).addTo(map);
        window.gisTiles = tiles;

        // Two draggable points that straddle the International Date Line (the REAL wraparound!)
        const blueIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#2196F3; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        const orangeIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#FF9800; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker1 = L.marker([5.0, 175.0], {draggable:true, icon: blueIcon}).addTo(map).bindTooltip('+175°E', {permanent:true, direction:'right'});
        const marker2 = L.marker([15.0, 178.0], {draggable:true, icon: orangeIcon}).addTo(map).bindTooltip('+178°E', {permanent:true, direction:'left'});
        const pts = [marker1, marker2];
        window.gisMarkers = pts;

        console.log('Created GIS markers:', pts.length, 'markers at positions:',
                   pts.map(m => `${m.getLatLng().lat},${m.getLatLng().lng}`));

        // Circular mean helper function
        function meanLonDeg(ds) {
            let x = 0, y = 0;
            for (const d of ds) {
                const r = d * Math.PI / 180;
                x += Math.cos(r);
                y += Math.sin(r);
            }
            let m = Math.atan2(y, x) * 180 / Math.PI;
            if (m >= 180) m -= 360;
            if (m < -180) m += 360;
            return m;
        }

        // Result markers - RED for wrong, GREEN for correct
        const wrongMarker = L.circleMarker(DATELINE_CENTER, {
            radius: 12,
            color: '#FF1744',
            fillColor: '#FF5252',
            fillOpacity: 0.9,
            weight: 3
        }).addTo(map).bindTooltip('WRONG: Linear Mean', {permanent: false, direction: 'top'});

        const correctMarker = L.circleMarker(DATELINE_CENTER, {
            radius: 15,
            color: '#00C853',
            fillColor: '#00E676',
            fillOpacity: 0.9,
            weight: 3
        }).addTo(map).bindTooltip('CORRECT: Circular Mean', {permanent: false, direction: 'bottom'});
        const readout = document.getElementById('readout');

        window.gisResultMarkers = [wrongMarker, correctMarker];

        function update() {
            const lats = pts.map(m => m.getLatLng().lat);
            const lons = pts.map(m => m.getLatLng().lng);
            const latAvg = lats.reduce((a, b) => a + b, 0) / lats.length;
            const linMean = (lons[0] + lons[1]) / 2; // WRONG near 0°
            const circMean = meanLonDeg(lons);

            wrongMarker.setLatLng([latAvg, linMean]);
            correctMarker.setLatLng([latAvg, circMean]);

            // Tiny line showing crossing at 0°
            if (window.crossLine) map.removeLayer(window.crossLine);
            window.crossLine = L.polyline([[latAvg, -0.01], [latAvg, 0.01]], {color:'#4FC3F7', weight:3}).addTo(map);

            if (readout) {
                readout.textContent =
                    `Circular mean: ${circMean.toFixed(3)}°, Linear mean (wrong): ${((linMean + 540) % 360 - 180).toFixed(3)}°`;
            }
        }

        pts.forEach(m => m.on('drag dragend', update));
        update();

        // UI toggles
        const worldCopyCheckbox = document.getElementById('worldCopy');
        const noWrapTilesCheckbox = document.getElementById('noWrapTiles');

        if (worldCopyCheckbox) {
            worldCopyCheckbox.addEventListener('change', (e) => {
                map.options.worldCopyJump = !!e.target.checked;
                map.panBy([1, 0]); // nudge to apply visually
            });
        }

        if (noWrapTilesCheckbox) {
            noWrapTilesCheckbox.addEventListener('change', (e) => {
                const noWrap = !!e.target.checked;
                map.removeLayer(tiles);
                tiles = L.tileLayer(
                    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    {
                        maxZoom: 19,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                        noWrap
                    }
                ).addTo(map);
                window.gisTiles = tiles;
            });
        }

        console.log('GIS demo initialized');
    } catch (error) {
        console.error('Error initializing GIS demo:', error);
    }
}