import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { createLogo, createRoomStrips } from './logo3d.js';
import { createFloor } from './floor.js';
import { LOGOS, MARK } from './logos.js';

const VIEW_WIDTH = 13; // world units visible across the canvas at the pile
const FLOOR_FROM_BOTTOM = 1.4; // world units between the fold and the line the pile stands on
const MOBILE_VIEW_WIDTH = 8.4; // closer mobile framing so cube and inner pile read clearly
const MOBILE_FLOOR_FROM_BOTTOM = 2.4;
const CUBE = 1.7;
const LOGO_SIZE = 1.4;
const CORRIDOR = 0.36; // logos live between invisible walls at z = ±CORRIDOR, so they stay upright
const STEP = 1 / 60;
// The most pixels the scene will draw. Past this the multisampled buffers outgrow a laptop GPU's
// memory: at 3840 x 2678 an RTX 3060 fell from 6ms a frame to 130ms. 3.5 million keeps desktop smooth.
const MAX_PIXELS = 3.5e6;
const MOBILE_MAX_PIXELS = 1.5e6;
// The cube's front face sits level with the front of the corridor. Any further forward and it would
// cover the logos beside it, and three's glass does not show other glass through it.
const CUBE_Z = CORRIDOR - CUBE / 2;
// Where each logo is dropped from before the pile settles, in LOGOS order: [x, y, roll in degrees].
// The first five land left of the cube and the next five right. The last, HyperEVM, comes down on the left pile.
const DROP = [
  [-1.7, 0.9, 6], [-3.05, 1.0, -4], [-4.5, 0.9, 3], [-2.4, 3.2, 12], [-4.0, 3.4, -6],
  [1.8, 0.8, -3], [3.4, 0.8, 4], [4.3, 3.6, -14], [4.95, 0.9, 2], [2.7, 3.3, 10],
  [-3.2, 5.4, 5],
];

const rad = THREE.MathUtils.degToRad;

/**
 * The hero scene: the Hevium mark in a fixed glass cube, with eleven logos piled round it, on
 * a floor of characters that mirrors them and pulses where a logo lands.
 * The logos are rigid bodies, so they can be dragged and thrown. Each is dark until the pointer is
 * on it, and glows for as long as it is pointed at or held. Pointing at the cube makes the mark breathe.
 *
 * It mounts the way the site's hero slot expects (../types.ts): on a `canvas`
 * the page sizes with CSS, reporting loading progress from 0 to 1 to `onProgress`, and returning
 * { setSpotlight, dispose }. With `reducedMotion` nothing loops by itself. setSpotlight(on) is for
 * the call to action; the handle also carries hooks for the tests.
 *
 * The canvas's parent is the art box. If the art box is taller than the box it is positioned in,
 * the extra height is floor running on below the fold.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ reducedMotion?: boolean, dragMinWidth?: number, onProgress?: (fraction: number) => void }} [options]
 */
