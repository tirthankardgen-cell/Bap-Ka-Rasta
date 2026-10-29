"""Paint the original cast's shared textile/prop atlas. Requires Pillow only.

python scripts/characters/make_atlas.py
All motifs are drawn here; no concept-board pixels or third-party textures are used.
"""
from pathlib import Path
import json
import math
import random
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/characters/mumbai"
TILE = 256
SIZE = TILE * 8
FABRICS = [
    ("plain", "ffffff", "plain"),
    ("khaki", "b18e4c", "cotton"),
    ("green_sari", "176548", "sari"),
    ("maroon", "802c41", "cotton"),
    ("work_blue", "33598c", "denim"),
    ("blue_kurta", "225991", "floral"),
    ("cream", "e9ddc4", "cotton"),
    ("hoodie", "762e40", "knit"),
    ("jeans", "4c647c", "denim"),
    ("purple_sari", "73318d", "sari"),
    ("orange_blouse", "d28a30", "cotton"),
    ("white", "eeeade", "cotton"),
    ("teal", "177c77", "floral"),
    ("apron", "e8d5b4", "stripe"),
    ("plaid", "c2ac8a", "plaid"),
    ("scrubs", "a585c7", "cotton"),
    ("pale_blue", "9bbada", "cotton"),
    ("navy", "303c53", "cotton"),
    ("rust", "ac4a2a", "cotton"),
    ("orange", "e08325", "cotton"),
    ("lime", "bbd849", "cotton"),
    ("blue_sari", "558cb9", "sari"),
    ("olive", "566344", "cotton"),
    ("cargo", "bda079", "cotton"),
    ("sports", "8842a6", "knit"),
    ("ochre", "bf913e", "cotton"),
    ("basket", "987043", "wicker"),
    ("newspaper", "e9e1ce", "paper"),
    ("leather", "47382c", "leather"),
    ("dark", "30343b", "cotton"),
    ("gold", "dfa94c", "gold"),
    ("silver", "b9c4ca", "metal"),
    ("sole", "e6dfd1", "plain"),
    ("black", "20252b", "leather"),
    ("apron_cream", "ded2b2", "cotton"),
    ("blue_workwear", "32629e", "cotton"),
]


