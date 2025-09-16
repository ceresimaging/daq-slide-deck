![Ceres AI Logo](ceres-tech-logo.png)

# Mathematical Presentation Build System

🚀 **Create interactive HTML presentations with automatic asset optimization and dual output formats**

A powerful build system for creating mathematical and technical presentations that work perfectly both for live presentations and phone calls. Automatically processes assets, embeds images as base64, and generates both single-file and bundle formats.

## Features

✨ **Smart Asset Processing**
- Automatically discovers images referenced in HTML slides
- Converts all images to optimized WebP format (60-80% smaller files)
- Handles complex nested paths from anywhere in your project
- Embeds assets as base64 for single-file output
- Preserves original quality in bundle format

🎯 **Dual Output Formats**
- **Single File**: Everything embedded for easy sharing and phone calls
- **Bundle**: Full-quality assets with proper file structure for presentations

🔧 **Interactive Components**
- Built-in support for interactive demos and visualizations
- Automatic JavaScript module discovery and embedding
- Dark theme optimized for technical presentations

## Quick Start

```bash
# Install dependencies
pip install Pillow PyYAML

# Build your presentation
python build.py

# Or use the shell script
./build.sh
```

## Creating Your First Presentation

### 1. Set Up Your Project

Clone or copy this repository structure:
```bash
git clone <this-repo>
cd presentation_project
```

### 2. Create Your Slides

Create HTML files in the `slides/` directory. Each slide is a complete HTML snippet:

```html
<!-- slides/01-title.html -->
<div class="slide title-slide">
  <style>
    .title-slide { padding: 6vh 6vw; text-align: center; }
    .main-title {
      font-size: clamp(44px, 6.2vw, 88px);
      background: linear-gradient(180deg, #b8f5ff 0%, #29f5c8 60%);
      -webkit-background-clip: text; color: transparent;
    }
  </style>

  <h1 class="main-title">Your Presentation Title</h1>
  <p class="subtitle">Your subtitle here</p>

  <!-- Images work with any path -->
  <img src="../your-logo.png" alt="Logo" style="width: 200px;" />
</div>
```

```html
<!-- slides/02-introduction.html -->
<div class="slide">
  <h2>Problem Statement</h2>
  <ul>
    <li>First key point</li>
    <li>Second key point</li>
    <li>Visual example below</li>
  </ul>

  <!-- Reference images anywhere in your project -->
  <img src="../../results/analysis_chart.png" style="width: 100%; max-width: 600px;" />
</div>
```

### 3. Add Interactive Elements (Optional)

Create JavaScript modules in the `js/` directory for interactive demos:

```javascript
// js/my-interactive-demo.js
function initMyDemo() {
  console.log("Demo starting!");

  // Find elements in your slide
  const button = document.getElementById("demo-button");
  const output = document.getElementById("demo-output");

  if (button && output) {
    button.addEventListener("click", () => {
      output.textContent = "Demo activated!";
    });
  }
}

// The build system automatically calls this when slides load
```

Then reference it in your slide:
```html
<!-- slides/03-interactive.html -->
<div class="slide">
  <h2>Interactive Demo</h2>
  <button id="demo-button">Click Me</button>
  <div id="demo-output">Output will appear here</div>
</div>
```

### 4. Configure Your Presentation

Edit `config.yaml`:
```yaml
presentation:
  title: "Your Amazing Presentation"
  subtitle: "Solving real problems with code"
  author: "Your Name"
  date: "2025-09-16"
  venue: "Tech Conference"

slides:
  # List your slides in presentation order
  - "01-title.html"
  - "02-introduction.html"
  - "03-interactive.html"
  - "04-conclusion.html"

build:
  single_file: true         # Creates phone-friendly embedded file
  bundle_folder: true       # Creates full-quality bundle
  webp_quality: 90         # Image compression (higher = better quality)
  max_image_width: 1920    # Resize huge images
```

### 5. Build and Test

```bash
# Build everything
python build.py

# Output files created:
# docs/index.html                    - Single file (273KB)
# docs/presentation_bundle/          - Bundle folder
# docs/presentation_bundle.zip       - Zipped bundle
# docs/assets_manifest.json          - Build details
```

### 6. View Your Presentation

