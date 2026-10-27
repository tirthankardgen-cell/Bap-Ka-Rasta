"""Bounded public Overture download; never request the entire building dataset."""
import argparse
import io
import json
from pathlib import Path

import requests
from overturemaps import core
from overturemaps.writers import copy, get_writer


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bbox", default="72.819,18.930,72.829,18.937")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    bbox = tuple(map(float, args.bbox.split(",")))
    if len(bbox) != 4 or not (bbox[0] < bbox[2] and bbox[1] < bbox[3]):
        raise ValueError("Expected west,south,east,north bbox")
    if (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) > 0.0025:
        raise ValueError("Use a small district crop, at most 0.0025 square degrees")
    session = requests.Session()
    session.headers["User-Agent"] = "BapKaRastaMapPreparation/1.0 (+https://github.com/tirthankardgen-cell/Bap-Ka-Rasta)"

    # Public HTTP adapter keeps the same STAC selection logic while supporting
    # requests-managed proxies and an identifying User-Agent in this environment.
    def public_urlopen(url):
        response = session.get(url, timeout=45)
        response.raise_for_status()
        return io.BytesIO(response.content)

    core.urlopen = public_urlopen
    catalog = session.get(core.STAC_CATALOG_URL, timeout=30)
    catalog.raise_for_status()
    catalog = catalog.json()
    latest = catalog.get("latest") or next(link["href"].split("/")[-2] for link in catalog["links"] if link.get("latest"))
    catalog["latest"] = latest
    core._cached_stac_catalog = catalog
    print(f"Downloading only the requested building bbox from release {latest}", flush=True)
    files = core._get_files_from_stac("buildings", "building", core._coerce_bbox(bbox), latest)
    if files is None:
        raise RuntimeError("STAC index unavailable; refusing to scan the whole dataset")
    if not files:
        raise RuntimeError("No indexed building files cover this bbox")
    core._get_files_from_stac = lambda *unused: files
    print(f"STAC selected {len(files)} Parquet file(s)", flush=True)
    reader = core.record_batch_reader("building", bbox, latest, connect_timeout=15, request_timeout=30, stac=True)
    if reader is None:
        raise RuntimeError("No Overture data reader was produced")
    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    with get_writer("geojson", str(path), reader.schema) as writer:
        copy(reader, writer)
    path.with_suffix(".source.json").write_text(json.dumps({"release": latest, "bbox": bbox, "source": core.STAC_CATALOG_URL, "license": "ODbL-1.0", "bytes": path.stat().st_size}, indent=2), encoding="utf-8")
    print(f"Saved {path} ({path.stat().st_size} bytes)", flush=True)


if __name__ == "__main__":
    main()
