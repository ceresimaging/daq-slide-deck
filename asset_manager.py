#!/usr/bin/env python3

import re
import json
import base64
import shutil
import zipfile
from pathlib import Path
from datetime import datetime
from PIL import Image
import yaml


class AssetManager:
    """Handles asset discovery, processing, and embedding"""
    
    def __init__(self, config, build_dir):
        self.config = config
        self.build_dir = build_dir
        self.assets_collected = []
    
    def process_slide_assets(self, slide_content, slide_file, output_mode='bundle'):
        """Find and process all assets referenced in a slide"""
        slide_assets = []
        
        # Patterns to find asset references
        patterns = [
            (r'src=["\']([^"\']+\.(png|jpg|jpeg|gif|webp|tiff?))["\']', 'image'),
            (r'url\(["\']?([^"\')\s]+\.(png|jpg|jpeg|gif|webp|tiff?))["\']?\)', 'image'),
            (r'href=["\']([^"\']+\.(json|csv|txt|md|html))["\']', 'data')
        ]
        
        for pattern, asset_type in patterns:
            for match in re.finditer(pattern, slide_content, re.IGNORECASE):
                original_path_str = match.group(1)
                
                # Resolve relative path from slide location
                if original_path_str.startswith('/'):
                    original_path = Path(original_path_str)
                else:
                    original_path = (slide_file.parent / original_path_str).resolve()
                
                if original_path.exists():
                    # Process the asset
                    local_name = self._generate_asset_name(original_path, asset_type)
                    processed_path = self._process_asset(original_path, local_name, asset_type, output_mode)
                    
                    # Track asset info
                    asset_info = {
                        'original': str(original_path),
                        'local': local_name,
                        'processed': str(processed_path) if processed_path else None,
                        'type': asset_type,
                        'slide': slide_file.name,
                        'original_match': match.group(0)
                    }
                    slide_assets.append(asset_info)
                    
                    # Update slide content to reference local asset (for bundle mode)
                    if output_mode == 'bundle' and processed_path:
                        if asset_type == 'image' and processed_path.suffix.lower() == '.webp':
                            new_ref = f'assets/{processed_path.name}'
                        else:
                            new_ref = f'assets/{local_name}'
                        slide_content = slide_content.replace(
                            match.group(0),
                            match.group(0).replace(original_path_str, new_ref)
                        )
                else:
                    print(f"   ⚠️  Asset not found: {original_path}")
        
        return slide_content, slide_assets
    
    def _generate_asset_name(self, original_path, asset_type):
        """Generate a clean local name for an asset"""
        parts = original_path.parts
        
        # Find meaningful parts (skip common directories)
        skip_parts = {'home', 'geoff', 'projects', 'lwir-align'}
        meaningful_parts = [part for part in parts if part not in skip_parts][-3:]
        
        # Create base name
        if len(meaningful_parts) > 1:
            base_name = '_'.join(meaningful_parts[:-1]) + '_' + meaningful_parts[-1]
        else:
            base_name = meaningful_parts[-1] if meaningful_parts else original_path.name
        
        # Clean up name
        base_name = re.sub(r'[^\w\-.]', '_', base_name)
        base_name = re.sub(r'_+', '_', base_name)
        
        # For images, we'll convert to WebP
        if asset_type == 'image':
            base_name = Path(base_name).stem + '.webp'
        
        return base_name
    
    def _process_asset(self, original_path, local_name, asset_type, output_mode):
        """Process and copy an asset to the assets directory"""
        if output_mode == 'single':
            # For single file mode, we still need to process assets for embedding
            # but write to a temp location
            temp_dir = self.build_dir / "temp_assets"
            temp_dir.mkdir(parents=True, exist_ok=True)
            output_path = temp_dir / local_name
        else:
            assets_dir = self.build_dir / "presentation_bundle" / "assets"
            assets_dir.mkdir(parents=True, exist_ok=True)
            output_path = assets_dir / local_name
        
        if asset_type == 'image':
            # Convert to WebP with optimization
            try:
                with Image.open(original_path) as img:
                    # Convert RGBA to RGB if necessary
                    if img.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                        img = background
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Resize if too large
                    max_width = self.config['build']['max_image_width']
                    if img.width > max_width:
                        height = int((max_width / img.width) * img.height)
                        img = img.resize((max_width, height), Image.Resampling.LANCZOS)
                        print(f"   🔄 Resized {original_path.name}: {img.width}x{img.height}")
                    
                    # Save as WebP
                    img.save(output_path, 'WebP', quality=self.config['build']['webp_quality'], optimize=True)
                    
                    # Calculate compression ratio
                    original_size = original_path.stat().st_size
                    new_size = output_path.stat().st_size
                    ratio = (1 - new_size/original_size) * 100
                    print(f"   📸 {original_path.name} → {output_path.name} ({ratio:.1f}% smaller)")
                    
            except Exception as e:
                print(f"   ❌ Error processing {original_path}: {e}")
                shutil.copy2(original_path, output_path.with_suffix(original_path.suffix))
                return output_path.with_suffix(original_path.suffix)
        else:
            # Copy data files as-is
            shutil.copy2(original_path, output_path)
            
        return output_path
    
    def embed_as_base64(self, template, assets):
        """Embed all assets as base64 data URLs"""
        result = template
        
        for asset in assets:
            if asset['type'] == 'image' and asset['processed']:
                processed_path = Path(asset['processed'])
                if processed_path.exists():
                    try:
                        with open(processed_path, 'rb') as f:
                            image_data = f.read()
                        b64_data = base64.b64encode(image_data).decode('utf-8')
                        data_url = f"data:image/webp;base64,{b64_data}"

                        # Replace asset references - try both original and processed paths
                        asset_ref = f"assets/{processed_path.name}"
                        old_result_len = len(result)
                        result = result.replace(asset_ref, data_url)

                        # Also replace original path references
                        if 'original_match' in asset:
                            original_match = asset['original_match']
                            # Handle both quote styles since the content processing changes " to '
                            original_match_single = original_match.replace('"', "'")
                            # Replace the entire original match with the same pattern but data URL
                            updated_match_double = re.sub(r'["\']([^"\']+)["\']', f'"{data_url}"', original_match)
                            updated_match_single = re.sub(r'["\']([^"\']+)["\']', f"'{data_url}'", original_match_single)
                            # Try replacing both quote styles
                            result = result.replace(original_match, updated_match_double)
                            result = result.replace(original_match_single, updated_match_single)

                        new_result_len = len(result)
                        if new_result_len != old_result_len:
                            print(f"   🔗 Embedded {processed_path.name} as base64 (+{new_result_len - old_result_len} bytes)")

                    except Exception as e:
                        print(f"   ❌ Failed to embed {processed_path}: {e}")
        
        return result
