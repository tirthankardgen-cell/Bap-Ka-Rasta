import * as THREE from "three";
export function atmosphere(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#bb873f");
  sky.addColorStop(0.3, "#e9b75f");
  sky.addColorStop(0.49, "#ffe4a2");
  sky.addColorStop(0.55, "#ddbe83");
  sky.addColorStop(1, "#7c827b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 512);
  const glow = ctx.createRadialGradient(750, 235, 12, 750, 235, 100);
  glow.addColorStop(0, "rgba(255,247,216,1)");
  glow.addColorStop(0.13, "rgba(255,228,164,.95)");
  glow.addColorStop(1, "rgba(255,223,157,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(650, 135, 200, 200);
  ctx.fillStyle = "#fff9c9";
  ctx.beginPath();
  ctx.arc(750, 235, 15, 0, Math.PI * 2);
  ctx.fill();
  // Thin warm clouds in the sunset sky; deterministic, locally generated.
  for (let i = 0; i < 28; i++) {
    const x = (i * 137) % 1024,
      y = 80 + ((i * 47) % 115);
    const cloud = ctx.createRadialGradient(x, y, 2, x, y, 40);
    cloud.addColorStop(0, "rgba(255,235,181,.27)");
    cloud.addColorStop(1, "rgba(255,235,181,0)");
    ctx.fillStyle = cloud;
    ctx.fillRect(x - 40, y - 20, 80, 40);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(texture);
  pmrem.dispose();
  scene.background = texture;
  scene.environment = environment.texture;
  scene.fog = new THREE.Fog("#e8c386", 140, 320);
  const fill = new THREE.HemisphereLight("#ffe6ad", "#84623e", 1.1);
  scene.add(fill);
  const sun = new THREE.DirectionalLight("#ffd087", 3.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.camera.left = -65;
  sun.shadow.camera.right = 65;
  sun.shadow.camera.top = 65;
  sun.shadow.camera.bottom = -65;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 300;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.08;
  scene.add(sun, sun.target);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  let last = -1,
    low = false;
  return {
    update(x: number, z: number, time: number) {
      if (Math.floor(time * 4) === last) return;
      last = Math.floor(time * 4);
      const cx = Math.round(x / 2) * 2,
        cz = Math.round(z / 2) * 2;
      sun.position.set(cx - 85, 65, cz - 100);
      sun.target.position.set(cx, 0, cz);
      sun.target.updateMatrixWorld();
      if (!low) renderer.shadowMap.needsUpdate = true;
    },
    quality(value: boolean) {
      low = value;
      renderer.shadowMap.enabled = !value;
      renderer.shadowMap.needsUpdate = true;
      scene.fog = new THREE.Fog("#e8c386", value ? 90 : 140, value ? 240 : 320);
    },
    dispose() {
      texture.dispose();
      environment.dispose();
      sun.shadow.map?.dispose();
    },
  };
}
