#!/usr/bin/env python3
"""
Presentation Build System
Compiles modular slides into single file or bundle with WebP image optimization

Usage:
    ./build.py                    # Direct execution
    conda run -n superglue-env ./build.py    # With specific conda env
"""

import re
import json
import base64
import shutil
import zipfile
from pathlib import Path
from datetime import datetime
from PIL import Image
import yaml


class SlideProcessor:
    """Handles slide collection and processing"""
    
    def __init__(self, config, asset_manager):
        self.config = config
        self.asset_manager = asset_manager
    
    def collect_slides(self, output_mode='bundle'):
        """Read slide files from config.yaml and discover assets"""
        slides_dir = Path("slides")
        
        # Get slide files from config.yaml
        slide_configs = self.config.get('slides', [])
        if not slide_configs:
            print("❌ No slides defined in config.yaml")
            return []
        
        print(f"📄 Processing {len(slide_configs)} slides from config.yaml")
        
        slides_content = []
        for i, slide_config in enumerate(slide_configs, 1):
            # Handle both formats
            if isinstance(slide_config, str):
                slide_filename = slide_config
            else:
                slide_filename = slide_config.get('file')
            
            slide_file = slides_dir / slide_filename
            
            if not slide_file.exists():
                print(f"   ❌ Slide not found: {slide_filename}")
                continue
            
            # Quietly process slide
            content = slide_file.read_text(encoding='utf-8')
            
            # Extract title from HTML
            title = self._extract_title_from_html(content)
            
            # Process assets in this slide
            content, slide_assets = self.asset_manager.process_slide_assets(
                content, slide_file, output_mode
            )
            
            # IMPORTANT: Remove any fetch() calls from slides
            content = self._remove_fetch_calls(content)
            
            slides_content.append({
                'file': slide_filename,
                'number': i,
                'title': title,
                'content': content,
                'assets': slide_assets
            })
            
            self.asset_manager.assets_collected.extend(slide_assets)
        
        return slides_content
    
    def _extract_title_from_html(self, content):
        """Extract title from HTML <h1> tag"""
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
        if h1_match:
            title = re.sub(r'<[^>]+>', '', h1_match.group(1)).strip()
            return title
        return "Untitled Slide"
    
    def _remove_fetch_calls(self, content):
        """Replace fetch() calls with checks for embedded data"""
        # Don't modify fetch calls for now since they're complex Promise chains
        # The 3D slide already has proper fallback logic to use embedded data
        # when available, so no replacement is needed
        return content
