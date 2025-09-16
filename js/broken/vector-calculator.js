// Vector Calculator Interactive Demo
// Visualizes vector addition and subtraction using angle representation

console.log('🧮 VECTOR CALCULATOR: JavaScript file loaded!');

// GLSL Fragment Shader for atan2 background visualization
const atan2FragmentShader = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_basis;
uniform float u_step_deg;
uniform float u_contour_alpha;

// Convert HSL to RGB
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
    
    // Apply basis rotation - this makes the field rotate with operations
    float angle = raw_angle - u_basis;
    
    // Map angle from [-PI, PI] to [0, 1] for hue
    float hue = (angle + 3.14159265) / (2.0 * 3.14159265);
    
    // Create radial gradient for better visualization
    float distance = length(centered_coord) / min(u_resolution.x, u_resolution.y) * 2.0;
    float lightness = 0.3 + 0.4 * (1.0 - min(distance, 1.0));
    
    // Add contour lines (isogons) for better geometric understanding
    float step_rad = u_step_deg * 3.14159265 / 180.0;
    float contour_dist = abs(mod(angle + 3.14159265, step_rad) - step_rad * 0.5);
    float contour_line = 1.0 - smoothstep(0.0, 0.02, contour_dist);
    
    vec3 base_color = hsl2rgb(hue, 0.8, lightness);
    vec3 contour_color = mix(base_color, vec3(1.0), contour_line * u_contour_alpha);
    
    gl_FragColor = vec4(contour_color, 1.0);
}
`;

// Global state for the vector calculator
let vectorCalculatorState = {
    p1_angle: 0.0,
    p2_angle: Math.PI / 4,
    operationMode: 'addition'
};

function initVectorCalculator() {
    console.log('🧮 VECTOR CALCULATOR: Function called!');
    console.log('🧮 VECTOR CALCULATOR: Initializing Vector Calculator...');
    console.log('🧮 VECTOR CALCULATOR: Current state:', vectorCalculatorState);
    
    // Check if PIXI is loaded
    if (typeof PIXI === 'undefined') {
        console.log('PIXI not loaded yet, retrying...');
        setTimeout(initVectorCalculator, 200);
        return;
    }
    
    const container = document.getElementById('vector-calculator-container');
    if (!container) {
        console.log('Vector calculator container not found');
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
        setTimeout(() => initVectorCalculator(), 100);
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
    
    // Create custom filter for atan2 background
    const atan2Filter = new PIXI.Filter(undefined, atan2FragmentShader, {
        u_resolution: [app.screen.width, app.screen.height],
        u_basis: 0.0,
        u_step_deg: 15.0,
        u_contour_alpha: 0.3
    });
    
    // Apply background filter only to background layer
    backgroundLayer.filterArea = app.screen;
    backgroundLayer.filters = [atan2Filter];
    
    // Create graphics objects on top of background
    const graphics = new PIXI.Graphics();
    app.stage.addChild(graphics);
    
    // Interactive state
    let isDragging = false;
    let dragTarget = null;
    
    // Make stage interactive (PIXI v7 API)
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.cursor = 'crosshair';
    
    console.log('🧮 Interactive setup - eventMode:', app.stage.eventMode, 'hitArea:', app.stage.hitArea);
    
    // Drawing function
    function draw() {
        graphics.clear();
        
        // Remove old text objects
        app.stage.children = app.stage.children.filter(child => !(child instanceof PIXI.Text));
        
        // Update the field basis to show the operation in action
        // In addition mode: field rotates by p2_angle showing θ ↦ θ + p2
        // In subtraction mode: field rotates by p2_angle showing θ ↦ θ - p2
        atan2Filter.uniforms.u_basis = vectorCalculatorState.p2_angle;
        
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;
        const radius = Math.min(centerX, centerY) * 0.7;
        
        // Draw unit circle with high contrast
        graphics.lineStyle(4, 0xFFFFFF, 1.0);
        graphics.drawCircle(centerX, centerY, radius);
        
        // Calculate positions
        const p1x = centerX + Math.cos(vectorCalculatorState.p1_angle) * radius;
        const p1y = centerY + Math.sin(vectorCalculatorState.p1_angle) * radius;
        const p2x = centerX + Math.cos(vectorCalculatorState.p2_angle) * radius;
        const p2y = centerY + Math.sin(vectorCalculatorState.p2_angle) * radius;
        
        // Draw vectors with high contrast outlines for visibility against atan2 background
        // Vector 1 (red) with white outline
        graphics.lineStyle(10, 0xFFFFFF, 1.0);
        graphics.moveTo(centerX, centerY);
        graphics.lineTo(p1x, p1y);
        graphics.lineStyle(6, 0xFF3333, 1.0);
        graphics.moveTo(centerX, centerY);
        graphics.lineTo(p1x, p1y);
        
        // Vector 2 (cyan) with white outline  
        graphics.lineStyle(10, 0xFFFFFF, 1.0);
        graphics.moveTo(centerX, centerY);
        graphics.lineTo(p2x, p2y);
        graphics.lineStyle(6, 0x33CCCC, 1.0);
        graphics.moveTo(centerX, centerY);
        graphics.lineTo(p2x, p2y);
        
        // Draw result based on operation mode with high contrast
        if (vectorCalculatorState.operationMode === 'addition') {
            const resultAngle = vectorCalculatorState.p1_angle + vectorCalculatorState.p2_angle;
            const resultX = centerX + Math.cos(resultAngle) * radius;
            const resultY = centerY + Math.sin(resultAngle) * radius;
            
            // Result vector with white outline
            graphics.lineStyle(10, 0xFFFFFF, 1.0);
            graphics.moveTo(centerX, centerY);
            graphics.lineTo(resultX, resultY);
            graphics.lineStyle(6, 0xFFDD00, 1.0);
            graphics.moveTo(centerX, centerY);
            graphics.lineTo(resultX, resultY);
        } else {
            // Subtraction - show angle between vectors
            const angleDiff = vectorCalculatorState.p1_angle - vectorCalculatorState.p2_angle;
            const resultX = centerX + Math.cos(angleDiff) * radius;
            const resultY = centerY + Math.sin(angleDiff) * radius;
            
            // Difference vector with white outline
            graphics.lineStyle(10, 0xFFFFFF, 1.0);
            graphics.moveTo(centerX, centerY);
            graphics.lineTo(resultX, resultY);
            graphics.lineStyle(6, 0xFF6600, 1.0);
            graphics.moveTo(centerX, centerY);
            graphics.lineTo(resultX, resultY);
        }
        
        // Draw draggable handles with thick white outlines for high visibility
        graphics.lineStyle(5, 0xFFFFFF, 1.0);
        graphics.beginFill(0xFF3333, 1.0);
        graphics.drawCircle(p1x, p1y, 18);
        graphics.endFill();
        
        graphics.lineStyle(5, 0xFFFFFF, 1.0);
        graphics.beginFill(0x33CCCC, 1.0);
        graphics.drawCircle(p2x, p2y, 18);
        graphics.endFill();
        
        // Add angle value labels to show atan2 values
        const p1AngleDeg = (vectorCalculatorState.p1_angle * 180 / Math.PI).toFixed(1);
        const p2AngleDeg = (vectorCalculatorState.p2_angle * 180 / Math.PI).toFixed(1);
        
        // Create text objects for angle values
        const p1Text = new PIXI.Text(`${p1AngleDeg}°`, {
            fontSize: 16,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 3
        });
        p1Text.anchor.set(0.5);
        p1Text.x = p1x + 25;
        p1Text.y = p1y - 25;
        app.stage.addChild(p1Text);
        
        const p2Text = new PIXI.Text(`${p2AngleDeg}°`, {
            fontSize: 16,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 3
        });
        p2Text.anchor.set(0.5);
        p2Text.x = p2x + 25;
        p2Text.y = p2y - 25;
        app.stage.addChild(p2Text);
        
        // Show result angle
        if (vectorCalculatorState.operationMode === 'addition') {
            const resultAngle = vectorCalculatorState.p1_angle + vectorCalculatorState.p2_angle;
            const resultAngleDeg = (resultAngle * 180 / Math.PI).toFixed(1);
            const resultText = new PIXI.Text(`Result: ${resultAngleDeg}°`, {
                fontSize: 18,
                fill: 0xFFDD00,
                fontWeight: 'bold',
                stroke: 0x000000,
                strokeThickness: 3
            });
            resultText.anchor.set(0.5);
            resultText.x = centerX;
            resultText.y = centerY - radius - 40;
            app.stage.addChild(resultText);
        }
    }
    
    // Event handlers
    app.stage.on('pointerdown', (event) => {
        console.log('🧮 POINTER DOWN detected:', event.data.global);
        const pos = event.data.global;
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;
        const radius = Math.min(centerX, centerY) * 0.7;
        
        const p1x = centerX + Math.cos(vectorCalculatorState.p1_angle) * radius;
        const p1y = centerY + Math.sin(vectorCalculatorState.p1_angle) * radius;
        const p2x = centerX + Math.cos(vectorCalculatorState.p2_angle) * radius;
        const p2y = centerY + Math.sin(vectorCalculatorState.p2_angle) * radius;
        
        console.log('🧮 Handle positions - P1:', {x: p1x, y: p1y}, 'P2:', {x: p2x, y: p2y});
        
        // Check if clicking on handles (larger hit area for easier interaction)
        const dist1 = Math.sqrt((pos.x - p1x) ** 2 + (pos.y - p1y) ** 2);
        const dist2 = Math.sqrt((pos.x - p2x) ** 2 + (pos.y - p2y) ** 2);
        
        console.log('🧮 Distances - P1:', dist1, 'P2:', dist2);
        
        if (dist1 < 30) {
            isDragging = true;
            dragTarget = 'p1';
            console.log('🧮 Dragging red handle');
        } else if (dist2 < 30) {
            isDragging = true;
            dragTarget = 'p2';
            console.log('🧮 Dragging blue handle');
        } else {
            console.log('🧮 Click outside handles');
        }
    });
    
    app.stage.on('pointermove', (event) => {
        if (!isDragging) return;
        
        const pos = event.data.global;
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;
        
        const angle = Math.atan2(pos.y - centerY, pos.x - centerX);
        
        if (dragTarget === 'p1') {
            vectorCalculatorState.p1_angle = angle;
        } else if (dragTarget === 'p2') {
            vectorCalculatorState.p2_angle = angle;
        }
        
        draw();
    });
    
    app.stage.on('pointerup', () => {
        isDragging = false;
        dragTarget = null;
    });
    
    app.stage.on('pointerupoutside', () => {
        isDragging = false;
        dragTarget = null;
    });
    
    // Hook up dropdown
    const dropdown = document.getElementById('vector-operation');
    if (dropdown) {
        dropdown.addEventListener('change', (e) => {
            vectorCalculatorState.operationMode = e.target.value;
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
                draw(); // This will update u_basis again
            }
        });
        resizeObserver.observe(container);
    }
    
    // Initial draw
    draw();
    
    console.log('Vector Calculator initialized');
}