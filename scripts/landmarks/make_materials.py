"""Paint original, seamless masonry and roof PBR textures. No photo is redistributed."""
import json
import math
import random
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/architecture/mumbai/textures'
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 512
SURFACES = {
    'sandstone': ('b59d79', 'stone'),
    'limestone': ('ded6be', 'stone'),
    'basalt': ('736d61', 'stone'),
    'redstone': ('985943', 'stone'),
    'terracotta': ('984d39', 'roof'),
    'plaster': ('dfd2b3', 'plaster'),
    'paving': ('b8ac97', 'paving'),
}
rng = random.Random(20261101)
for name, (hex_color, style) in SURFACES.items():
    rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    pixels, heights = [], []
    for y in range(SIZE):
        row = y // 64
        for x in range(SIZE):
            if style in ('stone', 'paving'):
                joint = y % 64 < 2 or (x + (row % 2) * 64) % 128 < 2
                block = math.sin((x // 128 + row * 11) * 23.7) * .025
                h = .18 if joint else .64 + rng.random() * .04
                value = .80 if joint else 1 + block + rng.gauss(0, .022)
            elif style == 'roof':
                flute = math.cos(x / 16 * math.pi * 2)
                joint = y % 64 < 3
                h = .2 if joint else .5 + .16 * flute
                value = .6 if joint else .95 + .13 * flute + rng.gauss(0, .025)
            else:
                h = .5 + rng.gauss(0, .025)
                value = 1 + rng.gauss(0, .022) + .02 * math.sin(x * math.tau / SIZE) * math.sin(y * math.tau / SIZE)
            pixels.append(tuple(max(0, min(255, round(c * value))) for c in rgb))
            heights.append(h)
    color = Image.new('RGB', (SIZE, SIZE)); color.putdata(pixels)
    color.save(OUT / (name + '-color.png'), optimize=True)
    normals = []
    for y in range(SIZE):
        for x in range(SIZE):
            dx = (heights[y*SIZE+(x+1)%SIZE]-heights[y*SIZE+(x-1)%SIZE]) * .9
            dy = (heights[((y+1)%SIZE)*SIZE+x]-heights[((y-1)%SIZE)*SIZE+x]) * .9
            length = math.sqrt(dx*dx+dy*dy+1)
            normals.append((int(127.5-127.5*dx/length), int(127.5+127.5*dy/length), int(127.5+127.5/length)))
    normal = Image.new('RGB', (SIZE, SIZE)); normal.putdata(normals)
    normal.save(OUT / (name + '-normal.png'), optimize=True)
(OUT.parent / 'materials.json').write_text(json.dumps({'size': SIZE, 'metres_per_repeat': 4, 'surfaces': list(SURFACES), 'authorship': 'Original deterministic procedural textures; no reference photos used as textures.'}, indent=2)+'\n')
print(f'Painted {len(SURFACES)} original masonry / plaster / roof PBR pairs.')
