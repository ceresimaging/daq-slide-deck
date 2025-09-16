import sys
from presentation_builder import PresentationBuilder

def main():
    """Main entry point for presentation builder"""
    # Get config file from command line argument, default to config.yaml
    config_file = sys.argv[1] if len(sys.argv) > 1 else "config.yaml"

    # Build presentation using the full-featured builder with asset management
    builder = PresentationBuilder(config_file)
    builder.build_all()


if __name__ == "__main__":
    main()