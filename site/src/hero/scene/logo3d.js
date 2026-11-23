import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

// The three parts of a logo, built like a backlit sign letter: a face that lights up, set in a
// dark metal body with a polished rim. `lit` is each part's emissive colour when fully on.
// The walls and rim stay mostly reflective when lit, so their colour survives the glow.
// Every part carries a thin film, which makes its reflections iridescent: teal seen head-on,
// sliding to violet at a glancing angle (film index 2.0, 300nm, picked from a rendered chart).
// The colours only show on a dark base. A bright metal reflects everything and stays plain.
const FILM = { iridescence: 1, iridescenceIOR: 2.0, iridescenceThicknessRange: [100, 300] };
const part = (hex, strength, look) => ({ lit: new THREE.Color(hex).multiplyScalar(strength), look: { metalness: 1, ...look, ...FILM } });
const PARTS = [
  part('#97FBE3', 0.9, { color: 0x1c1c1c, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04 }), // front and back faces
  part('#1CD8B3', 0.12, { color: 0x2a2a2a, roughness: 0.3 }), // side walls
  part('#97FBE3', 0.06, { color: 0x666666, roughness: 0.2 }), // bevel
];
const DIM = new THREE.Color('#0B5D55'); // every part ignites to this tone first, as in the reference video

/**
 * One builder for every asset logo. The outline is the SVG path itself, so it is exact.
 * Returns a Mesh whose larger side is `size`, centred on the origin, facing +Z.
 * `depth` and `bevel` are fractions of `size`. Drive the light-up with mesh.userData.setLit(0..1);
 * its second argument scales the glow (1 is normal).
 * The bevel is inset, so keep it under half the thinnest stroke of the logo or it folds over itself.
 * mesh.userData.collision holds the outline as flat triangles for the physics, see below.
 */
export function createLogo(svgText, { size = 1, depth = 0.26, bevel = 0.014 } = {}) {
  const raw = new SVGLoader().parse(svgText).paths.flatMap((p) => SVGLoader.createShapes(p));
  const box = new THREE.Box2();
  raw.forEach((s) => s.getPoints(8).forEach((p) => box.expandByPoint(p)));
  const unit = Math.max(box.max.x - box.min.x, box.max.y - box.min.y); // SVG units across the logo
  const b = bevel * unit;

  // Redraw every outline as a polyline that stays within `tolerance` (a fraction of the logo's size).
  const redraw = (tolerance) => {
    const tidy = (curve) => {
      const points = curve.getPoints(12);
      if (!points[0].equals(points[points.length - 1])) points.push(points[0].clone());
      return simplify(points, tolerance * unit).slice(0, -1);
    };
    return raw.map((s) => {
      const shape = new THREE.Shape(tidy(s));
      shape.holes = s.holes.map((h) => new THREE.Path(tidy(h)));
      return shape;
    });
  };

  // Tiny arcs in a logo path give segments far shorter than the bevel, and ExtrudeGeometry's bevel
  // spikes on those, so the visible mesh is built from the outline redrawn within 0.15%.
  let geometry = new THREE.ExtrudeGeometry(redraw(0.0015), {
    depth: depth * unit - 2 * b, // the bevel adds its thickness at both ends
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: -b, // inset the faces, so the widest outline stays the SVG outline
    bevelSegments: 5,
  });
  const k = size / unit;
  geometry.rotateX(Math.PI); // SVG y points down; a half turn about X fixes it without mirroring
  geometry.computeBoundingBox();
  const centre = geometry.boundingBox.getCenter(new THREE.Vector3());
  geometry.translate(-centre.x, -centre.y, -centre.z).scale(k, k, k);
  regroupByFacing(geometry);
  geometry = toCreasedNormals(geometry, 0.6); // round the bevel into the walls
  const normal = geometry.attributes.normal; // ...but keep the faces flat, or their big triangles shade unevenly
  for (let i = 0; i < geometry.groups[0].count; i++) normal.setXYZ(i, 0, 0, Math.sign(normal.getZ(i)));

  const materials = PARTS.map(({ look }) => new THREE.MeshPhysicalMaterial({
    ...look,
    side: THREE.DoubleSide, // where a stroke is thinner than the bevel the faces fold over; still draw them
  }));
  const mesh = new THREE.Mesh(geometry, materials);

  mesh.userData.setLit = (t, boost = 1) => {
    // two stages: black to one dim tone on every part, then each part rises to its own colour
    const ignite = THREE.MathUtils.smoothstep(t, 0, 0.35);
    const rise = THREE.MathUtils.smoothstep(t, 0.3, 1);
    materials.forEach((m, i) => {
      m.emissive.copy(DIM).lerp(PARTS[i].lit, rise);
      m.emissiveIntensity = ignite * boost;
    });
  };
  mesh.userData.setLit(0);

  // Collision shape: the outline redrawn coarser (within 0.8%), cut into flat triangles in the
  // mesh's own coordinates. The scene turns each triangle into a prism 2 x halfDepth thick, which
  // keeps hollows and notches real, so logos can hook into each other.
  const flat = new THREE.ShapeGeometry(redraw(0.008)).rotateX(Math.PI).translate(-centre.x, -centre.y, 0).scale(k, k, k);
  mesh.userData.collision = { triangles: flat.toNonIndexed().attributes.position.array, halfDepth: (depth * size) / 2 };
  return mesh;
}

