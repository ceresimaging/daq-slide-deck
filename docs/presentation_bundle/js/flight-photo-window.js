// This function contains all the logic for the aerial photography scheduling slide
// Shows why vector embedding matters for "time to optimal window" calculations

function initFlightPhotoWindow() {
  try {
    console.log("📸 Initializing Flight Photo Window demo...");

    // Get DOM elements
    const departureSlider = document.getElementById("departure-time");
    const durationSlider = document.getElementById("flight-duration");
    const timezonesSlider = document.getElementById("timezones");

    const departureValue = document.getElementById("departure-value");
    const durationValue = document.getElementById("duration-value");
    const timezoneValue = document.getElementById("timezone-value");

    const depClock = document.getElementById("departure-clock");
    const arrClock = document.getElementById("arrival-clock");
    const depHand = document.getElementById("dep-hand");
    const arrHand = document.getElementById("arr-hand");

    const vectorSpace = document.getElementById("vector-space");
    const depVector = document.getElementById("dep-vector");
    const arrVector = document.getElementById("arr-vector");
    const depPoint = document.getElementById("dep-point");
    const arrPoint = document.getElementById("arr-point");
    const depLabel = document.getElementById("dep-label");
    const arrLabel = document.getElementById("arr-label");

    const distanceArc = document.getElementById("distance-arc");
    const distanceLabel = document.getElementById("distance-label");

    // Time toggle button and labels
    const timeToggle = document.getElementById("time-toggle");
    const labelNorth = document.getElementById("label-north");
    const labelEast = document.getElementById("label-east");
    const labelSouth = document.getElementById("label-south");
    const labelWest = document.getElementById("label-west");
    let isMilitaryTime = true;

    const naiveDistance = document.getElementById("naive-distance");
    const vectorDistance = document.getElementById("vector-distance");
    const morningDistance = document.getElementById("morning-distance");
    const photoQuality = document.getElementById("photo-quality");

    const naiveResult = document.getElementById("naive-result");
    const vectorResult = document.getElementById("vector-result");
    const morningResult = document.getElementById("morning-result");
    const photoReady = document.getElementById("photo-ready");

    // Pedagogical elements
    const hintButton = document.getElementById("hint-button");
    const hintContent = document.getElementById("hint-content");
    const methodDifference = document.getElementById("method-difference");
    const differenceExplanation = document.getElementById(
      "difference-explanation"
    );
    const explanationText = document.getElementById("explanation-text");

    // Photo windows (in 24h format)
    const MORNING_START = 9; // 9 AM
    const MORNING_END = 11; // 11 AM
    const AFTERNOON_START = 14; // 2 PM
    const AFTERNOON_END = 16; // 4 PM

    // THE KEY FUNCTION: Embed time-of-day as 2D vector
    function embedTimeAsVector(hours) {
      // Convert to clock position:
      // - 0 hours (midnight) should be at top (angle = -π/2 in standard coords)
      // - Hours increase clockwise
      const theta = (2 * Math.PI * hours) / 24 - Math.PI / 2;
      return {
        x: Math.cos(theta),
        y: Math.sin(theta),
        angle: theta,
      };
    }

    // Compute circular distance between two times (in hours)
    function circularDistance(hours1, hours2) {
      const vec1 = embedTimeAsVector(hours1);
      const vec2 = embedTimeAsVector(hours2);

      // Dot product gives us cos(angle between)
      const dotProduct = vec1.x * vec2.x + vec1.y * vec2.y;
      const angleDistance = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

      // Convert radians to hours
      return (angleDistance * 12) / Math.PI;
    }

    // NAIVE distance calculation (what most systems do wrong)
    function naiveTimeDistance(currentTime, targetWindow) {
      // Most flight planning software does this simple subtraction
      let distance = targetWindow - currentTime;

      // Handle negative by adding 24 (but this is where it goes wrong!)
      if (distance < 0) {
        distance += 24;
      }

      // This gives you "hours until next occurrence" but not shortest distance!
      return distance;
    }

    // Find OPTIMAL photo window - this is where embedding shines!
    function findOptimalWindow(arrivalTime) {
      // Check all windows and find the best one
      const windows = [
        { start: MORNING_START, end: MORNING_END, name: "Morning" },
        { start: AFTERNOON_START, end: AFTERNOON_END, name: "Afternoon" },
      ];

      let bestWindow = null;
      let shortestWait = 24;

      // Naive approach - find the CHRONOLOGICALLY NEXT window
      let naiveChoice = null;
      let naiveWait = 24;

      // First, try to find a window later today
      for (const window of windows) {
        const windowCenter = (window.start + window.end) / 2;

        if (windowCenter > arrivalTime) {
          const waitTime = windowCenter - arrivalTime;
          if (waitTime < naiveWait) {
            naiveWait = waitTime;
            naiveChoice = window;
          }
        }
      }

      // If no window found later today, pick the earliest tomorrow
      if (!naiveChoice) {
        // Morning comes first tomorrow
        naiveChoice = windows[0]; // Morning window
        naiveWait = (MORNING_START + MORNING_END) / 2 + 24 - arrivalTime;
      }

      // Vector embedding approach - finds TRUE shortest distance in either direction
      for (const window of windows) {
        const windowCenter = (window.start + window.end) / 2;
        const vectorDist = circularDistance(arrivalTime, windowCenter);

        if (vectorDist < shortestWait) {
          shortestWait = vectorDist;
          bestWindow = window;
        }
      }

      return {
        optimal: bestWindow,
        optimalWait: shortestWait,
        naive: naiveChoice,
        naiveWait: naiveWait,
        differentChoice: bestWindow.name !== naiveChoice.name,
      };
    }

    // Draw photo windows on clock
    function drawPhotoWindows(svg) {
      const windows = svg.querySelector(".photo-windows");
      windows.innerHTML = "";

      // Morning window arc
      const morningStart = (MORNING_START * 360) / 24 - 90;
      const morningEnd = (MORNING_END * 360) / 24 - 90;
      const morningArc = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      const morningPath = describeArc(100, 100, 80, morningStart, morningEnd);
      morningArc.setAttribute("d", morningPath);
      morningArc.setAttribute("fill", "none");
      morningArc.setAttribute("stroke", "#FF9800");
      morningArc.setAttribute("stroke-width", "8");
      morningArc.setAttribute("opacity", "0.4");
      windows.appendChild(morningArc);

      // Afternoon window arc
      const afternoonStart = (AFTERNOON_START * 360) / 24 - 90;
      const afternoonEnd = (AFTERNOON_END * 360) / 24 - 90;
      const afternoonArc = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      const afternoonPath = describeArc(
        100,
        100,
        80,
        afternoonStart,
        afternoonEnd
      );
      afternoonArc.setAttribute("d", afternoonPath);
      afternoonArc.setAttribute("fill", "none");
      afternoonArc.setAttribute("stroke", "#2196F3");
      afternoonArc.setAttribute("stroke-width", "8");
      afternoonArc.setAttribute("opacity", "0.4");
      windows.appendChild(afternoonArc);
    }

    // Helper to create SVG arc path
    function describeArc(x, y, radius, startAngle, endAngle) {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M",
        start.x,
        start.y,
        "A",
        radius,
        radius,
        0,
        largeArcFlag,
        0,
        end.x,
        end.y,
      ].join(" ");
    }

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      const angleInRadians = (angleInDegrees * Math.PI) / 180;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    }

    // Draw vector space visualization
    function drawVectorSpace() {
      const centerX = 200;
      const centerY = 200;
      const radius = 150;

      // Draw photo window sectors in vector space
      const morningStartVec = embedTimeAsVector(MORNING_START);
      const morningEndVec = embedTimeAsVector(MORNING_END);
      const morningArc = document.getElementById("morning-arc");

      const morningPath = [
        "M",
        centerX,
        centerY,
        "L",
        centerX + morningStartVec.x * radius,
        centerY + morningStartVec.y * radius,
        "A",
        radius,
        radius,
        0,
        0,
        1, // Changed sweep-flag from 0 to 1 for clockwise
        centerX + morningEndVec.x * radius,
        centerY + morningEndVec.y * radius,
        "Z",
      ].join(" ");
      morningArc.setAttribute("d", morningPath);

      const afternoonStartVec = embedTimeAsVector(AFTERNOON_START);
      const afternoonEndVec = embedTimeAsVector(AFTERNOON_END);
      const afternoonArc = document.getElementById("afternoon-arc");

      const afternoonPath = [
        "M",
        centerX,
        centerY,
        "L",
        centerX + afternoonStartVec.x * radius,
        centerY + afternoonStartVec.y * radius,
        "A",
        radius,
        radius,
        0,
        0,
        1, // Changed sweep-flag from 0 to 1 for clockwise
        centerX + afternoonEndVec.x * radius,
        centerY + afternoonEndVec.y * radius,
        "Z",
      ].join(" ");
      afternoonArc.setAttribute("d", afternoonPath);

      // Position labels at the center of each pie slice
      const morningCenter = (MORNING_START + MORNING_END) / 2;
      const afternoonCenter = (AFTERNOON_START + AFTERNOON_END) / 2;

      const morningCenterVec = embedTimeAsVector(morningCenter);
      const afternoonCenterVec = embedTimeAsVector(afternoonCenter);

      // Position labels at 100px radius from center (closer than the 150px arc)
      const morningLabel = document.getElementById("morning-label");
      const afternoonLabel = document.getElementById("afternoon-label");

      if (morningLabel) {
        morningLabel.setAttribute("x", centerX + morningCenterVec.x * 100);
        morningLabel.setAttribute("y", centerY + morningCenterVec.y * 100 + 4); // +4 for text baseline
      }

      if (afternoonLabel) {
        afternoonLabel.setAttribute("x", centerX + afternoonCenterVec.x * 100);
        afternoonLabel.setAttribute(
          "y",
          centerY + afternoonCenterVec.y * 100 + 4
        ); // +4 for text baseline
      }
    }

    // Update visualization
    function update() {
      const departureHours = parseFloat(departureSlider.value);
      const flightDuration = parseFloat(durationSlider.value);
      const timezoneCrossed = parseFloat(timezonesSlider.value);

      // Calculate arrival time (with timezone change)
      const arrivalHours =
        (departureHours + flightDuration + timezoneCrossed + 24) % 24;

      // Update displays
      const formatTime = (h) => {
        const hours = Math.floor(h);
        const minutes = Math.round((h - hours) * 60);
        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      };

      departureValue.textContent = formatTime(departureHours);
      durationValue.textContent = `${flightDuration.toFixed(1)}h`;
      timezoneValue.textContent =
        timezoneCrossed > 0 ? `+${timezoneCrossed}h` : `${timezoneCrossed}h`;

      // Update clock hands
      const depAngle = (departureHours * 360) / 24 - 90;
      const arrAngle = (arrivalHours * 360) / 24 - 90;

      depHand.setAttribute(
        "x2",
        100 + 70 * Math.cos((depAngle * Math.PI) / 180)
      );
      depHand.setAttribute(
        "y2",
        100 + 70 * Math.sin((depAngle * Math.PI) / 180)
      );

      arrHand.setAttribute(
        "x2",
        100 + 70 * Math.cos((arrAngle * Math.PI) / 180)
      );
      arrHand.setAttribute(
        "y2",
        100 + 70 * Math.sin((arrAngle * Math.PI) / 180)
      );

      // VECTOR EMBEDDING
      const depVec = embedTimeAsVector(departureHours);
      const arrVec = embedTimeAsVector(arrivalHours);

      // Update vector visualization with new dimensions
      const centerX = 200;
      const centerY = 200;
      const radius = 150;

      const depX = centerX + depVec.x * radius;
      const depY = centerY + depVec.y * radius;
      const arrX = centerX + arrVec.x * radius;
      const arrY = centerY + arrVec.y * radius;

      depVector.setAttribute("x2", depX);
      depVector.setAttribute("y2", depY);
      depPoint.setAttribute("cx", depX);
      depPoint.setAttribute("cy", depY);
      depLabel.setAttribute("x", depX);
      depLabel.setAttribute("y", depY - 10);

      arrVector.setAttribute("x2", arrX);
      arrVector.setAttribute("y2", arrY);
      arrPoint.setAttribute("cx", arrX);
      arrPoint.setAttribute("cy", arrY);
      arrLabel.setAttribute("x", arrX);
      arrLabel.setAttribute("y", arrY - 10);

      // Draw arc between vectors
      // Calculate the angular difference to determine the shorter path
      let angularDiff = arrivalHours - departureHours;

      // Normalize to [-12, 12] range to find shorter path
      if (angularDiff > 12) {
        angularDiff -= 24;
      } else if (angularDiff < -12) {
        angularDiff += 24;
      }

      // For the arc to follow the circle:
      // - largeArcFlag: 0 if angular distance < 12 hours (180°), 1 if >= 12 hours
      // - sweepFlag: 1 if going clockwise (positive angular difference), 0 if counter-clockwise
      const largeArcFlag = Math.abs(angularDiff) >= 12 ? 1 : 0;
      const sweepFlag = angularDiff >= 0 ? 1 : 0;

      const arcPath = [
        "M",
        depX,
        depY,
        "A",
        radius,
        radius,
        0,
        largeArcFlag,
        sweepFlag,
        arrX,
        arrY,
      ].join(" ");
      distanceArc.setAttribute("d", arcPath);

      // THIS IS THE KEY COMPARISON!
      const windowAnalysis = findOptimalWindow(arrivalHours);

      // Show pedagogical explanation when methods disagree
      if (
        windowAnalysis.differentChoice ||
        Math.abs(windowAnalysis.naiveWait - windowAnalysis.optimalWait) > 2
      ) {
        // Methods disagree significantly - explain why!
        methodDifference.style.display = "block";

        const formatTime = (h) => {
          const hours = Math.floor(h);
          const minutes = Math.round((h - hours) * 60);
          return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
        };

        differenceExplanation.innerHTML = `
          <strong>Arrival time: ${formatTime(arrivalHours)}</strong><br>
          <strong>Naive method:</strong> Looks forward chronologically and says "wait ${windowAnalysis.naiveWait.toFixed(
            1
          )} hours until ${windowAnalysis.naive.name} window"<br>
          <strong>Vector method:</strong> Checks ALL directions on the clock and finds "${
            windowAnalysis.optimal.name
          } window is only ${windowAnalysis.optimalWait.toFixed(
          1
        )} hours away"<br>
          <br>
          <strong>Why it breaks:</strong> The naive method doesn't understand that time is circular! 
          It treats 23:00 and 01:00 as 22 hours apart instead of just 2 hours. 
          Vector embedding treats time as a circle where midnight connects back to itself.
        `;

        explanationText.textContent =
          "⚠️ The methods disagree! See explanation below.";
      } else {
        methodDifference.style.display = "none";
        explanationText.textContent =
          "Try different settings to see when naive calculation fails.";
      }

      // Show which window each approach recommends
      if (windowAnalysis.differentChoice) {
        naiveDistance.textContent = `${
          windowAnalysis.naive.name
        } (${windowAnalysis.naiveWait.toFixed(1)}h)`;
        vectorDistance.textContent = `${
          windowAnalysis.optimal.name
        } (${windowAnalysis.optimalWait.toFixed(1)}h)`;

        naiveResult.className = "result-card bad";
        vectorResult.className = "result-card good";
      } else {
        naiveDistance.textContent = `${windowAnalysis.naiveWait.toFixed(
          1
        )}h wait`;
        vectorDistance.textContent = `${windowAnalysis.optimalWait.toFixed(
          1
        )}h wait`;

        naiveResult.className =
          Math.abs(windowAnalysis.naiveWait - windowAnalysis.optimalWait) > 1
            ? "result-card bad"
            : "result-card";
        vectorResult.className = "result-card good";
      }

      // Show to nearest window
      morningDistance.textContent = `${windowAnalysis.optimalWait.toFixed(1)}h`;

      // Photo quality assessment
      let quality = "";
      let qualityClass = "";
      const inMorningWindow =
        arrivalHours >= MORNING_START && arrivalHours < MORNING_END;
      const inAfternoonWindow =
        arrivalHours >= AFTERNOON_START && arrivalHours < AFTERNOON_END;

      if (inMorningWindow || inAfternoonWindow) {
        quality = "In window! 🟢";
        qualityClass = "good";
      } else if (windowAnalysis.optimalWait < 1) {
        quality = "< 1h wait 🟡";
        qualityClass = "good";
      } else if (windowAnalysis.optimalWait < 3) {
        quality = `${windowAnalysis.optimalWait.toFixed(1)}h wait 🟠`;
        qualityClass = "";
      } else {
        quality = "Long wait 🔴";
        qualityClass = "bad";
      }

      photoQuality.textContent = quality;
      morningResult.className = `result-card ${
        windowAnalysis.optimalWait < 2 ? "good" : ""
      }`;
      photoReady.className = `result-card ${qualityClass}`;

      // Update distance label (now in HTML outside the SVG)
      const flightTime = circularDistance(departureHours, arrivalHours);
      if (distanceLabel) {
        distanceLabel.textContent = `Flight spans: ${flightTime.toFixed(
          1
        )}h on clock`;
      }
    }

    // Initialize photo windows
    drawPhotoWindows(depClock);
    drawPhotoWindows(arrClock);
    drawVectorSpace();

    // Event listeners
    departureSlider.addEventListener("input", update);
    durationSlider.addEventListener("input", update);
    timezonesSlider.addEventListener("input", update);

    // Toggle button for time display format
    if (timeToggle) {
      timeToggle.addEventListener("click", () => {
        isMilitaryTime = !isMilitaryTime;
        timeToggle.textContent = isMilitaryTime ? "24h" : "12h";

        // Update labels based on the time format
        if (isMilitaryTime) {
          if (labelNorth) labelNorth.textContent = "00:00";
          if (labelEast) labelEast.textContent = "06:00";
          if (labelSouth) labelSouth.textContent = "12:00";
          if (labelWest) labelWest.textContent = "18:00";
        } else {
          if (labelNorth) labelNorth.textContent = "12 AM";
          if (labelEast) labelEast.textContent = "6 AM";
          if (labelSouth) labelSouth.textContent = "12 PM";
          if (labelWest) labelWest.textContent = "6 PM";
        }
      });
    }

    // Hint button toggle
    if (hintButton) {
      hintButton.addEventListener("click", () => {
        const isHidden = hintContent.style.display === "none";
        hintContent.style.display = isHidden ? "block" : "none";
        hintButton.textContent = isHidden
          ? "💡 Hide Hint"
          : "💡 How to Break Naive Calculation";
      });
    }

    // Set initial values that show a subtle difference
    // Start with something that works, let users discover the breaking case
    departureSlider.value = "14"; // 2 PM departure
    durationSlider.value = "3"; // 3 hour flight
    timezonesSlider.value = "-1"; // Cross 1 timezone west

    // Initial update
    update();

    console.log("✅ Flight Photo Window demo initialized");
  } catch (error) {
    console.error("Error initializing Flight Photo Window demo:", error);
  }
}