```bash
# Open single file directly
open docs/index.html

# Or serve the bundle locally
cd docs/presentation_bundle
python -m http.server 8000
# Visit http://localhost:8000
```

## Slide Structure and Styling

### Basic Slide Template

Every slide should follow this structure:
```html
<div class="slide">
  <style>
    /* Slide-specific CSS goes here */
    .custom-class { color: #4CAF50; }
  </style>

  <!-- Your content here -->
  <h2>Slide Title</h2>
  <p>Content goes here</p>
</div>
```

### Built-in CSS Classes

The system includes these pre-styled classes:
- `.slide` - Base slide container (required)
- `.title-slide` - Special styling for title slides
- Navigation buttons are automatically added
- Dark theme optimized for technical content

### Image Best Practices

```html
<!-- Absolute paths work -->
<img src="/home/user/project/data/chart.png" />

<!-- Relative paths work -->
<img src="../../analysis/results.jpg" />

<!-- Will be automatically converted to: -->
<!-- Bundle: <img src="assets/chart.webp" /> -->
<!-- Single: <img src="data:image/webp;base64,..." /> -->
```

### Responsive Sizing

Use CSS clamp() for responsive elements:
```css
.main-title {
  font-size: clamp(44px, 6.2vw, 88px); /* min, preferred, max */
}

.hero-image {
  width: clamp(300px, 50vw, 800px);
}
```

## Project Structure

```
your-presentation/
├── slides/                 # Your HTML slide files
│   ├── 01-title.html
│   ├── 02-introduction.html
│   └── ...
├── js/                     # Interactive JavaScript modules (optional)
│   ├── interactive-demo.js
│   └── visualization.js
├── config.yaml            # Presentation configuration
├── build.py               # Build script
├── simple_builder.py      # Core build logic
├── asset_manager.py       # Asset processing
├── index.html             # Main template
├── styles.css             # Styling
├── presentation.js        # Navigation logic
└── dist/                  # Generated output
    ├── math_presentation_bundled.html    # Single file
    ├── math_presentation_bundle/         # Bundle folder
    └── assets_manifest.json              # Build metadata
```

## Configuration

Edit `config.yaml` to customize your presentation:

```yaml
presentation:
  title: "Your Presentation Title"
  subtitle: "Optional subtitle"
  author: "Your Name"
  date: "2025-09-16"
  venue: "Conference Name"

slides:
  # List your slides in presentation order
  - "01-title.html"
  - "02-introduction.html"
  - "03-problem.html"
  - "04-solution.html"
  - "05-conclusion.html"

build:
  single_file: true         # Create embedded single file
  bundle_folder: true       # Create bundle with separate assets
  webp_quality: 90         # Image compression quality (0-100)
  max_image_width: 1920    # Resize large images
  compress_json: true      # Minify JSON files
```

## Creating Slides

Create HTML files in the `slides/` directory. The build system will automatically:

1. **Find image references** in your HTML:
   ```html
   <img src="../path/to/image.png">
   <img src="/absolute/path/image.jpg">
   ```

2. **Convert to optimized WebP**:
   - Maintains 90% quality by default
   - Typically 60-80% smaller than PNG/JPG
   - Universal browser support

3. **Update references automatically**:
   ```html
   <!-- Bundle mode -->
   <img src="assets/image.webp">

   <!-- Single file mode -->
   <img src="data:image/webp;base64,UklGRiQAAABXRUJQVlA4...">
   ```

## Interactive Components

Add JavaScript interactivity by creating files in the `js/` directory:

```javascript
// js/my-demo.js
function initMyDemo() {
    // Your interactive code here
    console.log('Demo initialized');
}

// Auto-discovered and embedded in both output formats
```

**How JavaScript Discovery Works:**
1. Build system automatically scans the `js/` directory
2. All `.js` files are included in both single-file and bundle outputs
3. For single-file mode, JavaScript is concatenated and embedded directly in the HTML
4. For bundle mode, JavaScript files are copied to the bundle
5. Functions are automatically available in your slides

**Naming Convention:**
- Use descriptive names like `interactive-demo.js`, `visualization-tool.js`
- Functions can be called directly from slide HTML
- No manual imports needed - everything is auto-included

## Asset Processing Example

