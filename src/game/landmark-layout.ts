/** Authored, compact Mumbai layout. One world unit is one metre; north is -Z.
 * Heights are kept at architectural scale; long footprints and travel distances
 * are compressed to fit the playable neighbourhood. Facades face local +Z.
 */
export type LandmarkSite = {
  id: string;
  name: string;
  district: string;
  x: number;
  z: number;
  yaw: number;
  width: number;
  depth: number;
  height: number;
  halfWidth: number;
  halfLength: number;
  kind: "landmark" | "shop";
  reference: string;
  heightBasis: "published" | "visual estimate";
};

export const landmarkSites: readonly LandmarkSite[] = [
  { id: "mannat", name: "Mannat · Shah Rukh Khan", district: "Bandra / Bandstand", x: -175, z: -919, yaw: -Math.PI / 2, width: 53, depth: 53, height: 32, halfWidth: 37, halfLength: 37, kind: "landmark", reference: "https://www.google.com/search?tbm=isch&q=Mannat+Shah+Rukh+Khan+house+Bandstand+exterior", heightBasis: "visual estimate" },
  { id: "galaxy", name: "Galaxy Apartments · Salman Khan", district: "Bandra / Bandstand", x: -178, z: -761, yaw: -Math.PI / 2, width: 26, depth: 27, height: 26, halfWidth: 22, halfLength: 24, kind: "landmark", reference: "https://www.google.com/search?tbm=isch&q=Galaxy+Apartments+Salman+Khan+Bandra+exterior", heightBasis: "visual estimate" },
  { id: "jalsa", name: "Jalsa · Amitabh Bachchan", district: "Juhu Quarter", x: 18, z: -1092, yaw: Math.PI / 2, width: 47, depth: 38, height: 15, halfWidth: 32, halfLength: 29, kind: "landmark", reference: "https://www.google.com/search?tbm=isch&q=Jalsa+Amitabh+Bachchan+bungalow+exterior", heightBasis: "visual estimate" },
  { id: "taj-palace", name: "Taj Mahal Palace", district: "Colaba", x: 218, z: 518, yaw: Math.PI / 2, width: 120, depth: 62, height: 73, halfWidth: 70, halfLength: 44, kind: "landmark", reference: "Taj_Mahal_Palace_Hotel", heightBasis: "visual estimate" },
  { id: "gateway", name: "Gateway of India", district: "Gateway Waterfront", x: 349, z: 542, yaw: -Math.PI / 2, width: 45, depth: 23, height: 26, halfWidth: 34, halfLength: 27, kind: "landmark", reference: "Gateway_of_India", heightBasis: "published" },
  { id: "antilia", name: "Antilia", district: "Cumballa Hill", x: -172, z: -588, yaw: Math.PI / 2, width: 55, depth: 49, height: 173, halfWidth: 42, halfLength: 43, kind: "landmark", reference: "Antilia_(building)", heightBasis: "published" },
  { id: "csmt", name: "Chhatrapati Shivaji Maharaj Terminus", district: "Station Quarter", x: 200, z: -365, yaw: 0, width: 130, depth: 64, height: 78, halfWidth: 74, halfLength: 52, kind: "landmark", reference: "Chhatrapati_Shivaji_Terminus", heightBasis: "visual estimate" },
  { id: "bmc", name: "BMC Headquarters", district: "Station Quarter", x: 199, z: -198, yaw: Math.PI, width: 108, depth: 46, height: 77.7, halfWidth: 65, halfLength: 38, kind: "landmark", reference: "Municipal_Corporation_Building,_Mumbai", heightBasis: "published" },
  { id: "rajabai", name: "Rajabai Clock Tower", district: "Fort / Oval Maidan", x: 12, z: 65, yaw: -Math.PI / 2, width: 43, depth: 38, height: 85, halfWidth: 29, halfLength: 30, kind: "landmark", reference: "Rajabai_Clock_Tower", heightBasis: "published" },
  { id: "crawford", name: "Crawford Market", district: "Crawford / Bazaar", x: 198, z: -561, yaw: 0, width: 106, depth: 60, height: 32, halfWidth: 64, halfLength: 42, kind: "landmark", reference: "Crawford_Market", heightBasis: "visual estimate" },
  { id: "asiatic", name: "Asiatic Library / Town Hall", district: "Fort", x: 238, z: 275, yaw: -Math.PI / 2, width: 76, depth: 42, height: 24, halfWidth: 47, halfLength: 33, kind: "landmark", reference: "Asiatic_Society_of_Mumbai", heightBasis: "visual estimate" },
  { id: "eros", name: "Eros Cinema", district: "Churchgate", x: -173, z: -90, yaw: 0, width: 68, depth: 36, height: 34, halfWidth: 44, halfLength: 28, kind: "landmark", reference: "Eros_Cinema", heightBasis: "visual estimate" },
  { id: "regal", name: "Regal Cinema", district: "Colaba", x: 12, z: 330, yaw: 0, width: 54, depth: 38, height: 25, halfWidth: 35, halfLength: 30, kind: "landmark", reference: "Regal_Cinema", heightBasis: "visual estimate" },
  { id: "flora", name: "Flora Fountain", district: "Fort / Hutatma Chowk", x: 110, z: 180, yaw: 0, width: 12, depth: 12, height: 12, halfWidth: 11, halfLength: 11, kind: "landmark", reference: "Flora_Fountain", heightBasis: "visual estimate" },
  { id: "mount-mary", name: "Mount Mary Basilica", district: "Bandra Hill", x: 528, z: -916, yaw: 0, width: 50, depth: 64, height: 45, halfWidth: 32, halfLength: 43, kind: "landmark", reference: "Basilica_of_Our_Lady_of_the_Mount", heightBasis: "visual estimate" },
  { id: "siddhivinayak", name: "Siddhivinayak Temple", district: "Dadar / Prabhadevi", x: 886, z: -582, yaw: Math.PI / 2, width: 50, depth: 45, height: 38, halfWidth: 33, halfLength: 34, kind: "landmark", reference: "Siddhivinayak_Temple,_Mumbai", heightBasis: "visual estimate" },
  { id: "world-one", name: "World One", district: "Lower Parel", x: 1068, z: -360, yaw: 0, width: 68, depth: 62, height: 280.2, halfWidth: 43, halfLength: 45, kind: "landmark", reference: "World_One", heightBasis: "published" },
  { id: "opera-house", name: "Royal Opera House", district: "Girgaon Arts Quarter", x: 710, z: -355, yaw: -Math.PI / 2, width: 57, depth: 37, height: 28, halfWidth: 36, halfLength: 30, kind: "landmark", reference: "Royal_Opera_House_(Mumbai)", heightBasis: "visual estimate" },
  { id: "nehru-centre", name: "Nehru Centre", district: "Worli Quarter", x: 886, z: 62, yaw: Math.PI, width: 62, depth: 54, height: 91, halfWidth: 41, halfLength: 38, kind: "landmark", reference: "Nehru_Centre", heightBasis: "visual estimate" },
  { id: "high-court", name: "Bombay High Court", district: "Fort / Oval Maidan", x: 530, z: 280, yaw: 0, width: 80, depth: 50, height: 52, halfWidth: 49, halfLength: 39, kind: "landmark", reference: "Bombay_High_Court", heightBasis: "visual estimate" },
  { id: "bse", name: "Bombay Stock Exchange", district: "Dalal Street", x: 711, z: 505, yaw: Math.PI / 2, width: 52, depth: 48, height: 118, halfWidth: 35, halfLength: 36, kind: "landmark", reference: "Phiroze_Jeejeebhoy_Towers", heightBasis: "published" },
  { id: "world-trade-centre", name: "World Trade Centre", district: "Cuffe Parade", x: 892, z: 992, yaw: 0, width: 106, depth: 55, height: 155.9, halfWidth: 62, halfLength: 43, kind: "landmark", reference: "World_Trade_Centre,_Mumbai", heightBasis: "published" },
  { id: "leopold", name: "Leopold Cafe", district: "Colaba Causeway", x: 51, z: 433, yaw: Math.PI, width: 16, depth: 13, height: 13, halfWidth: 11, halfLength: 10, kind: "shop", reference: "Leopold_Cafe", heightBasis: "visual estimate" },
  { id: "mondegar", name: "Cafe Mondegar", district: "Colaba Causeway", x: 12, z: 433, yaw: Math.PI, width: 17, depth: 13, height: 14, halfWidth: 12, halfLength: 10, kind: "shop", reference: "Cafe_Mondegar", heightBasis: "visual estimate" },
  { id: "kyani", name: "Kyani & Co.", district: "Dhobi Talao", x: -21, z: -282, yaw: 0, width: 15, depth: 12, height: 11, halfWidth: 11, halfLength: 9, kind: "shop", reference: "Kyani_%26_Co.", heightBasis: "visual estimate" },
  { id: "yazdani", name: "Yazdani Bakery", district: "Fort", x: -25, z: 217, yaw: Math.PI, width: 13, depth: 11, height: 8, halfWidth: 9, halfLength: 9, kind: "shop", reference: "Yazdani_Bakery", heightBasis: "visual estimate" },
  { id: "kitab", name: "Kitab Khana", district: "Fort", x: 16, z: 217, yaw: Math.PI, width: 16, depth: 13, height: 14, halfWidth: 11, halfLength: 10, kind: "shop", reference: "Kitab_Khana", heightBasis: "visual estimate" },
  { id: "fashion", name: "Fashion Street", district: "Maidan Avenue", x: -55, z: 124, yaw: -Math.PI / 2, width: 19, depth: 7, height: 5, halfWidth: 12, halfLength: 7, kind: "shop", reference: "Fashion_Street", heightBasis: "visual estimate" },
  { id: "bademiya", name: "Bademiya", district: "Colaba", x: 67, z: 585, yaw: 0, width: 13, depth: 9, height: 6, halfWidth: 10, halfLength: 8, kind: "shop", reference: "Bademiya", heightBasis: "visual estimate" },
];

