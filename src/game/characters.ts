import {
  streets,
  junctions,
  geometry,
  lanePosition,
  crossingPosition,
} from "./network.ts";

export type Character = {
  id: string;
  name: string;
  role: string;
  shirt: string;
  trousers: string;
  skin: string;
  hair: string;
  prop: string;
  style?: "sari" | "kurta";
  hat?: string;
  moustache?: boolean;
  line: string;
  clip: string;
};
export const characters: Character[] = [
  {
    id: "sachin",
    name: "Sachin",
    role: "Apna driver",
    shirt: "#ad956d",
    trousers: "#ac9365",
    skin: "#bd8755",
    hair: "#25251f",
    prop: "keys",
    moustache: true,
    line: "Chala, Mumbai! Aaj aaramat phirte hain.",
    clip: "ignition",
  },
  {
    id: "raju",
    name: "Raju Kaka",
    role: "Auto stand",
    shirt: "#b39a70",
    trousers: "#a68e65",
    skin: "#a77550",
    hair: "#9e9b91",
    prop: "towel",
    moustache: true,
    line: "Arre bhau, chai piyega? Abhi banayi hai.",
    clip: "greet_stand",
  },
  {
    id: "meera",
    name: "Meera Tai",
    role: "Cutting chai",
    shirt: "#34724c",
    trousers: "#743843",
    skin: "#a7704c",
    hair: "#292723",
    prop: "chai",
    style: "sari",
    line: "Bhau, cutting chai? Ekdum garam!",
    clip: "stall_enter",
  },
  {
    id: "sameer",
    name: "Sameer",
    role: "Auto workshop",
    shirt: "#39638a",
    trousers: "#394148",
    skin: "#b77b4d",
    hair: "#24251e",
    prop: "wrench",
    line: "Auto ki awaaz badle toh bata dena, bhau.",
    clip: "workshop_enter",
  },
  {
    id: "aarti",
    name: "Aarti",
    role: "Office jaane ka time",
    shirt: "#36628b",
    trousers: "#e7dac0",
    skin: "#b78057",
    hair: "#292720",
    prop: "bag",
    style: "kurta",
    line: "Train mil jaaye, bas. Aaj meeting hai.",
    clip: "queue_idle",
  },
  {
    id: "imran",
    name: "Imran",
    role: "College gang",
    shirt: "#873a44",
    trousers: "#4b5968",
    skin: "#b77c56",
    hair: "#22261e",
    prop: "headphones",
    line: "Chai ke baad seedha class. Pakka!",
    clip: "friend_idle",
  },
  {
    id: "lata",
    name: "Lata Mavshi",
    role: "Taaze phool",
    shirt: "#82528e",
    trousers: "#ce8346",
    skin: "#a7714b",
    hair: "#4c4439",
    prop: "flowers",
    style: "sari",
    line: "Taaze phool hain! Dekh lo, bhau.",
    clip: "stall_enter",
  },
  {
    id: "patil",
    name: "Constable Patil",
    role: "Traffic police",
    shirt: "#f1eee2",
    trousers: "#a78b59",
    skin: "#b17b51",
    hair: "#242721",
    prop: "whistle",
    hat: "#eee9da",
    moustache: true,
    line: "Crossing khaali rakho, bhau.",
    clip: "blocked_crossing",
  },
  {
    id: "nilesh",
    name: "Nilesh",
    role: "Dabbawala",
    shirt: "#f1eee0",
    trousers: "#e6e0d1",
    skin: "#a9724f",
    hair: "#28271e",
    prop: "tiffins",
    hat: "#f3eee0",
    moustache: true,
    line: "Dabba tayyar. Chala, nikalte hain!",
    clip: "tiffin_sort",
  },
  {
    id: "farah",
    name: "Farah",
    role: "Fruit stall",
    shirt: "#287b79",
    trousers: "#b79572",
    skin: "#b47c55",
    hair: "#2f2923",
    prop: "fruit",
    style: "kurta",
    line: "Aaram se chuno. Sab taaza hai.",
    clip: "stall_idle",
  },
  {
    id: "suresh",
    name: "Suresh",
    role: "Aaj ka akhbaar",
    shirt: "#bca784",
    trousers: "#626155",
    skin: "#a87850",
    hair: "#b6b1a3",
    prop: "paper",
    moustache: true,
    line: "Aaj ka akhbaar! Paper le lo!",
    clip: "paper_enter",
  },
  {
    id: "pooja",
    name: "Pooja",
    role: "Shift khatam",
    shirt: "#a78bc0",
    trousers: "#9280b0",
    skin: "#c28c63",
    hair: "#262920",
    prop: "badge",
    line: "Shift khatam. Ab bas ghar jaana hai.",
    clip: "queue_idle",
  },
  {
    id: "vikram",
    name: "Vikram",
    role: "Office commuter",
    shirt: "#90b4cf",
    trousers: "#354558",
    skin: "#a97853",
    hair: "#282a24",
    prop: "glasses",
    line: "Meeting se pehle ek chai mil jaaye.",
    clip: "queue_idle",
  },
  {
    id: "zoya",
    name: "Zoya",
    role: "Sketchbook wali",
    shirt: "#b75d3d",
    trousers: "#3d3a37",
    skin: "#b68058",
    hair: "#292a23",
    prop: "sketchbook",
    line: "Woh balcony dekho. Kitni sundar hai!",
    clip: "sketch_idle",
  },
  {
    id: "bala",
    name: "Bala",
    role: "Delivery rider",
    shirt: "#da8433",
    trousers: "#434644",
    skin: "#ab744d",
    hair: "#222821",
    prop: "delivery",
    hat: "#324455",
    line: "Bhau, address isi building ka hai na?",
    clip: "delivery_wait",
  },
  {
    id: "jyoti",
    name: "Jyoti",
    role: "Safai saathi",
    shirt: "#4380a2",
    trousers: "#416c8b",
    skin: "#9f704d",
    hair: "#272a22",
    prop: "broom",
    line: "Zara side, bhau. Safai karni hai.",
    clip: "sweep_wait",
  },
  {
    id: "shanta",
    name: "Shanta Aaji",
    role: "Apni padosan",
    shirt: "#7f9cb8",
    trousers: "#d0c6a9",
    skin: "#ba8c65",
    hair: "#c2bdb3",
    prop: "shopping",
    style: "sari",
    line: "Aaj hawa achhi hai. Thoda baithte hain.",
    clip: "bench_idle",
  },
  {
    id: "dev",
    name: "Dev",
    role: "Sheher ki tasveerein",
    shirt: "#617b55",
    trousers: "#c1ad7f",
    skin: "#b8825c",
    hair: "#393027",
    prop: "camera",
    line: "Ek photo aur. Yeh building kamaal ki hai!",
    clip: "photo_idle",
  },
  {
    id: "asha",
    name: "Asha",
    role: "Morning run",
    shirt: "#8b56a3",
    trousers: "#414349",
    skin: "#b98157",
    hair: "#292b25",
    prop: "bottle",
    line: "Paani break. Aaj dhoop tez hai.",
    clip: "water_break",
  },
  {
    id: "ganesh",
    name: "Ganesh",
    role: "Dukaan ka saamaan",
    shirt: "#b58a46",
    trousers: "#6c6c60",
    skin: "#a47450",
    hair: "#302b23",
    prop: "crate",
    moustache: true,
    line: "Maal aa gaya. Idhar rakh doon?",
    clip: "stock_arrived",
  },
];
export type District =
  | "waterfront"
  | "station"
  | "bazaar"
  | "residential"
  | "office"
  | "workshop";
