import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, RotateCcw } from 'lucide-react';

export const ThreeBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [cameraAngle, setCameraAngle] = useState({ x: 0, y: 0 });

  // Refs for animation loop and interaction
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectsGroupRef = useRef<THREE.Group | null>(null);

  const mousePos = useRef({ x: 0, y: 0 });
  const targetCamPos = useRef({ x: 0, y: 0, z: 14 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const manualRotOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Fog for atmospheric depth
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 14);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Vibrant Three-Point Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Key warm light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Cool cyan/blue fill light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    fillLight.position.set(-10, -5, 8);
    scene.add(fillLight);

    // Violet/amber rim light from behind for brilliant book edge highlights
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    rimLight.position.set(0, -8, -6);
    scene.add(rimLight);

    const objectsGroup = new THREE.Group();
    objectsGroupRef.current = objectsGroup;
    scene.add(objectsGroup);

    // Helper: Create 3D Book with colored hardcover, realistic paper block, spine, and ribbon
    const createBook = (colorHex: number, width = 2.2, height = 3.0, thickness = 0.55) => {
      const book = new THREE.Group();

      // Cover Material (rich, slight sheen)
      const coverMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.35,
        metalness: 0.15,
      });

      // Pages Paper Material (soft ivory white)
      const pagesMat = new THREE.MeshStandardMaterial({
        color: 0xfdfbf7,
        roughness: 0.85,
        metalness: 0.02,
      });

      // Gold Foil Trim Material
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.25,
      });

      // 1. Pages block inside
      const pagesGeo = new THREE.BoxGeometry(width - 0.14, height - 0.16, thickness - 0.08);
      const pagesMesh = new THREE.Mesh(pagesGeo, pagesMat);
      pagesMesh.position.set(0.06, 0, 0);
      book.add(pagesMesh);

      // 2. Front & Back Hardcovers
      const coverThickness = 0.05;
      const frontCoverGeo = new THREE.BoxGeometry(width, height, coverThickness);
      const frontCover = new THREE.Mesh(frontCoverGeo, coverMat);
      frontCover.position.set(0, 0, thickness / 2 - coverThickness / 2);
      book.add(frontCover);

      const backCover = new THREE.Mesh(frontCoverGeo, coverMat);
      backCover.position.set(0, 0, -thickness / 2 + coverThickness / 2);
      book.add(backCover);

      // 3. Spine
      const spineGeo = new THREE.BoxGeometry(coverThickness * 2, height, thickness);
      const spine = new THREE.Mesh(spineGeo, coverMat);
      spine.position.set(-width / 2 + coverThickness, 0, 0);
      book.add(spine);

      // Gold spine ribs (embossed academic bands)
      for (let i = -1; i <= 1; i++) {
        const bandGeo = new THREE.BoxGeometry(coverThickness * 2.2, 0.08, thickness + 0.02);
        const band = new THREE.Mesh(bandGeo, goldMat);
        band.position.set(-width / 2 + coverThickness, i * (height * 0.28), 0);
        book.add(band);
      }

      // 4. Bookmark silk ribbon hanging out
      const ribbonGeo = new THREE.BoxGeometry(0.18, height * 0.45, 0.02);
      const ribbon = new THREE.Mesh(ribbonGeo, goldMat);
      ribbon.position.set(width * 0.2, -height / 2 - 0.15, 0);
      ribbon.rotation.z = 0.15;
      book.add(ribbon);

      return book;
    };

    // Helper: Create Open Book with angled wings/pages
    const createOpenBook = () => {
      const openBook = new THREE.Group();
      const pageMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.05,
      });
      const coverMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a, // Royal Sapphire
        roughness: 0.35,
        metalness: 0.2,
      });

      // Left wing
      const leftWing = new THREE.Group();
      const leftPage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.06), pageMat);
      leftPage.position.set(-0.8, 0, 0);
      leftWing.add(leftPage);
      const leftCover = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.45, 0.04), coverMat);
      leftCover.position.set(-0.82, 0, -0.04);
      leftWing.add(leftCover);
      leftWing.rotation.y = 0.35;
      openBook.add(leftWing);

      // Right wing
      const rightWing = new THREE.Group();
      const rightPage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.06), pageMat);
      rightPage.position.set(0.8, 0, 0);
      rightWing.add(rightPage);
      const rightCover = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.45, 0.04), coverMat);
      rightCover.position.set(0.82, 0, -0.04);
      rightWing.add(rightCover);
      rightWing.rotation.y = -0.35;
      openBook.add(rightWing);

      return openBook;
    };

    // Helper: Create 3D Pen / Fountain Pen with metallic clips, nib, and sleek barrel
    const createPen = (barrelColorHex: number, isFountain = true) => {
      const pen = new THREE.Group();

      const barrelMat = new THREE.MeshStandardMaterial({
        color: barrelColorHex,
        roughness: 0.25,
        metalness: 0.3,
      });

      const goldMetalMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.15,
      });

      const chromeMetalMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.1,
      });

      // 1. Pen Body Barrel
      const barrelGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.8, 20);
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      pen.add(barrel);

      // 2. Cap & Rings
      const capGeo = new THREE.CylinderGeometry(0.13, 0.13, 1.4, 20);
      const cap = new THREE.Mesh(capGeo, barrelMat);
      cap.position.set(0, 1.5, 0);
      pen.add(cap);

      // Gold accent ring between body and cap
      const ringGeo = new THREE.CylinderGeometry(0.135, 0.135, 0.08, 20);
      const ring = new THREE.Mesh(ringGeo, goldMetalMat);
      ring.position.set(0, 0.8, 0);
      pen.add(ring);

      // 3. Metallic Pen Clip
      const clipGeo = new THREE.BoxGeometry(0.06, 1.1, 0.14);
      const clip = new THREE.Mesh(clipGeo, goldMetalMat);
      clip.position.set(0, 1.55, 0.16);
      pen.add(clip);

      // 4. Pen Tip / Nib
      if (isFountain) {
        // Sculpted fountain nib
        const gripGeo = new THREE.CylinderGeometry(0.11, 0.08, 0.6, 20);
        const grip = new THREE.Mesh(gripGeo, chromeMetalMat);
        grip.position.set(0, -1.6, 0);
        pen.add(grip);

        const nibGeo = new THREE.ConeGeometry(0.09, 0.45, 12);
        const nib = new THREE.Mesh(nibGeo, goldMetalMat);
        nib.position.set(0, -2.05, 0);
        nib.rotation.x = Math.PI;
        pen.add(nib);
      } else {
        // Sleek ballpoint cone tip
        const tipGeo = new THREE.ConeGeometry(0.11, 0.4, 16);
        const tip = new THREE.Mesh(tipGeo, chromeMetalMat);
        tip.position.set(0, -1.6, 0);
        tip.rotation.x = Math.PI;
        pen.add(tip);
      }

      return pen;
    };

    // Instantiate Curated Floating Library Collection
    interface FloatingItem {
      mesh: THREE.Group;
      baseX: number;
      baseY: number;
      baseZ: number;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
      floatSpeed: number;
      floatAmp: number;
      phase: number;
    }

    const floatingItems: FloatingItem[] = [];

    // Colors: Vibrant sapphire, emerald, ruby crimson, warm amber, violet, obsidian
    const itemsConfig = [
      // 1. Large Sapphire Blue Textbook (Top Left)
      { type: 'book', color: 0x1d4ed8, pos: [-5.8, 3.2, -1.5], scale: 1.1, rot: [0.4, 0.6, -0.2] },
      // 2. Crimson Red Assignment Guide (Top Right)
      { type: 'book', color: 0xdc2626, pos: [5.6, 3.8, -2.0], scale: 1.0, rot: [-0.3, -0.5, 0.4] },
      // 3. Open Book with white pages (Center Top Background)
      { type: 'open_book', color: 0x0f172a, pos: [0.2, 4.8, -4.5], scale: 1.25, rot: [0.6, 0.2, 0.1] },
      // 4. Emerald Green Academic Volume (Mid Left)
      { type: 'book', color: 0x059669, pos: [-6.4, -0.8, -2.5], scale: 1.05, rot: [0.2, 0.8, 0.3] },
      // 5. Warm Amber / Golden Notebook (Mid Right)
      { type: 'book', color: 0xd97706, pos: [6.2, -1.2, -1.8], scale: 0.95, rot: [-0.5, -0.4, -0.3] },
      // 6. Violet / Purple Thesis Binder (Bottom Left)
      { type: 'book', color: 0x7c3aed, pos: [-4.6, -4.2, -2.0], scale: 1.15, rot: [-0.4, 0.5, -0.2] },
      // 7. Midnight Navy Reference Manual (Bottom Right)
      { type: 'book', color: 0x0f172a, pos: [4.8, -4.5, -1.5], scale: 1.05, rot: [0.3, -0.6, 0.2] },

      // Floating Pens
      // Pen 1: Gold & Black Executive Fountain Pen
      { type: 'pen', color: 0x09090b, fountain: true, pos: [-3.2, 2.2, 1.2], scale: 1.1, rot: [0.8, 0.4, 0.9] },
      // Pen 2: Royal Blue & Chrome Fountain Pen
      { type: 'pen', color: 0x2563eb, fountain: true, pos: [3.4, 2.0, 1.0], scale: 1.05, rot: [-0.7, -0.6, 0.8] },
      // Pen 3: Emerald Green Ballpoint
      { type: 'pen', color: 0x10b981, fountain: false, pos: [-2.8, -3.2, 1.4], scale: 1.0, rot: [0.6, -0.8, -0.7] },
      // Pen 4: Crimson Red Pen
      { type: 'pen', color: 0xe11d48, fountain: true, pos: [3.2, -3.4, 1.2], scale: 1.0, rot: [-0.8, 0.5, 0.6] },
      // Pen 5: Pure Golden Stylus Pen (Foreground)
      { type: 'pen', color: 0xf59e0b, fountain: true, pos: [0.5, -5.2, -1.0], scale: 1.2, rot: [0.3, 1.2, -0.4] },
    ];

    itemsConfig.forEach((cfg, idx) => {
      let mesh: THREE.Group;
      if (cfg.type === 'open_book') {
        mesh = createOpenBook();
      } else if (cfg.type === 'pen') {
        mesh = createPen(cfg.color, cfg.fountain);
      } else {
        mesh = createBook(cfg.color);
      }

      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      mesh.scale.setScalar(cfg.scale);

      objectsGroup.add(mesh);

      floatingItems.push({
        mesh,
        baseX: cfg.pos[0],
        baseY: cfg.pos[1],
        baseZ: cfg.pos[2],
        rotSpeedX: (Math.random() - 0.5) * 0.25,
        rotSpeedY: (Math.random() - 0.5) * 0.35,
        rotSpeedZ: (Math.random() - 0.5) * 0.2,
        floatSpeed: 0.8 + Math.random() * 0.6,
        floatAmp: 0.2 + Math.random() * 0.15,
        phase: idx * 0.7,
      });
    });

    // Add glowing ambient bokeh spheres (subtle dust / study sparks)
    const particleGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const particleColors = [0x38bdf8, 0xfbbf24, 0xa855f7, 0x34d399];
    for (let i = 0; i < 30; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: particleColors[i % particleColors.length],
        transparent: true,
        opacity: 0.55,
      });
      const p = new THREE.Mesh(particleGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10 - 2
      );
      objectsGroup.add(p);
    }

    // Interaction Handlers (Mouse & Touch Camera Movement)
    const onMouseMove = (e: MouseEvent) => {
      // Normalized coordinates (-1 to 1)
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (isDragging.current) {
        const deltaX = (e.clientX - dragStart.current.x) * 0.006;
        const deltaY = (e.clientY - dragStart.current.y) * 0.006;
        manualRotOffset.current.x += deltaX;
        manualRotOffset.current.y += deltaY;
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      // If clicking directly on background (not a form button/input)
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        setIsInteracting(true);
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
      setIsInteracting(false);
    };

    // Touch Support
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mousePos.current.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mousePos.current.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        if (isDragging.current) {
          const deltaX = (touch.clientX - dragStart.current.x) * 0.006;
          const deltaY = (touch.clientY - dragStart.current.y) * 0.006;
          manualRotOffset.current.x += deltaX;
          manualRotOffset.current.y += deltaY;
          dragStart.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
          isDragging.current = true;
          dragStart.current = { x: touch.clientX, y: touch.clientY };
          setIsInteracting(true);
        }
      }
    };

    const onTouchEnd = () => {
      isDragging.current = false;
      setIsInteracting(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Responsive Window Resize
    const onResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Dynamic floating animations for books & pens
      floatingItems.forEach(item => {
        item.mesh.position.y = item.baseY + Math.sin(elapsed * item.floatSpeed + item.phase) * item.floatAmp;
        item.mesh.position.x = item.baseX + Math.cos(elapsed * (item.floatSpeed * 0.7) + item.phase) * 0.08;

        item.mesh.rotation.x += item.rotSpeedX * delta;
        item.mesh.rotation.y += item.rotSpeedY * delta;
        item.mesh.rotation.z += item.rotSpeedZ * delta;
      });

      // Smooth Movable Camera Interpolation (Parallax + Manual Drag Orbit)
      const targetX = mousePos.current.x * 2.5 + manualRotOffset.current.x * 4;
      const targetY = mousePos.current.y * 1.8 - manualRotOffset.current.y * 4;

      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;

      // Subtle breath zoom in/out
      camera.position.z = 14 + Math.sin(elapsed * 0.5) * 0.3;

      camera.lookAt(0, 0, 0);

      setCameraAngle({
        x: Number(camera.position.x.toFixed(1)),
        y: Number(camera.position.y.toFixed(1)),
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleResetCamera = () => {
    manualRotOffset.current = { x: 0, y: 0 };
    mousePos.current = { x: 0, y: 0 };
  };

  return (
    <>
      {/* 3D WebGL Canvas Layer */}
      <div
        ref={mountRef}
        className="fixed inset-0 pointer-events-auto -z-10 overflow-hidden select-none"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        }}
      />

      {/* Discreet 3D Camera Controls Pill in Bottom Left */}
      <div className="fixed bottom-3 left-3 z-30 flex items-center gap-2 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-200/90 shadow-sm text-[11px] text-neutral-600 select-none">
        <Compass className={`w-3.5 h-3.5 text-amber-500 ${isInteracting ? 'animate-spin' : ''}`} />
        <span className="font-semibold text-neutral-800">3D Camera:</span>
        <span className="hidden sm:inline text-neutral-500">Move cursor / drag to orbit</span>
        <span className="sm:hidden text-neutral-500">Drag to orbit</span>

        <button
          onClick={handleResetCamera}
          className="ml-1 p-0.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
          title="Reset Camera Angle"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    </>
  );
};
