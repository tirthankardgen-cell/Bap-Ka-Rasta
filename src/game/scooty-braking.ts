import * as THREE from "three";

/** Pose only player-owned geometry; hands stay on the bars in both camera views. */
export function riderBrakePose(meshes: THREE.Mesh[]) {
  const point = new THREE.Vector3(), posed = new THREE.Vector3();
  const hip = new THREE.Vector3(0, 0.86, -0.18);
  for (const mesh of meshes) {
    mesh.updateWorldMatrix(true, false);
    const matrix = mesh.matrixWorld.clone(), inverse = matrix.clone().invert();
    const geometry = mesh.geometry, positions = geometry.getAttribute("position");
    const bounds = new THREE.Box3().setFromObject(mesh);
    const legs = bounds.max.y < 1 && bounds.min.y < 0.5;
    const shoes = bounds.max.y < 0.45;
    const targets: THREE.BufferAttribute[] = [];
    for (const grounded of [false, true]) {
      const target = new THREE.Float32BufferAttribute(new Float32Array(positions.count * 3), 3);
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(matrix);
        posed.copy(point);
        const side = point.x < 0 ? -1 : 1;
        if (shoes) {
          if (grounded) {
            posed.x += side * 0.23;
            posed.y -= bounds.min.y;
            posed.z -= 0.21;
          }
        } else if (legs) {
          // Blend the authored hip/knee/ankle offsets along each trouser leg.
          const upper = point.y >= 0.67;
          const t = THREE.MathUtils.clamp(upper ? (point.y - 0.67) / 0.19 : (point.y - 0.37) / 0.30, 0, 1);
          const hipOffset = grounded ? [0, -0.02, 0.165] : [0, 0.06, 0.14];
          const kneeOffset = grounded ? [side * 0.09, -0.29, -0.20] : [side * 0.04, 0.03, 0.01];
          const ankleOffset = grounded ? [side * 0.23, -0.305, -0.21] : [0, 0, 0];
          const start = upper ? kneeOffset : ankleOffset, end = upper ? hipOffset : kneeOffset;
          posed.x += THREE.MathUtils.lerp(start[0], end[0], t);
          posed.y += THREE.MathUtils.lerp(start[1], end[1], t);
          posed.z += THREE.MathUtils.lerp(start[2], end[2], t);
        } else {
          // Rise and lean forward from the pelvis while keeping both grips anchored.
          posed.sub(hip).applyAxisAngle(new THREE.Vector3(1, 0, 0), grounded ? 0.29 : 0.24).add(hip);
          posed.y += grounded ? -0.02 : 0.06;
          posed.z += grounded ? 0.165 : 0.14;
          const grip = THREE.MathUtils.smoothstep(Math.abs(point.x), 0.15, 0.25)
            * THREE.MathUtils.smoothstep(point.z, 0.08, 0.33);
          posed.lerp(point, grip);
        }
        posed.applyMatrix4(inverse);
        target.setXYZ(i, posed.x, posed.y, posed.z);
      }
      targets.push(target);
    }
    geometry.morphAttributes.position = targets;
    // Keep lighting consistent with the new standing/leaning silhouette.
    geometry.morphAttributes.normal = targets.map((position) => {
      const normalGeometry = new THREE.BufferGeometry();
      normalGeometry.setAttribute("position", position);
      normalGeometry.setIndex(geometry.index);
      normalGeometry.computeVertexNormals();
      const normal = normalGeometry.getAttribute("normal") as THREE.BufferAttribute;
      normalGeometry.dispose();
      return normal;
    });
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    mesh.updateMorphTargets();
  }
  return (progress: number, reducedMotion: boolean) => {
    const p = reducedMotion ? Number(progress > 0) : THREE.MathUtils.clamp(progress, 0, 1);
    const forward = THREE.MathUtils.smoothstep(p, 0, 0.45);
    const grounded = THREE.MathUtils.smoothstep(p, 0.45, 1);
    for (const mesh of meshes) {
      mesh.morphTargetInfluences![0] = forward * (1 - grounded);
      mesh.morphTargetInfluences![1] = grounded;
    }
  };
}
