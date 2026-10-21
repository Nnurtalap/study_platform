import type {
  BoxGeometry,
  CanvasTexture,
  EdgesGeometry,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CodeFile } from '@/lib/codeScan';
import type { Building, City, Zone } from '@/lib/cityLayout';
import { INK, PAPER, TextureCache, barcodeTexture, codeTexture } from './facade';

// Цвета дублируют токены из globals.css: из WebGL CSS-переменные не прочитать,
// поэтому источник правды — @theme, а здесь его копия.
const ZONE_COLOR: Record<Zone, number> = {
  backend: 0x2448c6,
  components: 0xe3411f,
  app: 0xf1b51c,
  shared: 0x5e5a52,
};

const SIGNAL = 0xe3411f;

/**
 * Смешиваем в sRGB, а не через Color.lerp: three переводит цвета в линейное
 * пространство, и там доля 0.12 даёт почти чистый акцент вместо лёгкого оттенка.
 */
function mix(from: number, to: number, t: number): number {
  let out = 0;
  for (let shift = 16; shift >= 0; shift -= 8) {
    const a = (from >> shift) & 0xff;
    const b = (to >> shift) & 0xff;
    out = (out << 8) | Math.round(a + (b - a) * t);
  }
  return out;
}

export type HoverInfo = {
  index: number;
  path: string;
  lines: number;
  bytes: number;
  x: number;
  y: number;
};

export type SceneCallbacks = {
  onHover(info: HoverInfo | null): void;
  onSelect(index: number | null): void;
};

export type SceneHandle = {
  setSelected(index: number | null): void;
  setFilter(matches: Set<number> | null): void;
  dispose(): void;
};

const INK_HEX = 0x121212;
const PAPER_HEX = 0xf2eee6;

export function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    // Пробный контекст сразу отпускаем: браузер держит их считанное число
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

type Slot = {
  building: Building;
  mesh: Mesh;
  cx: number;
  cz: number;
  /** Материал стен: сначала плоский, после сборки «штрих-кода» — с текстурой */
  wall: MeshStandardMaterial;
  barcode: CanvasTexture | null;
  facade: Mesh | null;
  facadeFace: number;
  dimmed: boolean;
};

const FACE_NORMALS: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

