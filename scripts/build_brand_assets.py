"""Build outlined BR identity.
Run from repository root, then node scripts/render-brand-assets.mjs.
Requires fontTools; runtime website has no Python dependency.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

root=Path(__file__).resolve().parents[1]
brand=root/'public/brand';brand.mkdir(exist_ok=True)
font_path=root/'node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff'
font=TTFont(font_path);glyphs=font.getGlyphSet();cmap=font.getBestCmap();units=font['head'].unitsPerEm
scale=33.5/units; cursor=0; paths=[]; bounds=[]
for letter in 'BR':
    name=cmap[ord(letter)];pen=SVGPathPen(glyphs);glyphs[name].draw(pen)
    paths.append(f'<path transform="translate({cursor:.2f} 0)" d="{pen.getCommands()}"/>')
    bp=BoundsPen(glyphs);glyphs[name].draw(bp);x0,y0,x1,y1=bp.bounds;bounds.append((x0+cursor,y0,x1+cursor,y1))
    cursor+=font['hmtx'][name][0]-3/22*33.5/scale
xmin=min(b[0] for b in bounds);xmax=max(b[2] for b in bounds);ymin=min(b[1] for b in bounds);ymax=max(b[3] for b in bounds)
tx=32-(xmin+xmax)*scale/2;ty=32+(ymin+ymax)*scale/2
body=f'<circle cx="32" cy="32" r="29.5" fill="#ffcc37" stroke="#23281f" stroke-width="3"/><g fill="#23281f" transform="rotate(-10 32 32)"><g transform="translate({tx:.3f} {ty:.3f}) scale({scale} {-scale})">'+''.join(paths)+'</g></g>'
logo='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="BR — Bap Ka Rasta">'+body+'</svg>'
(brand/'br-mark.svg').write_text(logo);(root/'public/favicon.svg').write_text(logo)
# Maskable icons keep the full circular mark inside the platform safe area.
(brand/'app-icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#faf8f0"/><svg x="40" y="40" width="432" height="432" viewBox="0 0 64 64">'+body+'</svg></svg>')
(brand/'maskable-icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#ffcc37"/><svg x="76" y="76" width="360" height="360" viewBox="0 0 64 64">'+body+'</svg></svg>')