export function districtFor(edge: number): District {
  const g = geometry(edge),
    x = (g.a.x + g.b.x) / 2,
    z = (g.a.z + g.b.z) / 2;
  if (x < -230) return "waterfront";
  if (x > 330)
    return (["bazaar", "residential", "workshop"] as const)[
      Math.abs(Math.floor(z / 220) + Math.floor(x / 160)) % 3
    ];
  return (["station", "office", "residential", "bazaar"] as const)[
    Math.abs(Math.floor(z / 220) + Math.floor(x / 180)) % 4
  ];
}
const pools: Record<District, number[]> = {
  waterfront: [18, 17, 13, 16, 11, 12],
  station: [8, 10, 12, 11, 14, 19],
  bazaar: [9, 19, 16, 8, 10, 14],
  residential: [16, 14, 9, 15, 13, 11],
  office: [12, 11, 13, 8, 17, 14],
  workshop: [19, 14, 15, 12, 8, 10],
};
export type Actor = {
  id: number;
  character: number;
  named: boolean;
  edge: number;
  side: number;
  phase: number;
  variant: number;
  activity: "walk" | "chat" | "browse" | "work";
  cross: number;
  home?: { x: number; z: number; yaw: number };
};
export function createActors(): Actor[] {
  const result: Actor[] = [];
  // Protected opening area: Raju and Meera each have one persistent home.
  const homes = [
    { x: -274, z: 326.8, yaw: 0 },
    { x: -277.5, z: 324, yaw: Math.PI / 2 },
  ];
  for (let c = 1; c < characters.length; c++) {
    const wanted: District =
      c === 3
        ? "workshop"
        : [6, 9, 19].includes(c)
          ? "bazaar"
          : [4, 8, 10].includes(c)
            ? "station"
            : [13, 17, 18].includes(c)
              ? "waterfront"
              : c === 16
                ? "residential"
                : "office";
    const eligible = streets.filter(
      (e) => !e.oneWay && districtFor(e.id) === wanted,
    );
    const e = eligible[(c * 7) % eligible.length];
    const p = lanePosition(
      e.id,
      e.a,
      geometry(e.id).length * (0.28 + (c % 3) * 0.2),
      e.width / 2 + 2.4,
    );
    result.push({
      id: result.length,
      character: c,
      named: true,
      edge: e.id,
      side: 1,
      phase: 0,
      variant: 0,
      activity: [3, 6, 9, 10, 15, 19].includes(c) ? "work" : "chat",
      cross: -1,
      home:
        c === 7
          ? { x: -65.5, z: -25.5, yaw: -Math.PI * 0.75 }
          : (homes[c - 1] ?? { x: p.x, z: p.z, yaw: p.yaw - Math.PI / 2 }),
    });
  }
  for (const e of streets) {
    if (e.oneWay || geometry(e.id).length < 90) continue;
    const district = districtFor(e.id),
      pool = pools[district];
    const count =
      district === "bazaar" || district === "station"
        ? 16
        : district === "residential"
          ? 10
          : 12;
    for (let i = 0; i < count; i++) {
      const chatting = i % 6 < 2;
      const phase = chatting
        ? 0.12 +
          Math.floor(i / 6) * 0.25 +
          ((i % 6) * 1.2) / (geometry(e.id).length - 65)
        : (i + 0.5) / count;
      result.push({
        id: result.length,
        character: pool[(i + e.id * 3) % pool.length],
        named: false,
        edge: e.id,
        side: chatting ? (Math.floor(i / 6) % 2 ? 1 : -1) : i % 2 ? 1 : -1,
        phase,
        variant: 1 + ((e.id * 11 + i) % 12),
        activity: chatting ? "chat" : i % 6 === 2 ? "browse" : "walk",
        cross: -1,
      });
    }
  }
  for (const n of junctions)
    if (n.signal)
      for (let i = 0; i < 2; i++)
        result.push({
          id: result.length,
          character: 8 + ((n.id + i) % 12),
          named: false,
          edge: 0,
          side: i ? 1 : -1,
          phase: i * 0.06,
          variant: 1 + (n.id % 12),
          activity: "walk",
          cross: n.id,
        });
  return result;
}
export function actorPose(a: Actor, time: number) {
  if (a.home) return { ...a.home, moving: false };
  if (a.cross >= 0)
    return crossingPosition(a.cross, time, a.side, a.phase * 12);
  const e = streets[a.edge],
    g = geometry(a.edge),
    span = g.length - 65;
  const active = a.activity === "walk";
  const speed =
    characters[a.character].id === "shanta"
      ? 0.65
      : characters[a.character].id === "asha"
        ? 1.8
        : 0.9 + (a.variant % 4) * 0.14;
  const phase = (a.phase + (active ? (time * speed) / span : 0)) % 2;
  const u = phase < 1 ? phase : 2 - phase;
  const p = lanePosition(
    e.id,
    e.a,
    32 + u * span,
    a.side * (e.width / 2 + (active ? 1.5 : 2.8)),
  );
  // Reserve a clear path around the opening auto stand; pedestrians stay farther along the promenade.
  if (p.x < -272 && p.x > -277 && p.z > 312 && p.z < 342)
    p.x -= 5 * Math.sin(((p.z - 312) / 30) * Math.PI);
  return {
    ...p,
    yaw:
      p.yaw +
      (active
        ? phase >= 1
          ? Math.PI
          : 0
        : a.activity === "chat"
          ? a.variant % 2
            ? 0
            : Math.PI
          : (a.side * Math.PI) / 2),
    moving: active,
  };
}
