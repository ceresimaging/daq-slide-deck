// Time Series Analyzer Interactive Demo
// Visualizes circular statistics and derivatives for angle sequences

console.log('📈 TIME SERIES ANALYZER: JavaScript file loaded!');

// Global state for the time series analyzer
let timeSeriesState = {
    points: [],
    operationMode: 'average'
};

function initTimeSeriesAnalyzer() {
    console.log('📈 TIME SERIES ANALYZER: Function called!');
    console.log('📈 TIME SERIES ANALYZER: Initializing Time Series Analyzer...');
    
    // Check if PIXI is loaded
    if (typeof PIXI === 'undefined') {
        console.log('PIXI not loaded yet, retrying...');
        setTimeout(initTimeSeriesAnalyzer, 200);
        return;
    }
    
    const container = document.getElementById('timeseries-analyzer-container');
    if (!container) {
        console.log('Time series analyzer container not found');
        return;
    }
    
    // Clean up any existing app for this specific container
    window.interactiveApps ??= new Map();
    const key = container.id;
    const existingApp = window.interactiveApps.get(key);
    if (existingApp) {
        existingApp.destroy(true, { children: true, texture: true, baseTexture: true });
        window.interactiveApps.delete(key);
    }
    
    // Check if container is visible and has dimensions
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.log('Container not visible yet, retrying...');
        setTimeout(() => initTimeSeriesAnalyzer(), 100);
        return;
    }
    
    // Create PIXI application
    const app = new PIXI.Application({
        width: container.offsetWidth,
        height: container.offsetHeight,
        backgroundColor: 0x000000,
        antialias: true
    });
    
    container.appendChild(app.view);
    window.interactiveApps.set(key, app);
    
    // Create background layer for atan2 filter
    const backgroundLayer = new PIXI.Graphics();
    backgroundLayer.beginFill(0x000000);
    backgroundLayer.drawRect(0, 0, app.screen.width, app.screen.height);
    backgroundLayer.endFill();
    app.stage.addChild(backgroundLayer);
    
    // Enhanced atan2 filter for time series with mean alignment and confidence
    const atan2Filter = new PIXI.Filter(undefined, `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_basis;
        uniform float u_strength;
        uniform float u_step_deg;
        uniform float u_contour_alpha;
        
        vec3 hsl2rgb(float h, float s, float l) {
            float c = (1.0 - abs(2.0 * l - 1.0)) * s;
            float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
            float m = l - c / 2.0;
            
            vec3 rgb;
            if (h < 1.0/6.0) {
                rgb = vec3(c, x, 0.0);
            } else if (h < 2.0/6.0) {
                rgb = vec3(x, c, 0.0);
            } else if (h < 3.0/6.0) {
                rgb = vec3(0.0, c, x);
            } else if (h < 4.0/6.0) {
                rgb = vec3(0.0, x, c);
            } else if (h < 5.0/6.0) {
                rgb = vec3(x, 0.0, c);
            } else {
                rgb = vec3(c, 0.0, x);
            }
            
            return rgb + m;
        }
        
        void main() {
            vec2 centered_coord = gl_FragCoord.xy - u_resolution / 2.0;
            float raw_angle = atan(centered_coord.y, centered_coord.x);
            
            // Apply basis rotation - field aligns with circular mean
            float angle = raw_angle - u_basis;
            
            float hue = (angle + 3.14159265) / (2.0 * 3.14159265);
            float distance = length(centered_coord) / min(u_resolution.x, u_resolution.y) * 2.0;
            
            // Modulate lightness by strength (|R|) - bright when clustered, dim when spread
            float base_lightness = 0.2 + 0.3 * (1.0 - min(distance, 1.0));
            float lightness = base_lightness + 0.4 * u_strength;
            
            // Add contour lines for geometric structure
            float step_rad = u_step_deg * 3.14159265 / 180.0;
            float contour_dist = abs(mod(angle + 3.14159265, step_rad) - step_rad * 0.5);
            float contour_line = 1.0 - smoothstep(0.0, 0.02, contour_dist);
            
            vec3 base_color = hsl2rgb(hue, 0.6, lightness);
            vec3 contour_color = mix(base_color, vec3(1.0), contour_line * u_contour_alpha);
            
            gl_FragColor = vec4(contour_color, 1.0);
        }
    `, {
        u_resolution: [app.screen.width, app.screen.height],
        u_basis: 0.0,
        u_strength: 0.0,
        u_step_deg: 15.0,
        u_contour_alpha: 0.2
    });
    
    // Apply background filter only to background layer
    backgroundLayer.filterArea = app.screen;
    backgroundLayer.filters = [atan2Filter];
    
    // Create graphics objects on top of background
    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);
    
    // Make stage interactive (PIXI v7 API)
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.cursor = 'crosshair';
    
    console.log('📈 Interactive setup - eventMode:', app.stage.eventMode, 'hitArea:', app.stage.hitArea);
    console.log('📈 Stage interactive?', app.stage.interactive);
    console.log('📈 Stage children count:', app.stage.children.length);
    
    // Circular mean calculation
    function calculateCircularMean(angles) {
        if (angles.length === 0) return 0;
        
        let x = 0, y = 0;
        for (const angle of angles) {
            x += Math.cos(angle);
            y += Math.sin(angle);
        }
        return Math.atan2(y, x);
    }
    
    // Calculate finite differences (derivatives)
    function calculateDerivatives(angles) {
        if (angles.length < 2) return [];
        
        const derivatives = [];
        for (let i = 1; i < angles.length; i++) {
            let diff = angles[i] - angles[i-1];
            
            // Handle angle wraparound
            if (diff > Math.PI) diff -= 2 * Math.PI;
            if (diff < -Math.PI) diff += 2 * Math.PI;
            
            derivatives.push(diff);
        }
        return derivatives;
    }
    
    // Drawing function
    function draw() {
        graphics.clear();
        
        // Update field uniforms based on current data
        if (timeSeriesState.points.length > 0) {
            const angles = timeSeriesState.points.map(p => p.angle);
            
            if (timeSeriesState.operationMode === 'average') {
                // Calculate circular mean and strength
                const meanAngle = calculateCircularMean(angles);
                
                // Calculate |R| for confidence/strength
                let x = 0, y = 0;
                for (const angle of angles) {
                    x += Math.cos(angle);
                    y += Math.sin(angle);
                }
                const strength = Math.sqrt(x*x + y*y) / angles.length; // |R|
                
                // Align field with mean, brightness shows confidence
                atan2Filter.uniforms.u_basis = meanAngle;
                atan2Filter.uniforms.u_strength = strength;
            } else {
                // For derivatives mode, use global field
                atan2Filter.uniforms.u_basis = 0.0;
                atan2Filter.uniforms.u_strength = 0.5; // Neutral brightness
            }
        } else {
            // No points yet, neutral field
            atan2Filter.uniforms.u_basis = 0.0;
            atan2Filter.uniforms.u_strength = 0.0;
        }
        
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;
        const radius = Math.min(centerX, centerY) * 0.7;
        
        // Draw unit circle
        graphics.lineStyle(2, 0xFFFFFF, 0.3);
        graphics.drawCircle(centerX, centerY, radius);
        
        // Draw all clicked points
        timeSeriesState.points.forEach((point, index) => {
            const x = centerX + Math.cos(point.angle) * radius;
            const y = centerY + Math.sin(point.angle) * radius;
            
            // Draw point
            graphics.beginFill(0xFFFFFF, 0.8);
            graphics.drawCircle(x, y, 6);
            graphics.endFill();
            
            // Draw line from center
            graphics.lineStyle(2, 0xFFFFFF, 0.4);
            graphics.moveTo(centerX, centerY);
            graphics.lineTo(x, y);
            
            // Draw index number
            const text = new PIXI.Text(index.toString(), {
                fontSize: 12,
                fill: 0xFFFFFF
            });
            text.anchor.set(0.5);
            text.x = x + 15;
            text.y = y - 15;
            app.stage.addChild(text);
        });
        
        if (timeSeriesState.points.length === 0) return;
        
        const angles = timeSeriesState.points.map(p => p.angle);
        
        if (timeSeriesState.operationMode === 'average') {
            // Draw circular mean
            const meanAngle = calculateCircularMean(angles);
            const meanX = centerX + Math.cos(meanAngle) * radius;
            const meanY = centerY + Math.sin(meanAngle) * radius;
            
            graphics.lineStyle(8, 0xFFE66D);
            graphics.moveTo(centerX, centerY);
            graphics.lineTo(meanX, meanY);
            
            // Draw mean point
            graphics.beginFill(0xFFE66D);
            graphics.drawCircle(meanX, meanY, 12);
            graphics.endFill();
            
        } else if (timeSeriesState.operationMode === 'derivatives') {
            // Draw derivatives (finite differences)
            const derivatives = calculateDerivatives(angles);
            
            derivatives.forEach((derivative, index) => {
                const derivX = centerX + Math.cos(derivative) * radius * 0.6;
                const derivY = centerY + Math.sin(derivative) * radius * 0.6;
                
                // Use different colors for different derivatives
                const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 0xFF9FF3];
                const color = colors[index % colors.length];
                
                graphics.lineStyle(6, color);
                graphics.moveTo(centerX, centerY);
                graphics.lineTo(derivX, derivY);
                
                // Draw derivative point
                graphics.beginFill(color);
                graphics.drawCircle(derivX, derivY, 8);
                graphics.endFill();
            });
        }
    }
    
    // Event handlers
    console.log('📈 Setting up event handlers...');
    
    app.stage.on('pointerdown', (event) => {
        console.log('📈 POINTER DOWN detected:', event.data.global);
        const pos = event.data.global;
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;
        
        const angle = Math.atan2(pos.y - centerY, pos.x - centerX);
        
        console.log('📈 Adding point at angle:', angle);
        
        // Add new point
        timeSeriesState.points.push({ angle: angle });
        draw();
        
        console.log('📈 Total points now:', timeSeriesState.points.length);
    });
    
    app.stage.on('pointermove', (event) => {
        // Just a test to see if ANY events work
        console.log('📈 POINTER MOVE detected');
    });
    
    // Hook up dropdown
    const dropdown = document.getElementById('timeseries-operation');
    if (dropdown) {
        dropdown.addEventListener('change', (e) => {
            timeSeriesState.operationMode = e.target.value;
            draw();
        });
    }
    
    // Hook up clear button
    const clearButton = document.getElementById('clear-points');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            timeSeriesState.points = [];
            // Remove all text objects
            app.stage.children = app.stage.children.filter(child => !(child instanceof PIXI.Text));
            draw();
        });
    }
    
    // Add resize observer to handle container size changes
    if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
            if (container.offsetWidth > 0 && container.offsetHeight > 0) {
                app.renderer.resize(container.offsetWidth, container.offsetHeight);
                atan2Filter.uniforms.u_resolution = [app.screen.width, app.screen.height];
                backgroundLayer.filterArea = app.screen;
                app.stage.hitArea = app.screen;
                // Resize background layer
                backgroundLayer.clear();
                backgroundLayer.beginFill(0x000000);
                backgroundLayer.drawRect(0, 0, app.screen.width, app.screen.height);
                backgroundLayer.endFill();
                draw(); // This will update u_basis and u_strength again
            }
        });
        resizeObserver.observe(container);
    }
    
    // Initial draw
    draw();
    
    console.log('Time Series Analyzer initialized');
}