import * as THREE from 'three';

const CELL = [10, 10]; // one pixel, in CSS pixels: small enough for a mirrored logo to keep its shape
const PULSES = 8; // rings alive at once; the oldest is reused
const RESTING = 12; // things that can rest on the floor at once
const PULSE_LIFE = 3.2; // seconds until a ring has faded out

/**
 * The floor, drawn as a grid of the page's pixels: four-point stars that lean as the Hevium mark does,
 * each as big and as bright as the floor is at its cell (the user chose the star over a square and a
 * circle on 2026-11-22; lib/pixels.ts draws the same star on a canvas). Four things decide a pixel's size:
 * a sparse speckle everywhere, the mirror image of whatever stands on it (reflect), a slow
 * ripple at the waterline of whatever rests on it (rest), as if it floated on water, and rings
 * that spread from wherever something lands (pulse). Inside a ring the floor goes dark for a
 * moment, as in the interactive-floor reference.
 *
 * The pixels are laid out on the screen, not on the floor, so they keep their shape at this low
 * camera angle. Each one looks up the spot on the floor behind it. Pixels near the pointer slide
 * toward it inside their cells and swell a little (point).
 *
 * The ripple never stops, so the scene keeps drawing for it; `rippling` is false with
 * `reducedMotion`, and then the floor only changes while a ring is alive (active).
 */
