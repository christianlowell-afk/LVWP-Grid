import { useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture, Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'
import useElementSize from '../hooks/useElementSize'

// ---------------------------------------------------------------------------
// Image sources – 5 portrait PNGs cycled across COUNT slots
// ---------------------------------------------------------------------------
const SOURCES = [
  '/images/frank-geelen.png',
  '/images/carole-forestier.png',
  '/images/francois-overstake.png',
  '/images/kari-voutilainen.png',
  '/images/group-75.png',
]

const COUNT = 48   // total billboard instances

// ---------------------------------------------------------------------------
// Deterministic pseudo-random (sine-hash) so the layout is stable on reload
// ---------------------------------------------------------------------------
function sr(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Generate stable layout once at module load
const LAYOUT = Array.from({ length: COUNT }, (_, i) => ({
  url:      SOURCES[i % SOURCES.length],
  position: [
    (sr(i * 3)       - 0.5) * 26,   // wide X spread
    (sr(i * 3 + 1)   - 0.5) * 17,   // tall Y spread
    (sr(i * 3 + 2)   - 0.5) * 10,   // deeper Z spread for parallax layers
  ],
  scale: 0.85 + sr(i * 7  + 100) * 2.0,   // 0.85 → 2.85
  rotZ:  (sr(i * 11 + 200) - 0.5) * 0.28, // slight random tilt
}))

// ---------------------------------------------------------------------------
// Single billboard image plane
// ---------------------------------------------------------------------------
function ImagePlane({ position, url, scale, rotZ }) {
  const texture = useTexture(url)
  const W = scale
  const H = W * (5 / 4)   // 4 : 5 portrait ratio

  return (
    <Billboard position={position} follow>
      {/* rotZ applied on child so Billboard's camera-facing still works */}
      <mesh rotation={[0, 0, rotZ]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
      </mesh>
    </Billboard>
  )
}

// ---------------------------------------------------------------------------
// Camera slowly dollies in along Z then back out – each depth layer moves
// at a different apparent speed, creating the "layered zoom" parallax.
// ---------------------------------------------------------------------------
function CameraZoom({ near = 5, far = 18, speed = 0.22 }) {
  const { camera } = useThree()
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta * speed
    // cosine starts at far, eases into near, eases back to far
    const z = near + (far - near) * (0.5 + 0.5 * Math.cos(t.current))
    camera.position.set(0, 0, z)
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ---------------------------------------------------------------------------
// Full scene – images + orbit driver, no decorative geometry
// ---------------------------------------------------------------------------
function Scene() {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1} />

      {LAYOUT.map((item, i) => (
        <ImagePlane key={i} {...item} />
      ))}

      <CameraZoom />
    </>
  )
}

function LoadingOverlay() {
  return (
    <Html center>
      <p style={{ color: '#333', fontFamily: 'sans-serif', fontSize: 13, letterSpacing: '0.1em' }}>
        Loading…
      </p>
    </Html>
  )
}

// ---------------------------------------------------------------------------
// WorldGrid – public component
// useElementSize mirrors Framer's frame.width / frame.height pattern;
// the Canvas fills the container and R3F handles internal resize.
// ---------------------------------------------------------------------------
export default function WorldGrid() {
  const [containerRef] = useElementSize()

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 0, 18], fov: 68, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <Suspense fallback={<LoadingOverlay />}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
