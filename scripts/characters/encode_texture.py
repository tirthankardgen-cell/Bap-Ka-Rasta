"""Pillow WebP encoding for the packer; binary input/output, no temporary files."""
import io
import sys
from PIL import Image

image = Image.open(io.BytesIO(sys.stdin.buffer.read()))
image.save(sys.stdout.buffer, "WEBP", quality=92, method=6, lossless=sys.argv[1] == "data")
