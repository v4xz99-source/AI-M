
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const canvas = document.createElement("canvas");
canvas.className = "room3d-canvas";
canvas.setAttribute("aria-hidden", "true");
document.body.prepend(canvas);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#030611");
scene.fog = new THREE.FogExp2("#071126", 0.012);

const camera = new THREE.PerspectiveCamera(
  window.innerWidth < 700 ? 65 : 52,
  innerWidth / innerHeight,
  0.1,
  250
);
camera.position.set(0, 3.5, 15);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: window.innerWidth >= 700,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

scene.add(new THREE.HemisphereLight("#789bff", "#10091f", 2));

const blueLight = new THREE.PointLight("#167bff", 100, 45);
blueLight.position.set(0, 5, 1);
scene.add(blueLight);

const violetLight = new THREE.PointLight("#8b43ff", 65, 35);
violetLight.position.set(-8, 2, -4);
scene.add(violetLight);

const goldLight = new THREE.PointLight("#ffad67", 55, 45);
goldLight.position.set(0, -1, -12);
scene.add(goldLight);

const world = new THREE.Group();
scene.add(world);

const blue = new THREE.MeshBasicMaterial({ color: "#49bfff" });
const violet = new THREE.MeshBasicMaterial({ color: "#a06bff" });
const whiteBlue = new THREE.MeshBasicMaterial({ color: "#d8f5ff" });

const darkStone = new THREE.MeshStandardMaterial({
  color: "#111a30",
  metalness: 0.55,
  roughness: 0.38,
  emissive: "#07132b",
  emissiveIntensity: 0.8
});

const crystalMaterial = new THREE.MeshStandardMaterial({
  color: "#152b56",
  metalness: 0.8,
  roughness: 0.18,
  emissive: "#102f80",
  emissiveIntensity: 1.4
});

// Endless reflective-looking cosmic ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.MeshStandardMaterial({
    color: "#050a18",
    metalness: 0.75,
    roughness: 0.3,
    emissive: "#07112b",
    emissiveIntensity: 0.7
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -3.5;
world.add(ground);

// Faint energy grid
const grid = new THREE.GridHelper(120, 55, "#174b9b", "#102147");
grid.position.y = -3.45;
grid.material.transparent = true;
grid.material.opacity = 0.23;
world.add(grid);

// Floating broken worlds
const islands = [];

function createIsland(x, y, z, scale) {
  const island = new THREE.Group();
  island.position.set(x, y, z);
  island.scale.setScalar(scale);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 0.55, 0.75, 7, 1),
    darkStone
  );
  top.position.y = 0;
  island.add(top);

  const crystal = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 2.3, 5),
    crystalMaterial
  );
  crystal.position.set(0.1, -1.25, 0);
  crystal.rotation.z = Math.PI;
  island.add(crystal);

  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.025, 6, 60),
    blue
  );
  edge.rotation.x = Math.PI / 2;
  edge.position.y = 0.38;
  island.add(edge);

  world.add(island);
  islands.push({
    object: island,
    baseY: y,
    phase: Math.random() * Math.PI * 2
  });
}

createIsland(-7, 0.2, -5, 1.15);
createIsland(7, 1, -7, 1.25);
createIsland(-11, -0.5, -13, 1.4);
createIsland(11, -0.2, -16, 1.3);
createIsland(-4, -1, -18, 0.8);
createIsland(5, -0.7, -21, 0.9);

// Ancient floating monoliths
const monoliths = [];

for (let i = 0; i < 12; i++) {
  const height = 2 + Math.random() * 5;
  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.45 + Math.random() * 0.8,
      height,
      0.5 + Math.random() * 0.8
    ),
    i % 3 === 0 ? crystalMaterial : darkStone
  );

  pillar.position.set(
    (Math.random() - 0.5) * 34,
    Math.random() * 5 - 1,
    -8 - Math.random() * 25
  );

  pillar.rotation.z = (Math.random() - 0.5) * 0.18;
  world.add(pillar);

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, height * 0.72, 0.04),
    i % 2 ? blue : violet
  );
  strip.position.set(0, 0, 0.27 + 0.15);
  pillar.add(strip);

  monoliths.push({
    object: pillar,
    baseY: pillar.position.y,
    phase: Math.random() * 6
  });
}

// Central AI core
const core = new THREE.Group();
core.position.set(0, 1.3, -2.5);
world.add(core);

const coreShell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.3, 2),
  new THREE.MeshPhysicalMaterial({
    color: "#1a5eff",
    emissive: "#154dff",
    emissiveIntensity: 2.5,
    metalness: 0.6,
    roughness: 0.13,
    clearcoat: 1
  })
);
core.add(coreShell);

const innerCore = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.78, 1),
  new THREE.MeshBasicMaterial({
    color: "#a9efff",
    wireframe: true
  })
);
core.add(innerCore);

const glow = new THREE.Mesh(
  new THREE.SphereGeometry(1.65, 32, 32),
  new THREE.MeshBasicMaterial({
    color: "#176dff",
    transparent: true,
    opacity: 0.09,
    side: THREE.BackSide
  })
);
core.add(glow);