export async function createFloor(reducedMotion) {
  const uniforms = {
    uCell: { value: new THREE.Vector2() },
    uResolution: { value: new THREE.Vector2() },
    uInvViewProj: { value: new THREE.Matrix4() },
    uTime: { value: 0 },
    // x, z, start time, strength. Strength must start at 0: a bare Vector4 has w = 1, which is a full-strength ring.
    uPulses: { value: Array.from({ length: PULSES }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uResting: { value: Array.from({ length: RESTING }, () => new THREE.Vector3()) }, // x, z, how afloat
    uRipple: { value: reducedMotion ? 0 : 1 },
    uPointer: { value: new THREE.Vector3() }, // x and y from the bottom left of the screen, 0 to 1, and how hard it pulls
    uReflection: { value: null },
    uMirror: { value: new THREE.Matrix4() },
    uDim: { value: new THREE.Color('#0B5D55') },
    uBright: { value: new THREE.Color('#97FBE3') },
  };

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 40).rotateX(-Math.PI / 2).translate(0, 0, 12), new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform vec2 uCell, uResolution;
      uniform mat4 uInvViewProj;
      uniform float uTime;
      uniform vec4 uPulses[${PULSES}];
      uniform vec3 uResting[${RESTING}];
      uniform float uRipple;
      uniform vec3 uPointer;
      uniform sampler2D uReflection;
      uniform mat4 uMirror;
      uniform vec3 uDim, uBright;

      // Distances on the floor are measured with depth squeezed. Seen this low, a true circle is a
      // sliver one pixel tall; squeezed, pools and rings open into ellipses that read as round.
      const vec2 STRETCH = vec2(1.0, 0.45);
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      void main() {
        // the floor point behind the middle of this pixel
        vec2 cell = floor(gl_FragCoord.xy / uCell);
        vec2 ndc = (cell + 0.5) * uCell / uResolution * 2.0 - 1.0;
        vec4 near = uInvViewProj * vec4(ndc, -1.0, 1.0), far = uInvViewProj * vec4(ndc, 1.0, 1.0);
        near /= near.w; far /= far.w;
        vec3 ray = far.xyz - near.xyz;
        if (ray.y >= 0.0) discard;
        vec2 p = (near.xyz + ray * (-near.y / ray.y)).xz;

        float grain = hash(cell);
        float value = grain > 0.7 ? 0.1 + 0.14 * hash(cell + 7.0) : 0.0; // a quiet speckle on three cells in ten
        float ripple = 0.0;
        for (int i = 0; i < ${RESTING}; i++) {
          // small waves leaving anything that rests on the floor, each object out of step with the next
          float reach = length((p - uResting[i].xy) * STRETCH);
          ripple += uResting[i].z * exp(-reach * 2.6) * (0.3 + 0.7 * (0.5 + 0.5 * sin(reach * 8.0 - uTime * 1.8 + float(i) * 1.7)));
        }
        value += uRipple * 0.55 * min(ripple, 1.0) * (0.45 + 0.55 * grain);

        // The mirror image: what the camera under the floor sees at this spot. It fades with the
        // height of what it shows, and sways a little, as a reflection on water does.
        float height = near.y * max(p.y, 0.0) / max(near.z - p.y, 0.001);
        vec4 spot = uMirror * vec4(p.x, 0.0, p.y, 1.0);
        vec2 at = spot.xy / spot.w * 0.5 + 0.5;
        at.x += uRipple * 0.0025 * sin(p.y * 2.4 - uTime * 1.5) * min(height, 1.0);
        // Four spots in the pixel. The brightest counts, not their average: thin strokes are
        // narrower than a pixel and an average would lose them.
        vec2 tap = 0.25 * uCell / uResolution;
        vec4 s0 = textureLod(uReflection, at - tap, 2.0), s1 = textureLod(uReflection, at + tap, 2.0);
        vec4 s2 = textureLod(uReflection, at + tap * vec2(1.0, -1.0), 2.0), s3 = textureLod(uReflection, at + tap * vec2(-1.0, 1.0), 2.0);
        vec4 seen = max(max(s0, s1), max(s2, s3));
        // Three readings of the image. Lit parts show by their brightness. A dark object would mirror
        // as nothing, so its outline is drawn, wherever the image's coverage changes inside the
        // pixel, over a faint fill.
        float outline = seen.a - min(min(s0.a, s1.a), min(s2.a, s3.a));
        float lit = 1.0 - exp(-7.0 * dot(seen.rgb, vec3(0.2126, 0.7152, 0.0722)));
        float image = max(max(lit, 0.7 * smoothstep(0.12, 0.5, outline)) * (0.85 + 0.15 * grain), 0.14 * seen.a);
        value = max(value, image * exp(-height * 0.3));

        float ring = 0.0, cleared = 0.0;
        for (int i = 0; i < ${PULSES}; i++) {
          float age = uTime - uPulses[i].z;
          if (uPulses[i].w <= 0.0 || age < 0.0 || age > ${PULSE_LIFE.toFixed(1)}) continue;
          float d = length((p - uPulses[i].xy) * STRETCH);
          float radius = 0.25 + age * (2.6 - 0.35 * age); // fast at first, then easing out
          float width = 0.24 + 0.12 * radius;
          float fade = uPulses[i].w * exp(-age * 0.9);
          ring += fade * exp(-pow((d - radius) / width, 2.0)) * (0.6 + 0.4 * grain);
          cleared = max(cleared, fade * (1.0 - smoothstep(radius - 2.0 * width, radius, d)));
        }
        value = value * (1.0 - min(cleared * 2.0, 0.96)) + ring * 2.2;

        // no floor behind the pile, or far out to the sides
        value *= smoothstep(-3.0, -0.6, p.y) * (1.0 - smoothstep(7.5, 11.0, abs(p.x)));

        float shown = step(0.1, value); // under this the cell is empty
        if (shown < 1.0) discard;
        // The pointer pulls on the pixels within about twelve cells of it.
        vec2 centre = (cell + 0.5) * uCell;
        vec2 toPointer = uPointer.xy * uResolution - centre;
        float away = max(length(toPointer), 1.0), reach = uCell.x * 12.0;
        float pulled = uPointer.z * exp(-away * away / (reach * reach));
        // The star: four points with hollow sides (an astroid), leaning as the Hevium mark does.
        // It slides toward the pointer inside its cell and swells a little.
        vec2 local = (gl_FragCoord.xy - centre) / uCell - toPointer / away * pulled * 0.2;
        local.x -= 0.3 * local.y;
        float radius = 0.5 * (0.16 + 0.84 * min(value, 1.0)) * (1.0 + 0.3 * pulled);
        float ink = 1.0 - smoothstep(-0.03, 0.03, pow(abs(local.x), 0.6667) + pow(abs(local.y), 0.6667) - pow(radius, 0.6667));
        vec3 colour = mix(uDim, uBright, min(value, 1.0)) * ink * (0.45 + 1.5 * value) * (1.0 + 0.5 * pulled) * shown;
        gl_FragColor = vec4(colour, 1.0);
      }`,
  }));

  // The mirror image is the scene drawn from under the floor, at half size: one pixel covers
  // many of its pixels, so more would be wasted.
  const reflection = new THREE.WebGLRenderTarget(1, 1, { samples: 4, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  uniforms.uReflection.value = reflection.texture;
  const mirror = new THREE.PerspectiveCamera();
  const size = new THREE.Vector2(), forward = new THREE.Vector3();

  const started = performance.now();
  const clock = () => (performance.now() - started) / 1000;
  let next = 0, count = 0, lastPulse = -PULSE_LIFE, pulling = 0;
  return {
    mesh,
    /** Start a ring at (x, z). Strength runs from 0 to 1. */
    pulse(x, z, strength) {
      lastPulse = clock();
      uniforms.uPulses.value[next++ % PULSES].set(x, z, lastPulse, strength);
      count++;
    },
    /** Thing `i` is at (x, z) and this far afloat: 1 resting on the floor, 0 up in the air. */
    rest(i, x, z, afloat) { uniforms.uResting.value[i].set(x, z, afloat); },
    rippling: uniforms.uRipple.value > 0,
    /** Where the pointer is, as shares of the screen from its bottom left, or nothing when it is away. */
    point(x, y) {
      pulling = x === undefined ? 0 : 1;
      if (pulling) uniforms.uPointer.value.setX(x).setY(y);
    },
    dispose() {
      reflection.dispose();
    },
    /** Redraw the mirror image. Call when something in `scene` has moved or changed. */
    reflect(renderer, scene, camera) {
      renderer.getSize(size).multiplyScalar(0.5).ceil();
      if (size.x !== reflection.width || size.y !== reflection.height) reflection.setSize(size.x, size.y);
      // the camera, mirrored in the floor: same place and aim with up and down swapped
      mirror.copy(camera);
      mirror.layers.set(0); // not the floor itself, it cannot be in its own reflection
      mirror.position.y *= -1;
      camera.getWorldDirection(forward).y *= -1;
      mirror.lookAt(forward.add(mirror.position));
      renderer.setRenderTarget(reflection);
      renderer.render(scene, mirror);
      renderer.setRenderTarget(null);
      uniforms.uMirror.value.multiplyMatrices(mirror.projectionMatrix, mirror.matrixWorldInverse);
    },
    /** Call before each drawn frame. */
    update(camera, renderer) {
      uniforms.uTime.value = clock();
      uniforms.uPointer.value.z += (pulling - uniforms.uPointer.value.z) * 0.15; // the pull eases in and back out
      uniforms.uInvViewProj.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
      renderer.getDrawingBufferSize(uniforms.uResolution.value);
      uniforms.uCell.value.fromArray(CELL).multiplyScalar(renderer.getPixelRatio());
    },
    active: () => clock() - lastPulse < PULSE_LIFE,
    count: () => count,
  };
}
