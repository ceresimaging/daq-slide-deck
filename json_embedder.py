#!/usr/bin/env python3
"""
JSON Data Embedder for Presentation Build System
Simplified - no external data dependencies
"""

from templates import JSON_EMBED


class JSONDataEmbedder:
    """Simplified data embedder with no external dependencies"""

    @staticmethod
    def load_and_embed_json_data():
        """Return simplified JavaScript embedding code (no external data needed)"""
        return JSON_EMBED