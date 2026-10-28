"""Small stdio MCP client for the locally installed Blender bridge.

python scripts/blender_mcp.py get_scene_info
python scripts/blender_mcp.py execute_blender_code --file scripts/vehicles/build_mumbai_auto.py
"""
import argparse
import asyncio
import base64
import json
import os
from pathlib import Path
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("tool")
    parser.add_argument("--file", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--bridge", type=Path, default=Path(os.environ.get("BLENDER_MCP_DIR", "D:/AI-Tools/blender-codex-mcp")))
    args = parser.parse_args()
    env = {**os.environ, "PYTHONPATH": str(args.bridge / "src"), "DISABLE_TELEMETRY": "true", "BLENDER_HOST": "127.0.0.1", "BLENDER_PORT": "9876"}
    params = StdioServerParameters(command=sys.executable, args=[str(args.bridge / "main.py")], env=env)
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            # The local Blender process can read the script directly. Keep MCP logs compact.
            arguments = {}
            if args.file:
                filename = str(args.file.resolve())
                arguments['code'] = (
                    f"exec(compile(open({filename!r}, encoding='utf-8').read(), {filename!r}, 'exec'), "
                    f"{{'__name__': '__main__', '__file__': {filename!r}}})"
                )
            result = await session.call_tool(args.tool, arguments=arguments)
            for item in result.content:
                if item.type == "text":
                    print(item.text)
                    if item.text.startswith('Error'):
                        raise RuntimeError(item.text)
                elif item.type == "image" and args.output:
                    args.output.parent.mkdir(parents=True, exist_ok=True)
                    args.output.write_bytes(base64.b64decode(item.data))
                    print(json.dumps({"image": str(args.output)}))
            if result.isError:
                raise RuntimeError("Blender MCP tool failed")


if __name__ == "__main__":
    asyncio.run(main())
