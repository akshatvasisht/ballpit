"use client";

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Props for the Ballpit component.
 */
interface BallpitProps {
  /** Optional CSS class name for the container element */
  className?: string;
}

class Ball {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  color: THREE.Color;
  mesh: THREE.Mesh;

  constructor(
    position: THREE.Vector3,
    radius: number,
    color: THREE.Color,
    velocity: THREE.Vector3 = new THREE.Vector3()
  ) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;

    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.2,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
  }

  update(bounds: { width: number; height: number; depth: number }, gravity: number, damping: number) {
    this.velocity.y -= gravity;
    this.position.add(this.velocity);
    this.velocity.multiplyScalar(damping);

    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;
    const halfDepth = bounds.depth / 2;

    if (this.position.x - this.radius < -halfWidth || this.position.x + this.radius > halfWidth) {
      this.velocity.x *= -0.8;
      this.position.x = Math.max(-halfWidth + this.radius, Math.min(halfWidth - this.radius, this.position.x));
    }

    if (this.position.y - this.radius < -halfHeight) {
      this.velocity.y *= -0.8;
      this.position.y = -halfHeight + this.radius;
    } else if (this.position.y + this.radius > halfHeight) {
      this.velocity.y *= -0.8;
      this.position.y = halfHeight - this.radius;
    }

    if (this.position.z - this.radius < -halfDepth || this.position.z + this.radius > halfDepth) {
      this.velocity.z *= -0.8;
      this.position.z = Math.max(-halfDepth + this.radius, Math.min(halfDepth - this.radius, this.position.z));
    }

    this.mesh.position.copy(this.position);
  }

  checkCollision(other: Ball) {
    const distance = this.position.distanceTo(other.position);
    const minDistance = this.radius + other.radius;

    if (distance < minDistance) {
      const normal = new THREE.Vector3().subVectors(this.position, other.position).normalize();
      const overlap = minDistance - distance;
      const separation = normal.multiplyScalar(overlap / 2);

      this.position.add(separation);
      other.position.sub(separation);

      const relativeVelocity = new THREE.Vector3().subVectors(this.velocity, other.velocity);
      const velocityAlongNormal = relativeVelocity.dot(normal);

      if (velocityAlongNormal < 0) {
        const restitution = 0.7;
        const impulse = normal.multiplyScalar(-(1 + restitution) * velocityAlongNormal / 2);

        this.velocity.add(impulse);
        other.velocity.sub(impulse);
      }
    }
  }

  handleMouseCollision(mousePos: THREE.Vector3, mouseRadius: number) {
    const distance = this.position.distanceTo(mousePos);
    const minDistance = this.radius + mouseRadius;

    if (distance < minDistance) {
      const normal = new THREE.Vector3().subVectors(this.position, mousePos).normalize();
      const overlap = minDistance - distance;

      // Displacement
      this.position.add(normal.clone().multiplyScalar(overlap));

      // Velocity impulse
      const impulseStrength = 0.05;
      this.velocity.add(normal.multiplyScalar(impulseStrength));
    }
  }
}

/**
 * Interactive 3D Ballpit component rendering a floating physics simulation.
 * Balls react to mouse pointer collisions and bounce off invisible container boundaries.
 * 
 * @param {BallpitProps} props - Component properties
 * @returns {JSX.Element} The rendered ballpit canvas container
 */
const Ballpit: React.FC<BallpitProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple seeded random generator (LCG)
  const lcg = (seed: number) => {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing canvases (React Strict Mode double-mount protection)
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const scene = new THREE.Scene();
    const nextRandom = lcg(42); // Seeded for consistent, aesthetically pleasing initial placement

    const camera = new THREE.PerspectiveCamera(
      25,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 25);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);

    // Brighter brand colors
    const colorPalette = [
      new THREE.Color('#7B9CB5'), // Brighter slate-blue
      new THREE.Color('#8FBF8F'), // Brighter sage-green
      new THREE.Color('#E6B4AA'), // Brighter dusty-rose
      new THREE.Color('#F0C48A'), // Brighter warm-amber
      new THREE.Color('#22D3EE'), // Electric cyan
      new THREE.Color('#606060'), // Lighter charcoal
    ];

    const balls: Ball[] = [];
    const numBalls = 14;
    const bounds = { width: 34, height: 10, depth: 6 }; // Enlarged to allow free floating within camera view

    for (let i = 0; i < numBalls; i++) {
      let radius = 0.8 + nextRandom() * 0.6;
      let position: THREE.Vector3;
      let attempts = 0;
      let hasCollision = true;

      // Try to find a non-overlapping position
      do {
        position = new THREE.Vector3(
          (nextRandom() - 0.5) * bounds.width * 0.9,
          (nextRandom() - 0.5) * bounds.height * 0.9,
          (nextRandom() - 0.5) * bounds.depth * 0.9
        );

        hasCollision = false;
        for (const other of balls) {
          if (position.distanceTo(other.position) < (radius + other.radius + 0.2)) {
            hasCollision = true;
            break;
          }
        }
        attempts++;
      } while (hasCollision && attempts < 50);

      const velocity = new THREE.Vector3(
        (nextRandom() - 0.5) * 0.01,
        (nextRandom() - 0.5) * 0.01,
        (nextRandom() - 0.5) * 0.01
      );
      const color = colorPalette[Math.floor(nextRandom() * colorPalette.length)];

      const ball = new Ball(position, radius, color, velocity);
      balls.push(ball);
      scene.add(ball.mesh);
    }

    // Physics parameters
    const gravity = 0;
    const damping = 0.995; // Slightly more damping for stability

    // Mouse tracking for collision
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mousePos3D = new THREE.Vector3(1000, 1000, 1000); // Start far away

    const handleMouseMove = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Check if mouse is actually within bounds
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(mousePlane, mousePos3D);
      } else {
        // Move interaction point far away if mouse leaves header
        mousePos3D.set(1000, 1000, 1000);
      }
    };

    window.addEventListener('pointermove', handleMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);

      balls.forEach((ball) => {
        ball.handleMouseCollision(mousePos3D, 2.0); // Mouse interaction radius
        ball.update(bounds, gravity, damping);
      });

      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          balls[i].checkCollision(balls[j]);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handleMouseMove);
      if (containerRef.current && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      balls.forEach((ball) => {
        ball.mesh.geometry.dispose();
        (ball.mesh.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export default Ballpit;
