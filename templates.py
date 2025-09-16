# Create these files in a "templates" folder next to build.py

## File 1: templates/single_file.html
SINGLE_FILE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>

    <!-- Code syntax highlighting with Highlight.js -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">

    <!-- Leaflet CSS for GIS demo -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">

    <!-- D3 UMD (exposes window.d3) -->
    <script src="https://d3js.org/d3.v7.min.js" defer></script>

    <!-- D3FC UMD bundle (exposes window.fc, includes label-layout) -->
    <script src="https://unpkg.com/d3fc@15" defer></script>

    <style>
{{CSS_CONTENT}}

        /* Code block styling */
        pre code {
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 12px !important;
            padding: 20px !important;
            display: block;
        }

        /* Maintain our colored container backgrounds */
        .bad-code, .code-example {
            background: linear-gradient(180deg, rgba(255,123,123,0.08), rgba(255,123,123,0.04)) !important;
            border-left: 4px solid var(--accent3) !important;
            border-radius: 8px !important;
            padding: 1em !important;
        }

        .good-code, .code-solution {
            background: linear-gradient(180deg, rgba(155,255,176,0.08), rgba(155,255,176,0.04)) !important;
            border-left: 4px solid var(--accent2) !important;
            border-radius: 8px !important;
            padding: 1em !important;
        }

        .implementation-example {
            background: linear-gradient(180deg, rgba(156,39,176,0.08), rgba(156,39,176,0.04)) !important;
            border-left: 4px solid #9C27B0 !important;
            border-radius: 8px !important;
            padding: 1em !important;
        }

        .universal-class {
            background: linear-gradient(180deg, rgba(33,150,243,0.08), rgba(33,150,243,0.04)) !important;
            border-left: 4px solid #2196F3 !important;
            border-radius: 8px !important;
            padding: 1em !important;
        }

        .approach-bad, .approach-good {
            background: rgba(255,255,255,0.04) !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            border-radius: 8px !important;
            padding: 1em !important;
        }

        /* Crisp "halo" under label text to keep it readable */
        svg text {
            paint-order: stroke;
            stroke: rgba(8,12,16,.75);
            stroke-width: 3;
        }
        /* Optional: keep strokes consistent when scaling */
        svg *[stroke] {
            vector-effect: non-scaling-stroke;
        }
    </style>

    <!-- Math rendering with MathJax -->
    <script>
        MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
            },
            options: {
                renderActions: {
                    addMenu: []  // Disable context menu for cleaner presentation
                }
            }
        };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
    <div class="slideshow-container">
        <div id="slide-content"></div>
    </div>

    <!-- Navigation -->
    <div class="navigation">
        <button class="nav-button" onclick="console.log('Previous button clicked!'); previousSlide()">◀ Previous</button>
        <button class="nav-button" onclick="nextSlide()">Next ▶</button>
    </div>

    <!-- Slide Counter -->
    <div class="slide-counter">
        <span id="current-slide">1</span> / <span id="total-slides">{{TOTAL_SLIDES}}</span>
    </div>

    <!-- Code highlighting JavaScript -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js"></script>

    <!-- Leaflet JavaScript for GIS demo -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

    <!-- PixiJS for interactive math demos -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            hljs.highlightAll();

            // Sanity check for D3 and fc libraries
            console.log("✅ D3 loaded?", typeof d3);
            console.log("✅ fc loaded?", typeof fc);

            if (typeof d3 !== 'undefined' && typeof fc !== 'undefined') {
                console.log("✅ D3 version:", d3.version);
                console.log("✅ fc.layoutLabel exists?", typeof fc.layoutLabel);
            } else {
                console.error("❌ D3 or fc libraries failed to load!");
            }
        });

        // Helper function to expand SVG viewBox to prevent text cutoff
        function expandViewBox(svg, pad = 20) {
            console.log("📐 expandViewBox called with padding:", pad);
            const node = svg.node ? svg.node() : svg;
            const box = node.getBBox();
            const oldViewBox = node.getAttribute("viewBox");
            const newViewBox = [
                box.x - pad,
                box.y - pad,
                box.width + 2 * pad,
                box.height + 2 * pad
            ].join(" ");

            console.log("   Old viewBox:", oldViewBox);
            console.log("   New viewBox:", newViewBox);

            if (svg.attr) {
                svg.attr("viewBox", newViewBox);
            } else {
                node.setAttribute("viewBox", newViewBox);
            }
        }

        // Helper function to wait for libraries to load
        function waitForLibraries(callback, maxRetries = 20) {
            let retries = 0;
            const checkInterval = setInterval(() => {
                retries++;
                if (window.d3 && window.fc) {
                    console.log("✅ D3 and fc libraries loaded");
                    clearInterval(checkInterval);
                    callback();
                } else if (retries >= maxRetries) {
                    console.warn("⚠️ Timeout waiting for D3/fc libraries after", retries, "attempts");
                    clearInterval(checkInterval);
                } else {
                    console.log("⏳ Waiting for D3/fc libraries... attempt", retries);
                }
            }, 100);
        }

        // Helper function to fix SVG text layout and prevent overlap
        function fixSVGLayout(svgElement) {
            console.log("🔧 fixSVGLayout called for SVG element");

            if (!window.d3 || !window.fc) {
                console.warn("⚠️ D3 or fc libraries not loaded yet, will retry...");
                waitForLibraries(() => {
                    console.log("🔄 Retrying fixSVGLayout after libraries loaded");
                    fixSVGLayout(svgElement);
                });
                return;
            }

            const svg = d3.select(svgElement);
            console.log("   SVG selected with D3");

            // Expand viewBox to prevent edge clipping
            expandViewBox(svg, 25);

            // Optional: Apply label layout if there are many text elements
            const textElements = svg.selectAll("text");
            console.log('   Found ' + textElements.size() + ' text elements');

            if (textElements.size() > 4) {
                console.log("   Applying d3fc label layout for", textElements.size(), "text elements");
                // For complex layouts with many labels, use d3fc-label-layout
                try {
                    const labels = textElements.nodes();
                    const layout = fc.layoutLabel()
                        .size(d => {
                            const box = d.getBBox();
                            return [box.width, box.height];
                        })
                        .position(d => {
                            const x = parseFloat(d.getAttribute("x") || 0);
                            const y = parseFloat(d.getAttribute("y") || 0);
                            return [x, y];
                        });

                    svg.datum(labels).call(layout);
                    console.log("   ✅ Label layout applied successfully");
                } catch (e) {
                    console.warn("   ❌ Label layout failed:", e);
                }
            } else {
                console.log("   Skipping label layout (not enough text elements)");
            }
        }

        // Helper function to compute safe SVG bounds
        function computeSvgBounds(svgNode) {
            const svg = d3.select(svgNode);
            const vbAttr = svg.attr("viewBox");
            if (vbAttr) {
                const nums = vbAttr.trim().split(/\s+/).map(Number);
                if (nums.length === 4 && nums.every(Number.isFinite)) {
                    const [vx, vy, vw, vh] = nums;
                    if (vw > 0 && vh > 0) return { x: vx, y: vy, width: vw, height: vh };
                }
            }
            // fallback: bbox + padding, and set a sane viewBox
            const b = svgNode.getBBox();
            const bounds = { x: b.x - 16, y: b.y - 16, width: b.width + 32, height: b.height + 32 };
            svg.attr("viewBox", bounds.x + " " + bounds.y + " " + bounds.width + " " + bounds.height);
            return bounds;
        }

        // Move existing <text> elements with d3fc (no new labels are created)
        window.applyLabelLayout = function applyLabelLayout(svgNode, { anneal = false } = {}) {
            if (!window.d3 || !window.fc) {
                console.warn("applyLabelLayout: d3/fc not present");
                return;
            }

            console.log('🏷️ Applying label layout (reuse existing labels)');
            const svg = d3.select(svgNode);
            const textsSel = svg.selectAll("text");
            const textNodes = textsSel.nodes();

            if (textNodes.length < 2) {
                console.log('   Skipping layout (less than 2 text elements)');
                return; // nothing to resolve
            }

            // normalize anchors to reduce surprises
            textsSel
                .attr("dominant-baseline", function () { return this.getAttribute("dominant-baseline") || "middle"; })
                .attr("text-anchor", function () { return this.getAttribute("text-anchor") || "middle"; });

            const bounds = computeSvgBounds(svgNode);
            console.log('   Using bounds:', bounds);

            // pick strategy
            const base = anneal ? fc.layoutAnnealing() : fc.layoutGreedy();
            const strategy = fc.layoutRemoveOverlaps(base.bounds(bounds));

            // NO component: we don't want new nodes rendered
            const noop = () => {};

            // layout that measures & reads current positions off each datum (the SVGTextElement)
            const layout = fc.layoutLabel(strategy)
                .size(function (d) {
                    const bb = d.getBBox();
                    return [bb.width + 8, bb.height + 6];  // padding around label boxes
                })
                .position(function (d) {
                    return [ +d.getAttribute("x") || 0, +d.getAttribute("y") || 0 ];
                })
                .component(noop);

            // bind nodes as data and run layout
            svg.datum(textNodes).call(layout);

            // now bind those datums to the text selection
            textsSel.data(textNodes);

            // write solved positions back; keep old value as fallback
            textsSel
                .attr("x", function (d) { return (d && Number.isFinite(d.x)) ? d.x : +this.getAttribute("x"); })
                .attr("y", function (d) { return (d && Number.isFinite(d.y)) ? d.y : +this.getAttribute("y"); });
            console.log('   ✅ Label layout applied to', textNodes.length, 'existing text elements (no new nodes created)');
        };

        // Move every <text> to the end of its parent so it paints on top
        function bringTextToFront(svgEl) {
            console.log('📤 Bringing text elements to front');
            const texts = svgEl.querySelectorAll('text');
            texts.forEach(t => t.parentNode.appendChild(t)); // append = top of paint order
            console.log('   ✅ Moved', texts.length, 'text elements to front');
        }

        // Ensure SVG has the filter definitions for labels
        function ensureLabelFilters(svgEl) {
            const NS = "http://www.w3.org/2000/svg";
            let defs = svgEl.querySelector("defs");
            if (!defs) {
                defs = document.createElementNS(NS, "defs");
                svgEl.insertBefore(defs, svgEl.firstChild);
            }

            if (!svgEl.querySelector("#label-shadow")) {
                const f = document.createElementNS(NS, "filter");
                f.setAttribute("id", "label-shadow");
                f.innerHTML = '<feDropShadow dx="0" dy=".7" stdDeviation="1.2" flood-color="#000" flood-opacity=".55"/>';
                defs.appendChild(f);
            }
            if (!svgEl.querySelector("#label-glow")) {
                const f = document.createElementNS(NS, "filter");
                f.setAttribute("id", "label-glow");
                f.setAttribute("x", "-20%");
                f.setAttribute("y", "-20%");
                f.setAttribute("width", "140%");
                f.setAttribute("height", "140%");
                f.innerHTML = '<feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>';
                defs.appendChild(f);
            }
        }

        // Apply styling filters to labels
        function styleLabels(svgEl, { use = "shadow" } = {}) {
            console.log('🎨 Applying', use, 'filter to text labels');
            ensureLabelFilters(svgEl);
            const texts = svgEl.querySelectorAll("text");
            texts.forEach(t => {
                t.setAttribute("filter", 'url(#label-' + use + ')');
            });
            console.log('   ✅ Applied', use, 'filter to', texts.length, 'text elements');
        }

        // Reduce the size of filled endpoint circles; leave stroked rings alone
        function shrinkEndpoints(svgEl, targetR = 5) {
            console.log('🔴 Shrinking endpoint bulbs to radius', targetR);
            let shrunkCount = 0;
            svgEl.querySelectorAll('circle').forEach(c => {
                const r0 = +c.getAttribute('r') || 0;
                const fill = (c.getAttribute('fill') || '').trim().toLowerCase();
                const hasFill = fill && fill !== 'none';
                // Heuristic: rings in your slides have fill="none", endpoints are filled
                if (hasFill && r0 > targetR) {
                    c.setAttribute('r', targetR);
                    shrunkCount++;
                }
            });
            console.log('   ✅ Shrunk', shrunkCount, 'filled circles from larger sizes to', targetR);
        }

        // Called after each slide's SVG is inserted (comprehensive enhancement pipeline)
        window.fixSVGLayoutAndLabels = function fixSVGLayoutAndLabels(svgEl) {
            console.log('🔧 fixSVGLayoutAndLabels called - running full enhancement pipeline');

            if (window.fixSVGLayout) {
                window.fixSVGLayout(svgEl);         // your viewBox pad step
            }
            if (window.applyLabelLayout) {
                window.applyLabelLayout(svgEl);     // space labels (greedy)
            }
            bringTextToFront(svgEl);                // labels above graphics
            styleLabels(svgEl, { use: "shadow" });  // halo + subtle shadow
            shrinkEndpoints(svgEl, 5);              // smaller bulbs globally

            console.log('   ✅ Enhancement pipeline completed');
        };

        // Auto-fix all SVGs when a slide is loaded
        window.addEventListener("slideLoaded", () => {
            console.log("📄 slideLoaded event received");
            const svgs = document.querySelectorAll("#slide-content svg");
            console.log('   Found ' + svgs.length + ' SVG(s) in slide content');

            if (svgs.length > 0) {
                // Wait for libraries to be ready before processing SVGs
                if (!window.d3 || !window.fc) {
                    console.log("⏳ Libraries not ready, waiting...");
                    waitForLibraries(() => {
                        svgs.forEach((svg, index) => {
                            console.log('   Processing SVG ' + (index + 1) + '/' + svgs.length);
                            fixSVGLayoutAndLabels(svg);
                        });
                    });
                } else {
                    svgs.forEach((svg, index) => {
                        console.log('   Processing SVG ' + (index + 1) + '/' + svgs.length);
                        fixSVGLayoutAndLabels(svg);
                    });
                }
            }
        });
    </script>

    <script>
{{JSON_EMBED_JS}}

