// This function contains all the logic for the interactive "Flight vs Now" timezone slide.
// It should be loaded by the main presentation when slide 18 is displayed.

function initFlightVsNow() {
  try {
    console.log("🛩️ Initializing Flight vs Now timezone demo...");

    // Debug: First check if we can see the slide content at all
    const slideContent = document.getElementById("slide-content");
    console.log("🔍 Slide content element:", slideContent ? "✅ found" : "❌ missing");
    if (slideContent) {
      console.log("   Slide content HTML:", slideContent.innerHTML.substring(0, 200) + "...");
    }

    // Get DOM elements
    const sydDate = document.getElementById("syd-date");
    const sydTime = document.getElementById("syd-time");
    const sfNowReadout = document.getElementById("sf-now-readout");
    // Removed button references since we're auto-setting SF time
    const utcTimeline = document.getElementById("utc-timeline");
    const dtCorrect = document.getElementById("dt-correct");
    const dtNaive = document.getElementById("dt-naive");
    const offsetDiff = document.getElementById("offset-diff");
    const sydReadout = document.getElementById("syd-readout");
    const sfReadout = document.getElementById("sf-readout");
    const dstControls = document.getElementById("dst-controls");
    const dstMessage = document.getElementById("dst-message");

    // Debug: Check each element individually
    console.log("🔍 DOM element check:");
    console.log("  sydDate:", sydDate ? "✅ found" : "❌ missing");
    console.log("  sydTime:", sydTime ? "✅ found" : "❌ missing");
    console.log("  sfNowReadout:", sfNowReadout ? "✅ found" : "❌ missing");
    console.log("  utcTimeline:", utcTimeline ? "✅ found" : "❌ missing");
    console.log("  dtCorrect:", dtCorrect ? "✅ found" : "❌ missing");
    console.log("  dtNaive:", dtNaive ? "✅ found" : "❌ missing");

    if (!sydDate || !sydTime || !sfNowReadout) {
      console.error("❌ Required DOM elements for FlightVsNow demo not found");
      console.error("   Missing elements:", {
        sydDate: !sydDate,
        sydTime: !sydTime,
        sfNowReadout: !sfNowReadout
      });
      return;
    }

    let sfNowInstant = null; // UTC instant for SF "now"
    let sydFlightInstant = null; // UTC instant for Sydney flight

    // Helper to get timezone offset in hours for a specific instant and timezone
    function getTimezoneOffsetHours(epochMs, timeZone) {
      const date = new Date(epochMs);
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "longOffset",
      });

      const formatted = formatter.format(date);
      const offsetMatch = formatted.match(/GMT([+-]\d{1,2}):?(\d{2})?/);
      if (offsetMatch) {
        const hours = parseInt(offsetMatch[1]);
        const minutes = offsetMatch[2] ? parseInt(offsetMatch[2]) : 0;
        return hours + (hours < 0 ? -minutes / 60 : minutes / 60);
      }
      return 0;
    }

    // Convert local Sydney date/time to UTC instant, handling DST gaps and folds
    function localSydneyToInstant(dateStr, timeStr) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hour, minute] = timeStr.split(":").map(Number);
      const searchStart = Date.UTC(year, month - 1, day - 1, 0, 0);
      const searchEnd = Date.UTC(year, month - 1, day + 2, 0, 0);
      const matches = [];

      for (let utc = searchStart; utc <= searchEnd; utc += 15 * 60 * 1000) {
        const formatter = new Intl.DateTimeFormat("en-AU", {
          timeZone: "Australia/Sydney",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const parts = formatter.formatToParts(new Date(utc));
        const formatted = {};
        parts.forEach((p) => (formatted[p.type] = p.value));
        if (
          `${formatted.year}-${formatted.month}-${formatted.day}` === dateStr &&
          `${formatted.hour}:${formatted.minute}` === timeStr
        ) {
          matches.push(utc);
        }
      }

      if (matches.length === 0) {
        // Spring-forward gap
        for (let utc = searchStart; utc <= searchEnd; utc += 15 * 60 * 1000) {
          const formatter = new Intl.DateTimeFormat("en-AU", {
            timeZone: "Australia/Sydney",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          const parts = formatter.formatToParts(new Date(utc));
          const formatted = {};
          parts.forEach((p) => (formatted[p.type] = p.value));
          if (
            `${formatted.year}-${formatted.month}-${formatted.day}` ===
              dateStr &&
            `${formatted.hour}:${formatted.minute}` > timeStr
          ) {
            return {
              instant: utc,
              status: "gap",
              adjustedTime: `${formatted.hour}:${formatted.minute}`,
            };
          }
        }
        return { instant: null, status: "gap" };
      } else if (matches.length === 1) {
        return { instant: matches[0], status: "valid" };
      } else {
        // Fall-back fold
        return { instant: matches[0], status: "fold" };
      }
    }

    function formatDuration(milliseconds) {
      const totalMinutes = Math.round(milliseconds / (1000 * 60));
      const absMinutes = Math.abs(totalMinutes);
      const hours = Math.floor(absMinutes / 60);
      const minutes = absMinutes % 60;
      const sign = totalMinutes >= 0 ? "+" : "-";
      return `${sign}${hours}h ${minutes}m`;
    }

    function formatLocalTime(epochMs, timeZone) {
      if (!epochMs) return "Invalid";
      const date = new Date(epochMs);
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
      const offset = getTimezoneOffsetHours(epochMs, timeZone);
      const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
      return `${formatter.format(date)}, UTC${offsetStr}`;
    }

    function calculateNaiveDelta(sydDateStr, sydTimeStr, sfEpochMs) {
      const sfDate = new Date(sfEpochMs);
      const sfFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const sfParts = sfFormatter.formatToParts(sfDate);
      const sfFormatted = {};
      sfParts.forEach((p) => (sfFormatted[p.type] = p.value));
      const sydLocal = new Date(`${sydDateStr}T${sydTimeStr}:00`);
      const sfLocal = new Date(
        `${sfFormatted.year}-${sfFormatted.month}-${sfFormatted.day}T${sfFormatted.hour}:${sfFormatted.minute}:00`
      );
      return sfLocal.getTime() - sydLocal.getTime();
    }

    function drawTimeline(sydInstant, sfInstant) {
      if (!utcTimeline || !sydInstant || !sfInstant) return;
      utcTimeline.innerHTML = "";
      utcTimeline.setAttribute("viewBox", "0 0 900 320");

      const width = 900, height = 320;
      const margin = { left: 80, right: 80, top: 40, bottom: 40 };

      // Draw two timelines: correct (top) and naive (bottom)
      drawSingleTimeline(true, 60, sydInstant, sfInstant);  // Correct UTC timeline
      drawSingleTimeline(false, 220, sydInstant, sfInstant); // Naive local time timeline

      function drawSingleTimeline(isCorrect, timelineY, sydInstant, sfInstant) {
        const label = isCorrect ? "✅ Correct: UTC Timeline (Ring Embedding)" : "❌ Naive: Local Time Math";
        const color = isCorrect ? "#4CAF50" : "#FF5722";

        // Timeline title
        const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
        title.setAttribute("x", width / 2);
        title.setAttribute("y", timelineY - 35);
        title.setAttribute("text-anchor", "middle");
        title.setAttribute("fill", color);
        title.setAttribute("font-size", "14");
        title.setAttribute("font-weight", "bold");
        title.textContent = label;
        utcTimeline.appendChild(title);

        if (isCorrect) {
          // Correct approach: Use actual UTC times
          drawTimelineWithTimes(timelineY, sydInstant, sfInstant, "#4CAF50");
        } else {
          // Naive approach: Treat local times as if they're on same timeline
          // This creates a misleading visualization
          const sydLocal = new Date(sydInstant);
          const sfLocal = new Date(sfInstant);

          // Extract just the time components and create "fake" UTC times
          const sydFakeUTC = new Date(Date.UTC(2025, 8, 16, sydLocal.getHours(), sydLocal.getMinutes()));
          const sfFakeUTC = new Date(Date.UTC(2025, 8, 16, sfLocal.getHours(), sfLocal.getMinutes()));

          drawTimelineWithTimes(timelineY, sydFakeUTC.getTime(), sfFakeUTC.getTime(), "#FF5722");
        }
      }

      function drawTimelineWithTimes(timelineY, time1, time2, color) {
        // Create timeline span
        const centerTime = (time1 + time2) / 2;
        const timeSpan = Math.max(24 * 60 * 60 * 1000, Math.abs(time2 - time1) * 3);
        const startTime = centerTime - timeSpan / 2;
        const endTime = centerTime + timeSpan / 2;

        const timeToX = (ts) =>
          margin.left + ((ts - startTime) / (endTime - startTime)) * (width - margin.left - margin.right);

        // Draw main timeline
        const timeline = document.createElementNS("http://www.w3.org/2000/svg", "line");
        timeline.setAttribute("x1", margin.left);
        timeline.setAttribute("x2", width - margin.right);
        timeline.setAttribute("y1", timelineY);
        timeline.setAttribute("y2", timelineY);
        timeline.setAttribute("stroke", "#7d8590");
        timeline.setAttribute("stroke-width", "2");
        utcTimeline.appendChild(timeline);

        // Draw tick marks (fewer for cleaner look)
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
          const tickTime = startTime + (i * (endTime - startTime) / numTicks);
          const x = timeToX(tickTime);

          // Tick mark
          const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
          tick.setAttribute("x1", x);
          tick.setAttribute("x2", x);
          tick.setAttribute("y1", timelineY - 5);
          tick.setAttribute("y2", timelineY + 5);
          tick.setAttribute("stroke", "#7d8590");
          tick.setAttribute("stroke-width", "1");
          utcTimeline.appendChild(tick);

          // Time label with alternating heights
          const yOffset = (i % 2 === 0) ? 20 : 30;
          const timeLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
          timeLabel.setAttribute("x", x);
          timeLabel.setAttribute("y", timelineY + yOffset);
          timeLabel.setAttribute("text-anchor", "middle");
          timeLabel.setAttribute("fill", "#9aa4ad");
          timeLabel.setAttribute("font-size", "10");

          const timeStr = new Date(tickTime).toISOString().substring(11, 16);
          timeLabel.textContent = timeStr;
          utcTimeline.appendChild(timeLabel);
        }

        // Draw event pins
        drawPin(time1, "#ff6b6b", "Sydney", timelineY);
        drawPin(time2, "#4ecdc4", "SF Now", timelineY);

        function drawPin(instant, pinColor, label, y) {
          const x = timeToX(instant);

          // Pin line
          const pin = document.createElementNS("http://www.w3.org/2000/svg", "line");
          pin.setAttribute("x1", x);
          pin.setAttribute("x2", x);
          pin.setAttribute("y1", y - 15);
          pin.setAttribute("y2", y + 15);
          pin.setAttribute("stroke", pinColor);
          pin.setAttribute("stroke-width", "3");
          utcTimeline.appendChild(pin);

          // Pin circle
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", x);
          circle.setAttribute("cy", y);
          circle.setAttribute("r", "5");
          circle.setAttribute("fill", pinColor);
          utcTimeline.appendChild(circle);

          // Label above timeline
          const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
          text.setAttribute("x", x);
          text.setAttribute("y", y - 25);
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("fill", pinColor);
          text.setAttribute("font-size", "11");
          text.setAttribute("font-weight", "bold");
          text.textContent = label;
          utcTimeline.appendChild(text);
        }
      }
    }

    function updateCalculations() {
      const sydDateStr = sydDate.value;
      const sydTimeStr = sydTime.value;

      if (!sydDateStr || !sydTimeStr || !sfNowInstant) return;

      const sydResult = localSydneyToInstant(sydDateStr, sydTimeStr);
      dstControls.classList.remove("show");
      if (sydResult.status === "gap") {
        dstControls.classList.add("show");
        dstMessage.textContent = `Time ${sydTimeStr} doesn't exist. Auto-adjusted to ${
          sydResult.adjustedTime || "next valid"
        }.`;
      } else if (sydResult.status === "fold") {
        dstControls.classList.add("show");
        dstMessage.textContent = `Time ${sydTimeStr} occurs twice. Using earlier instance.`;
      }
      sydFlightInstant = sydResult.instant;

      if (!sydFlightInstant) return;

      dtCorrect.textContent = formatDuration(sfNowInstant - sydFlightInstant);
      dtNaive.textContent = formatDuration(
        calculateNaiveDelta(sydDateStr, sydTimeStr, sfNowInstant)
      );

      const sydOffset = getTimezoneOffsetHours(
        sydFlightInstant,
        "Australia/Sydney"
      );
      const sfOffset = getTimezoneOffsetHours(
        sfNowInstant,
        "America/Los_Angeles"
      );
      const offsetDifference = sfOffset - sydOffset;
      offsetDiff.textContent = `(${sfOffset}h) - (${sydOffset}h) = ${offsetDifference.toFixed(
        2
      )}h`;

      sydReadout.textContent = `Sydney: ${formatLocalTime(
        sydFlightInstant,
        "Australia/Sydney"
      )}`;
      sfReadout.textContent = `San Francisco: ${formatLocalTime(
        sfNowInstant,
        "America/Los_Angeles"
      )}`;
      drawTimeline(sydFlightInstant, sfNowInstant);
    }

    // Buttons removed - SF time is automatically set to current time

    sydDate.addEventListener("change", updateCalculations);
    sydTime.addEventListener("change", updateCalculations);

    // Initialize SF time to current time
    sfNowInstant = Date.now();
    sfNowReadout.textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(sfNowInstant));

    // Set Sydney flight time to today with a reasonable time
    const today = new Date();
    sydDate.value = today.toISOString().split('T')[0]; // Today's date
    sydTime.value = "08:10"; // Flight time in Sydney

    // Trigger initial calculation to draw the timeline
    updateCalculations();

    console.log("Flight vs Now timezone demo initialized");
  } catch (error) {
    console.error("Error initializing Flight vs Now demo:", error);
  }
}
