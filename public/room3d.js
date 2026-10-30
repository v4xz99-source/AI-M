
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const app = document.querySelector(".app");
if (!app) throw new Error("AI M app not found");

const canvas = document.createElement("canvas");
canvas.className = "room3d-canvas";
canvas.setAttribute("aria-hidden", "true");
document.body.prepend(canvas);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#030716");
scene.fog = new THREE.FogExp2("#030716", 0.012);

const camera = new THREE.PerspectiveCamera(
  48,
  innerWidth / innerHeight,
  0.1,
  500
);
camera.position.set(0, 5.5, 19);
camera.lookAt(0, 3, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: innerWidth < 700 ? false : true,
  alpha: false,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

scene.add(new THREE.AmbientLight("#6689d9", 1.7));

const blueLight = new THREE.PointLight("#188dff", 90, 45);
blueLight.position.set(0, 5, 1);
scene.add(blueLight);

const purpleLight = new THREE.PointLight("#8b35ff", 65, 35);
purpleLight.position.set(-8, 4, -2);
scene.add(purpleLight);

const cyanLight = new THREE.PointLight("#22dfff", 50, 30);
cyanLight.position.set(8, 3, 1);
scene.add(cyanLight);

const room = new THREE.Group();
scene.add(room);

// Materials
const darkMetal = new THREE.MeshStandardMaterial({
  color: "#09152d",
  metalness: 0.8,
  roughness: 0.28
});

const glass = new THREE.MeshPhysicalMaterial({
  color: "#12366c",
  metalness: 0.35,
  roughness: 0.12,
  transparent: true,
  opacity: 0.23,
  transmission: 0.18,
  side: THREE.DoubleSide
});

const neonBlue = new THREE.MeshBasicMaterial({
  color: "#39bfff"
});

const neonPurple = new THREE.MeshBasicMaterial({
  color: "#9d55ff"
});

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({
    color: "#050b1b",
    metalness: 0.8,
    roughness: 0.24,
    emissive: "#061332",
    emissiveIntensity: 0.6
  })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.05;
room.add(floor);

// Glowing floor grid
const grid = new THREE.GridHelper(100, 80, "#147ad8", "#10234c");
grid.position.y = 0.015;
grid.material.transparent = true;
grid.material.opacity = 0.38;
room.add(grid);

// Panoramic window frames
function beam(x, y, z, sx, sy, sz, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material
  );
  mesh.position.set(x, y, z);
  room.add(mesh);
  return mesh;
}

beam(0, 9, -7, 30, 0.12, 0.18, neonBlue);
beam(0, 0.2, -7, 30, 0.1, 0.18, neonBlue);
beam(-12, 4.5, -7, 0.12, 9, 0.18, neonBlue);
beam(12, 4.5, -7, 0.12, 9, 0.18, neonBlue);

for (let x = -8; x <= 8; x += 4) {
  beam(x, 4.5, -7, 0.045, 9, 0.08, neonPurple);
}

// Futuristic skyline
const city = new THREE.Group();
scene.add(city);

const buildingMaterials = [
  new THREE.MeshStandardMaterial({
    color: "#0a1737",
    metalness: 0.65,
    roughness: 0.32,
    emissive: "#081a45",
    emissiveIntensity: 0.8
  }),
  new THREE.MeshStandardMaterial({
    color: "#11172e",
    metalness: 0.5,
    roughness: 0.35,
    emissive: "#171044",
    emissiveIntensity: 0.7
  })
];

for (let i = 0; i < 85; i++) {
  const x = (Math.random() - 0.5) * 60;
  const width = 0.5 + Math.random() * 1.3;
  const height = 1.5 + Math.random() * 9;
  const depth = 0.5 + Math.random() * 1.2;

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    buildingMaterials[i % 2]
  );

  building.position.set(x, height / 2 - 0.05, -13 - Math.random() * 7);
  city.add(building);

  // Tiny illuminated windows
  for (let j = 0; j < Math.min(8, Math.floor(height)); j++) {
    if (Math.random() > 0.45) continue;

    const windowLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.12, 0.025),
      Math.random() > 0.5 ? neonBlue : neonPurple
    );

    windowLight.position.set(
      x + (Math.random() - 0.5) * width * 0.7,
      j + 0.5,
      -13.6 - Math.random() * 7
    );

    city.add(windowLight);
  }
}

