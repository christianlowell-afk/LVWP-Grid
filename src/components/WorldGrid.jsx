import { useRef, Suspense, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture, Billboard, Stars, Html } from '@react-three/drei'
import * as THREE from 'three'
import useElementSize from '../hooks/useElementSize'

// ---------------------------------------------------------------------------
// Fibonacci sphere – distributes N points evenly over a sphere surface.
// Each point's (phi, theta) maps directly to Cartesian (x, y, z).
// ---------------------------------------------------------------------------
function getFibonacciPositions(count, radius) {
  return Array.from({ length: count }, (_, i) => {
    const phi   = Math.acos(1 - 2 * (i + 0.5) / count)
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5)
    return [
      radius * Math.cos(theta) * Math.sin(phi),
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(phi),
    ]
  })
}

// ---------------------------------------------------------------------------
// Individual image plane rendered as a camera-facing billboard.
// The 4 : 5 aspect ratio matches the supplied jury portrait photos.
// ---------------------------------------------------------------------------
function ImageBillboard({ position, url, label }) {
  const texture  = useTexture(url)
  const meshRef  = useRef()
  const [hovered, setHovered] = useState(false)

  // Smooth scale-up on hover via lerp every frame
  useFrame(() => {
    if (!meshRef.current) return
    const target = hovered ? 1.18 : 1.0
    meshRef.current.scale.x += (target - meshRef.current.scale.x) * 0.12
    meshRef.current.scale.y += (target - meshRef.current.scale.y) * 0.12
    meshRef.current.scale.z += (target - meshRef.current.scale.z) * 0.12
  })

  // 4 : 5 portrait ratio ─ width 1.2, height 1.5
  const W = 1.2
  const H = W * (5 / 4)

  return (
    <Billboard position={position} follow>
      <mesh
        ref={meshRef}
        onPointerEnter={e => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer' }}
        onPointerLeave={() =>  { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          opacity={hovered ? 1.0 : 0.88}
        />

        {/* Label shown on hover */}
        {hovered && (
          <Html
            center
            distanceFactor={8}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div style={{
              background: 'rgba(0,0,0,0.72)',
              color: '#f0f0f0',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.03em',
              padding: '5px 12px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              marginTop: `${H * 52}px`,
            }}>
              {label}
            </div>
          </Html>
        )}
      </mesh>
    </Billboard>
  )
}

// ---------------------------------------------------------------------------
// The full scene: stars, lights, images on sphere, orbit controls.
// ---------------------------------------------------------------------------
function GalleryScene({ images, radius }) {
  const positions = getFibonacciPositions(images.length, radius)

  return (
    <>
      {/* Deep-space background */}
      <color attach="background" args={['#07070f']} />
      <Stars radius={30} depth={60} count={4000} factor={3} fade speed={0.4} />

      {/* Subtle ambient + central point light */}
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#ffffff" />

      {images.map((img, i) => (
        <ImageBillboard
          key={img.url}
          position={positions[i]}
          url={img.url}
          label={img.label}
        />
      ))}

      {/* Optional: faint wireframe sphere to visualise the grid */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color="#334" wireframe transparent opacity={0.08} />
      </mesh>

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.6}
        enableZoom
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={radius * 0.6}
        maxDistance={radius * 3.5}
      />
    </>
  )
}

// Loading overlay rendered inside Canvas via Drei Html
function LoadingOverlay() {
  return (
    <Html center>
      <p style={{
        color: '#aab',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 16,
        letterSpacing: '0.08em',
      }}>
        Loading gallery…
      </p>
    </Html>
  )
}

// ---------------------------------------------------------------------------
// WorldGrid – public component.
// Props:
//   images  – array of { url: string, label: string }
//   radius  – sphere radius (default 4)
// Sizing follows the Framer useElementSize / frame.width / frame.height
// pattern: the hook measures the root div, and the Canvas fills it exactly.
// ---------------------------------------------------------------------------
export default function WorldGrid({ images, radius = 4 }) {
  const [containerRef, { width, height }] = useElementSize()

  return (
    // Root div ─ size this however you like (100vw/100vh, fixed px, etc.)
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <Canvas
        // Mirroring frame.width / frame.height from useElementSize
        style={{ width, height, display: 'block' }}
        camera={{
          position: [0, 0, radius * 2],
          fov: 60,
          near: 0.1,
          far: radius * 60,
        }}
        gl={{ antialias: true }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <Suspense fallback={<LoadingOverlay />}>
          <GalleryScene images={images} radius={radius} />
        </Suspense>
      </Canvas>
    </div>
  )
}
