import assert from "node:assert/strict";
import { test } from "node:test";
import { marineDriveRoute, type Road } from "./route.ts";
import { selectTiles, TileStreamer, type Tile } from "./streaming.ts";

const tile = (id: string, x = 0, z = 0): Tile => ({ id, bounds: [x, z, x + 125, z + 125], url: id + ".glb", bytes: 100 });
const flush = () => new Promise<void>(resolve => setImmediate(resolve));

test("selection protects nearby tiles and changes the forward corridor on reversal", () => {
  const tiles = [tile("near"), tile("front", 0, 300), tile("back", 0, -425), tile("side", 500, 0)];
  const forward = selectTiles(tiles, { x: 60, z: 60, yaw: 0 }).map(t => t.id);
  const reverse = selectTiles(tiles, { x: 60, z: 60, yaw: Math.PI }).map(t => t.id);
  assert.deepEqual(forward, ["near", "front"]);
  assert.deepEqual(reverse, ["near", "back"]);
  assert.equal(selectTiles(tiles, { x: 60, z: 60, yaw: 0 }, 1).length, 1);
});

test("requests and resident scenery stay bounded while old tiles are disposed", async () => {
  const disposed: string[] = [];
  let active = 0, maxActive = 0;
  const streamer = new TileStreamer(async t => {
    maxActive = Math.max(maxActive, ++active);
    await flush();
    active--;
    return t.id;
  }, id => disposed.push(id), () => {});
  streamer.update(Array.from({ length: 18 }, (_, i) => tile("first" + i)));
  assert.equal(streamer.stats().requests, 3);
  for (let i = 0; i < 30 && streamer.stats().requests; i++) await flush();
  assert.equal(streamer.stats().resident, 18);
  streamer.update(Array.from({ length: 18 }, (_, i) => tile("second" + i)));
  for (let i = 0; i < 30 && streamer.stats().requests; i++) await flush();
  assert.equal(streamer.stats().resident, 22);
  assert.equal(streamer.stats().evictedTiles, 14);
  assert.equal(disposed.length, 14);
  assert.ok(maxActive <= 3);
  assert.ok(streamer.stats().wantedIds.every(id => streamer.stats().residentIds.includes(id)));
  streamer.stop();
  assert.equal(disposed.length, 36);
});

test("an aborted parse cannot become resident after rapid reversal or scene stop", async () => {
  const loads: { id: string; signal: AbortSignal; resolve: (value: string) => void }[] = [];
  const disposed: string[] = [];
  const streamer = new TileStreamer<string>((t, signal) => new Promise(resolve => loads.push({ id: t.id, signal, resolve })), id => disposed.push(id), () => {});
  streamer.update([tile("a")]);
  streamer.update([tile("b")]);
  streamer.update([tile("a")]);
  assert.ok(loads[0].signal.aborted);
  loads[0].resolve("aborted-a");
  await flush();
  assert.equal(streamer.stats().resident, 0);
  assert.deepEqual(disposed, ["aborted-a"]);
  assert.equal(loads.filter(l => l.id === "a").length, 2);
  const retry = loads.at(-1)!;
  retry.resolve("fresh-a");
  await flush();
  assert.deepEqual(streamer.stats().residentIds, ["a"]);
  streamer.stop();
  loads[1].resolve("late-b");
  await flush();
  streamer.update([tile("c")]);
  assert.equal(streamer.stats().resident, 0);
  assert.equal(streamer.stats().requests, 0);
  assert.equal(loads.length, 3);
  assert.deepEqual(disposed, ["aborted-a", "fresh-a", "late-b"]);
  assert.deepEqual(streamer.stats().errors, []);
});

test("route joins shared OSM nodes and preserves one-way carriageways", () => {
  const road = (id: string, nodeIds: string[], coordinates: number[][]): Road => ({ id, name: "Marine Drive", nodeIds, coordinates, tags: { oneway: "yes" } });
  const roads = [
    road("south", ["a", "b"], [[0, 80], [0, 0]]),
    road("continuation", ["b", "c"], [[0, 0], [0, -80]]),
    road("opposite", ["x", "y"], [[15, -80], [15, 0]]),
    road("disconnected", ["u", "v"], [[-60, 0], [-60, 50]])
  ];
  assert.deepEqual(marineDriveRoute(roads, [-200, -200, 200, 200]), [[0, 80], [0, 0], [0, -80]]);
});
