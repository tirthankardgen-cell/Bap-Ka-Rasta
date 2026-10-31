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
  gender: "male" | "female";
  shirt: string;
  trousers: string;
  skin: string;
  hair: string;
  prop: string;
  style?: "sari" | "kurta";
  hat?: string;
  moustache?: boolean;
};
export const characters: Character[] = [
  {
    id: "sachin",
    gender: "male",
    name: "Sachin",
    role: "Auto driver",
    shirt: "#ad956d",
    trousers: "#ac9365",
    skin: "#bd8755",
    hair: "#25251f",
    prop: "keys",
    moustache: true,
  },
  {
    id: "raju",
    gender: "male",
    name: "Raju Kaka",
    role: "Auto driver",
    shirt: "#b39a70",
    trousers: "#a68e65",
    skin: "#a77550",
    hair: "#9e9b91",
    prop: "towel",
    moustache: true,
  },
  {
    id: "meera",
    gender: "female",
    name: "Meera Tai",
    role: "Chai seller",
    shirt: "#34724c",
    trousers: "#743843",
    skin: "#a7704c",
    hair: "#292723",
    prop: "chai",
    style: "sari",
  },
  {
    id: "sameer",
    gender: "male",
    name: "Sameer",
    role: "Mechanic",
    shirt: "#39638a",
    trousers: "#394148",
    skin: "#b77b4d",
    hair: "#24251e",
    prop: "wrench",
  },
  {
    id: "aarti",
    gender: "female",
    name: "Aarti",
    role: "Office commuter",
    shirt: "#36628b",
    trousers: "#e7dac0",
    skin: "#b78057",
    hair: "#292720",
    prop: "bag",
    style: "kurta",
  },
  {
    id: "imran",
    gender: "male",
    name: "Imran",
    role: "College student",
    shirt: "#873a44",
    trousers: "#4b5968",
    skin: "#b77c56",
    hair: "#22261e",
    prop: "headphones",
  },
  {
    id: "lata",
    gender: "female",
    name: "Lata Mavshi",
    role: "Flower seller",
    shirt: "#82528e",
    trousers: "#ce8346",
    skin: "#a7714b",
    hair: "#4c4439",
    prop: "flowers",
    style: "sari",
  },
  {
    id: "patil",
    gender: "male",
    name: "Constable Patil",
    role: "Traffic constable",
    shirt: "#f1eee2",
    trousers: "#a78b59",
    skin: "#b17b51",
    hair: "#242721",
    prop: "whistle",
    hat: "#eee9da",
    moustache: true,
  },
  {
    id: "nilesh",
    gender: "male",
    name: "Nilesh",
    role: "Dabbawala",
    shirt: "#f1eee0",
    trousers: "#e6e0d1",
    skin: "#a9724f",
    hair: "#28271e",
    prop: "tiffins",
    hat: "#f3eee0",
    moustache: true,
  },
  {
    id: "farah",
    gender: "female",
    name: "Farah",
    role: "Fruit seller",
    shirt: "#287b79",
    trousers: "#b79572",
    skin: "#b47c55",
    hair: "#2f2923",
    prop: "fruit",
    style: "kurta",
  },
  {
    id: "suresh",
    gender: "male",
    name: "Suresh",
    role: "Newspaper seller",
    shirt: "#bca784",
    trousers: "#626155",
    skin: "#a87850",
    hair: "#b6b1a3",
    prop: "paper",
    moustache: true,
  },
  {
    id: "pooja",
    gender: "female",
    name: "Pooja",
    role: "Nurse",
    shirt: "#a78bc0",
    trousers: "#9280b0",
    skin: "#c28c63",
    hair: "#262920",
    prop: "badge",
  },
  {
    id: "vikram",
    gender: "male",
    name: "Vikram",
    role: "Office commuter",
    shirt: "#90b4cf",
    trousers: "#354558",
    skin: "#a97853",
    hair: "#282a24",
    prop: "glasses",
  },
  {
    id: "zoya",
    gender: "female",
    name: "Zoya",
    role: "Artist",
    shirt: "#b75d3d",
    trousers: "#3d3a37",
    skin: "#b68058",
    hair: "#292a23",
    prop: "sketchbook",
  },
  {
    id: "bala",
    gender: "male",
    name: "Bala",
    role: "Delivery rider",
    shirt: "#da8433",
    trousers: "#434644",
    skin: "#ab744d",
    hair: "#222821",
    prop: "delivery",
    hat: "#324455",
  },
  {
    id: "jyoti",
    gender: "female",
    name: "Jyoti",
    role: "Safai saathi",
    shirt: "#4380a2",
    trousers: "#416c8b",
    skin: "#9f704d",
    hair: "#272a22",
    prop: "broom",
  },
  {
    id: "shanta",
    gender: "female",
    name: "Shanta Aaji",
    role: "Local resident",
    shirt: "#7f9cb8",
    trousers: "#d0c6a9",
    skin: "#ba8c65",
    hair: "#c2bdb3",
    prop: "shopping",
    style: "sari",
  },
  {
    id: "dev",
    gender: "male",
    name: "Dev",
    role: "Photographer",
    shirt: "#617b55",
    trousers: "#c1ad7f",
    skin: "#b8825c",
    hair: "#393027",
    prop: "camera",
  },
  {
    id: "asha",
    gender: "female",
    name: "Asha",
    role: "Jogger",
    shirt: "#8b56a3",
    trousers: "#414349",
    skin: "#b98157",
    hair: "#292b25",
    prop: "bottle",
  },
  {
    id: "ganesh",
    gender: "male",
    name: "Ganesh",
    role: "Shop worker",
    shirt: "#b58a46",
    trousers: "#6c6c60",
    skin: "#a47450",
    hair: "#302b23",
    prop: "crate",
    moustache: true,
  },
];
export type District =
  "waterfront" | "station" | "bazaar" | "residential" | "office" | "workshop";
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
  waterfront: [18, 17, 13, 16, 11, 12, 14, 1],
  station: [8, 10, 12, 11, 14, 19, 4, 5],
  bazaar: [9, 19, 16, 8, 10, 14, 6, 2],
  residential: [16, 14, 9, 15, 13, 11, 18, 5],
  office: [12, 11, 13, 8, 17, 14, 4, 7],
  workshop: [19, 14, 15, 12, 8, 10, 3, 1],
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
  jaywalk?: number;
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
        ? 22
        : district === "residential"
          ? 16
          : 18;
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
  for (const e of streets) {
    if (e.oneWay || geometry(e.id).length < 90) continue;
    const pool = pools[districtFor(e.id)];
    for (let i = 0; i < 3; i++)
      result.push({
        id: result.length,
        character: pool[(e.id + i * 3) % pool.length],
        named: false,
        edge: e.id,
        side: i % 2 ? 1 : -1,
        phase: e.id * 3.17 + i * 19.3,
        variant: 1 + ((e.id + i * 5) % 12),
        activity: "walk",
        cross: -1,
        jaywalk: 0.2 + i * 0.3,
      });
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
  if (a.jaywalk !== undefined) return jaywalkingPose(a, time);
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

// Each person follows a continuous loop with independently staggered pauses.
// Crossings are mid-block and diagonal; traffic lights do not gate this route.
const jayRoutes = new Map<
  string,
  { points: { x: number; z: number }[]; lengths: number[] }
>();
function jaywalkingPose(a: Actor, time: number) {
  const key = a.edge + ":" + a.jaywalk;
  let route = jayRoutes.get(key);
  if (!route) {
    const e = streets[a.edge],
      length = geometry(a.edge).length;
    let d = length * a.jaywalk!;
    const anchor = lanePosition(e.id, e.a, d, 0);
    if (anchor.x < -245 && anchor.z > 304 && anchor.z < 344)
      d = Math.min(length - 24, d + 45);
    const offset = e.width / 2 + 1.6;
    const points = [
      lanePosition(e.id, e.a, d - 8, -offset),
      lanePosition(e.id, e.a, d + 4, offset),
      lanePosition(e.id, e.a, d + 16, offset),
      lanePosition(e.id, e.a, d + 8, -offset),
    ];
    route = {
      points,
      lengths: points.map((p, i) =>
        Math.hypot(p.x - points[(i + 1) % 4].x, p.z - points[(i + 1) % 4].z),
      ),
    };
    jayRoutes.set(key, route);
  }
  const speed = 0.95 + (a.variant % 5) * 0.16,
    wait = 2 + (a.id % 5);
  const durations = route.lengths.map((d) => d / speed + wait);
  let clock = (time + a.phase) % durations.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 4; i++) {
    if (clock <= durations[i] || i === 3) {
      const from = route.points[i],
        to = route.points[(i + 1) % 4];
      const u = Math.min(
        1,
        Math.max(0, (clock - wait) / (durations[i] - wait)),
      );
      return {
        x: from.x + (to.x - from.x) * u,
        z: from.z + (to.z - from.z) * u,
        yaw: Math.atan2(to.x - from.x, to.z - from.z),
        moving: clock > wait,
      };
    }
    clock -= durations[i];
  }
  throw new Error("Invalid pedestrian route");
}

