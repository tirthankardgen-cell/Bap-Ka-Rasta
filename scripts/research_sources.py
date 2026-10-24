"""Fetch primary references for the game plan and retain a small evidence record."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from hashlib import sha256
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import json
import re

import requests


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "research" / "source-checks.json"
CHECKED = "2026-10-24"

SOURCES = [
    ("S01", "Vite static deployment", "https://vite.dev/guide/static-deploy.html", ["Vercel", "dist", "preview"]),
    ("S02", "Vite on Vercel", "https://vercel.com/docs/frameworks/frontend/vite", ["rewrite", "Vite", "deployment"]),
    ("S03", "Three.js WebGL renderer", "https://threejs.org/docs/pages/WebGLRenderer.html", ["WebGL 2", "WebGL 1", "pixel"]),
    ("S04", "React Three Fiber performance pitfalls", "https://r3f.docs.pmnd.rs/advanced/pitfalls", ["setState", "delta", "reuse"]),
    ("S05", "React Three Fiber scaling performance", "https://r3f.docs.pmnd.rs/advanced/scaling-performance", ["draw call", "instanc", "performance"]),
    ("S06", "Three.js InstancedMesh", "https://threejs.org/docs/pages/InstancedMesh.html", ["draw call", "same geometry", "instance"]),
    ("S07", "Three.js GLTFLoader", "https://threejs.org/docs/pages/GLTFLoader.html", ["Meshopt", "KTX2", "DRACO"]),
    ("S08", "Three.js texture resource disposal", "https://threejs.org/docs/pages/Texture.html", ["dispose", "GPU", "memory"]),
    ("S09", "MDN pointer events", "https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events", ["pointercancel", "capture", "touch-action"]),
    ("S10", "MDN Web Audio best practices", "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices", ["gesture", "autoplay", "resume"]),
    ("S11", "MDN localStorage", "https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage", ["SecurityError", "private", "origin"]),
    ("S12", "MDN Page Visibility API", "https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API", ["background", "requestAnimationFrame", "visibilitychange"]),
    ("S13", "MDN WebGL best practices", "https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices", ["memory", "draw call", "context"]),
    ("S14", "Vercel Hobby plan", "https://vercel.com/docs/plans/hobby", ["non-commercial", "personal", "limit"]),
    ("S15", "Godot web export", "https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html", ["SharedArrayBuffer", "WebGL 2", "thread"]),
    ("S16", "Babylon.js engine capabilities", "https://www.babylonjs.com/specifications/", ["WebGPU", "WebGL", "physics"]),
    ("S17", "Marine Drive city reference", "https://www.incredibleindia.gov.in/en/maharashtra/mumbai/marine-drive", ["Arabian", "Queen", "Marine Drive"]),
    ("S18", "India Gate city reference", "https://www.incredibleindia.gov.in/en/delhi/delhi/india-gate", ["arch", "India Gate", "Rajpath"]),
    ("S19", "Howrah Bridge city reference", "https://www.incredibleindia.gov.in/en/west-bengal/kolkata/howrah-bridge", ["Hooghly", "cantilever", "Howrah"]),
    ("S20", "Marina Beach city reference", "https://www.incredibleindia.gov.in/en/tamil-nadu/chennai/marina-beach", ["Bay of Bengal", "Marina", "promenade"]),
    ("S21", "Bengaluru city reference", "https://www.incredibleindia.gov.in/en/karnataka/bengaluru", ["Cubbon", "Vidhana", "Garden"]),
    ("S22", "glTF Transform asset optimization", "https://gltf-transform.dev/cli", ["meshopt", "optimize", "texture"]),
    ("S23", "MDN prefers reduced motion", "https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion", ["reduce", "vestibular", "animation"]),
    ("S24", "Three.js license", "https://raw.githubusercontent.com/mrdoob/three.js/dev/LICENSE", ["MIT", "copyright", "permission"]),
    ("S25", "Meshoptimizer license", "https://raw.githubusercontent.com/zeux/meshoptimizer/master/LICENSE.md", ["MIT", "copyright", "permission"]),
    ("S26", "MDN Web Share API", "https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API", ["secure", "gesture", "permission"]),
]


class TextOnly(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.parts = []
        self.main_depth = 0
        self.main_parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "main":
            self.main_depth += 1
        if tag in {"script", "style", "noscript", "svg"}:
            self.hidden += 1

    def handle_endtag(self, tag):
        if tag == "main":
            self.main_depth = max(0, self.main_depth - 1)
        if tag in {"script", "style", "noscript", "svg"}:
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)
            if self.main_depth:
                self.main_parts.append(data)


def fetch(source):
    source_id, label, url, terms = source
    row = {"id": source_id, "label": label, "url": url, "checked_on": CHECKED}
    try:
        response = requests.get(url, timeout=(8, 24), headers={"User-Agent": "BapKaRoadProjectResearch/1.0"})
        row.update(status=response.status_code, final_url=response.url)
        response.raise_for_status()
        markup = response.text
        title = re.search(r"<title[^>]*>(.*?)</title>", markup, re.I | re.S)
        row["title"] = unescape(re.sub(r"\s+", " ", title.group(1)).strip()) if title else label
        parser = TextOnly()
        parser.feed(markup)
        readable = re.sub(r"\s+", " ", unescape(" ".join(parser.parts))).strip()
        main_text = re.sub(r"\s+", " ", unescape(" ".join(parser.main_parts))).strip()
        evidence_text = main_text if len(main_text) > 300 else readable
        excerpts = []
        for term in terms:
            # Whole-word matching keeps "arch" from matching a navigation "Search".
            expression = (r"\b" + re.escape(term) + r"\b") if term == "arch" else re.escape(term)
            matches = list(re.finditer(expression, evidence_text, re.I))
            candidates = []
            for match in matches:
                snippet = evidence_text[max(0, match.start() - 140): match.end() + 300]
                if any(nav in snippet.lower() for nav in ("hi, user name", "trending searches", "unfortunately we could not find", "apply clear north")):
                    continue
                if snippet not in candidates:
                    candidates.append(snippet)
            for snippet in candidates[:2]:
                excerpts.append({"term": term, "text": snippet})
        row["evidence"] = excerpts
        row["text_characters"] = len(readable)
        row["content_sha256"] = sha256(response.content).hexdigest()
        row["retrieved_at_utc"] = datetime.now(timezone.utc).isoformat()
    except Exception as exc:
        row["error"] = str(exc)
    return row


def main():
    rows = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        tasks = [pool.submit(fetch, item) for item in SOURCES]
        for task in as_completed(tasks):
            row = task.result()
            rows.append(row)
            print(f"{row['id']} {row.get('status', 'ERROR')} {row['label']}", flush=True)
    rows.sort(key=lambda row: row["id"])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"checked_on": CHECKED, "sources": rows}, indent=2, ensure_ascii=False), encoding="utf-8")
    failures = [row for row in rows if row.get("status") != 200 or "error" in row or not row.get("evidence")]
    print(f"Checked {len(rows)} primary sources; {len(failures)} failed. Evidence: {OUT}")
    if failures:
        print(json.dumps(failures, indent=2))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
