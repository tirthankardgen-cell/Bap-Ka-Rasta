"""Rebuild the runtime scooter cues: python prepare.py --ffmpeg /path/to/ffmpeg."""
import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
args = parser.parse_args()
if not args.ffmpeg:
    parser.error('Supply --ffmpeg with an installed ffmpeg executable')

folder = Path(__file__).resolve().parent
root = folder.parents[2]
manifest = json.loads((folder / 'sources.json').read_text())
settings = {
    'engine': (4.0, 3.8, 'highpass=f=70,lowpass=f=6500,loudnorm=I=-22:TP=-2:LRA=7'),
    'horn': (0.04, 0.44, 'highpass=f=250,lowpass=f=4500,loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:d=0.01,afade=t=out:st=0.41:d=0.03'),
}
for recording in manifest['recordings']:
    source = folder / recording['file']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == recording['sha256'], source
    start, duration, filters = settings[recording['role']]
    output = root / f"public/audio/mumbai/scooty-{recording['role']}.mp3"
    subprocess.run([
        args.ffmpeg, '-nostdin', '-v', 'error', '-y', '-i', str(source),
        '-ss', str(start), '-t', str(duration), '-af', filters,
        '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', str(output),
    ], check=True)
    subprocess.run([args.ffmpeg, '-nostdin', '-v', 'error', '-xerror', '-i', str(output), '-f', 'null', '-'], check=True)
    recording['runtime'] = {
        'file': output.relative_to(root).as_posix(), 'startSeconds': start,
        'durationSeconds': duration, 'filters': filters,
        'encoding': 'mono 44.1 kHz, 128 kbps MP3',
        'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'bytes': output.stat().st_size,
    }
    print(output.name, output.stat().st_size, 'bytes; decode passed')
(folder / 'sources.json').write_text(json.dumps(manifest, indent=2) + '\n')
