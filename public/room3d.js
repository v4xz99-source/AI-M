
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

(() => {
  if (window.__AIM_WORLD_STARTED__) return;
  window.__AIM_WORLD_STARTED__ = true;

  const mobile = window.innerWidth < 700;
  const canvas = document.createElement("canvas");
  canvas.className = "room3d-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#050714");
  scene.fog = new THREE.FogExp2("#080d20", 0.014);

  const camera = new THREE.PerspectiveCamera(
    mobile ? 66 : 52,
    window.innerWidth / window.innerHeight,
    0.1,
    240
  );
  camera.position.set(0, 3.1, 15);
  camera.lookAt(0, 2, -7);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  const world = new THREE.Group();
  scene.add(world);

  const blue = new THREE.Color("#49dfff");
  const violet = new THREE.Color("#8c5cff");
  const gold = new THREE.Color("#ffb86c");

  scene.add(new THREE.HemisphereLight("#9acaff", "#080615", 1.7));

  const moonLight = new THREE.DirectionalLight("#c7d9ff", 2.0);
  moonLight.position.set(-8, 12, 8);
  scene.add(moonLight);

  const blueLight = new THREE.PointLight("#20bfff", 65, 42, 2);
  blueLight.position.set(-5, 2, -7);
  scene.add(blueLight);

  const violetLight = new THREE.PointLight("#8a45ff", 75, 38, 2);
  violetLight.position.set(6, 5, -15);
  scene.add(violetLight);

  const horizonLight = new THREE.PointLight("#ff9e6c", 55, 55, 2);
  horizonLight.position.set(0, -1, -30);
  scene.add(horizonLight);

  function standard(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.75,
      metalness: options.metalness ?? 0.15,
      emissive: options.emissive ?? "#000000",
      emissiveIntensity: options.emissiveIntensity ?? 0
    });
  }

  const stone = standard("#171b30", { roughness: 0.9, metalness: 0.25 });
  const stoneLight = standard("#292e49", { roughness: 0.8, metalness: 0.3 });
  const darkMetal = standard("#080d1b", { roughness: 0.32, metalness: 0.8 });
  const cyanGlow = standard("#42dcff", {
    roughness: 0.25,
    metalness: 0.2,
    emissive: "#18bfff",
    emissiveIntensity: 2.5
  });
  const purpleGlow = standard("#965bff", {
    roughness: 0.25,
    emissive: "#682dff",
    emissiveIntensity: 2.0
  });

  function mesh(geometry, material, parent = world, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }

  function box(parent, x, y, z, sx, sy, sz, material, rx = 0, ry = 0, rz = 0) {
    const object = mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      material,
      parent,
      x, y, z
    );
    object.rotation.set(rx, ry, rz);
    return object;
  }

  function cylinder(parent, x, y, z, rt, rb, h, material, sides = 6) {
    return mesh(
      new THREE.CylinderGeometry(rt, rb, h, sides),
      material,
      parent,
      x, y, z
    );
  }

  // Distant cosmic sky
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 512;
  skyCanvas.height = 256;
  const ctx = skyCanvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#03040d");
  gradient.addColorStop(0.45, "#111638");
  gradient.addColorStop(0.72, "#33254f");
  gradient.addColorStop(1, "#b66b78");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 512;
    const y = 90 + Math.random() * 150;
    const radius = 8 + Math.random() * 35;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, i % 2 ? "rgba(102,72,255,.20)" : "rgba(255,139,121,.17)");
    glow.addColorStop(1, "rgba(10,10,30,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.colorSpace = THREE.SRGBColorSpace;
  const sky = mesh(
    new THREE.SphereGeometry(100, 32, 20),
    new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      depthWrite: false
    }),
    scene,
    0, 0, 0
  );

  // Ground and broken foreground ledge
  const ground = mesh(
    new THREE.PlaneGeometry(180, 180),
    standard("#080b19", { roughness: 0.95, metalness: 0.1 }),
    world,
    0, -4.7, -25
  );
  ground.rotation.x = -Math.PI / 2;

  for (let i = 0; i < 26; i++) {
    const x = (Math.random() - 0.5) * 26;
    const z = 2 - Math.random() * 20;
    const width = 1 + Math.random() * 2.8;
    const height = 0.4 + Math.random() * 1.6;
    const rock = mesh(
      new THREE.DodecahedronGeometry(1, 0),
      i % 3 ? stone : stoneLight,
      world,
      x, -4.15 + height * 0.25, z
    );
    rock.scale.set(width, height, 1.2 + Math.random() * 2);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
  }

  // Distant mountain silhouettes
  for (let i = 0; i < 17; i++) {
    const x = -31 + i * 3.8;
    const h = 5 + Math.random() * 10;
    const mountain = mesh(
      new THREE.ConeGeometry(4 + Math.random() * 3, h, 5),
      standard(i % 2 ? "#11142b" : "#1b1935", { roughness: 1 }),
      world,
      x, -2 + h / 2, -37 - Math.random() * 8
    );
    mountain.rotation.y = Math.random() * Math.PI;
  }

  // Tower of M
  const tower = new THREE.Group();
  tower.position.set(0, -1.5, -17);
  world.add(tower);

  cylinder(tower, 0, -0.7, 0, 4.4, 5.2, 1.5, darkMetal, 8);
  cylinder(tower, 0, 0.5, 0, 3.5, 4.2, 2.0, stone, 8);
  cylinder(tower, 0, 2.5, 0, 2.65, 3.4, 2.2, stoneLight, 8);
  cylinder(tower, 0, 4.2, 0, 2.1, 2.7, 1.5, darkMetal, 8);

  // Tall cathedral-like spire
  const spire = mesh(
    new THREE.ConeGeometry(2.5, 5.8, 8),
    stone,
    tower,
    0, 7.8, 0
  );
  spire.rotation.y = Math.PI / 8;

  const spireTip = mesh(
    new THREE.ConeGeometry(0.65, 2.8, 6),
    cyanGlow,
    tower,
    0, 11.6, 0
  );

  // Tower buttresses and luminous seams
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    const x = Math.cos(a) * 2.65;
    const z = Math.sin(a) * 2.65;

    const buttress = box(
      tower, x, 2.6, z,
      0.65, 5.5, 0.65, stone,
      0, -a, 0
    );
    buttress.rotation.z = (i % 2 ? 0.08 : -0.08);

    const seam = box(
      tower, x * 1.02, 2.6, z * 1.02,
      0.09, 3.9, 0.09, cyanGlow,
      0, -a, 0
    );
  }

  // A glowing M emblem, built as a 3D line in front of the tower
  const mShape = new THREE.Shape();
  mShape.moveTo(-1.65, -1.45);
  mShape.lineTo(-1.65, 1.45);
  mShape.lineTo(-0.65, 0.15);
  mShape.lineTo(0, 1.1);
  mShape.lineTo(0.65, 0.15);
  mShape.lineTo(1.65, 1.45);
  mShape.lineTo(1.65, -1.45);
  const mGeometry = new THREE.ExtrudeGeometry(mShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.06,
    bevelThickness: 0.05
  });
  const emblem = mesh(mGeometry, cyanGlow, tower, 0, 4.0, 2.8);
  emblem.scale.set(0.85, 0.85, 0.85);

  const emblemFrame = mesh(
    new THREE.TorusGeometry(2.35, 0.055, 8, 64),
    purpleGlow,
    tower,
    0, 4.15, 2.75
  );
  emblemFrame.scale.y = 1.12;

  // Broken cathedral arches
  function createArch(x, y, z, scale, material) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(scale);
    world.add(group);

    const curve = new THREE.EllipseCurve(0, 0, 2.5, 3.5, 0, Math.PI, false, 0);
    const points = curve.getPoints(48).map(p => new THREE.Vector3(p.x, p.y, 0));
    const geometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      48,
      0.17,
      7,
      false
    );
    mesh(geometry, material, group, 0, 0, 0);

    box(group, -2.5, -1.5, 0, 0.65, 4, 0.65, stone);
    box(group, 2.5, -1.5, 0, 0.65, 4, 0.65, stone);

    return group;
  }

  createArch(-8, 0.4, -10, 1.1, stoneLight);
  createArch(8, 1.1, -14, 1.4, stone);
  createArch(-12, 1.8, -23, 1.5, stone);

  // Floating islands with fractured crystal undersides
  const islands = [];

  function createIsland(x, y, z, scale, glowMaterial) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(scale);
    world.add(group);

    const top = mesh(
      new THREE.CylinderGeometry(2.4, 3.0, 1.1, 7, 1),
      stoneLight,
      group,
      0, 0, 0
    );
    top.rotation.y = Math.random();

    const crown = mesh(
      new THREE.CylinderGeometry(2.2, 1.6, 0.25, 7),
      darkMetal,
      group,
      0, 0.58, 0
    );

    const underside = mesh(
      new THREE.ConeGeometry(2.15, 3.7, 7),
      stone,
      group,
      0, -2.15, 0
    );
    underside.rotation.y = 0.3;

    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const shard = mesh(
        new THREE.ConeGeometry(0.38 + Math.random() * 0.25, 1.8 + Math.random() * 1.5, 5),
        i % 2 ? purpleGlow : glowMaterial,
        group,
        Math.cos(a) * (0.9 + Math.random() * 0.5),
        -2.1 - Math.random() * 0.5,
        Math.sin(a) * (0.9 + Math.random() * 0.5)
      );
      shard.rotation.z = Math.cos(a) * 0.22;
      shard.rotation.x = Math.sin(a) * 0.22;
    }

    const rim = mesh(
      new THREE.TorusGeometry(2.1, 0.045, 6, 40),
      glowMaterial,
      group,
      0, 0.58, 0
    );
    rim.rotation.x = Math.PI / 2;

    // Tiny ruined structures on the island
    for (let i = 0; i < 3; i++) {
      const px = (Math.random() - 0.5) * 2.5;
      const pz = (Math.random() - 0.5) * 2.1;
      const height = 0.7 + Math.random() * 1.7;
      box(group, px, 0.9 + height / 2, pz, 0.32, height, 0.32, stone);
      box(group, px, 0.95 + height, pz, 0.55, 0.14, 0.55, stoneLight);
    }

    islands.push({
      group,
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.4
    });

    return group;
  }

  createIsland(-7.5, 3.5, -7, 1.0, cyanGlow);
  createIsland(7.2, 5.0, -11, 1.15, purpleGlow);
  createIsland(-12, 7.2, -21, 1.4, purpleGlow);
  createIsland(12.5, 4.5, -25, 1.5, cyanGlow);
  createIsland(-4.8, 9.2, -28, 1.3, cyanGlow);
  createIsland(4.5, 8.0, -35, 1.7, purpleGlow);

  // Luminous waterfalls with drifting droplets
  const waterfallGroups = [];

  function createWaterfall(x, y, z, height, material) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    world.add(group);

    const strands = mobile ? 3 : 5;

    for (let i = 0; i < strands; i++) {
      const offset = (i - (strands - 1) / 2) * 0.18;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(offset, 0, 0),
        new THREE.Vector3(offset + 0.12, -height * 0.25, 0.04),
        new THREE.Vector3(offset - 0.1, -height * 0.58, 0),
        new THREE.Vector3(offset + 0.04, -height, -0.05)
      ]);
      const tube = new THREE.TubeGeometry(curve, 32, 0.045, 5, false);
      mesh(tube, material, group);
    }

    const drops = [];
    for (let i = 0; i < (mobile ? 12 : 22); i++) {
      const drop = mesh(
        new THREE.SphereGeometry(0.045 + Math.random() * 0.04, 6, 6),
        material,
        group,
        (Math.random() - 0.5) * 0.7,
        -Math.random() * height,
        (Math.random() - 0.5) * 0.25
      );
      drops.push({
        mesh: drop,
        start: Math.random(),
        speed: 0.3 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2
      });
    }

    waterfallGroups.push({ group, height, drops });
  }

  createWaterfall(-7.5, 2.7, -7, 6.0, cyanGlow);
  createWaterfall(7.2, 4.1, -11, 7.2, purpleGlow);
  createWaterfall(-12, 6.3, -21, 7.0, cyanGlow);
  createWaterfall(12.5, 3.7, -25, 7.0, purpleGlow);

  // Foreground monoliths and ancient broken pillars
  for (let i = 0; i < 20; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (5.8 + Math.random() * 9);
    const z = -3 - Math.random() * 25;
    const h = 1.8 + Math.random() * 5.5;

    const pillar = box(
      world, x, -2.8 + h / 2, z,
      0.65 + Math.random() * 0.6,
      h,
      0.65 + Math.random() * 0.6,
      i % 3 === 0 ? stoneLight : stone,
      (Math.random() - 0.5) * 0.14,
      Math.random() * 0.3,
      (Math.random() - 0.5) * 0.14
    );

    if (i % 3 === 0) {
      box(
        world, x, -2.8 + h * 0.7, z,
        0.09, h * 0.4, 0.09,
        i % 2 ? cyanGlow : purpleGlow
      );
    }
  }

  // Moon
  const moon = mesh(
    new THREE.SphereGeometry(2.0, 32, 32),
    new THREE.MeshStandardMaterial({
      color: "#d8d8ff",
      emissive: "#7777ff",
      emissiveIntensity: 0.55,
      roughness: 1
    }),
    world,
    10, 7, -36
  );

  const moonHalo = mesh(
    new THREE.TorusGeometry(2.8, 0.035, 6, 64),
    purpleGlow,
    world,
    10, 7, -36
  );
  moonHalo.rotation.x = 0.8;
  moonHalo.rotation.y = 0.3;

  // Star field
  const starCount = mobile ? 650 : 1450;
  const starPositions = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 150;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 85;
    starPositions[i * 3 + 2] = -Math.random() * 95 - 8;
    starSizes[i] = 0.3 + Math.random() * 1.5;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));

  const starMaterial = new THREE.PointsMaterial({
    color: "#c7dcff",
    size: 0.11,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    depthWrite: false
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // Nearby floating particles
  const dustCount = mobile ? 90 : 190;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 24;
    dustPositions[i * 3 + 1] = Math.random() * 13 - 4;
    dustPositions[i * 3 + 2] = -Math.random() * 35;
  }

  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));

  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: "#69dfff",
      size: 0.055,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    })
  );
  world.add(dust);

  // Touch / mouse camera movement
  let targetX = 0;
  let targetY = 0;
  let smoothX = 0;
  let smoothY = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let dragging = false;

  function updatePointer(clientX, clientY) {
    targetX = (clientX / window.innerWidth - 0.5) * 1.0;
    targetY = (clientY / window.innerHeight - 0.5) * 0.45;
  }

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse" || dragging) {
      updatePointer(event.clientX, event.clientY);
    }
  }, { passive: true });

  canvas.addEventListener("touchstart", (event) => {
    if (!event.touches.length) return;
    dragging = true;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener("touchmove", (event) => {
    if (!dragging || !event.touches.length) return;
    const touch = event.touches[0];
    targetX = THREE.MathUtils.clamp(
      targetX + (touch.clientX - touchStartX) / window.innerWidth * 0.8,
      -0.65, 0.65
    );
    targetY = THREE.MathUtils.clamp(
      targetY + (touch.clientY - touchStartY) / window.innerHeight * 0.5,
      -0.35, 0.35
    );
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    dragging = false;
  }, { passive: true });

  // Optional device tilt support
  window.addEventListener("deviceorientation", (event) => {
    if (event.gamma == null || event.beta == null) return;
    targetX = THREE.MathUtils.clamp(event.gamma / 65, -0.4, 0.4);
    targetY = THREE.MathUtils.clamp((event.beta - 40) / 180, -0.2, 0.2);
  }, { passive: true });

  // Animation loop
  const clock = new THREE.Clock();
  let frame = 0;

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    frame++;

    smoothX += (targetX - smoothX) * 0.025;
    smoothY += (targetY - smoothY) * 0.025;

    camera.position.x = smoothX * 2.2;
    camera.position.y = 3.1 - smoothY * 1.5 + Math.sin(t * 0.28) * 0.12;
    camera.lookAt(smoothX * 0.7, 1.7 - smoothY * 0.4, -8);

    islands.forEach((island) => {
      island.group.position.y =
        island.baseY + Math.sin(t * island.speed + island.phase) * 0.22;
      island.group.rotation.y = Math.sin(t * 0.15 + island.phase) * 0.04;
    });

    tower.rotation.y = Math.sin(t * 0.12) * 0.025;
    emblem.material.emissiveIntensity = 1.8 + Math.sin(t * 1.8) * 0.6;
    spireTip.material.emissiveIntensity = 1.5 + Math.sin(t * 2.2) * 1.0;
    blueLight.intensity = 58 + Math.sin(t * 1.2) * 10;
    violetLight.intensity = 68 + Math.sin(t * 0.9 + 1) * 12;

    waterfallGroups.forEach((waterfall) => {
      waterfall.drops.forEach((drop) => {
        const progress = (drop.start + t * drop.speed * 0.12) % 1;
        drop.mesh.position.y = -progress * waterfall.height;
        drop.mesh.position.x =
          Math.sin(t * 1.5 + drop.offset) * 0.12;
      });
    });

    if (frame % 2 === 0) {
      stars.rotation.y = Math.sin(t * 0.025) * 0.025;
      dust.rotation.y += 0.00018;
      dust.position.y = Math.sin(t * 0.2) * 0.15;
      moonHalo.rotation.z = t * 0.035;
    }

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.fov = w < 700 ? 66 : 52;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 1.3 : 1.7));
    renderer.setSize(w, h);
  }, { passive: true });
})();
