"""Verify the checked-in audio library; optionally probe and fully decode each MP3."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffprobe', help='Optional ffprobe executable name or path')
    parser.add_argument('--ffmpeg', help='Optional ffmpeg executable for full decode checks')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1] / 'assets/audio/mumbai'
    manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    recordings = manifest['recordings']
    actual_files = {file.relative_to(root).as_posix() for file in root.rglob('*.mp3')}
    expected_files = {row['file'] for row in recordings}
    if len(expected_files) != len(recordings) or actual_files != expected_files:
        raise ValueError('Manifest and audio files differ, or paths are duplicated')
    if len({row['id'] for row in recordings}) != len(recordings):
        raise ValueError('Recording IDs are duplicated')
    credits = (root / 'ATTRIBUTION.md').read_text(encoding='utf-8')
    for row in recordings:
        file = (root / row['file']).resolve()
        if not file.is_relative_to(root.resolve()):
            raise ValueError(f"Path escapes the audio library: {row['file']}")
        data = file.read_bytes()
        if len(data) != row['bytes'] or hashlib.sha256(data).hexdigest() != row['sha256']:
            raise ValueError(f"Size or checksum mismatch: {row['file']}")
        if row['license'] not in {'CC0-1.0', 'CC-BY-4.0', 'CC-BY-3.0'}:
            raise ValueError(f"Unexpected license: {row['file']}")
        if not (root / 'licenses' / (row['license'] + '.txt')).is_file():
            raise ValueError(f"Missing license text: {row['file']}")
        if any(value not in credits for value in [row['file'], row['source_url'], row['license_url'], row['creator']]):
            raise ValueError(f"Missing attribution: {row['file']}")
        if args.ffprobe:
            probe = json.loads(subprocess.check_output([
                args.ffprobe, '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(file)
            ], timeout=30))
            streams = probe['streams']
            if len(streams) != 1 or streams[0]['codec_name'] != 'mp3':
                raise ValueError(f"Not a single MP3 audio stream: {row['file']}")
            if (int(streams[0]['sample_rate']) != row['sample_rate_hz']
                    or streams[0]['channels'] != row['channels']
                    or abs(float(probe['format']['duration']) - row['duration_seconds']) > 0.01):
                raise ValueError(f"Audio metadata differs: {row['file']}")
        if args.ffmpeg:
            subprocess.run([
                args.ffmpeg, '-nostdin', '-v', 'error', '-xerror', '-i', str(file), '-f', 'null', '-'
            ], check=True, timeout=60, stdout=subprocess.DEVNULL)
    summary = manifest['summary']
    if (len(recordings) != summary['recordings']
            or sum(row['bytes'] for row in recordings) != summary['total_bytes']
            or abs(sum(row['duration_seconds'] for row in recordings) - summary['total_duration_seconds']) > 0.01
            or dict(Counter(row['location_scope'] for row in recordings)) != summary['location_scopes']
            or dict(Counter(row['license'] for row in recordings)) != summary['licenses']):
        raise ValueError('Summary does not match the recordings')
    print(f"Verified {len(recordings)} MP3s, {summary['total_bytes']:,} bytes, "
          f"{summary['total_duration_seconds'] / 60:.1f} minutes; all checksums and credits match.")
    if args.ffprobe:
        print('All MP3 streams, sample rates, channels and durations match the manifest.')
    if args.ffmpeg:
        print('Every recording decoded completely without ffmpeg errors.')


if __name__ == '__main__':
    main()
