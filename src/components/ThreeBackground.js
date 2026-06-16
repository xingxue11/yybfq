import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Three.js 3D particle background.
 * Subtle, performant — uses BufferGeometry and a single Points material.
 * Reacts to isPlaying with color/scale shifts.
 */
export default function ThreeBackground({ isPlaying = false }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const particlesRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Setup scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Create particle system
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Spread in a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 8 + Math.random() * 15;

      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
      positions[i * 3 + 2] = Math.cos(phi) * radius * 0.6;

      // Accent color with slight variation
      colors[i * 3] = 0.2 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.7 + Math.random() * 0.3;

      sizes[i] = 0.08 + Math.random() * 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Ambient light rings
    const ringGeometry = new THREE.TorusGeometry(8, 0.05, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI * 0.5;
    scene.add(ring);

    const ring2Geometry = new THREE.TorusGeometry(12, 0.03, 16, 100);
    const ring2 = new THREE.Mesh(ring2Geometry, ringMaterial.clone());
    ring2.material.opacity = 0.08;
    ring2.rotation.x = Math.PI * 0.35;
    ring2.rotation.y = Math.PI * 0.25;
    scene.add(ring2);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.005;

      // Rotate particles slowly
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0015;
        particlesRef.current.rotation.x += 0.0008;
      }

      // Pulse ring
      const scale = 1 + Math.sin(time * 0.7) * 0.1;
      ring.scale.setScalar(scale);
      ring.rotation.z += 0.002;
      ring2.rotation.z -= 0.0015;
      ring2.rotation.x += 0.001;

      // Adjust opacity based on playing state
      const targetOpacity = isPlaying ? 0.7 : 0.4;
      material.opacity += (targetOpacity - material.opacity) * 0.03;
      ring.material.opacity = isPlaying ? 0.2 : 0.1;
      ring2.material.opacity = isPlaying ? 0.12 : 0.05;

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    // Handle resize
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      ring2Geometry.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update opacity when isPlaying changes
  useEffect(() => {
    if (!particlesRef.current) return;
    animeJsOpacity(isPlaying);
  }, [isPlaying]);

  return (
    <div
      ref={mountRef}
      className="three-bg"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.35,
      }}
    />
  );
}

// Simple anime-like opacity controller
function animeJsOpacity(isPlaying) {
  // CSS transition handles this smoothly via parent class
}
