"""Build outlined BR identity and a geographically sourced Mumbai reference SVG.
Run from repository root, then node scripts/render-brand-assets.mjs.
Requires fontTools; runtime website has no Python dependency.
"""
from pathlib import Path
import json, math, base64, html
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

data=json.loads((root/'docs/research/mumbai/BMC_Wards.geojson').read_text())
polygons=[]
for feature in data['features']:
    geometry=feature['geometry']; groups=geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]
    polygons.append((str(feature['properties']['name']),groups))
def project(p):return p[0]*math.pi/180,math.log(math.tan(math.pi/4+p[1]*math.pi/360))
coords=[project(p) for _,groups in polygons for poly in groups for ring in poly for p in ring]
x0=min(p[0] for p in coords);x1=max(p[0] for p in coords);y0=min(p[1] for p in coords);y1=max(p[1] for p in coords)
factor=min(790/(x1-x0),1020/(y1-y0));ox=610+(790-(x1-x0)*factor)/2;oy=200+(1020-(y1-y0)*factor)/2
def screen(p):
    x,y=project(p);return ox+(x-x0)*factor,oy+(y1-y)*factor
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1400" role="img" aria-label="Actual Mumbai municipal ward map in BR branding">', '<rect width="1600" height="1400" fill="#faf8f0"/>', '<rect x="565" y="150" width="975" height="1120" rx="28" fill="#dce7de"/>', '<svg x="64" y="58" width="80" height="80" viewBox="0 0 64 64">'+body+'</svg>', '<g fill="#23281f" font-family="Arial, sans-serif">', '<text x="165" y="110" font-size="38" font-weight="900">BAP KA RASTA.</text>', '<text x="64" y="285" font-size="76" font-weight="900">MUMBAI.</text>', '<text x="68" y="330" font-size="21" letter-spacing="3">APNA SHEHER. APNA RASTA.</text>', '<path d="M68 370 H445" stroke="#ffcc37" stroke-width="8" stroke-linecap="round"/>', '<text x="68" y="442" font-size="27" font-weight="700">The real geography.</text>', '<text x="68" y="484" font-size="22">24 municipal ward boundaries,</text>', '<text x="68" y="518" font-size="22">drawn from source coordinates.</text>', '<text x="68" y="590" font-size="20">This is a geographic reference.</text>', '<text x="68" y="623" font-size="20">The playable road network is</text>', '<text x="68" y="656" font-size="20">independently authored.</text>', '<text x="68" y="758" font-size="17" letter-spacing="2">ARABIAN SEA</text>', '<text x="68" y="1050" font-size="18" font-weight="700">WARM IVORY / FOREST INK / TAXI YELLOW</text>', '<text x="68" y="1100" font-size="18">Ward codes are dataset labels.</text>', '<text x="68" y="1132" font-size="18">Source snapshot, not a current navigation map.</text>', '</g>']
svg.insert(1, '<style>@font-face{font-family:Barlow;src:url(data:font/woff;base64,'+base64.b64encode(font_path.read_bytes()).decode()+')}text.brand-title{font-family:Barlow,sans-serif}</style>')
svg=[part.replace('x="165" y="110" font-size="38"', 'class="brand-title" x="165" y="110" font-size="46"').replace('x="64" y="285" font-size="76"', 'class="brand-title" x="64" y="285" font-size="108"') for part in svg]
colors=['#f3df9b','#f8edc9','#e8d99c','#f1e7c8']
labels=[]
for i,(name,groups) in enumerate(polygons):
    commands=[]
    largest=max(groups,key=lambda poly:len(poly[0]))[0]
    for poly in groups:
        for ring in poly:
            points=[screen(p) for p in ring];commands.append('M '+' L '.join(f'{x:.2f} {y:.2f}' for x,y in points)+' Z')
    svg.append(f'<path d="{" ".join(commands)}" fill="{colors[i%4]}" fill-rule="evenodd" stroke="#4b6255" stroke-width="1.5" stroke-linejoin="round"/>')
    # Polygon centroid, using the largest exterior ring in projected coordinates.
    ps=[screen(p) for p in largest];area=cx=cy=0
    for a,b in zip(ps,ps[1:]+ps[:1]):
        cross=a[0]*b[1]-b[0]*a[1];area+=cross;cx+=(a[0]+b[0])*cross;cy+=(a[1]+b[1])*cross
    if area:labels.append((cx/(3*area),cy/(3*area),name))
for x,y,name in labels:
    svg.append(f'<text x="{x:.2f}" y="{y:.2f}" text-anchor="middle" fill="#23281f" stroke="#faf8f0" stroke-width="5" paint-order="stroke" font-family="Arial,sans-serif" font-size="21" font-weight="700">{html.escape(name)}</text>')
svg+=['<path d="M1460 275 V205 M1448 225 L1460 205 L1472 225" fill="none" stroke="#23281f" stroke-width="3"/><text x="1460" y="190" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#23281f">N</text>', '<g fill="#23281f" font-family="Arial,sans-serif" font-size="18"><text x="64" y="1315">Geographic data: DataMeet Trust, Pune chapter · CC BY-SA 2.5 India · BMC_Wards.geojson</text><text x="64" y="1350">Projection: Web Mercator · Source revision 9b4d1c2 · Branded reference illustration: 27 October 2026</text></g></svg>']
(root/'docs/research/mumbai/br-mumbai-map.svg').write_text(''.join(svg))
print('Built BR vector master, icon sources and actual municipal reference map.')
