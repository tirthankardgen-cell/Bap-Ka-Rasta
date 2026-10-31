import { writeFileSync, readFileSync } from "node:fs";
import { streets, streetPath, WORLD_BOUNDS, SPAWN, roundabouts } from "../src/game/network.ts";
import { boundaryBuildings } from "../src/game/boundaries.ts";
import { buildingLots, LOT_HALF_WIDTH, LOT_HALF_LENGTH } from "../src/game/buildings.ts";
import { landmarkSites, landmarkApproaches } from "../src/game/landmark-layout.ts";

const font=readFileSync("node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff2").toString("base64");
const logo=readFileSync("public/brand/br-mark.svg","utf8").replace("<svg ",'<svg x="65" y="52" width="80" height="80" ');
const escape=(s:string)=>s.replaceAll("&","&amp;").replaceAll("<","&lt;");
const plot={x:65,y:325,width:1030,height:1530};
const s=Math.min((plot.width-130)/(WORLD_BOUNDS.maxX-WORLD_BOUNDS.minX),(plot.height-80)/(WORLD_BOUNDS.maxZ-WORLD_BOUNDS.minZ));
const ox=plot.x+95-WORLD_BOUNDS.minX*s,oy=plot.y+40-WORLD_BOUNDS.minZ*s;
const xy=(x:number,z:number)=>[ox+x*s,oy+z*s];
const point=(x:number,z:number)=>xy(x,z).map(v=>v.toFixed(2)).join(",");
const rect=(b:{x:number;z:number;yaw:number;width:number;depth:number},attrs="")=>`<rect x="${-b.width*s/2}" y="${-b.depth*s/2}" width="${b.width*s}" height="${b.depth*s}" transform="translate(${point(b.x,b.z)}) rotate(${-b.yaw*180/Math.PI})" ${attrs}/>`;
const paths=(halo=false)=>streets.map(e=>`<path data-street="${e.id}" d="M${streetPath(e.id).map(p=>point(p.x,p.z)).join(" L")}" stroke-width="${e.width*s+(halo?2.6:0)}"/>`).join("");
const lots=buildingLots();
const cityLots=lots.map(b=>rect({...b,width:LOT_HALF_WIDTH*2,depth:LOT_HALF_LENGTH*2})).join("");
const perimeter=boundaryBuildings.map(b=>rect(b)).join("");
const approaches=landmarkApproaches.map(b=>rect({...b,width:b.halfWidth*2,depth:b.halfLength*2})).join("");
const sites=landmarkSites.map(b=>rect(b,`data-landmark="${b.id}" fill="${b.kind==='shop'?'#b37545':'#ab8a50'}"`)).join("");
const pins=landmarkSites.map((b,i)=>`<g transform="translate(${point(b.x,b.z)})"><circle r="10.8" fill="${b.kind==='shop'?'#97532e':'#1d5c50'}" stroke="#faf8f0" stroke-width="2"/><text y="4.2" text-anchor="middle" class="pin">${i+1}</text></g>`).join("");
const circles=roundabouts.map(r=>{const [x,y]=xy(r.x,r.z);return `<circle cx="${x}" cy="${y}" r="${r.islandRadius*s}" fill="#8aa77b"/>${r.id==='central'?`<circle cx="${x}" cy="${y}" r="${20*s}" fill="#f4d589" stroke="#b69558" stroke-width="1.5"/><text x="${x+45}" y="${y-8}" class="district">MUMBAI CHOWK</text><text x="${x+45}" y="${y+10}" font-size="11">Future feature at the centre</text>`:''}`;}).join("");
const labels=[
 ["BANDSTAND",-150,-1035],["JUHU",255,-1135],["BANDRA HILL",600,-1030],
 ["CHOWPATTY",-140,-430],["DADAR / PAREL",865,-815],["WORLI",1025,140],
 ["CHURCHGATE",-155,-150],["FORT",15,275],["COLABA",150,720],
 ["CUFFE PARADE",360,1020],
] as const;
const districtLabels=labels.map(([name,x,z])=>`<text x="${xy(x,z)[0]}" y="${xy(x,z)[1]}" text-anchor="middle" class="district">${name}</text>`).join("");
const shortNames:Record<string,string>={csmt:"CSMT railway terminus",asiatic:"Asiatic Library / Town Hall",galaxy:"Galaxy Apartments · Salman Khan",mannat:"Mannat · Shah Rukh Khan",jalsa:"Jalsa · Amitabh Bachchan"};
const legend=landmarkSites.map((site,i)=>`<g transform="translate(0 ${i*34})"><circle cx="12" cy="-6" r="11" fill="${site.kind==='shop'?'#97532e':'#1d5c50'}"/><text x="12" y="-1.8" text-anchor="middle" class="pin">${i+1}</text><text x="32" font-size="17">${escape(shortNames[site.id]??site.name)}</text></g>`).join("");
const roadKm=streets.reduce((n,e)=>n+streetPath(e.id).at(-1)!.distance,0)/1000;
const [startX,startY]=xy(SPAWN.x,SPAWN.z);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2000" role="img" aria-label="Mumbai game map with ${streets.length} roads and ${landmarkSites.length} landmarks and shops">
<style>@font-face{font-family:Barlow;src:url(data:font/woff2;base64,${font})}text{font-family:Arial,sans-serif;fill:#23281f}.title{font-family:Barlow}.pin{fill:#fff;font-size:12px;font-weight:700}.district{font-size:13px;font-weight:700;paint-order:stroke;stroke:#ece5d0;stroke-width:3px;stroke-linejoin:round}</style>
<defs><clipPath id="map"><rect x="${plot.x}" y="${plot.y}" width="${plot.width}" height="${plot.height}" rx="26"/></clipPath></defs>
<rect width="1600" height="2000" fill="#faf8f0"/>${logo}<text x="168" y="111" class="title" font-size="48">BAP KA RASTA.</text>
<text x="65" y="220" class="title" font-size="76">MUMBAI · GAME MAP</text><text x="68" y="264" font-size="22">${streets.length} connected streets · ${roadKm.toFixed(2)} km of roads · ${landmarkSites.length} places to discover</text>
<g clip-path="url(#map)"><rect x="${plot.x}" y="${plot.y}" width="${plot.width}" height="${plot.height}" fill="#cbdeda"/>
<rect x="${ox+WORLD_BOUNDS.minX*s}" y="${oy+WORLD_BOUNDS.minZ*s}" width="${(WORLD_BOUNDS.maxX-WORLD_BOUNDS.minX)*s}" height="${(WORLD_BOUNDS.maxZ-WORLD_BOUNDS.minZ)*s}" fill="#e8dfc5"/>
<g fill="#cec2a3" stroke="#e8dfc5" stroke-width=".5">${cityLots}</g><g fill="#b98c62">${perimeter}</g>
<g fill="#f0dbaa">${approaches}</g>${sites}
<g fill="none" stroke="#faf8f0" stroke-linejoin="round" stroke-linecap="round">${paths(true)}</g><g fill="none" stroke="#43564f" stroke-linejoin="round" stroke-linecap="round">${paths()}</g>
${circles}${districtLabels}${pins}<circle cx="${startX}" cy="${startY}" r="8" fill="#ffcc37" stroke="#23281f" stroke-width="2"/><text x="${startX-13}" y="${startY+5}" text-anchor="end" font-size="12" font-weight="700">START</text>
<text x="107" y="1115" transform="rotate(-90 107 1115)" font-size="20" letter-spacing="5">ARABIAN SEA</text>
</g>
<g transform="translate(1140 350)"><path d="M25 64V0M14 19L25 0L36 19" fill="none" stroke="#23281f" stroke-width="3"/><text x="17" y="-12" font-size="18">N</text>
<text x="75" y="12" class="title" font-size="32">A BIGGER MUMBAI</text><text x="75" y="42" font-size="18">1,488 × 2,400 metres</text><text x="75" y="69" font-size="18">3.57 km² playable layout</text>
<path d="M0 105H370" stroke="#d6cbb4"/><text y="140" font-size="18">Main avenues + curved two-lane streets</text><text y="171" font-size="18">Four clockwise roundabouts</text><text y="202" font-size="18">Central plaza reserved for a future feature</text>
<rect y="228" width="23" height="15" fill="#b98c62"/><text x="34" y="241" font-size="16">Boundary buildings</text>
<text y="300" class="title" font-size="36">LANDMARKS &amp; LOCAL STOPS</text><g transform="translate(0 343)">${legend}</g>
<path d="M0 1356H370" stroke="#d6cbb4"/><text y="1392" class="title" font-size="34">FREE ROAM.</text><text y="1426" font-size="18">Find your own route across the city.</text><text y="1454" font-size="16">Numbers match the landmark catalogue.</text>
</g>
<text x="65" y="1910" font-size="22">Apna sheher. Apni sawaari. Apna rasta.</text><text x="65" y="1950" font-size="18">Authored Mumbai-inspired game layout. Distances and footprints are compressed; this is not a navigation map.</text>
</svg>`;
writeFileSync("docs/maps/mumbai-game-map.svg",svg);
console.log(`Mapped ${streets.length} roads, ${boundaryBuildings.length} boundary buildings, ${lots.length} lots and ${landmarkSites.length} landmark sites.`);