/** Open approaches keep ordinary frontage from obscuring landmarks at road level.
 * Distances are in local +Z, from the site's origin to just before the footpath.
 */
const frontageDepths: Readonly<Record<string,number>> = {
  mannat:71, galaxy:68, jalsa:80, "taj-palace":58, gateway:45, antilia:80,
  csmt:84, bmc:46, rajabai:80, crawford:65, asiatic:110, eros:35, regal:58,
  "mount-mary":69, siddhivinayak:81, "world-one":86, "opera-house":86,
  "nehru-centre":86, "high-court":106, bse:73, "world-trade-centre":114,
};
export const landmarkApproaches = landmarkSites.flatMap(site => {
  const end=frontageDepths[site.id];
  if(!end || end<=site.halfLength) return [];
  const halfLength=(end-site.halfLength)/2, distance=site.halfLength+halfLength;
  return [{id:site.id, x:site.x+Math.sin(site.yaw)*distance, z:site.z+Math.cos(site.yaw)*distance,
    yaw:site.yaw, halfWidth:site.width/2, halfLength, end}];
});
/** Complete forecourts, balconies, stairs and approaches precede ordinary lots. */
export const landmarkReservations = [
  ...landmarkSites.map(({ x, z, yaw, halfWidth, halfLength }) => ({ x, z, yaw, halfWidth, halfLength })),
  ...landmarkApproaches,
];

