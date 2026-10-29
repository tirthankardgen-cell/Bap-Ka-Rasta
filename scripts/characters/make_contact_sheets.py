"""Assemble labelled review sheets from the actual Blender portrait renders."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
PORTRAITS = ROOT / "output/playwright/character-renders"
OUT = ROOT / "docs/mumbai-characters/renders"
CAST = json.loads((ROOT / "assets/characters/mumbai/manifest.json").read_text())["characters"]


def font(size, bold=False):
    candidates = [Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")]
    return ImageFont.truetype(str(next(p for p in candidates if p.exists())), size)


def sheet(cast, title, filename):
    tile_w, tile_h, caption_h = 384, 461, 53
    gap, header, footer = 16, 114, 39
    rows = (len(cast) + 3) // 4
    width = tile_w * 4 + gap * 5
    height = header + rows * (tile_h + caption_h + gap) + footer
    image = Image.new("RGB", (width, height), "#efe3ce")
    draw = ImageDraw.Draw(image)
    draw.text((gap, 18), "BAP KA RASTA", font=font(40, True), fill="#2b241c")
    draw.text((gap, 69), title + "  /  BLENDER MODEL RENDERS", font=font(21), fill="#70563a")
    draw.rectangle((gap, 101, width - gap, 105), fill="#c99135")
    for i, c in enumerate(cast):
        x, y = gap + (i % 4) * (tile_w + gap), header + (i // 4) * (tile_h + caption_h + gap)
        portrait = Image.open(PORTRAITS / (c["id"] + ".png")).convert("RGB").resize((tile_w, tile_h), Image.Resampling.LANCZOS)
        image.paste(portrait, (x, y))
        draw.text((x + 10, y + tile_h + 11), f"{c['reference_index']:02d}  {c['name']}", font=font(23, True), fill="#392b20")
    draw.text((gap, height - 29), "Actual 3D meshes · Shared clothing atlas · Matching game assets and editable Blender source", font=font(16), fill="#70563a")
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT / filename, quality=93, subsampling=0, optimize=True)
    print(OUT / filename)


if __name__ == "__main__":
    sheet(CAST[:8], "MUMBAI MAIN CAST", "main-cast.jpg")
    sheet(CAST[8:], "MUMBAI STREET CROWD", "street-crowd.jpg")
