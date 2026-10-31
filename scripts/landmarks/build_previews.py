"""Package original Blender/game review PNGs into small repository previews.

Run render_landmarks.py and capture the development landmark viewer first.
Only project-authored renders are used; no reference photographs are included.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "output/playwright/landmark-renders"
DESTINATION = ROOT / "docs/mumbai-landmarks"
DESTINATION.mkdir(parents=True, exist_ok=True)


def font(size, bold=False):
    for path in [
        Path("C:/Windows/Fonts") / ("arialbd.ttf" if bold else "arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu")
        / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"),
    ]:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def gallery(filename, title, subtitle, items, columns, tile_width, tile_height, game=False):
    gap, top, label_height = 18, 96, 38
    rows = (len(items) + columns - 1) // columns
    canvas = Image.new(
        "RGB",
        (columns * tile_width + (columns + 1) * gap,
         top + rows * (tile_height + label_height + gap) + 26),
        "#f7f3e9",
    )
    draw = ImageDraw.Draw(canvas)
    draw.text((gap, 15), title, font=font(30, True), fill="#24423e")
    draw.text((gap, 57), subtitle, font=font(18), fill="#505c52")
    for index, (source, label) in enumerate(items):
        with Image.open(SOURCE / source) as original:
            picture = original.convert("RGB")
        if game:
            # Omit the developer controls, preserving the actual rendered scene.
            picture = picture.crop((0, 72, picture.width, picture.height - 90))
        tile = ImageOps.fit(picture, (tile_width, tile_height), Image.Resampling.LANCZOS)
        x = gap + (index % columns) * (tile_width + gap)
        y = top + (index // columns) * (tile_height + label_height + gap)
        canvas.paste(tile, (x, y))
        draw.text((x + 8, y + tile_height + 8), label, font=font(19, True), fill="#24423e")
    canvas.save(DESTINATION / filename, quality=91, optimize=True)
    print(f"Wrote {filename}: {canvas.width} x {canvas.height}")


gallery(
    "landmark-library.jpg", "MUMBAI / ORIGINAL BLENDER LANDMARKS",
    "Selected models from the 29-site game library. Public exterior interpretations; game distances are compressed.",
    [
        ("taj-palace.png", "Taj Mahal Palace"),
        ("gateway.png", "Gateway of India"),
        ("antilia.png", "Antilia"),
        ("csmt.png", "CSMT"),
        ("mannat.png", "Mannat"),
        ("galaxy.png", "Galaxy Apartments"),
        ("jalsa.png", "Jalsa"),
        ("mount-mary.png", "Mount Mary Basilica"),
        ("siddhivinayak.png", "Siddhivinayak Temple"),
        ("nehru-centre.png", "Nehru Centre"),
        ("high-court.png", "Bombay High Court"),
        ("world-trade-centre.png", "World Trade Centre"),
    ], 4, 480, 360,
)
gallery(
    "city-preview.jpg", "BAP KA RASTA / MUMBAI IN THE GAME",
    "Real game meshes and lighting in the development viewer. Four roundabouts; 227 connected road segments.",
    [
        ("final-taj-palace.png", "Taj Mahal Palace"),
        ("final-gateway.png", "Gateway of India"),
        ("final-mannat.png", "Mannat / Bandstand"),
        ("final-galaxy.png", "Galaxy Apartments / Bandstand"),
        ("final-central.png", "Mumbai Chowk / clear future-feature centre"),
        ("final-scale.png", "Common-ground people and vehicle scale"),
    ], 2, 690, 405, game=True,
)
gallery(
    "small-roundabouts.jpg", "MUMBAI / TWO NEW NEIGHBOURHOOD CIRCLES",
    "Clockwise traffic, planted islands and connected approach roads.",
    [
        ("final-circle-dadar.png", "Dadar Garden Circle / 26 m road radius"),
        ("final-circle-cuffe.png", "Cuffe Parade Circle / 25 m road radius"),
    ], 2, 690, 405, game=True,
)
for source, name in [("final-central.png", "mumbai-chowk.jpg"), ("final-scale.png", "street-scale.jpg")]:
    with Image.open(SOURCE / source) as picture:
        picture.convert("RGB").save(DESTINATION / name, quality=92, optimize=True)
    print(f"Wrote {name}")
