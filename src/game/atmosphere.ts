import * as THREE from "three";
export function atmosphere(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#4b91c1");
  sky.addColorStop(0.3, "#91bdd1");
  sky.addColorStop(0.49, "#f3d8aa");
  sky.addColorStop(0.55, "#b8b9ac");
  sky.addColorStop(1, "#7c827b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 512);
  const glow = ctx.createRadialGradient(750, 195, 3, 750, 195, 95);
  glow.addColorStop(0, "rgba(255,247,216,1)");
  glow.addColorStop(0.13, "rgba(255,228,164,.95)");
  glow.addColorStop(1, "rgba(255,223,157,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(650, 95, 200, 200);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(texture);
  pmrem.dispose();
  scene.background = texture;
  scene.environment = environment.texture;
  scene.fog = new THREE.Fog("#d7ccaf", 150, 480);
  const fill = new THREE.HemisphereLight("#c4e1f0", "#76654f", 1.4);
  scene.add(fill);
  const sun = new THREE.DirectionalLight("#ffead1", 3.2);
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
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  let last = -1,
    low = false;
  return {
    update(x: number, z: number, time: number) {
      if (Math.floor(time * 4) === last) return;
      last = Math.floor(time * 4);
      const cx = Math.round(x / 2) * 2,
        cz = Math.round(z / 2) * 2;
      sun.position.set(cx - 85, 115, cz - 60);
      sun.target.position.set(cx, 0, cz);
      sun.target.updateMatrixWorld();
      if (!low) renderer.shadowMap.needsUpdate = true;
    },
    quality(value: boolean) {
      low = value;
      renderer.shadowMap.enabled = !value;
      renderer.shadowMap.needsUpdate = true;
      scene.fog = new THREE.Fog("#d7ccaf", value ? 90 : 150, value ? 300 : 480);
    },
    dispose() {
      texture.dispose();
      environment.dispose();
      sun.shadow.map?.dispose();
    },
  };
}
