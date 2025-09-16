// GIS longitude wraparound demo for slide 12-gis-demo.html

function initGISDemo() {
  // Check if Leaflet is loaded
  if (typeof L === "undefined") {
    console.log("Leaflet not loaded yet, retrying...");
    setTimeout(initGISDemo, 200);
    return;
  }

  // Check if map container exists
  const mapContainer = document.getElementById("map");
  if (!mapContainer) {
    console.log("Map container not found");
    return;
  }

  // Clear any existing map
  if (window.gisMap) {
    window.gisMap.remove();
    window.gisMap = null;
  }

  try {
    // Add CSS styles for marker labels
    const style = document.createElement('style');
    style.textContent = `
      .wrong-label {
        background-color: #FF1744 !important;
        color: white !important;
        font-weight: bold !important;
        font-size: 12px !important;
        border: none !important;
        border-radius: 4px !important;
        padding: 4px 8px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
      }
      .wrong-label::before {
        border-top-color: #FF1744 !important;
      }
      .right-label {
        background-color: #00C853 !important;
        color: white !important;
        font-weight: bold !important;
        font-size: 12px !important;
        border: none !important;
        border-radius: 4px !important;
        padding: 4px 8px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
      }
      .right-label::before {
        border-top-color: #00C853 !important;
      }
    `;
    document.head.appendChild(style);

    // Center between the Pacific (where pins are) and Atlantic (where wrong answer appears)
    const MAP_CENTER = [10.0, 90.0]; // Centered to show both Pacific pins and Atlantic error

    // Map zoomed out to show both correct answer (Pacific) and wrong answer (Atlantic)
    const map = L.map("map", {
      center: MAP_CENTER,
      zoom: 2, // Zoom out more to show both hemispheres
      worldCopyJump: false,
    });
    window.gisMap = map; // Store reference for cleanup

    // OSM tiles with attribution
    let tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);
    window.gisTiles = tiles;

    // Two draggable points that straddle the International Date Line (the REAL wraparound!)
    const blueIcon = L.divIcon({
      className: "custom-marker",
      html: '<div style="background:#2196F3; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    const orangeIcon = L.divIcon({
      className: "custom-marker",
      html: '<div style="background:#FF9800; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker1 = L.marker([5.0, 170.0], { draggable: true, icon: blueIcon })
      .addTo(map)
      .bindTooltip("170°E", { permanent: true, direction: "right" });
    // Use +190° instead of -170° to ensure it appears on the same map copy as 170°
    const marker2 = L.marker([15.0, 190.0], {
      draggable: true,
      icon: orangeIcon,
    })
      .addTo(map)
      .bindTooltip("190°E (-170°)", { permanent: true, direction: "left" });
    const pts = [marker1, marker2];
    window.gisMarkers = pts;

    console.log(
      "Created GIS markers:",
      pts.length,
      "markers at positions:",
      pts.map((m) => `${m.getLatLng().lat},${m.getLatLng().lng}`)
    );

    // Circular mean helper function
    function meanLonDeg(ds) {
      let x = 0,
        y = 0;
      for (const d of ds) {
        const r = (d * Math.PI) / 180;
        x += Math.cos(r);
        y += Math.sin(r);
      }
      let m = (Math.atan2(y, x) * 180) / Math.PI;
      // For this demo, keep result in range [-180, 180] but prefer positive values near dateline
      if (m < -180) m += 360;
      if (m > 180) m -= 360;
      return m;
    }

    // Result markers - RED for wrong, GREEN for correct with permanent labels
    const wrongMarker = L.circleMarker(MAP_CENTER, {
      radius: 12,
      color: "#FF1744",
      fillColor: "#FF5252",
      fillOpacity: 0.9,
      weight: 3,
    })
      .addTo(map)
      .bindTooltip("WRONG", {
        permanent: true,
        direction: "top",
        className: "wrong-label",
        offset: [0, -15]
      });

    const correctMarker = L.circleMarker(MAP_CENTER, {
      radius: 15,
      color: "#00C853",
      fillColor: "#4CAF50",
      fillOpacity: 0.9,
      weight: 3,
    })
      .addTo(map)
      .bindTooltip("RIGHT", {
        permanent: true,
        direction: "top",
        className: "right-label",
        offset: [0, -15]
      });
    const readout = document.getElementById("readout");

    window.gisResultMarkers = [wrongMarker, correctMarker];

    function update() {
      const lats = pts.map((m) => m.getLatLng().lat);
      const lons = pts.map((m) => m.getLatLng().lng);
      const latAvg = lats.reduce((a, b) => a + b, 0) / lats.length;

      // Update marker tooltips with current positions
      // Normalize longitude for display (keep in -180 to 180 range)
      let displayLon1 = lons[0];
      let displayLon2 = lons[1];
      if (displayLon2 > 180) displayLon2 -= 360; // Convert 190° back to -170° for display

      marker1.setTooltipContent(`${displayLon1.toFixed(1)}°`);
      marker2.setTooltipContent(`${displayLon2.toFixed(1)}°`);

      // Naive linear mean - just averages the longitude values directly
      // When points are on opposite sides of date line (e.g. 170° and -170°),
      // this gives 180° which is wrong (should be 180°)
      const naiveLinMean = (displayLon1 + displayLon2) / 2;

      // Correct circular mean - use the normalized display values
      const circMean = meanLonDeg([displayLon1, displayLon2]);

      // Debug logging
      console.log(`Blue: ${displayLon1.toFixed(1)}°, Orange: ${displayLon2.toFixed(1)}°`);
      console.log(`Naive linear: ${naiveLinMean.toFixed(1)}°, Circular: ${circMean.toFixed(1)}°`);

      // Ensure markers appear on the main visible map copy
      let correctLon = circMean;
      let wrongLon = naiveLinMean;

      // Fix the green pin positioning - if it's in the western hemisphere near dateline, convert to positive equivalent
      if (correctLon < -90) {
        correctLon += 360; // Convert negative western longitudes to positive equivalent
      }

      // For the red pin, if it's in the eastern hemisphere when pins are western,
      // it should stay where it is (the naive wrong answer)

      wrongMarker.setLatLng([latAvg, wrongLon]);
      correctMarker.setLatLng([latAvg, correctLon]);

      // Show a reference line at the Prime Meridian (0°) when naive mean is wrong
      if (window.crossLine) map.removeLayer(window.crossLine);
      if (Math.abs(naiveLinMean - circMean) > 90) {
        // Large difference means we're crossing the date line
        window.crossLine = L.polyline(
          [
            [latAvg - 5, 0],
            [latAvg + 5, 0],
          ],
          { color: "#FFC107", weight: 2, dashArray: "5,5" }
        ).addTo(map);
      }

      if (readout) {
        // For display, show the mathematical result but indicate position
        let displayCorrectLon = circMean;
        if (correctLon > 180) {
          displayCorrectLon = circMean; // Show original calculation (-176°)
        }
        readout.textContent = `✅ Circular mean: ${displayCorrectLon.toFixed(
          1
        )}° | ❌ Naive linear mean: ${wrongLon.toFixed(1)}°`;
      }
    }

    pts.forEach((m) => m.on("drag dragend", update));
    update();

    // UI toggles
    const worldCopyCheckbox = document.getElementById("worldCopy");
    const noWrapTilesCheckbox = document.getElementById("noWrapTiles");

    if (worldCopyCheckbox) {
      worldCopyCheckbox.addEventListener("change", (e) => {
        map.options.worldCopyJump = !!e.target.checked;
        map.panBy([1, 0]); // nudge to apply visually
      });
    }

    if (noWrapTilesCheckbox) {
      noWrapTilesCheckbox.addEventListener("change", (e) => {
        const noWrap = !!e.target.checked;
        map.removeLayer(tiles);
        tiles = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            noWrap,
          }
        ).addTo(map);
        window.gisTiles = tiles;
      });
    }

    console.log("GIS demo initialized");
  } catch (error) {
    console.error("Error initializing GIS demo:", error);
  }
}
