#!/bin/bash

# Build script for Math Presentation: Stop Fighting Wraparound
# This creates both single-file and bundle versions optimized for different use cases

set -e  # Exit on any error

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not installed"
    exit 1
fi

# Check if required Python packages are available
python3 -c "import yaml" 2>/dev/null || {
    echo "❌ Error: Required Python packages not found"
    echo "Please install: pip install PyYAML"
    exit 1
}

# Run the simple builder (our new math-specific builder)
python3 build.py "$@"

# Check if build was successful
if [ -f "docs/index.html" ] && [ -d "docs/presentation_bundle" ]; then
    # Show file sizes
    single_size=$(du -h docs/index.html | cut -f1)
    bundle_size=$(du -sh docs/presentation_bundle | cut -f1)
    echo "📄 Single file: $single_size | 📁 Bundle: $bundle_size"
else
    echo "❌ Build failed - output files not found"
    exit 1
fi