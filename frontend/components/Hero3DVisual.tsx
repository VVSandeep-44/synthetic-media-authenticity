import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Hero3DVisual() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Scene
    const scene = new THREE.Scene();
    const w = el.clientWidth || 360;
    const h = el.clientHeight || 360;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    setCanvasReady(true);

    // Geometry: icosahedron wireframe
    const geo = new THREE.IcosahedronGeometry(1.4, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x22d5f2,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Inner sphere
    const innerGeo = new THREE.SphereGeometry(0.78, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0a3d52,
      transparent: true,
      opacity: 0.7,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Core glowing dot
    const dotGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x74fdff });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    scene.add(dot);

    // Ring
    const ringGeo = new THREE.TorusGeometry(1.75, 0.012, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x5ef0ff, transparent: true, opacity: 0.45 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    scene.add(ring);

    let animId: number;
    const clock = new THREE.Clock();
    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mesh.rotation.y = t * 0.18;
      mesh.rotation.x = t * 0.09;
      ring.rotation.z = t * 0.22;
      renderer.render(scene, camera);
    }
    animate();

    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      aria-hidden="true"
    />
  );
}
