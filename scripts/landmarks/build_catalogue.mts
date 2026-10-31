import { writeFileSync } from 'node:fs';
import { landmarkSites,mumbaiRoadSigns } from '../../src/game/landmark-layout.ts';
import { streets,streetPath,roundabouts,CENTRAL_PLAZA } from '../../src/game/network.ts';
const reference=(ref:string)=>ref.startsWith('https://')?ref:'https://en.wikipedia.org/wiki/'+ref;
const rows=landmarkSites.map((s,i)=>`| ${i+1} | ${s.name} | ${s.district} | ${s.x}, ${s.z} | ${s.height} m · ${s.heightBasis} | [Photos / source](${reference(s.reference)}) |`);
const roadKm=streets.reduce((n,s)=>n+streetPath(s.id).at(-1)!.distance,0)/1000;
writeFileSync('docs/Mumbai-Landmarks.md',[
 '# Mumbai landmarks, streets and shops','',
 `${landmarkSites.length} original Blender models are placed in the playable city: ${landmarkSites.filter(s=>s.kind==='landmark').length} landmarks and residences, plus seven local shops. The numbered [game map](maps/mumbai-game-map.png) uses this same layout.`,'',
 'This is a compressed, authored Mumbai-inspired city, not a surveyed replica. North is negative Z and one world unit is one metre. Published heights are identified below; other heights and all footprints are visual approximations. Public exterior photographs were viewed in Chrome as modelling references. The meshes and masonry textures are original; photographs are not included in the game. Mumbai’s monument is the Gateway of India, distinct from Delhi’s India Gate.','',
 '| Map no. | Building / shop | Game district | Game X, Z (m) | Model height | Reference |',
 '| --- | --- | --- | --- | --- | --- |',...rows,'',
 '## Placement','',
 'Taj and Gateway face one another across the Colaba waterfront road. CSMT and BMC face Station Road; Antilia sits farther north. Bandstand contains Mannat and Galaxy, with Jalsa in the Juhu quarter. Mount Mary, Siddhivinayak, World One, the Opera House, Nehru Centre, High Court, BSE and World Trade Centre extend sightseeing into the northern, eastern and southern districts. Full building envelopes and open approaches are reserved before ordinary frontage is generated.','',
 '## Roads and roundabouts','',
 `${streets.length} connected road segments provide ${roadKm.toFixed(2)} km of centreline. Wide avenues connect the map; curved streets with one lane in each direction appear in every quadrant. Signs reference these familiar Mumbai roads and destinations:`, '',
 ...mumbaiRoadSigns.map(s=>'- '+s.text),'',
 '| Circle | Centre X, Z (m) | Road centre radius | Island radius |','| --- | --- | --- | --- |',
 ...roundabouts.map(r=>`| ${r.name} | ${r.x}, ${r.z} | ${r.radius} m | ${r.islandRadius} m |`),'',
 `Mumbai Chowk is exactly at the map centre. Its clear centre is radius ${CENTRAL_PLAZA.radius} m, at surface Y = ${CENTRAL_PLAZA.height} m. Future content should fit this reserved area; the surrounding radial paths, gardens and road remain usable. Dadar Garden Circle and Cuffe Parade Circle are additional smaller neighbourhood roundabouts.`,'',
 '## Scale and assets','',
 '[Original Blender and in-game previews](mumbai-landmarks/README.md)','',
 'Standing character profiles are 1.56–1.81 m before small crowd variation; the pavement is 0.16 m high. The auto canopy is approximately 2.08 m, cars 1.55 m high and 4.25 m long, the BEST midi bus 3.10 m high and 9.40 m long, and the scooter with rider approximately 1.95 m. Car bodies may naturally be shorter than adults. Long vehicle bodies use oriented collision envelopes.','',
 '[Editable Blender source and rebuild steps](../assets/architecture/mumbai/README.md) · [Reference records](research/mumbai/landmarks-sources.json) · [Celebrity home references](research/mumbai/celebrity-house-sources.json) · [Expansion references](research/mumbai/expansion-sources.json)','',
 'For interactive review, run `npm run dev` and open `/tools/landmark-preview/`. It loads the real game world, landmarks, character rigs, traffic models and lighting. Choose a landmark, switch between overview and street views, compare Standard/Low graphics, or select the common-ground vehicle/people scale lineup. This development tool is not added to the production player interface.','',
].join('\n'));
console.log('Wrote the landmark, road, shop and scale catalogue.');