// The room the logos are lit by, to render into an environment map. Three thin strip lights give
// sharp highlights along bevels. Two big dim panels give polished surfaces a soft gradient to
// reflect, which is what stops them reading as flat black.
export function createRoomStrips() {
  const room = new THREE.Group();
  const lights = [[9, 0.35, 0, 6, 3, 40], [0.35, 7, -7, 1, 2, 18], [0.35, 7, 6, 2, -3, 12], [16, 8, 0, 10, 8, 0.5], [8, 10, -12, 3, 6, 0.3]];
  for (const [w, h, x, y, z, power] of lights) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(power), side: THREE.DoubleSide }));
    strip.position.set(x, y, z);
    strip.lookAt(0, 0, 0);
    room.add(strip);
  }
  return room;
}

// Sort triangles into three draw groups by which way they face: 0 faces (±Z), 1 side walls, 2 bevel.
// ExtrudeGeometry only separates faces from everything else, and the bevel needs its own tone.
function regroupByFacing(geometry) {
  const pos = geometry.attributes.position.array;
  const lists = [[], [], []];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < pos.length; i += 9) {
    a.fromArray(pos, i); b.fromArray(pos, i + 3); c.fromArray(pos, i + 6);
    const nz = Math.abs(b.sub(a).cross(c.sub(a)).normalize().z);
    lists[nz > 0.99 ? 0 : nz < 0.01 ? 1 : 2].push(i);
  }
  const sorted = new Float32Array(pos.length);
  let o = 0;
  geometry.clearGroups();
  lists.forEach((list, materialIndex) => {
    geometry.addGroup(o / 3, list.length * 3, materialIndex);
    for (const i of list) { sorted.set(pos.subarray(i, i + 9), o); o += 9; }
  });
  geometry.setAttribute('position', new THREE.BufferAttribute(sorted, 3));
  geometry.deleteAttribute('uv');
  geometry.deleteAttribute('normal');
}

// Ramer-Douglas-Peucker: keep only the points that sit more than `tolerance` off the line
// through their kept neighbours. Corners survive exactly; redundant curve samples go.
function simplify(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const spans = [[0, points.length - 1]];
  while (spans.length) {
    const [from, to] = spans.pop();
    let worst = 0, at = -1;
    for (let i = from + 1; i < to; i++) {
      const d = distanceToSegment(points[i], points[from], points[to]);
      if (d > worst) { worst = d; at = i; }
    }
    if (worst > tolerance) { keep[at] = 1; spans.push([from, at], [at, to]); }
  }
  return points.filter((_, i) => keep[i]);
}

function distanceToSegment(p, a, b) {
  const ab = b.clone().sub(a);
  const t = ab.lengthSq() ? THREE.MathUtils.clamp(p.clone().sub(a).dot(ab) / ab.lengthSq(), 0, 1) : 0;
  return p.distanceTo(ab.multiplyScalar(t).add(a));
}