// Ближе этого расстояния у дома появляется читаемый текст
const READABLE_DISTANCE = 26;
const READABLE_LIMIT = 10;
const BARCODES_PER_FRAME = 6;
const FLY_MS = 700;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export async function createCityScene(
  container: HTMLElement,
  city: City,
  files: CodeFile[],
  labelClassName: string,
  callbacks: SceneCallbacks,
): Promise<SceneHandle> {
  const THREE = await import('three');
  const { OrbitControls: Controls } = await import('three/addons/controls/OrbitControls.js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const renderer: WebGLRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(PAPER);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  // PCFSoftShadowMap убрали в r186 — остался PCFShadowMap
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // На 3x-экране полный пиксель-рейтио с тенями — самый быстрый способ уехать в 15 fps
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const labelLayer = document.createElement('div');
  labelLayer.setAttribute('aria-hidden', 'true');
  labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  container.appendChild(labelLayer);

  const scene: Scene = new THREE.Scene();
  scene.background = new THREE.Color(PAPER);
  // Бумажный туман: дальние кварталы растворяются в листе, а не в дымке
  scene.fog = new THREE.Fog(PAPER, city.size * 1.4, city.size * 3.4);

  const camera: PerspectiveCamera = new THREE.PerspectiveCamera(42, 1, 0.5, city.size * 5);
  // Отходим так, чтобы в кадр влез весь город: 64 единицы при fov 42
  camera.position.set(city.size * 0.95, city.size * 0.78, city.size * 0.95);

  const controls: OrbitControls = new Controls(camera, renderer.domElement);
  controls.target.set(0, 3, 0);
  controls.enableDamping = !reduceMotion.matches;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 3;
  controls.maxDistance = city.size * 2;
  controls.update();

  // Меньше заливки и больше солнца: иначе грани домов сливаются в один силуэт
  scene.add(new THREE.AmbientLight(PAPER, 0.95));
  const sun = new THREE.DirectionalLight(0xffffff, 3.1);
  sun.position.set(city.size * 0.5, city.size * 0.9, city.size * 0.35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0008;
  const shadowSide = city.size * 0.75;
  sun.shadow.camera.left = -shadowSide;
  sun.shadow.camera.right = shadowSide;
  sun.shadow.camera.top = shadowSide;
  sun.shadow.camera.bottom = -shadowSide;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = city.size * 4;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);

  // Три геометрии на весь город: всё остальное — масштаб конкретного меша
  const boxGeometry: BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const planeGeometry: PlaneGeometry = new THREE.PlaneGeometry(1, 1);
  const edgeGeometry: EdgesGeometry = new THREE.EdgesGeometry(boxGeometry);

  const ground = new THREE.Mesh(
    planeGeometry,
    new THREE.MeshStandardMaterial({ color: PAPER, roughness: 1 }),
  );
  ground.scale.set(city.size * 3, city.size * 3, 1);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a35, roughness: 0.9 });
  const baseMaterial = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.95 });
  const dimMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfc9bd,
    roughness: 1,
    transparent: true,
    opacity: 0.45,
  });

  const plateMaterials = new Map<Zone, MeshStandardMaterial>();
  for (const zone of Object.keys(ZONE_COLOR) as Zone[]) {
    plateMaterials.set(
      zone,
      new THREE.MeshStandardMaterial({ color: mix(PAPER_HEX, ZONE_COLOR[zone], 0.34), roughness: 1 }),
    );
  }

  // Плиты кварталов: верхние два уровня — цветом района, глубже было бы рябью
  const plates = new THREE.Group();
  for (const district of city.districts) {
    if (district.depth > 1) continue;
    const material = plateMaterials.get(district.zone);
    if (!material) continue;

    const plate = new THREE.Mesh(planeGeometry, material);
    plate.scale.set(district.w, district.d, 1);
    plate.rotation.x = -Math.PI / 2;
    plate.position.set(district.x + district.w / 2, 0.02 + district.depth * 0.01, district.z + district.d / 2);
    plate.receiveShadow = true;
    plates.add(plate);
  }
  scene.add(plates);

  const buildings = new THREE.Group();
  const slots: Slot[] = [];
  const byIndex = new Map<number, Slot>();
  const pickTargets: Mesh[] = [];

  for (const building of city.buildings) {
    const wall = new THREE.MeshStandardMaterial({
      color: mix(INK_HEX, ZONE_COLOR[building.zone], 0.26),
      roughness: 0.92,
    });

    const cx = building.x + building.w / 2;
    const cz = building.z + building.d / 2;

    // Порядок слотов в BoxGeometry: +x, -x, +y, -y, +z, -z
    const mesh = new THREE.Mesh(boxGeometry, [wall, wall, roofMaterial, baseMaterial, wall, wall]);
    mesh.scale.set(building.w, building.h, building.d);
    mesh.position.set(cx, building.h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.index = building.index;

    buildings.add(mesh);
    pickTargets.push(mesh);
    const slot: Slot = {
      building,
      mesh,
      cx,
      cz,
      wall,
      barcode: null,
      facade: null,
      facadeFace: -1,
      dimmed: false,
    };
    slots.push(slot);
    byIndex.set(building.index, slot);
  }
  scene.add(buildings);

  const outline: LineSegments = new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({ color: SIGNAL }),
  );
  outline.visible = false;
  scene.add(outline);

  const readable = new TextureCache(READABLE_LIMIT);
  const facadeMaterials = new Map<number, MeshBasicMaterial>();
  const barcodeQueue = slots.map((_, i) => i);

  const labels = new Map<string, HTMLSpanElement>();
  for (const district of city.districts) {
    if (district.depth > 0) continue;
    const span = document.createElement('span');
    span.className = labelClassName;
    span.textContent = district.label;
    span.style.cssText = 'position:absolute;transform:translate(-50%,-50%);white-space:nowrap';
    labelLayer.appendChild(span);
    labels.set(district.path, span);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const projected = new THREE.Vector3();
  const flyFrom = new THREE.Vector3();
  const flyTo = new THREE.Vector3();
  const targetFrom = new THREE.Vector3();
  const targetTo = new THREE.Vector3();

  let disposed = false;
  let frame = 0;
  let dirty = true;
  let pointerMoved = false;
  let pointerInside = false;
  let hovered: number | null = null;
  let selected: number | null = null;
  let flyStart = 0;
  let flying = false;
  let downX = 0;
  let downY = 0;

  function requestRender(): void {
    if (disposed) return;
    dirty = true;
    if (frame === 0) frame = requestAnimationFrame(tick);
  }

  function resize(): void {
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    // updateStyle оставляем включённым: иначе при pixelRatio 2 канва
    // раздувается до 2880 CSS-пикселей и вылезает за контейнер
    renderer.setSize(clientWidth, clientHeight);
    requestRender();
  }

  function slotOf(index: number): Slot | undefined {
    return byIndex.get(index);
  }

  function setWall(mesh: Mesh, wall: Material, roof: Material): void {
    mesh.material = [wall, wall, roof, baseMaterial, wall, wall];
  }

  function applyDim(slot: Slot, dim: boolean): void {
    if (slot.dimmed === dim) return;
    slot.dimmed = dim;
    // Крышу гасим вместе со стенами, иначе призрачные дома остаются в тёмных шапках
    setWall(slot.mesh, dim ? dimMaterial : slot.wall, dim ? dimMaterial : roofMaterial);
    if (slot.facade) slot.facade.visible = !dim;
  }

  function buildBarcode(slot: Slot): void {
    const file = files[slot.building.index];
    if (!file) return;
    slot.barcode = barcodeTexture(THREE, file.path, file.source);
    slot.wall.map = slot.barcode;
    slot.wall.needsUpdate = true;
  }

  /** Выбираем сторону, которая сейчас смотрит на камеру: на неё и вешаем текст */
  function faceFor(slot: Slot): number {
    const dx = camera.position.x - slot.cx;
    const dz = camera.position.z - slot.cz;
    let best = 0;
    let bestDot = -Infinity;
    FACE_NORMALS.forEach(([nx, nz], i) => {
      const dot = nx * dx + nz * dz;
      if (dot > bestDot) {
        bestDot = dot;
        best = i;
      }
    });
    return best;
  }

  function placeFacade(slot: Slot, face: number): void {
    const { building } = slot;
    const [nx, nz] = FACE_NORMALS[face];
    const width = nz !== 0 ? building.w : building.d;
    const half = nz !== 0 ? building.d / 2 : building.w / 2;

    const mesh = slot.facade;
    if (!mesh) return;

    mesh.scale.set(width * 0.97, building.h * 0.97, 1);
    // Чуть выносим вперёд, иначе плоскость мерцает в одной глубине со стеной
    mesh.position.set(slot.cx + nx * (half + 0.012), building.h / 2, slot.cz + nz * (half + 0.012));
    mesh.rotation.y = Math.atan2(nx, nz);
    slot.facadeFace = face;
  }

  function ensureReadable(slot: Slot): void {
    const file = files[slot.building.index];
    if (!file || file.lines === 0) return;

    const key = file.path;
    let texture = readable.get(key);

    if (!texture) {
      const aspect = ((slot.building.w + slot.building.d) / 2) / slot.building.h;
      texture = codeTexture(THREE, file.path, file.source, aspect);
      readable.set(key, texture);
    }

    let material = facadeMaterials.get(slot.building.index);
    if (!material) {
      material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
      facadeMaterials.set(slot.building.index, material);
    } else if (material.map !== texture) {
      material.map = texture;
      material.needsUpdate = true;
    }

    if (!slot.facade) {
      const facade = new THREE.Mesh(planeGeometry, material);
      facade.castShadow = false;
      facade.receiveShadow = false;
      // Фасад не должен перехватывать луч: кликаем по самому дому
      facade.raycast = () => {};
      slot.facade = facade;
      scene.add(facade);
    } else {
      slot.facade.material = material;
    }

    slot.facade.visible = !slot.dimmed;
    const face = faceFor(slot);
    if (face !== slot.facadeFace) placeFacade(slot, face);
  }

  function dropReadable(slot: Slot): void {
    if (!slot.facade) return;
    scene.remove(slot.facade);
    slot.facade = null;
    slot.facadeFace = -1;
  }

  function updateReadable(): void {
    // Текст строим только у ближайших домов: такая текстура весит до 4096 px
    const ranked = slots
      .filter((slot) => !slot.dimmed && files[slot.building.index]?.lines)
      .map((slot) => ({
        slot,
        distance: Math.hypot(camera.position.x - slot.cx, camera.position.z - slot.cz),
      }))
      .filter((entry) => entry.distance < READABLE_DISTANCE)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, READABLE_LIMIT);

    const keep = new Set(ranked.map((entry) => entry.slot.building.index));
    if (selected !== null) keep.add(selected);

    for (const slot of slots) {
      if (slot.facade && !keep.has(slot.building.index)) dropReadable(slot);
    }
    for (const entry of ranked) ensureReadable(entry.slot);

    const chosen = selected !== null ? slotOf(selected) : undefined;
    if (chosen) ensureReadable(chosen);
  }

  function updateLabels(): void {
    const { clientWidth, clientHeight } = container;

    for (const district of city.districts) {
      if (district.depth > 0) continue;
      const span = labels.get(district.path);
      if (!span) continue;

      projected.set(district.x + district.w / 2, 0.4, district.z + district.d / 2);
      projected.project(camera);

      const behind = projected.z > 1;
      span.style.opacity = behind ? '0' : '0.75';
      span.style.left = `${((projected.x + 1) / 2) * clientWidth}px`;
      span.style.top = `${((1 - projected.y) / 2) * clientHeight}px`;
    }
  }

  function pick(): void {
    if (!pointerInside) {
      if (hovered !== null) {
        hovered = null;
        callbacks.onHover(null);
      }
      return;
    }

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickTargets, false)[0];
    const index = hit ? (hit.object.userData.index as number) : null;

    if (index === hovered) return;
    hovered = index;

    if (index === null) {
      callbacks.onHover(null);
      return;
    }

    const file = files[index];
    const rect = container.getBoundingClientRect();
    callbacks.onHover({
      index,
      path: file.path,
      lines: file.lines,
      bytes: file.bytes,
      x: ((pointer.x + 1) / 2) * rect.width,
      y: ((1 - pointer.y) / 2) * rect.height,
    });
  }

  function updateOutline(): void {
    if (selected === null) {
      outline.visible = false;
      return;
    }
    const slot = slotOf(selected);
    if (!slot) {
      outline.visible = false;
      return;
    }
    outline.visible = true;
    outline.scale.set(slot.building.w * 1.02, slot.building.h * 1.02, slot.building.d * 1.02);
    outline.position.copy(slot.mesh.position);
  }

  function flyToSlot(slot: Slot): void {
    const distance = Math.min(40, Math.max(12, slot.building.h * 1.9));
    const [nx, nz] = FACE_NORMALS[faceFor(slot)];

    flyFrom.copy(camera.position);
    targetFrom.copy(controls.target);
    targetTo.set(slot.cx, slot.building.h * 0.45, slot.cz);
    flyTo.set(
      slot.cx + nx * distance * 0.8,
      slot.building.h * 0.75 + distance * 0.45,
      slot.cz + nz * distance * 0.8,
    );

    if (reduceMotion.matches) {
      camera.position.copy(flyTo);
      controls.target.copy(targetTo);
      controls.update();
      flying = false;
      requestRender();
      return;
    }

    flyStart = performance.now();
    flying = true;
    requestRender();
  }

  function tick(): void {
    frame = 0;
    if (disposed) return;

    if (flying) {
      const t = Math.min(1, (performance.now() - flyStart) / FLY_MS);
      const eased = easeInOutCubic(t);
      camera.position.lerpVectors(flyFrom, flyTo, eased);
      controls.target.lerpVectors(targetFrom, targetTo, eased);
      if (t >= 1) flying = false;
      dirty = true;
    }

    const moving = controls.update();
    if (pointerMoved) {
      pick();
      pointerMoved = false;
      dirty = true;
    }

    if (dirty || moving || flying) {
      updateReadable();
      updateOutline();
      updateLabels();
      renderer.render(scene, camera);
      dirty = false;
    }

    // «Штрих-коды» докладываем порциями: 176 канв разом дали бы заметный провал
    if (barcodeQueue.length > 0) {
      for (let i = 0; i < BARCODES_PER_FRAME && barcodeQueue.length > 0; i += 1) {
        const index = barcodeQueue.shift();
        if (index !== undefined) buildBarcode(slots[index]);
      }
      dirty = true;
    }

    if (dirty || moving || flying || barcodeQueue.length > 0) {
      frame = requestAnimationFrame(tick);
    }
  }

  function onPointerMove(event: PointerEvent): void {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    pointerInside = true;
    pointerMoved = true;
    requestRender();
  }

  function onPointerLeave(): void {
    pointerInside = false;
    pointerMoved = true;
    requestRender();
  }

  function onPointerDown(event: PointerEvent): void {
    downX = event.clientX;
    downY = event.clientY;
  }

  function onPointerUp(event: PointerEvent): void {
    // Больше четырёх пикселей — это вращение камеры, а не выбор дома
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > 4) return;
    callbacks.onSelect(hovered);
  }

  function onControlsStart(): void {
    flying = false;
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  controls.addEventListener('change', requestRender);
  controls.addEventListener('start', onControlsStart);

  resize();
  requestRender();

  return {
    setSelected(index: number | null): void {
      selected = index;
      const slot = index === null ? undefined : slotOf(index);
      if (slot) flyToSlot(slot);
      requestRender();
    },

    setFilter(matches: Set<number> | null): void {
      for (const slot of slots) {
        applyDim(slot, matches !== null && !matches.has(slot.building.index));
      }
      requestRender();
    },

    dispose(): void {
      disposed = true;
      if (frame !== 0) cancelAnimationFrame(frame);
      observer.disconnect();

      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.removeEventListener('change', requestRender);
      controls.removeEventListener('start', onControlsStart);
      controls.dispose();

      for (const slot of slots) {
        slot.barcode?.dispose();
        slot.wall.dispose();
      }
      for (const material of facadeMaterials.values()) material.dispose();
      for (const material of plateMaterials.values()) material.dispose();
      readable.dispose();

      roofMaterial.dispose();
      baseMaterial.dispose();
      dimMaterial.dispose();
      (ground.material as MeshStandardMaterial).dispose();
      (outline.material as Material).dispose();
      boxGeometry.dispose();
      planeGeometry.dispose();
      edgeGeometry.dispose();

      renderer.dispose();
      // Браузер держит около 16 живых контекстов, а Strict Mode монтирует дважды
      renderer.forceContextLoss();

      labelLayer.remove();
      renderer.domElement.remove();
    },
  };
}