```html
<!-- In slides/03-analysis.html -->
<img src="../../data/results/correlation_plot.png">
<a href="../metadata/analysis.json">View Data</a>

<!-- Build system automatically: -->
<!-- 1. Finds: /home/user/project/data/results/correlation_plot.png -->
<!-- 2. Converts: PNG → WebP (90% quality, ~70% smaller) -->
<!-- 3. Bundle: <img src="assets/results_correlation_plot.webp"> -->
<!-- 4. Single: <img src="data:image/webp;base64,..."> -->
<!-- 5. Copies: analysis.json → assets/metadata_analysis.json -->
```

## Output Formats

### Single File (`math_presentation_bundled.html`)
- **Perfect for**: Phone calls, email sharing, offline viewing
- **Size**: Typically 100-500KB depending on images
- **Features**: Everything embedded, works without internet
- **Use case**: Share with stakeholders who need quick access

### Bundle Folder (`math_presentation_bundle/`)
- **Perfect for**: Live presentations, full-quality viewing
- **Features**: Separate optimized assets, faster loading
- **Use case**: Conference presentations, detailed technical reviews

## Build Output

After running `python build.py`, you'll see:

```
🔨 Building presentation: Stop Fighting Wraparound: Embed Your Rings!
📁 Processing slides...
   📄 01-title.html
   📸 ceres-tech-logo.png → ceres-tech-logo.webp (67.2% smaller)
   📄 02-the-bug.html
   📄 03-midnight-bug.html
   ...
✅ Single file: dist/math_presentation_bundled.html (273KB)
✅ Bundle: dist/math_presentation_bundle/
📋 Asset manifest: dist/assets_manifest.json
```

## Asset Manifest

Track exactly what was processed in `assets_manifest.json`:

```json
{
  "build_info": {
    "title": "Stop Fighting Wraparound: Embed Your Rings!",
    "build_time": "2025-09-16T16:12:04.424259",
    "total_assets": 2,
    "webp_quality": 90
  },
  "assets": [
    {
      "local": "_presentation_project_ceres-tech-logo.webp",
      "original": "/home/geoff/projects/presentation_project/ceres-tech-logo.png",
      "type": "image",
      "used_in_slide": "01-title.html",
      "size_bytes": 94252,
      "size_human": "92.0KB"
    }
  ]
}
```

## Advanced Features

### Custom Build Settings

```yaml
build:
  webp_quality: 95        # Higher quality for critical images
  max_image_width: 2560   # Support high-DPI displays
  single_file: false      # Skip single file if not needed
```

### Interactive Demos

Create rich interactive content:

```html
<!-- In your slide -->
<div id="interactive-demo">
    <canvas id="visualization"></canvas>
    <div class="controls">
        <button onclick="updateVisualization()">Update</button>
    </div>
</div>

<script>
function updateVisualization() {
    // Your interactive code
}
</script>
```

### Multiple Presentations

Use different config files for different presentations:

```bash
python build.py config_technical.yaml    # Technical deep-dive
python build.py config_executive.yaml    # Executive summary
```

## Deployment

### GitHub Pages
1. Copy output to `docs/` folder
2. Enable GitHub Pages in repository settings
3. Single file works perfectly for direct links

### Local Serving
```bash
cd dist/math_presentation_bundle
python -m http.server 8000
# Visit http://localhost:8000
```

## Why This Tool?

✅ **No manual asset management** - just reference images anywhere
✅ **Automatic optimization** - WebP conversion with perfect quality
✅ **Phone-call ready** - single file with everything embedded
✅ **Professional quality** - optimized for technical presentations
✅ **Version controlled** - everything is code, trackable in git
✅ **Reusable** - perfect template for future presentations

## Dependencies

```bash
pip install Pillow PyYAML
```

## Troubleshooting

**Images not showing?**
- Check file paths in your HTML are correct
- Verify images exist at the referenced locations
- Check the asset manifest for processing details

**Build failing?**
- Ensure all slide files listed in config.yaml exist
- Verify Python dependencies are installed
- Check for syntax errors in slide HTML

**Single file too large?**
- Reduce `webp_quality` in config.yaml
- Decrease `max_image_width` to resize large images
- Consider removing some images from slides

## License

Open source - feel free to adapt for your presentations!

---

*Created with Ceres AI - Making technical presentations that actually work* 🚀