export async function mountHeroScene(canvas, { reducedMotion = false, dragMinWidth = 768, onProgress = () => {} } = {}) {
  const STEPS = LOGOS.length + 3; // the physics engine, the mark and the floor's font, then each logo
  let loaded = 0;
  const done = (value) => (onProgress(++loaded / STEPS), value); // one step finished
  done(await RAPIER.init());

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  // Draw at 1.5x at most: on an ordinary 1x screen that is what keeps the thin bright rims smooth.
  // Measured free on an RTX 3060 at 1920 wide. Slower machines fall back to 1, see the frame loop,
  // and resize keeps the total under MAX_PIXELS (or MOBILE_MAX_PIXELS below dragMinWidth).
  let sharpness = Math.min(devicePixelRatio || 1, 1.5);
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps the brand mint from washing out to white
  canvas.style.touchAction = 'pan-y'; // touch scrolls the page; dragging is for mouse and pen
  renderer.setClearColor(0x000000, 0); // what a view with no backdrop clears to; the floor's mirror image is one

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#07080B');
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRoom = new THREE.Scene().add(createRoomStrips());
  scene.environment = pmrem.fromScene(envRoom, 0.01).texture;
  envRoom.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose?.();
  });
  pmrem.dispose();
  scene.environmentIntensity = 3; // enough for unlit logos to show as edge highlights, like the reference
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

  // a soft glow round anything bright; tone mapping moves to the last pass
  const isMobileInit = window.innerWidth < dragMinWidth;
  const targetType = renderer.extensions.get('EXT_color_buffer_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: targetType, samples: isMobileInit ? 2 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.14, 0.35, 0.6)); // strength, radius, threshold
  composer.addPass(new OutputPass());
  // The polished rims are bright lines a pixel or two wide, which multisampling alone leaves
  // stepped. This smooths what is left, for the price of one cheap full-screen pass.
  const smooth = new ShaderPass(FXAAShader);
  composer.addPass(smooth);

  // --- glass cube ---------------------------------------------------------------------------
  // The glass reflects a live cube map of the scene, so lit logos show up in it. Layer 1 holds
  // lights that only that cube map sees: the room strips, and a panel over the cube that
  // brightens while the pointer is on the call to action.
  const cubeTarget = new THREE.WebGLCubeRenderTarget(128, { type: targetType });
  const cubeCamera = new THREE.CubeCamera(0.1, 60, cubeTarget);
  cubeCamera.position.set(0, CUBE / 2, CUBE_Z);
  cubeCamera.layers.enable(1);
  const strips = createRoomStrips();
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(CUBE * 2, CUBE * 2),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }));
  panel.position.set(0, CUBE + 2.2, CUBE_Z + CUBE * 0.35);
  panel.rotation.x = Math.PI / 2;
  for (const light of [strips, panel]) {
    light.traverse((o) => o.layers.set(1));
    scene.add(light);
  }

  const glass = new THREE.Mesh(new RoundedBoxGeometry(CUBE, CUBE, CUBE, 8, CUBE * 0.14), new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0, transmission: 1, thickness: CUBE * 0.35, ior: 1.45,
    attenuationColor: new THREE.Color('#97FBE3'), attenuationDistance: 2.5,
    sheenColor: new THREE.Color('#97FBE3'), sheenRoughness: 0.35,
    clearcoat: 1, envMap: cubeTarget.texture, envMapIntensity: 3, // glass reflects about 4% head-on, so lift it until lit neighbours show
    side: THREE.DoubleSide, // the back faces refract too, which is most of what makes it read as glass
  }));
  glass.position.set(0, CUBE / 2, CUBE_Z);
  const mark = done(createLogo(MARK, { size: CUBE * 0.7, depth: 0.14 }));
  glass.add(mark);
  scene.add(glass);
  // the mark's own light, so its glow lands on the logos beside the cube and comes back in the glass's reflections
  const markLight = new THREE.PointLight('#97FBE3', 0, 0, 2);
  markLight.position.set(0, CUBE / 2, CORRIDOR);
  scene.add(markLight);

  // The floor: characters lit by whatever stands on them (see floor.js). Layer 2 keeps it to the
  // main camera; its shader works from that camera's matrices, so the cube's reflections skip it.
  const floor = done(await createFloor(reducedMotion));
  floor.rest(LOGOS.length, 0, 0.9, 1); // the cube
  floor.mesh.layers.set(2);
  camera.layers.enable(2);
  scene.add(floor.mesh);
  // A glow behind the mark, so the block looks lit from inside. It has to be opaque: the glass only
  // refracts opaque things. It stays inside the cube's outline, so it never hides a logo.
  const core = new THREE.Mesh(new THREE.PlaneGeometry(CUBE * 0.98, CUBE * 0.98),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowCanvas('#0E5C53', '#07080B')) }));
  core.material.map.colorSpace = THREE.SRGBColorSpace;
  core.position.z = -CUBE * 0.18;
  glass.add(core);

  // --- physics ------------------------------------------------------------------------------
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const wall = (hx, hy, hz, x, y, z, friction = 0) =>
    world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z).setFriction(friction));
  const edge = VIEW_WIDTH / 2 - 0.2;
  wall(20, 0.5, 5, 0, -0.5, 0, 0.8); // floor
  wall(20, 0.5, 5, 0, 7, 0); // ceiling
  wall(20, 10, 0.5, 0, 5, -CORRIDOR - 0.5); // back of the corridor
  wall(20, 10, 0.5, 0, 5, CORRIDOR + 0.5); // front of the corridor
  wall(0.5, 10, 5, -edge - 0.5, 5, 0);
  wall(0.5, 10, 5, edge + 0.5, 5, 0);
  wall(CUBE / 2, CUBE / 2, CUBE / 2, 0, CUBE / 2, CUBE_Z, 0.4); // the cube never moves

  const logos = LOGOS.map((entry, i) => {
    const mesh = done(createLogo(entry.svg, { depth: entry.depth, bevel: entry.bevel }));
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox.getSize(new THREE.Vector3());
    const scale = LOGO_SIZE / (box.x * box.y) ** 0.25; // wide or tall logos get a little bigger, to balance weight
    mesh.scale.setScalar(scale);
    scene.add(mesh);

    const [x, y, roll] = DROP[i];
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, y, 0)
      .setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rad(roll))))
      .setLinearDamping(0.2).setAngularDamping(1.5).setCcdEnabled(true));
    const { triangles, halfDepth } = mesh.userData.collision;
    for (let t = 0; t < triangles.length; t += 9) {
      const prism = [];
      for (let v = t; v < t + 9; v += 3) {
        for (const z of [halfDepth, -halfDepth]) prism.push(triangles[v] * scale, triangles[v + 1] * scale, z * scale);
      }
      const hull = RAPIER.ColliderDesc.convexHull(new Float32Array(prism)); // null for a sliver; skip those
      if (hull) world.createCollider(hull.setFriction(0.5).setRestitution(0.05), body);
    }

    return { mesh, body };
  });

  const sync = () => {
    for (const { mesh, body } of logos) {
      mesh.position.copy(body.translation());
      mesh.quaternion.copy(body.rotation());
      mesh.updateMatrixWorld();
    }
  };
  // let the pile come to rest before the first frame (fast pre-settle cap)
  for (let i = 0; i < 400 && (i < 60 || logos.some((l) => !l.body.isSleeping())); i++) world.step();
  sync();

  // --- hover and drag -----------------------------------------------------------------------
  const ray = new THREE.Raycaster();
  const meshes = logos.map((l) => l.mesh);
  let hovered = null; // the logo under the pointer
  let overCube = false;
  let drag = null;
  let pointer = null; // the last pointer event over the canvas
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2), camera);
    return ray.intersectObjects(meshes, false)[0];
  };
  const listening = new AbortController(); // dispose() ends every listener at once
  const listen = (type, handler) => canvas.addEventListener(type, handler, { signal: listening.signal });
  const dragQuery = matchMedia(`(min-width: ${dragMinWidth}px)`);
  let dragLocked = !dragQuery.matches;
  const syncDragLock = () => {
    dragLocked = !dragQuery.matches;
    canvas.dataset.dragLocked = dragLocked ? 'true' : 'false';
    if (dragLocked) {
      drag = null;
      hovered = null;
      canvas.style.cursor = '';
    }
  };
  syncDragLock();
  dragQuery.addEventListener('change', syncDragLock, { signal: listening.signal });

  const hover = (e) => { // what the pointer is on: a logo, the cube, or neither
    const hit = pick(e);
    hovered = !dragLocked && hit && e.pointerType !== 'touch' ? logos[meshes.indexOf(hit.object)] : null;
    overCube = !hit && ray.intersectObject(glass, false).length > 0;
    canvas.style.cursor = hovered ? 'grab' : '';
  };
  listen('pointermove', (e) => {
    pointer = e;
    if (drag) pick(e); // keeps `ray` on the pointer for the drag below
    else hover(e);
  });
  listen('pointerleave', () => {
    pointer = hovered = null;
    overCube = false;
  });
  listen('pointerdown', (e) => {
    if (dragLocked) return;
    const hit = e.button === 0 && e.pointerType !== 'touch' && pick(e);
    if (!hit) return;
    drag = {
      logo: logos[meshes.indexOf(hit.object)],
      local: hit.object.worldToLocal(hit.point.clone()), // where on the logo it was grabbed
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), -hit.point.z), // the pointer moves in this plane
    };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    e.preventDefault(); // no text selection while dragging
  });
  const release = (e) => {
    drag = null;
    hover(e);
  };
  listen('pointerup', release);
  listen('pointercancel', release);

  // Pull the grabbed point toward the pointer with a damped spring, so the logo swings from where
  // it is held and still collides with everything.
  const target = new THREE.Vector3(), grab = new THREE.Vector3(), pointVelocity = new THREE.Vector3(), pull = new THREE.Vector3();
  const applyDrag = () => {
    if (!drag || !ray.ray.intersectPlane(drag.plane, target)) return;
    const { body, mesh } = drag.logo;
    mesh.localToWorld(grab.copy(drag.local));
    const spin = body.angvel();
    pointVelocity.set(spin.x, spin.y, spin.z).cross(pull.subVectors(grab, body.worldCom())).add(body.linvel());
    pull.subVectors(target, grab).multiplyScalar(160).addScaledVector(pointVelocity, -24).clampLength(0, 400);
    body.applyImpulseAtPoint(pull.multiplyScalar(body.mass() * STEP), grab, true);
  };

  // --- frame loop ---------------------------------------------------------------------------
  let spotlight = 0, spotlightGoal = 0;
  let breath = 0, breathClock = 0; // how far into the hover state the cube is, and time spent there
  let last = performance.now(), behind = 0, frameMs = 0;
  let redraw = true, stillFrames = 0, drawnAt = 0, frames = 0; // see the pacing in the loop
  let disposed = false;
  let onScreen = true; // nothing runs while the hero is scrolled out of view
  let hidden = typeof document !== 'undefined' && document.hidden;
  let slowTime = 0; // seconds of slow frames, see the loop
  const renderFrame = (now) => {
    if (disposed || !onScreen || hidden) return;
    const elapsed = (now - last) / 1000;
    last = now;
    frameMs += (elapsed * 1000 - frameMs) * 0.05;
    behind = Math.min(behind + elapsed, 0.1);
    while (behind >= STEP) {
      applyDrag();
      for (const logo of logos) logo.before = logo.body.linvel();
      world.step();
      sync();
      for (const logo of logos) {
        // A sudden change of speed is a landing, on the floor or on the pile, which passes the blow
        // on to the floor. Free fall changes it by 0.16 a step; the logo in hand is being pulled, so skip it.
        const v = logo.body.linvel();
        const blow = Math.hypot(v.x - logo.before.x, v.y - logo.before.y, v.z - logo.before.z);
        if (blow < 2 || logo === drag?.logo || logo.mesh.position.y > 2.4 || now - (logo.landedAt ?? 0) < 250) continue;
        logo.landedAt = now;
        floor.pulse(logo.mesh.position.x, logo.mesh.position.z, Math.min(1, blow / 7));
      }
      behind -= STEP;
    }

    // The pile can move under a still pointer, so while anything is moving ask again what it is on.
    const moving = logos.some((l) => !l.body.isSleeping());
    if (moving && pointer && !drag) hover(pointer);

    // A logo is dark until the pointer is on it, and glows for as long as it is pointed at or held:
    // 0.35s up, as in the reference video, and 0.6s back down.
    let lighting = false;
    for (const [i, logo] of logos.entries()) {
      const on = logo === hovered || logo === drag?.logo;
      const value = THREE.MathUtils.clamp((logo.value ?? 0) + (on ? elapsed / 0.35 : -elapsed / 0.6), 0, 1);
      lighting ||= value !== logo.value;
      logo.value = value;
      logo.mesh.userData.setLit(value);
      // its ripple on the floor, from its front edge, fading as it is lifted
      const { x, y, z } = logo.mesh.position;
      floor.rest(i, x, z + 0.5, 1 / (1 + 3 * Math.max(0, y - 1.1)));
    }
    spotlight += (spotlightGoal - spotlight) * Math.min(1, elapsed * 8);
    panel.material.color.setScalar(spotlight * 26);

    // Pointing at the cube: the mark brightens, then breathes on a 2.6s loop. Everything its light
    // touches follows: the glow behind it, its mirror image in the floor, and the light on its neighbours.
    breath += ((overCube ? 1 : 0) - breath) * Math.min(1, elapsed * 5);
    breathClock = overCube ? breathClock + elapsed : 0;
    // with reduced motion it brightens and holds there
    const glow = 1 + breath * (0.7 + (reducedMotion ? 0.5 : 0.5 * (1 - Math.cos((breathClock * Math.PI * 2) / 2.6))));
    mark.userData.setLit(1, glow);
    core.material.color.setScalar(1 + (glow - 1) * 2.2); // the glow behind the mark swells more than the mark itself
    markLight.intensity = 8 * glow;
    // Light caught in the glass shows at its edges. Never exactly zero: turning sheen on later
    // recompiles the glass shader, which froze the first hover for most of a second.
    glass.material.sheen = 0.001 + 0.8 * (glow - 1);

    // How much needs drawing. If the scene itself changed, everything does, the cube's reflections
    // included. If only the floor is moving, the reflections are still good (the floor is not in
    // them): a ring gets every frame, the idle ripple 30 a second, and with reduced motion an idle
    // floor is not drawn at all, the canvas keeps showing its last frame.
    const busy = redraw || lighting || !!drag || breath > 0.002 || Math.abs(spotlightGoal - spotlight) > 0.002 || moving;
    redraw = false;
    stillFrames = busy ? 0 : stillFrames + 1;
    const floorOnly = stillFrames > 2;
    if (floorOnly && !floor.active() && (!floor.rippling || now - drawnAt < 33)) return;
    drawnAt = now;
    frames++;

    // More than a second's worth of slow frames: give up the extra sharpness, once. Time counts,
    // not frames, so a machine at five frames a second is caught as soon as one at thirty. A gap
    // over a second is a tab that was hidden, not a slow machine, and counts for nothing.
    if (elapsed < 1) slowTime = Math.max(0, slowTime + (elapsed > 0.024 ? elapsed : -elapsed));
    if (slowTime > 1 && sharpness > 1) {
      sharpness = 1;
      resize();
    }

    if (!floorOnly) {
      glass.visible = false;
      cubeCamera.update(renderer, scene);
      glass.visible = true;
      // The floor's mirror image: no backdrop, so empty floor stays empty, and the cube shown by
      // its lit inside alone, since drawing glass costs a whole extra pass.
      const backdrop = scene.background;
      scene.background = null;
      glass.material.visible = false;
      floor.reflect(renderer, scene, camera);
      glass.material.visible = true;
      scene.background = backdrop;
    }
    // the floor's pixels lean toward the pointer (not with reduced motion, where the floor stays still)
    if (pointer && !reducedMotion) {
      const box = canvas.getBoundingClientRect();
      floor.point((pointer.clientX - box.left) / box.width, 1 - (pointer.clientY - box.top) / box.height);
    } else floor.point();
    floor.update(camera, renderer);
    composer.render();
  };
  const syncLoop = () => {
    if (disposed) return;
    if (onScreen && !hidden) {
      last = performance.now();
      renderer.setAnimationLoop(renderFrame);
    } else {
      renderer.setAnimationLoop(null);
    }
  };
  const watching = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    syncLoop();
  });
  watching.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    syncLoop();
  }, { signal: listening.signal });
  syncLoop();

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const mobile = w < dragMinWidth;
    const maxPixels = mobile ? MOBILE_MAX_PIXELS : MAX_PIXELS;
    const viewWidth = mobile ? MOBILE_VIEW_WIDTH : VIEW_WIDTH;
    const floorFromBottom = mobile ? MOBILE_FLOOR_FROM_BOTTOM : FLOOR_FROM_BOTTOM;
    renderer.setPixelRatio(Math.min(sharpness, Math.sqrt(maxPixels / (w * h))));
    renderer.setSize(w, h, false); // the page sizes the canvas; only its drawing buffer changes here
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    smooth.material.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio()));
    redraw = true;
    camera.aspect = w / h;
    // Fit viewWidth across the canvas and put the floor line floorFromBottom above the fold. The
    // fold is the bottom of the box the art box is positioned in; any canvas below it shows more floor.
    const art = canvas.parentElement;
    const fold = Math.min(h, (art.offsetParent ?? art).clientHeight - art.offsetTop);
    const lookY = (fold - h / 2) * (viewWidth / w) - floorFromBottom;
    const dist = viewWidth / (2 * Math.tan(rad(camera.fov / 2)) * camera.aspect);
    camera.position.set(0, lookY + 0.4, dist);
    camera.far = Math.max(100, dist + 40);
    camera.lookAt(0, lookY, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(); // the floor reads it before the first render
  };
  const sizing = new ResizeObserver(resize);
  sizing.observe(canvas);
  resize();

  return {
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      listening.abort();
      delete canvas.dataset.dragLocked;
      watching.disconnect();
      sizing.disconnect();
      world.free(); // the physics engine's memory is not garbage collected
      scene.traverse((o) => {
        o.geometry?.dispose();
        for (const material of [o.material ?? []].flat()) {
          material.map?.dispose();
          material.dispose();
        }
      });
      scene.environment.dispose();
      cubeTarget.dispose();
      floor.dispose();
      composer.passes.forEach((pass) => pass.dispose?.());
      composer.dispose();
      renderer.dispose();
    },
    logos,
    mark,
    floor,
    camera,
    setSpotlight: (on) => { spotlightGoal = on ? 1 : 0; canvas.dataset.spotlight = on ? 'on' : 'off'; },
    redraw: () => { redraw = true; }, // draw the next frame even if nothing changed
    frameMs: () => frameMs,
    frames: () => frames, // frames drawn so far
  };
}

// A square canvas with a round gradient from `centre` to `rim`.
function glowCanvas(centre, rim) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const fade = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  fade.addColorStop(0, centre);
  fade.addColorStop(1, rim);
  g.fillStyle = fade;
  g.fillRect(0, 0, 128, 128);
  return c;
}