const maleNames =
  "Aarav Aditya Akash Amit Aniket Arjun Ashish Avinash Chetan Deepak Devendra Dinesh Farhan Gaurav Harish Irfan Karan Kunal Mahesh Manish Mohan Nikhil Omkar Prakash Rahul Rajesh Rohit Sagar Sameer Sanjay Vishal Yusuf".split(
    " ",
  );
const femaleNames =
  "Aditi Aishwarya Amruta Anjali Ankita Archana Deepa Divya Fatima Gauri Kavita Kiran Madhuri Manasi Manisha Neha Nisha Padmini Pallavi Poonam Priya Radhika Rashmi Ritu Riya Sakshi Salma Seema Shreya Smita Sonali Vaishali".split(
    " ",
  );
const surnames =
  "Sawant Shaikh Patil Shinde More Jadhav Pawar Deshmukh Kulkarni Joshi Naik Kadam Chavan Salunkhe Mane Bhosale Khan Ansari Qureshi Merchant Fernandes Dsouza Pereira Dsilva Dmello Shah Mehta Patel Desai Vora Jain Gupta Sharma Verma Mishra Tiwari Singh Yadav Maurya Pandey Iyer Nair Menon Pillai Shetty Kamble Kambli Gaikwad Wagh Rane Mhatre Koli Bhoir Dalvi Parab Gokhale Apte Borkar Sardesai Tendulkar Sutar Lohar Sayed Mirza".split(
    " ",
  );
export function actorIdentity(a: Actor) {
  const c = characters[a.character];
  if (a.named) return { name: c.name, role: c.role };
  const names = c.gender === "female"
    ? femaleNames
    : maleNames;
  return {
    name:
      names[a.id % names.length] +
      " " +
      surnames[Math.floor(a.id / names.length) % surnames.length],
    role: c.role,
  };
}
