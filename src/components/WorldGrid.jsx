import { useRef, Suspense, forwardRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture, Html } from '@react-three/drei'
import useElementSize from '../hooks/useElementSize'

const SOURCES = [
  '/images/frank-geelen.png',
  '/images/carole-forestier.png',
  '/images/francois-overstake.png',
  '/images/kari-voutilainen.png',
  '/images/group-75.png',
]

const COUNT = 60
const DEPTH = 60   // tunnel depth in world units
const SPEED = 3    // units per second
const CAM_Z = 10   // fixed camera Z

function sr(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Seeded layout – stable on every reload
const INIT = Array.from({ length: COUNT }, (_, i) => ({
  url:   SOURCES[i % SOURCES.length],
  x:     (sr(i * 3)     - 0.5) * 28,
  y:     (sr(i * 3 + 1) - 0.5) * 18,
  z:     -sr(i * 3 + 2) * DEPTH,         // spread from 0 to -DEPTH
  scale: 0.85 + sr(i * 7 + 100) * 2.0,   // 0.85 → 2.85
}))

// forwardRef so Scene can imperatively update position.z each frame
const ImagePlane = forwardRef(function ImagePlane({ x, y, z, url, scale }, ref) {
  const texture = useTexture(url)
  const W = scale
  const H = W * (5 / 4)
  return (
    <mesh ref={ref} position={[x, y, z]}>
      <planeGeometry args={[W, H]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  )
})

function Scene() {
  const meshRefs = useRef([])
  const zPos     = useRef(INIT.map(d => d.z))

  useFrame((_, delta) => {
    for (let i = 0; i < COUNT; i++) {
      zPos.current[i] += SPEED * delta
      // Once past camera, recycle to the far end of the tunnel
      if (zPos.current[i] > CAM_Z + 2) zPos.current[i] -= DEPTH
      const mesh = meshRefs.current[i]
      if (mesh) mesh.position.z = zPos.current[i]
    }
  })

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1} />
      {INIT.map((item, i) => (
        <ImagePlane
          key={i}
          ref={el => { meshRefs.current[i] = el }}
          x={item.x}
          y={item.y}
          z={item.z}
          url={item.url}
          scale={item.scale}
        />
      ))}
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

export default function WorldGrid() {
  const [containerRef] = useElementSize()
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 0, CAM_Z], fov: 68, near: 0.1, far: 200 }}
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
