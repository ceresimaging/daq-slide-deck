// Interactive angle averaging demo for slide 11-interactive-demo.html

function initInteractiveDemo() {
  const angle1Input = document.getElementById("angle1");
  const angle2Input = document.getElementById("angle2");
  const angle1Display = document.getElementById("angle1-display");
  const angle2Display = document.getElementById("angle2-display");
  const wrongResult = document.getElementById("wrong-result");
  const correctResult = document.getElementById("correct-result");

  // Check if elements exist (safety check)
  if (!angle1Input || !angle2Input) {
    console.log("Interactive demo elements not found");
    return;
  }

  function updateDemo() {
    const a1 = parseInt(angle1Input.value);
    const a2 = parseInt(angle2Input.value);

    // Update displays
    angle1Display.textContent = a1 + "°";
    angle2Display.textContent = a2 + "°";

    // Calculate wrong (linear) average
    const wrongAvg = (a1 + a2) / 2;
    wrongResult.textContent = Math.round(wrongAvg) + "°";

    // Calculate correct (circular) average
    const theta1 = (a1 * Math.PI) / 180;
    const theta2 = (a2 * Math.PI) / 180;
    const v1 = [Math.cos(theta1), Math.sin(theta1)];
    const v2 = [Math.cos(theta2), Math.sin(theta2)];
    const avgVec = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2];
    const norm = Math.sqrt(avgVec[0] ** 2 + avgVec[1] ** 2);
    avgVec[0] /= norm;
    avgVec[1] /= norm;
    const correctAvg = (Math.atan2(avgVec[1], avgVec[0]) * 180) / Math.PI;
    const correctAvgNormalized = (correctAvg + 360) % 360;
    correctResult.textContent = Math.round(correctAvgNormalized) + "°";

    // Update visual
    updateVisual(a1, a2, wrongAvg, correctAvgNormalized);

    // Show/hide wrong result based on how wrong it is
    const wrongness = Math.abs(wrongAvg - correctAvgNormalized);
    const adjustedWrongness = Math.min(wrongness, 360 - wrongness);
    const opacity = adjustedWrongness > 30 ? 1 : 0;

    const wrongLine = document.getElementById("avg-wrong-line");
    const wrongPoint = document.getElementById("avg-wrong-point");
    if (wrongLine) wrongLine.style.opacity = opacity;
    if (wrongPoint) wrongPoint.style.opacity = opacity;
  }

  function updateVisual(a1, a2, wrongAvg, correctAvg) {
    const cx = 200,
      cy = 200,
      r = 150;

    // Convert angles to positions
    function angleToPos(angle) {
      const rad = ((angle - 90) * Math.PI) / 180; // -90 to start from top
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
      };
    }

    const pos1 = angleToPos(a1);
    const pos2 = angleToPos(a2);
    const wrongPos = angleToPos(wrongAvg);
    const correctPos = angleToPos(correctAvg);

    // Update lines and points safely
    const elements = [
      { id: "angle1-line", x2: pos1.x, y2: pos1.y },
      { id: "angle1-point", cx: pos1.x, cy: pos1.y },
      { id: "angle2-line", x2: pos2.x, y2: pos2.y },
      { id: "angle2-point", cx: pos2.x, cy: pos2.y },
      { id: "avg-wrong-line", x2: wrongPos.x, y2: wrongPos.y },
      { id: "avg-wrong-point", cx: wrongPos.x, cy: wrongPos.y },
      { id: "avg-correct-line", x2: correctPos.x, y2: correctPos.y },
      { id: "avg-correct-point", cx: correctPos.x, cy: correctPos.y },
    ];

    elements.forEach((elem) => {
      const element = document.getElementById(elem.id);
      if (element) {
        if (elem.x2 !== undefined) element.setAttribute("x2", elem.x2);
        if (elem.y2 !== undefined) element.setAttribute("y2", elem.y2);
        if (elem.cx !== undefined) element.setAttribute("cx", elem.cx);
        if (elem.cy !== undefined) element.setAttribute("cy", elem.cy);
      }
    });
  }

  // Set up event listeners
  angle1Input.addEventListener("input", updateDemo);
  angle2Input.addEventListener("input", updateDemo);

  // Initial update
  updateDemo();

  console.log("Interactive demo initialized");
}
