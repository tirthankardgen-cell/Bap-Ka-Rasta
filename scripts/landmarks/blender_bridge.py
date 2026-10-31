"""Run the landmark builder through Blender's local add-on, without MCP dependencies.

python scripts/landmarks/blender_bridge.py --info
python scripts/landmarks/blender_bridge.py scripts/landmarks/build_mumbai_landmarks.py
The add-on must already be listening on loopback port 9876.
"""
import argparse
import json
import socket
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('script', nargs='?', type=Path)
    parser.add_argument('--info', action='store_true')
    parser.add_argument('--timeout', type=float, default=900)
    args = parser.parse_args()
    if args.info:
        request = {'type': 'get_scene_info', 'params': {}}
    elif args.script:
        path = str(args.script.resolve(strict=True))
        code = f"exec(compile(open({path!r}, encoding='utf-8').read(), {path!r}, 'exec'), {{'__name__':'__main__', '__file__':{path!r}}})"
        request = {'type': 'execute_code', 'params': {'code': code}}
    else:
        parser.error('provide a script or --info')
    with socket.create_connection(('127.0.0.1', 9876), timeout=10) as client:
        client.settimeout(args.timeout)
        client.sendall(json.dumps(request).encode())
        chunks = bytearray()
        while True:
            chunk = client.recv(65536)
            if not chunk:
                raise RuntimeError('Blender disconnected before returning a result')
            chunks.extend(chunk)
            try:
                result = json.loads(chunks)
                break
            except (json.JSONDecodeError, UnicodeDecodeError):
                continue
    print(json.dumps(result, indent=2, ensure_ascii=True))
    if result.get('status') != 'success':
        raise RuntimeError(result.get('message', 'Blender command failed'))


if __name__ == '__main__':
    main()
