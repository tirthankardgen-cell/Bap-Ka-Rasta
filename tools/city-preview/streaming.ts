export type Tile = { id: string; bounds: number[]; url: string; bytes: number };
export type Pose = { x: number; z: number; yaw: number };

export function selectTiles(tiles: Tile[], pose: Pose, limit = 18) {
  const forwardX = Math.sin(pose.yaw), forwardZ = Math.cos(pose.yaw);
  return tiles.map(tile => {
    const [minX, minZ, maxX, maxZ] = tile.bounds;
    const nearestX = Math.max(minX, Math.min(maxX, pose.x));
    const nearestZ = Math.max(minZ, Math.min(maxZ, pose.z));
    const distance = Math.hypot(nearestX - pose.x, nearestZ - pose.z);
    const dx = (minX + maxX) / 2 - pose.x, dz = (minZ + maxZ) / 2 - pose.z;
    const radius = Math.hypot(maxX - minX, maxZ - minZ) / 2;
    const front = dx * forwardX + dz * forwardZ;
    const side = Math.abs(dx * forwardZ - dz * forwardX);
    const nearby = distance <= 140;
    const ahead = front >= 0 && front <= 350 + radius && side <= 90 + radius;
    return { tile, wanted: nearby || ahead, priority: nearby ? distance - 500 : distance + side * 0.4 };
  }).filter(item => item.wanted).sort((a, b) => a.priority - b.priority).slice(0, limit).map(item => item.tile);
}

export class TileStreamer<T> {
  private wanted = new Map<string, Tile>();
  private resident = new Map<string, { tile: Tile; value: T; touched: number }>();
  private requests = new Map<string, AbortController>();
  private failed = new Map<string, number>();
  private tick = 0;
  private stopped = false;
  downloadedBytes = 0;
  fetchedTiles = new Set<string>();
  evictedTiles = 0;
  maxActiveRequests = 0;
  errors: string[] = [];
  private load: (tile: Tile, signal: AbortSignal) => Promise<T>;
  private dispose: (value: T) => void;
  private changed: () => void;
  readonly maxResident: number;
  readonly concurrency: number;

  constructor(load: (tile: Tile, signal: AbortSignal) => Promise<T>,
              dispose: (value: T) => void, changed: () => void,
              maxResident = 22, concurrency = 3) {
    this.load = load; this.dispose = dispose; this.changed = changed;
    this.maxResident = maxResident; this.concurrency = concurrency;
  }

  update(tiles: Tile[]) {
    if (this.stopped) return;
    this.tick++;
    this.wanted = new Map(tiles.map(tile => [tile.id, tile]));
    for (const tile of tiles) {
      const entry = this.resident.get(tile.id);
      if (entry) entry.touched = this.tick;
    }
    for (const [id, request] of this.requests) if (!this.wanted.has(id)) request.abort();
    this.evict();
    this.pump();
    this.changed();
  }

  private evict() {
    const extras = [...this.resident].filter(([id]) => !this.wanted.has(id))
      .sort((a, b) => a[1].touched - b[1].touched);
    while (this.resident.size > this.maxResident && extras.length) {
      const [id, entry] = extras.shift()!;
      this.resident.delete(id);
      this.dispose(entry.value);
      this.evictedTiles++;
    }
  }

  private pump() {
    if (this.stopped) return;
    for (const [id, tile] of this.wanted) {
      if (this.requests.size >= this.concurrency) break;
      if (this.resident.has(id) || this.requests.has(id) || Date.now() - (this.failed.get(id) ?? 0) < 3000) continue;
      const controller = new AbortController();
      this.requests.set(id, controller);
      this.maxActiveRequests = Math.max(this.maxActiveRequests, this.requests.size);
      this.load(tile, controller.signal).then(value => {
        this.downloadedBytes += tile.bytes;
        this.fetchedTiles.add(id);
        if (this.stopped || controller.signal.aborted || !this.wanted.has(id)) this.dispose(value);
        else this.resident.set(id, { tile, value, touched: this.tick });
      }).catch(error => {
        if (!controller.signal.aborted) {
          this.failed.set(id, Date.now());
          this.errors.push(`${id}: ${String(error)}`);
        }
      }).finally(() => {
        this.requests.delete(id);
        this.evict();
        this.changed();
        this.pump();
      });
    }
  }

  stats() {
    return { resident: this.resident.size, wanted: this.wanted.size, requests: this.requests.size,
      residentIds: [...this.resident.keys()], wantedIds: [...this.wanted.keys()],
      downloadedBytes: this.downloadedBytes, fetchedTiles: this.fetchedTiles.size,
      evictedTiles: this.evictedTiles, maxActiveRequests: this.maxActiveRequests, errors: [...this.errors] };
  }

  stop() {
    this.stopped = true;
    for (const request of this.requests.values()) request.abort();
    for (const entry of this.resident.values()) this.dispose(entry.value);
    this.resident.clear();
    this.wanted.clear();
    this.changed();
  }
}
