# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a mathematical presentation build system for creating interactive HTML presentations about circular quantities and wraparound bugs. The system generates two output formats: a single bundled HTML file for phone calls and a folder bundle with separate assets.

## Key Build Commands

```bash
# Main build command (builds both single file and bundle)
python build.py

# Alternative using shell script
./build.sh

# Build with custom config
python build.py config_stroke_pipeline.yaml
```

## Architecture

### Core Components

- **`presentation_builder.py`** - Main presentation builder class (`PresentationBuilder`)
- **`build.py`** - Entry point that instantiates the builder
- **`config.yaml`** - Presentation configuration (title, slides, build settings)
- **`index.html`** - Main HTML template
- **`presentation.js`** - Navigation and presentation logic
- **`styles.css`** - Dark theme styling

### Build Process

1. **Single File Build** (`build_single_file()`):
   - Embeds CSS and JavaScript directly into HTML
   - Processes slides from `slides/` directory according to `config.yaml` order
   - Creates JavaScript object with slide content as strings
   - Embeds JavaScript modules directly via `templates.py` 
   - Outputs to `dist/math_presentation_bundled.html`

2. **Bundle Folder Build** (`build_bundle_folder()`):
   - Copies files separately to `dist/math_presentation_bundle/`
   - Maintains original file structure
   - Includes interactive JavaScript modules from `js/` directory

### Slide Processing

- Slides are HTML files in `slides/` directory
- Order defined by `slides` array in `config.yaml`
- Content is embedded as escaped JavaScript strings in single file version
- Code blocks (`<pre><code>`) preserve formatting and newlines
- Script tags are preserved intact during processing

### Interactive Components

- **Vector Calculator** (`js/vector-calculator.js`) - For slide 16
- **Timeseries Analyzer** (`js/timeseries-analyzer.js`) - For slide 17
- Interactive demos embedded directly in slides (circular mean, atan2 visualizations)

## Dependencies

```bash
pip install PyYAML
```

## Configuration

Edit `config.yaml` to:
- Change presentation metadata (title, author, date)
- Reorder slides by modifying the `slides` array
- Adjust build settings (WebP quality, image dimensions, etc.)

## File Structure

```
presentation/
├── slides/              # HTML slide files (processed in config.yaml order)
├── js/                  # Interactive JavaScript modules
├── templates/           # Build templates
├── docs/               # Generated output (GitHub Pages)
├── config.yaml         # Main configuration
├── build.py           # Build entry point
└── presentation_builder.py  # Core build logic
```