const slidesData = {{SLIDES_JSON}};

// Set up window.slideData for embedded mode compatibility
window.slideData = {};
slidesData.forEach((slide, index) => {
    window.slideData[index.toString()] = slide.content;
});

{{NAVIGATION_JS}}
    </script>
</body>
</html>
'''

## File 2: templates/bundle_index.html
BUNDLE_INDEX = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="slideshow-container">
        <div id="slide-content">
            <!-- Slides loaded by JavaScript -->
        </div>
    </div>

    <div class="navigation">
        <button class="nav-button" onclick="console.log('Previous button clicked!'); previousSlide()">◀ Previous</button>
        <button class="nav-button" onclick="nextSlide()">Next ▶</button>
    </div>

    <div class="slide-counter">
        <span id="current-slide">1</span> / <span id="total-slides">0</span>
    </div>

    <!-- Interactive demo modules (auto-generated) -->
{{JS_SCRIPT_TAGS}}
</body>
</html>
'''

## File 3: templates/navigation.js
NAVIGATION = '''let currentSlide = 0;

function showSlide(index) {
    if (index < 0 || index >= slidesData.length) return;

    console.log(`${'='.repeat(80)}`);
    console.log(`🎬 LOADING SLIDE ${index + 1}/${slidesData.length}: ${slidesData[index].title || `slide-${index}`}`);
    console.log(`   Title: ${slidesData[index].title || 'Untitled'}`);
    console.log(`${'='.repeat(80)}`);

    const slideContent = document.getElementById('slide-content');
    slideContent.innerHTML = slidesData[index].content;
    
    // Update counter
    document.getElementById('current-slide').textContent = index + 1;
    document.getElementById('total-slides').textContent = slidesData.length;
    
    // Update navigation buttons (allow wrap-around, so no disabling)
    const prevButton = document.querySelector('.nav-button');
    const nextButton = document.querySelector('.nav-button:last-child');
    
    // Add fade in animation
    slideContent.style.animation = 'none';
    slideContent.offsetHeight; // Trigger reflow
    slideContent.style.animation = 'fadeIn 0.5s';
    
    // Re-run any scripts in the slide
    const scripts = slideContent.querySelectorAll('script');
    scripts.forEach(script => {
        try {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            script.parentNode.replaceChild(newScript, script);
        } catch (error) {
            console.warn('Error re-executing script:', error);
            // Try alternative approach - evaluate script directly
            try {
                eval(script.textContent);
            } catch (evalError) {
                console.error('Failed to execute script:', evalError);
            }
        }
    });

    // Fire the slideLoaded event to trigger SVG enhancement pipeline
    window.dispatchEvent(new Event('slideLoaded'));

    // Initialize interactive demos if present
    // Check for hue drag wheel (slide 06)
    if (document.getElementById('dwSVG') && typeof initHueDragWheel === 'function') {
        console.log('🎨 Initializing hue drag wheel for slide', index + 1);
        initHueDragWheel();
    }

    // Check for vector calculator
    if (document.getElementById('vector-demo') && typeof initVectorCalculator === 'function') {
        console.log('📐 Initializing vector calculator for slide', index + 1);
        initVectorCalculator();
    }

    // Check for timeseries analyzer
    if (document.getElementById('timeseries-demo') && typeof initTimeseriesAnalyzer === 'function') {
        console.log('📈 Initializing timeseries analyzer for slide', index + 1);
        initTimeseriesAnalyzer();
    }

    // Check for interactive angle demo
    if (document.getElementById('angle1') && typeof initInteractiveDemo === 'function') {
        console.log('🎮 Initializing interactive angle demo for slide', index + 1);
        initInteractiveDemo();
    }

    // Check for GIS demo
    if (document.getElementById('map') && typeof initGISDemo === 'function') {
        console.log('🗺️ Initializing GIS demo for slide', index + 1);
        initGISDemo();
    }

    // Check for flight photo window demo
    if (document.getElementById('departure-time') && typeof initFlightPhotoWindow === 'function') {
        console.log('📸 Initializing flight photo window demo for slide', index + 1);
        initFlightPhotoWindow();
    }

    // Check for flight vs now timezone demo (more specific check)
    if (document.getElementById('syd-date') &&
        document.getElementById('utc-timeline') &&
        typeof initFlightVsNow === 'function') {
        console.log('🛩️ Initializing flight vs now timezone demo for slide', index + 1);
        initFlightVsNow();
    }

    currentSlide = index;
}

function nextSlide() {
    if (currentSlide < slidesData.length - 1) {
        currentSlide++;
        showSlide(currentSlide);
    } else {
        // Wrap to the first slide
        currentSlide = 0;
        showSlide(currentSlide);
    }
}

function previousSlide() {
    console.log('🔄 previousSlide() called - currentSlide:', currentSlide, 'totalSlides:', slidesData.length);

    if (currentSlide > 0) {
        currentSlide--;
        console.log('   Moving to previous slide:', currentSlide);
        showSlide(currentSlide);
    } else {
        // Wrap to the last slide
        currentSlide = slidesData.length - 1;
        console.log('   Wrapping to last slide:', currentSlide);
        showSlide(currentSlide);
    }
}

function goToSlide(index) {
    if (index >= 0 && index < slidesData.length) {
        currentSlide = index;
        showSlide(currentSlide);
    }
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        nextSlide();
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousSlide();
    } else if (event.key >= '1' && event.key <= '9') {
        const slideNum = parseInt(event.key) - 1;
        if (slideNum < slidesData.length) {
            goToSlide(slideNum);
        }
    } else if (event.key === 'Home') {
        goToSlide(0);
    } else if (event.key === 'End') {
        goToSlide(slidesData.length - 1);
    }
});

// Initialize on first load
document.addEventListener('DOMContentLoaded', function() {
    showSlide(0);
});
'''

## File 4: templates/json_embed.js (simplified - no Plotly data)
JSON_EMBED = '''// No embedded data needed for this presentation
console.log('Presentation loaded - no external data dependencies');
'''

## File 5: templates/bundle_presentation.js
BUNDLE_PRESENTATION = '''{{JSON_EMBED_JS}}

const slidesData = {{SLIDES_JSON}};

{{NAVIGATION_JS}}

// Update total slides on load
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('total-slides').textContent = slidesData.length;
    showSlide(0);
    
    console.log('Keyboard shortcuts:');
    console.log('→ or Space: Next slide');
    console.log('←: Previous slide');
    console.log('1-9: Jump to slide');
    console.log('Home: First slide');
    console.log('End: Last slide');
});
'''