// Central floating AI core
const core = new THREE.Group();
core.position.set(0, 4.1, -0.7);
scene.add(core);

const orb = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.05, 3),
  new THREE.MeshPhysicalMaterial({
    color: "#286dff",
    emissive: "#175dff",
    emissiveIntensity: 2.4,
    metalness: 0.55,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  })
);
core.add(orb);

const orbGlow = new THREE.Mesh(
  new THREE.SphereGeometry(1.22, 32, 32),
  new THREE.MeshBasicMaterial({
    color: "#367bff",
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
  })
);
core.add(orbGlow);

// Orbiting holographic rings
const rings = [];

for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.55 + i * 0.2, 0.012, 8, 120),
    i === 1 ? neonPurple : neonBlue
  );

  ring.rotation.x = Math.PI * (0.35 + i * 0.17);
  ring.rotation.y = Math.PI * (0.2 + i * 0.25);
  core.add(ring);
  rings.push(ring);
}

// Floating holographic panels
function panel(x, y, z, w, h, color) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const pane = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 0.035),
    glass
  );
  group.add(pane);

  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 0.045)),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95
    })
  );
  group.add(outline);

  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(w * (0.25 + Math.random() * 0.4), 0.025, 0.025),
      i % 2 ? neonPurple : neonBlue
    );

    bar.position.set(
      -w * 0.12,
      h * 0.27 - i * h * 0.14,
      0.04
    );
    group.add(bar);
  }

  scene.add(group);
  return group;
}

const panels = [
  panel(-5.6, 4.6, 0, 2.5, 2.8, "#32bfff"),
  panel(5.6, 4.5, -0.2, 2.5, 2.7, "#9c5cff"),
  panel(-4.8, 1.9, 0.5, 2.2, 1.2, "#9c5cff"),
  panel(4.8, 1.9, 0.5, 2.2, 1.2, "#32bfff")
];

// Floating particles
const particleCount = innerWidth < 700 ? 350 : 750;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 28;
  positions[i * 3 + 1] = Math.random() * 12;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 24 - 2;
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({
    color: "#82d8ff",
    size: 0.035,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  })
);
scene.add(particles);

// Touch and pointer interaction
let targetX = 0;
let targetY = 0;
let pointerX = 0;
let pointerY = 0;

function movePointer(x, y) {
  targetX = (x / innerWidth - 0.5) * 1.3;
  targetY = (y / innerHeight - 0.5) * 0.6;
}

addEventListener("pointermove", (event) => {
  movePointer(event.clientX, event.clientY);
}, { passive: true });

addEventListener("deviceorientation", (event) => {
  if (event.gamma == null || event.beta == null) return;
  targetX = THREE.MathUtils.clamp(event.gamma / 50, -0.5, 0.5);
  targetY = THREE.MathUtils.clamp((event.beta - 35) / 100, -0.3, 0.3);
}, { passive: true });

// Responsive sizing
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = innerWidth < 700 ? 58 : 48;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
}

addEventListener("resize", resize);

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  pointerX += (targetX - pointerX) * 0.035;
  pointerY += (targetY - pointerY) * 0.035;

  core.position.y = 4.1 + Math.sin(t * 0.9) * 0.2;
  core.rotation.y = t * 0.18 + pointerX * 0.25;
  core.rotation.x = Math.sin(t * 0.35) * 0.1 + pointerY * 0.2;

  orb.rotation.y = t * 0.2;
  orb.rotation.x = t * 0.13;

  rings.forEach((ring, i) => {
    ring.rotation.z += (i % 2 ? -1 : 1) * 0.003;
  });

  panels.forEach((p, i) => {
    p.position.y += Math.sin(t * 0.7 + i * 1.8) * 0.0018;
    p.rotation.y = Math.sin(t * 0.3 + i) * 0.035;
  });

  particles.rotation.y = t * 0.008;

  camera.position.x += (pointerX * 1.5 - camera.position.x) * 0.018;
  camera.position.y += ((5.5 - pointerY * 1.2) - camera.position.y) * 0.018;
  camera.lookAt(pointerX * 0.7, 3.1 - pointerY * 0.4, 0);

  blueLight.intensity = 80 + Math.sin(t * 1.3) * 12;
  renderer.render(scene, camera);
}

animate();