// Large cosmic rings
const rings = [];

for (let i = 0; i < 4; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.05 + i * 0.32, 0.018, 8, 120),
    i % 2 === 0 ? blue : violet
  );

  ring.rotation.set(
    0.5 + i * 0.27,
    0.25 + i * 0.4,
    i * 0.35
  );
  core.add(ring);
  rings.push(ring);
}

// Light beam beneath the core
const beam = new THREE.Mesh(
  new THREE.CylinderGeometry(0.06, 1.1, 5, 32, 1, true),
  new THREE.MeshBasicMaterial({
    color: "#258aff",
    transparent: true,
    opacity: 0.13,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
);
beam.position.set(0, -3.1, -2.5);
world.add(beam);

// Giant halo in the sky
const halo = new THREE.Mesh(
  new THREE.TorusGeometry(5.2, 0.045, 8, 160),
  new THREE.MeshBasicMaterial({
    color: "#78bfff"
  })
);
halo.position.set(0, 6.2, -9);
halo.rotation.x = 1.25;
world.add(halo);

const halo2 = new THREE.Mesh(
  new THREE.TorusGeometry(4.4, 0.018, 8, 160),
  violet
);
halo2.position.copy(halo.position);
halo2.rotation.set(1.05, 0.2, 0.3);
world.add(halo2);

// Distant moon
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(2.2, 40, 40),
  new THREE.MeshStandardMaterial({
    color: "#b5caff",
    emissive: "#263d91",
    emissiveIntensity: 0.65,
    metalness: 0.2,
    roughness: 0.85
  })
);
moon.position.set(11, 5, -28);
world.add(moon);

// Starfield
const count = innerWidth < 700 ? 650 : 1300;
const positions = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 90;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
  positions[i * 3 + 2] = -Math.random() * 65;
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: "#9fdcff",
    size: 0.045,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  })
);
world.add(stars);

// Drifting glowing particles
const dustCount = innerWidth < 700 ? 180 : 350;
const dustPositions = new Float32Array(dustCount * 3);

for (let i = 0; i < dustCount; i++) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 35;
  dustPositions[i * 3 + 1] = Math.random() * 18 - 5;
  dustPositions[i * 3 + 2] = -Math.random() * 32;
}

const dustGeometry = new THREE.BufferGeometry();
dustGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(dustPositions, 3)
);

const dust = new THREE.Points(
  dustGeometry,
  new THREE.PointsMaterial({
    color: "#79caff",
    size: 0.055,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  })
);
world.add(dust);

// Touch and mouse movement
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

addEventListener("pointermove", event => {
  targetX = (event.clientX / innerWidth - 0.5) * 1.5;
  targetY = (event.clientY / innerHeight - 0.5) * 0.65;
}, { passive: true });

addEventListener("deviceorientation", event => {
  if (event.gamma == null || event.beta == null) return;
  targetX = THREE.MathUtils.clamp(event.gamma / 55, -0.5, 0.5);
  targetY = THREE.MathUtils.clamp((event.beta - 35) / 100, -0.3, 0.3);
}, { passive: true });

const clock = new THREE.Clock();

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = innerWidth < 700 ? 65 : 52;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener("resize", resize);

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  currentX += (targetX - currentX) * 0.025;
  currentY += (targetY - currentY) * 0.025;

  core.position.y = 1.3 + Math.sin(t * 0.8) * 0.22;
  core.rotation.y = t * 0.13 + currentX * 0.15;
  core.rotation.x = Math.sin(t * 0.35) * 0.12;
  coreShell.rotation.y = -t * 0.18;
  innerCore.rotation.x = t * 0.25;
  innerCore.rotation.y = -t * 0.2;

  rings.forEach((ring, i) => {
    ring.rotation.z += (i % 2 ? -1 : 1) * 0.0018;
  });

  halo.rotation.z = Math.sin(t * 0.12) * 0.08;
  halo2.rotation.z -= 0.001;
  moon.position.y = 5 + Math.sin(t * 0.15) * 0.2;

  islands.forEach(item => {
    item.object.position.y =
      item.baseY + Math.sin(t * 0.45 + item.phase) * 0.18;
    item.object.rotation.y = Math.sin(t * 0.2 + item.phase) * 0.08;
  });

  monoliths.forEach(item => {
    item.object.position.y =
      item.baseY + Math.sin(t * 0.3 + item.phase) * 0.15;
  });

  stars.rotation.y = t * 0.002;
  dust.rotation.y = t * 0.008;

  camera.position.x +=
    (currentX * 1.2 - camera.position.x) * 0.012;
  camera.position.y +=
    (3.5 - currentY - camera.position.y) * 0.012;
  camera.lookAt(currentX * 0.45, 0.6 - currentY * 0.3, -3);

  blueLight.intensity = 90 + Math.sin(t * 1.3) * 15;
  renderer.render(scene, camera);
}

animate();