export const mumbaiRoadSigns = [
  { text: "MARINE DRIVE · QUEEN'S NECKLACE", x: -246, z: 260, yaw: Math.PI / 2 },
  { text: "ALTAMOUNT ROAD · ANTILIA", x: -93, z: -585, yaw: -Math.PI / 2 },
  { text: "D. N. ROAD · CSMT", x: 124, z: -302, yaw: Math.PI / 2 },
  { text: "MAHARSHI KARVE ROAD · EROS", x: -94, z: -106, yaw: -Math.PI / 2 },
  { text: "SHAHID BHAGAT SINGH ROAD · COLABA", x: 59, z: 391, yaw: Math.PI },
  { text: "APOLLO BUNDER · TAJ / GATEWAY", x: 276, z: 580, yaw: -Math.PI / 2 },
  { text: "MOHAMMED ALI ROAD · CRAWFORD MARKET", x: 308, z: -537, yaw: Math.PI / 2 },
  { text: "HORNIMAN CIRCLE · TOWN HALL", x: 277, z: 310, yaw: -Math.PI / 2 },
  { text: "FASHION STREET · M. G. ROAD", x: -69, z: 105, yaw: Math.PI / 2 },
  { text: "BANDSTAND · MANNAT / GALAXY", x: -246, z: -940, yaw: Math.PI / 2 },
  { text: "JUHU TARA ROAD · JALSA", x: 32, z: -1185, yaw: 0 },
  { text: "MUMBAI CHOWK · CENTRAL CIRCLE", x: 361, z: -57, yaw: Math.PI },
  { text: "MOUNT MARY · BANDRA HILL", x: 597, z: -871, yaw: -Math.PI / 2 },
  { text: "SIDDHIVINAYAK · PRABHADEVI", x: 959, z: -560, yaw: -Math.PI / 2 },
  { text: "LOWER PAREL · WORLD ONE", x: 998, z: -318, yaw: Math.PI / 2 },
  { text: "WORLI · NEHRU CENTRE", x: 818, z: 38, yaw: Math.PI / 2 },
  { text: "DALAL STREET · STOCK EXCHANGE", x: 780, z: 551, yaw: -Math.PI / 2 },
  { text: "CUFFE PARADE · WORLD TRADE CENTRE", x: 819, z: 1075, yaw: Math.PI / 2 },
] as const;