def rgb(s):
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def paint(index, color, pattern):
    base = rgb(color)
    rng = random.Random(index + 5083)
    tile = Image.new("RGB", (TILE, TILE), base)
    pixels = tile.load()
    if pattern != "plain":
        for y in range(TILE):
            for x in range(TILE):
                n = rng.uniform(-3, 3) + (1 if (x + y) % 3 == 0 else -1)
                if pattern in ("denim", "knit"):
                    n += 4 * math.sin((x + y * 2) * math.pi / 4)
                pixels[x, y] = tuple(max(0, min(255, round(c + n))) for c in base)
    d = ImageDraw.Draw(tile)
    gold = (204, 163, 75)
    if pattern in ("floral", "sari"):
        ink = (191, 211, 218) if index == 5 else gold
        for row, y in enumerate(range(18, TILE, 48)):
            for x in range(18 + (row % 2) * 24, TILE, 48):
                if pattern == "floral":
                    for k in range(5):
                        a = k * math.tau / 5
                        px, py = x + 5 * math.cos(a), y + 5 * math.sin(a)
                        d.ellipse((px - 2, py - 3, px + 2, py + 3), fill=ink)
                    d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=gold)
                    d.line((x, y + 5, x - 2, y + 12), fill=ink, width=1)
                else:
                    d.line([(x, y - 4), (x + 3, y), (x, y + 5), (x - 3, y), (x, y - 4)], fill=gold, width=1)
                    d.ellipse((x - 1, y - 1, x + 1, y + 1), fill=gold)
    if pattern == "stripe":
        for x in range(0, TILE, 16):
            d.rectangle((x, 0, x + 5, TILE), fill=(169, 72, 45))
            d.line((x + 9, 0, x + 9, TILE), fill=(203, 109, 71), width=2)
    if pattern == "plaid":
        for p in range(0, TILE, 32):
            d.rectangle((p, 0, p + 4, TILE), fill=(148, 126, 99))
            d.rectangle((0, p, TILE, p + 4), fill=(151, 129, 101))
            d.line((p + 9, 0, p + 9, TILE), fill=(227, 215, 188), width=2)
            d.line((0, p + 9, TILE, p + 9), fill=(227, 215, 188), width=2)
    if pattern == "wicker":
        for y in range(0, TILE, 12):
            d.line((0, y, TILE, y), fill=(79, 53, 30), width=3)
            d.line((0, y + 3, TILE, y + 3), fill=(187, 146, 88), width=2)
            for x in range((y % 24), TILE, 24):
                d.line((x, y, x, y + 12), fill=(99, 68, 38), width=2)
    if pattern == "paper":
        font_path = Path("C:/Windows/Fonts/arialbd.ttf")
        font = ImageFont.truetype(str(font_path), 20) if font_path.exists() else ImageFont.load_default()
        d.text((14, 12), "MUMBAI TODAY", fill=(47, 49, 47), font=font)
        d.line((12, 39, 244, 39), fill=(69, 70, 65), width=3)
        for col in range(3):
            x = 14 + col * 79
            for y in range(48, 243, 6):
                length = rng.randint(43, 67)
                d.line((x, y, x + length, y), fill=(111, 108, 97), width=2)
        d.rectangle((93, 57, 153, 103), fill=(141, 147, 143))
        d.rectangle((105, 66, 129, 99), fill=(111, 120, 116))
        d.line((97, 99, 125, 75, 150, 99), fill=(190, 186, 166), width=4)
    if pattern == "gold":
        for y in range(8, TILE, 24):
            d.line((0, y, TILE, y), fill=(153, 100, 32), width=2)
            for x in range(0, TILE, 24):
                d.line([(x, y + 10), (x + 10, y + 2), (x + 20, y + 10), (x + 10, y + 18), (x, y + 10)], fill=(246, 204, 115), width=2)
    # Four pixels of duplicated border prevent sampling neighbouring textiles.
    tile = tile.resize((TILE - 8, TILE - 8), Image.Resampling.LANCZOS)
    padded = Image.new("RGB", (TILE, TILE))
    padded.paste(tile, (4, 4))
    padded.paste(tile.crop((0, 0, 1, 248)).resize((4, 248)), (0, 4))
    padded.paste(tile.crop((247, 0, 248, 248)).resize((4, 248)), (252, 4))
    padded.paste(padded.crop((0, 4, 256, 5)).resize((256, 4)), (0, 0))
    padded.paste(padded.crop((0, 251, 256, 252)).resize((256, 4)), (0, 252))
    return padded


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    atlas = Image.new("RGB", (SIZE, SIZE), "white")
    orm = Image.new("RGB", (SIZE, SIZE), (255, 200, 0))
    layout = {}
    for i, (name, color, pattern) in enumerate(FABRICS):
        x, y = (i % 8) * TILE, (i // 8) * TILE
        atlas.paste(paint(i, color, pattern), (x, y))
        metal = 210 if pattern == "metal" else 150 if pattern == "gold" else 0
        rough = 85 if pattern == "metal" else 125 if pattern in ("gold", "leather") else 207
        ImageDraw.Draw(orm).rectangle((x, y, x + TILE - 1, y + TILE - 1), fill=(255, rough, metal))
        layout[name] = {"index": i, "color": "#" + color, "pattern": pattern}
    atlas.save(OUT / "cast-basecolor.png", optimize=True)
    orm.save(OUT / "cast-orm.png", optimize=True)
    (OUT / "atlas.json").write_text(json.dumps(layout, indent=2) + "\n")
    print(f"Painted {len(layout)} original textile and prop tiles in {OUT}")


if __name__ == "__main__":
    main()
