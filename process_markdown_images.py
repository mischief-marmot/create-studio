#!/usr/bin/env python3
"""
Process Markdown Images - Download external images, crop pink borders, rename, and update markdown.
"""

import os
import re
import sys
import argparse
from pathlib import Path
from io import BytesIO
from typing import Optional, Tuple, List
import requests
from PIL import Image

# Color configuration
PINK_BORDER_COLOR = (246, 175, 170)
COLOR_TOLERANCE = 30  # Allow variations within this range

class MarkdownImageProcessor:
    def __init__(self, markdown_file: str, dry_run: bool = False, verbose: bool = False):
        self.markdown_file = Path(markdown_file)
        self.dry_run = dry_run
        self.verbose = verbose

        # Determine base filename for image naming
        self.base_name = self.markdown_file.stem

        # Output directory - go up from content/ to packages/app/, then to public/
        self.output_dir = Path(self.markdown_file.parent.parent) / ".." / "public" / "img" / "features"
        self.output_dir = self.output_dir.resolve()

        # Store markdown content
        with open(self.markdown_file, 'r') as f:
            self.content = f.read()

        self.log(f"Processing: {self.markdown_file}")
        self.log(f"Output directory: {self.output_dir}")

    def log(self, message: str):
        if self.verbose:
            print(f"[INFO] {message}")

    def log_success(self, message: str):
        print(f"✓ {message}")

    def log_error(self, message: str):
        print(f"✗ {message}")

    def slugify_section(self, section_name: str) -> str:
        """Convert section name to slug using first 2 words max."""
        # Remove markdown symbols
        cleaned = re.sub(r'[#*_`\[\]()]', '', section_name).strip()

        # Get first 2 words
        words = cleaned.split()[:2]

        # Remove special characters and convert to lowercase
        slug = '-'.join(words).lower()
        slug = re.sub(r'[^a-z0-9\-]', '', slug)

        return slug

    def extract_sections(self) -> dict:
        """Extract all sections and their line ranges."""
        sections = {}
        current_section = "unsectioned"

        for i, line in enumerate(self.content.split('\n')):
            match = re.match(r'^(#{1,4})\s+(.+)$', line)
            if match:
                level = len(match.group(1))
                title = match.group(2)
                current_section = self.slugify_section(title)
                self.log(f"Found section: {title} -> {current_section}")

            if current_section not in sections:
                sections[current_section] = []
            sections[current_section].append(i)

        return {section: (min(lines), max(lines)) for section, lines in sections.items()}

    def get_section_for_line(self, line_num: int, sections: dict) -> str:
        """Get the section name for a given line number."""
        for section, (start, end) in sections.items():
            if start <= line_num <= end:
                return section
        return "unsectioned"

    def is_pink_border(self, pixel: Tuple[int, int, int]) -> bool:
        """Check if a pixel is the pink border color (with tolerance)."""
        r, g, b = pixel[:3]

        return (
            abs(r - PINK_BORDER_COLOR[0]) <= COLOR_TOLERANCE and
            abs(g - PINK_BORDER_COLOR[1]) <= COLOR_TOLERANCE and
            abs(b - PINK_BORDER_COLOR[2]) <= COLOR_TOLERANCE
        )

    def crop_pink_borders(self, image: Image.Image) -> Image.Image:
        """Remove pink borders from an image."""
        # Convert to RGB if needed
        if image.mode == 'RGBA':
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))
            rgb_image.paste(image, mask=image.split()[3])
            image = rgb_image
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        pixels = image.load()
        width, height = image.size

        # Find crop boundaries
        left, top, right, bottom = 0, 0, width, height

        # Find leftmost non-pink column
        for x in range(width):
            found_content = False
            for y in range(height):
                if not self.is_pink_border(pixels[x, y]):
                    found_content = True
                    break
            if found_content:
                left = x
                break

        # Find rightmost non-pink column
        for x in range(width - 1, -1, -1):
            found_content = False
            for y in range(height):
                if not self.is_pink_border(pixels[x, y]):
                    found_content = True
                    break
            if found_content:
                right = x + 1
                break

        # Find topmost non-pink row
        for y in range(height):
            found_content = False
            for x in range(width):
                if not self.is_pink_border(pixels[x, y]):
                    found_content = True
                    break
            if found_content:
                top = y
                break

        # Find bottommost non-pink row
        for y in range(height - 1, -1, -1):
            found_content = False
            for x in range(width):
                if not self.is_pink_border(pixels[x, y]):
                    found_content = True
                    break
            if found_content:
                bottom = y + 1
                break

        # Crop the image
        if left < right and top < bottom:
            return image.crop((left, top, right, bottom))

        return image

    def download_image(self, url: str) -> Optional[Image.Image]:
        """Download an image from URL."""
        try:
            self.log(f"Downloading: {url}")
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            image = Image.open(BytesIO(response.content))
            return image
        except Exception as e:
            self.log_error(f"Failed to download {url}: {str(e)}")
            return None

    def get_image_extension(self, image: Image.Image) -> str:
        """Get appropriate file extension for image format."""
        format_map = {
            'JPEG': 'jpg',
            'PNG': 'png',
            'GIF': 'gif',
            'WEBP': 'webp',
        }
        return format_map.get(image.format, 'jpg')

    def process_images(self) -> dict:
        """Find and process all external images in markdown."""
        # Extract section information
        sections = self.extract_sections()

        # Find all image references
        image_pattern = r'!\[([^\]]*)\]\(https://[^)]+\)'

        lines = self.content.split('\n')
        replacements = {}  # Map old URL to dict with new path and alt text
        section_counters = {}  # Track image count per section

        for line_num, line in enumerate(lines):
            matches = list(re.finditer(image_pattern, line))

            for match in matches:
                full_match = match.group(0)
                url = re.search(r'\((https://[^)]+)\)', full_match).group(1)

                # Get section for this line
                section = self.get_section_for_line(line_num, sections)

                # Increment counter for this section
                if section not in section_counters:
                    section_counters[section] = 0
                section_counters[section] += 1
                image_num = section_counters[section]

                self.log(f"Found image in section '{section}': {url}")

                # Download and process image
                image = self.download_image(url)
                if image is None:
                    continue

                # Crop pink borders
                self.log("Cropping pink borders...")
                image = self.crop_pink_borders(image)

                # Create section subdirectory
                section_dir = self.output_dir / self.base_name / section
                if not self.dry_run:
                    section_dir.mkdir(parents=True, exist_ok=True)

                # Generate new filename
                ext = self.get_image_extension(image)
                new_filename = f"{image_num:02d}.{ext}"
                new_path = section_dir / new_filename
                new_url = f"/img/features/{self.base_name}/{section}/{new_filename}"

                # Save image
                if not self.dry_run:
                    save_kwargs = {}
                    if ext.lower() in ['jpg', 'jpeg']:
                        save_kwargs['quality'] = 95

                    # Map file extensions to PIL format names
                    format_map = {'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'gif': 'GIF', 'webp': 'WEBP'}
                    pil_format = format_map.get(ext.lower(), ext.upper())
                    image.save(str(new_path), format=pil_format, **save_kwargs)
                    self.log_success(f"Saved: {new_path}")
                else:
                    self.log(f"[DRY RUN] Would save: {new_path}")

                # Create alt text: section-number format
                alt_text = f"{section}-{image_num}"

                # Store replacement with metadata
                replacements[url] = {'url': new_url, 'alt': alt_text}
                self.log_success(f"Image processed: {new_filename}")

        return replacements

    def update_markdown(self, replacements: dict):
        """Update markdown file with new image URLs and alt text."""
        updated_content = self.content

        for old_url, replacement_data in replacements.items():
            new_url = replacement_data['url']
            alt_text = replacement_data['alt']

            # Replace the entire image markdown: ![old-alt](old-url) -> ![alt-text](new-url)
            pattern = f'!\\[[^\\]]*\\]\\({re.escape(old_url)}\\)'
            updated_content = re.sub(pattern, f'![{alt_text}]({new_url})', updated_content)

        if not self.dry_run:
            with open(self.markdown_file, 'w') as f:
                f.write(updated_content)
            self.log_success(f"Updated markdown file: {self.markdown_file}")
        else:
            self.log("[DRY RUN] Would update markdown file")

    def process(self):
        """Main processing pipeline."""
        replacements = self.process_images()

        if replacements:
            self.update_markdown(replacements)
            print(f"\n✓ Processed {len(replacements)} images successfully!")
        else:
            print("\nNo external images found to process.")

def main():
    parser = argparse.ArgumentParser(
        description='Process markdown images: download, crop borders, rename, and update links.'
    )
    parser.add_argument('markdown_file', help='Path to markdown file to process')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without modifying files')
    parser.add_argument('-v', '--verbose', action='store_true', help='Verbose output')

    args = parser.parse_args()

    if not os.path.exists(args.markdown_file):
        print(f"Error: File not found: {args.markdown_file}")
        sys.exit(1)

    processor = MarkdownImageProcessor(args.markdown_file, args.dry_run, args.verbose)
    processor.process()

if __name__ == '__main__':
    main()
