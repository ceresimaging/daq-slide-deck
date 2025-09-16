#!/usr/bin/env python3
"""
Presentation Build System
Compiles modular slides into single file or bundle with WebP image optimization

Usage:
    ./build.py                    # Direct execution
    conda run -n superglue-env ./build.py    # With specific conda env
"""

# Debug control - set to True to save debug files (presentation_no_plotly.html, etc.)
# Useful for development and troubleshooting. Set to False for production builds.
SAVE_DEBUG = False

import json
import re
import shutil
import zipfile
from pathlib import Path
from datetime import datetime
import yaml
from asset_manager import AssetManager
from slide_processor import SlideProcessor
from json_embedder import JSONDataEmbedder
from templates import SINGLE_FILE, BUNDLE_INDEX, NAVIGATION, BUNDLE_PRESENTATION


# JS_MODULES will be auto-discovered from js/ directory 

class PresentationBuilder:
    """Main builder orchestrating the presentation build process"""

    def __init__(self, config_path="config.yaml"):
        self.config = self._load_config(config_path)
        self.build_dir = Path("docs")
        self.asset_manager = AssetManager(self.config, self.build_dir)
        self.slide_processor = SlideProcessor(self.config, self.asset_manager)
        self.json_embedder = JSONDataEmbedder()
    
    def _load_config(self, config_path):
        """Load build configuration"""
        if Path(config_path).exists():
            with open(config_path) as f:
                return yaml.safe_load(f)
        else:
            return {
                'presentation': {
                    'title': 'LWIR Project Presentation',
                    'author': 'Geoff',
                    'date': datetime.now().strftime('%Y-%m-%d')
                },
                'build': {
                    'single_file': True,
                    'bundle_folder': True,
                    'webp_quality': 90,
                    'max_image_width': 1920,
                    'compress_json': True
                }
            }
    
    def build_all(self):
        """Main build function - creates both single file and bundle"""
        # Clean and create build directory
        if self.build_dir.exists():
            shutil.rmtree(self.build_dir)
        self.build_dir.mkdir()

        # Copy static assets to docs root for GitHub Pages
        self._copy_static_assets()

        # Build outputs
        if self.config['build']['single_file']:
            self.build_single_file()

        if self.config['build']['bundle_folder']:
            self.build_bundle()

        # Create manifest
        self._create_manifest()

        print(f"✅ Build complete! Output in {self.build_dir}")
        self._print_build_summary()

    def _get_js_modules(self):
        """Auto-discover JavaScript modules in the js/ directory"""
        js_dir = Path("js")
        if not js_dir.exists():
            return []

        # Find all .js files in the js directory
        js_files = list(js_dir.glob("*.js"))
        js_modules = [f.name for f in js_files]

        # Sort for consistent ordering
        js_modules.sort()

        return js_modules

    def _copy_static_assets(self):
        """Copy static assets to docs root for GitHub Pages"""
        static_assets = [
            "ceres-tech-logo.png",
            # Add other static files here as needed
        ]

        copied_count = 0
        for asset in static_assets:
            asset_path = Path(asset)
            if asset_path.exists():
                shutil.copy2(asset_path, self.build_dir / asset_path.name)
                copied_count += 1
                print(f"   📋 Copied {asset} to docs root for GitHub Pages")

        if copied_count > 0:
            print(f"   ✅ Copied {copied_count} static assets for GitHub Pages")

    def _create_unified_js(self):
        """Reads and combines all interactive JavaScript modules."""
        unified_js = ""
        js_embedded_count = 0
        js_modules = self._get_js_modules()
        for module in js_modules:
            module_path = Path("js") / module
            if module_path.exists():
                module_js = module_path.read_text(encoding='utf-8')
                # Escape </script> tags to avoid breaking the parent script block
                module_js_escaped = module_js.replace('</', '<\\/')
                unified_js += module_js_escaped + "\n\n"
                js_embedded_count += 1

        if js_embedded_count > 0:
            print(f"   📦 Combined {js_embedded_count} interactive modules for unified loading")

        return unified_js

    def build_single_file(self):
        """Build single HTML file with everything embedded"""
        # Collect slides for single file mode
        slides_content = self.slide_processor.collect_slides(output_mode='single')

        # Save intermediate JSON for debugging
        json_debug_path = self.build_dir / "slides_debug.json"
        with open(json_debug_path, 'w', encoding='utf-8') as f:
            json.dump(slides_content, f, indent=2, ensure_ascii=False)
        print(f"   📄 Debug: Saved slides data to {json_debug_path}")

        # Create the unified JavaScript from all modules
        unified_js = self._create_unified_js()

        # Create HTML with embedded everything
        html_content = self._create_single_file_html(slides_content, unified_js)

        # Process images as base64 for single file
        for slide in slides_content:
            for asset in slide['assets']:
                if asset['type'] == 'image':
                    # Process the image to WebP in temp location
                    original_path = Path(asset['original'])
                    temp_dir = self.build_dir / "temp"
                    temp_dir.mkdir(exist_ok=True)

                    local_name = self.asset_manager._generate_asset_name(original_path, 'image')
                    temp_path = temp_dir / local_name

                    # Process the image
                    self.asset_manager._process_asset(original_path, local_name, 'image', 'bundle')
                    asset['processed'] = str(self.build_dir / "presentation_bundle" / "assets" / local_name)

        # Embed assets as base64
        html_content = self.asset_manager.embed_as_base64(html_content, self.asset_manager.assets_collected)

        # Write single file
        single_file_path = self.build_dir / "index.html"
        single_file_path.write_text(html_content, encoding='utf-8')

        file_size = single_file_path.stat().st_size / (1024*1024)
        print(f"   📄 Single file: {file_size:.1f}MB")

        # Clean up temp directory
        temp_dir = self.build_dir / "temp"
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
    
    def build_bundle(self):
        """Build bundle folder with separate assets"""
        bundle_dir = self.build_dir / "presentation_bundle"
        bundle_dir.mkdir(exist_ok=True)

        # Collect slides for bundle mode
        slides_content = self.slide_processor.collect_slides(output_mode='bundle')

        # Create directory structure
        (bundle_dir / "css").mkdir(exist_ok=True)
        (bundle_dir / "js").mkdir(exist_ok=True)
        (bundle_dir / "assets").mkdir(exist_ok=True)

        # Copy CSS
        if Path("styles.css").exists():
            shutil.copy2("styles.css", bundle_dir / "css" / "styles.css")

        # Copy interactive JavaScript modules
        js_count = 0
        js_modules = self._get_js_modules()
        for module in js_modules:
            module_path = Path("js") / module
            if module_path.exists():
                print(f"   📄 Copying {module_path} to {bundle_dir / 'js' / module}")
                shutil.copy2(module_path, bundle_dir / "js" / module)
                js_count += 1
            else:
                print(f"   ⚠️ Module {module_path} not found")

        if js_count > 0:
            print(f"   🎮 Copied {js_count} interactive modules")

        # Create presentation.js with embedded slide data
        presentation_js = self._create_bundle_javascript(slides_content)
        (bundle_dir / "js" / "presentation.js").write_text(presentation_js, encoding='utf-8')

        # Create index.html
        index_html = self._create_bundle_html()
        (bundle_dir / "index.html").write_text(index_html, encoding='utf-8')

        # Create ZIP
        zip_path = self.build_dir / "presentation_bundle.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file in bundle_dir.rglob('*'):
                if file.is_file():
                    zf.write(file, file.relative_to(bundle_dir))

        zip_size = zip_path.stat().st_size / (1024*1024)
        print(f"   📁 Bundle: {zip_size:.1f}MB")
    
    def _create_single_file_html(self, slides_content, unified_js):
        """Create complete single-file HTML"""
        css_content = Path("styles.css").read_text() if Path("styles.css").exists() else ""

        # Get embedded JSON data
        json_embed_js = self.json_embedder.load_and_embed_json_data()

        # Create slides JavaScript data
        slides_js_data = []
        for slide in slides_content:
            content_to_process = slide['content']

            # --- START OF COMPREHENSIVE FIX ---
            # 1. Escape any potential script-breaking tags first
            processed_content = content_to_process.replace('</script>', '<\\/script>')

            # 2. Split content to safely process HTML without breaking code or scripts
            parts = re.split(r'(<pre><code[^>]*>.*?</code></pre>|<script[^>]*>.*?</script>)', processed_content, flags=re.DOTALL)

            final_parts = []
            for part in parts:
                is_code = re.match(r'<pre><code[^>]*>.*?</code></pre>', part, re.DOTALL)
                is_script = re.match(r'<script[^>]*>.*?</script>', part, re.DOTALL)

                if is_code or is_script:
                    # For code and script blocks, preserve them as is.
                    # json.dumps will handle escaping newlines and quotes inside them correctly.
                    final_parts.append(part)
                else:
                    # This is regular HTML content.
                    # a. Replace double quotes with single quotes to simplify things.
                    part = part.replace('"', "'")
                    # b. Replace newline characters with spaces to prevent JS syntax errors.
                    part = part.replace('\n', ' ').replace('\r', '')
                    # c. Collapse multiple spaces into one for cleanliness
                    part = re.sub(r'\s+', ' ', part)
                    final_parts.append(part)

            # 3. Join the processed parts back together
            final_content = ''.join(final_parts)
            # --- END OF COMPREHENSIVE FIX ---

            slides_js_data.append({
                'content': final_content,  # Use the fully processed content
                'title': slide['title']
            })

        slides_json = json.dumps(slides_js_data, ensure_ascii=False, separators=(',', ':'))

        # Get the main navigation logic
        nav_js = self._create_navigation_javascript()

        # Combine interactive modules with navigation
        # This ensures functions like initVectorCalculator() are defined before nav_js might call them
        combined_js = unified_js + nav_js

        # DEBUG: Save intermediate versions
        debug_html = SINGLE_FILE.replace('{{TITLE}}', self.config['presentation']['title']) \
                                .replace('{{CSS_CONTENT}}', css_content) \
                                .replace('{{TOTAL_SLIDES}}', str(len(slides_content))) \
                                .replace('{{JSON_EMBED_JS}}', json_embed_js) \
                                .replace('{{SLIDES_JSON}}', slides_json) \
                                .replace('{{NAVIGATION_JS}}', nav_js)

        # Save debug versions (if enabled)
        if SAVE_DEBUG:
            debug_dir = self.build_dir / "debug"
            debug_dir.mkdir(exist_ok=True)

            (debug_dir / "presentation_debug.html").write_text(debug_html, encoding='utf-8')
            (debug_dir / "json_embed.js").write_text(json_embed_js, encoding='utf-8')
            (debug_dir / "navigation.js").write_text(nav_js, encoding='utf-8')
            (debug_dir / "slides_data.json").write_text(slides_json, encoding='utf-8')
            (debug_dir / "combined.js").write_text(combined_js, encoding='utf-8')

            print(f"   🐛 Debug files saved to {debug_dir}")

        return SINGLE_FILE.replace('{{TITLE}}', self.config['presentation']['title']) \
                        .replace('{{CSS_CONTENT}}', css_content) \
                        .replace('{{TOTAL_SLIDES}}', str(len(slides_content))) \
                        .replace('{{JSON_EMBED_JS}}', json_embed_js) \
                        .replace('{{SLIDES_JSON}}', slides_json) \
                        .replace('{{NAVIGATION_JS}}', combined_js)
    
    def _create_bundle_html(self):
        """Create index.html for bundle"""
        # Generate script tags for all JS modules
        js_modules = self._get_js_modules()
        script_tags = []
        for module in js_modules:
            script_tags.append(f'    <script src="js/{module}"></script>')
        script_tags.append('    <script src="js/presentation.js"></script>')

        js_script_tags = '\n'.join(script_tags)

        return BUNDLE_INDEX.replace('{{TITLE}}', self.config['presentation']['title']) \
                          .replace('{{JS_SCRIPT_TAGS}}', js_script_tags)
    
    def _create_bundle_javascript(self, slides_content):
        """Create presentation.js for bundle with embedded slides"""
        # Get embedded JSON data
        json_embed_js = self.json_embedder.load_and_embed_json_data()
        
        # Create slides JavaScript data
        slides_js_data = []
        for slide in slides_content:
            slides_js_data.append({
                'content': slide['content'],
                'title': slide['title']
            })
        
        slides_json = json.dumps(slides_js_data, ensure_ascii=False, separators=(',', ':'))
        
        # Create navigation JavaScript
        nav_js = self._create_navigation_javascript()
        
        return BUNDLE_PRESENTATION.replace('{{JSON_EMBED_JS}}', json_embed_js) \
                                 .replace('{{SLIDES_JSON}}', slides_json) \
                                 .replace('{{NAVIGATION_JS}}', nav_js)
    
    def _create_navigation_javascript(self):
        """Create reusable navigation JavaScript"""
        # Always use the template to ensure YAML ordering is respected
        # The old presentation.js file has hardcoded slide ordering that conflicts with YAML
        return NAVIGATION
    
    def _create_manifest(self):
        """Create asset manifest"""
        manifest = {
            'build_info': {
                'title': self.config['presentation']['title'],
                'build_time': datetime.now().isoformat(),
                'total_assets': len(self.asset_manager.assets_collected),
                'webp_quality': self.config['build']['webp_quality']
            },
            'assets': []
        }
        
        for asset in self.asset_manager.assets_collected:
            asset_info = {
                'local': asset['local'],
                'original': asset['original'],
                'type': asset['type'],
                'used_in_slide': asset['slide']
            }
            
            if asset.get('processed') and Path(asset['processed']).exists():
                size = Path(asset['processed']).stat().st_size
                asset_info['size_bytes'] = size
                asset_info['size_human'] = self._human_size(size)
            
            manifest['assets'].append(asset_info)
        
        manifest_path = self.build_dir / "assets_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"📋 Created manifest: {manifest_path}")
    
    def _human_size(self, size_bytes):
        """Convert bytes to human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024:
                return f"{size_bytes:.1f}{unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f}TB"
    
    def _print_build_summary(self):
        """Print build summary"""
        total_assets = len(self.asset_manager.assets_collected)
        image_assets = len([a for a in self.asset_manager.assets_collected if a['type'] == 'image'])
        
        print("\n📊 Build Summary:")
        print(f"   📄 Slides processed: {len(list(Path('slides').glob('*.html')))}")
        print(f"   🖼️  Images converted to WebP: {image_assets}")
        print(f"   📁 Total assets: {total_assets}")
        print(f"   🎯 WebP quality: {self.config['build']['webp_quality']}%")
        
        if self.build_dir.exists():
            files = list(self.build_dir.rglob('*'))
            total_size = sum(f.stat().st_size for f in files if f.is_file())
            print(f"   💾 Total output size: {self._human_size(total_size)}")

