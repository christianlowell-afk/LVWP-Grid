import { useRef, Suspense, forwardRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture, Html } from '@react-three/drei'
import useElementSize from '../hooks/useElementSize'

const SOURCES = [
  '/images/frank-geelen.png',
  '/images/carole-forestier.png',
  '/images/francois-overstake.png',
  '/images/kari-voutilainen.png',
  '/images/group-75.png',
]

const COUNT     = 60
const DEPTH     = 60    // tunnel length in world units
const SPEED     = 1.5   // units / second  –  slower, dreamier
const CAM_Z     = 10    // fixed camera Z
const FADE_FULL = 44    // fully opaque at this distance from camera
const FADE_GONE = 57    // fully transparent at this distance

function sr(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// forwardRef so Scene can imperatively drive position + opacity each frame
const ImagePlane = forwardRef(function ImagePlane({ x, y, z, url, scale }, ref) {
  const texture = useTexture(url)
  const W = scale
  const H = W * (5 / 4)
  return (
    <mesh ref={ref} position={[x, y, z]}>
      <planeGeometry args={[W, H]} />
      {/* start invisible; useFrame fades in based on distance */}
      <meshBasicMaterial map={texture} transparent opacity={0} />
    </mesh>
  )
})

function Scene() {
  const { viewport } = useThree()
  const meshRefs = useRef([])

  // Responsive: X/Y spread + image scale track viewport world-unit dimensions
  const layout = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({
    url:   SOURCES[i % SOURCES.length],
    x:     (sr(i * 3)     - 0.5) * viewport.width  * 2.0,
    y:     (sr(i * 3 + 1) - 0.5) * viewport.height * 1.8,
    scale: (0.85 + sr(i * 7 + 100) * 2.0) * viewport.height * 0.1,
  })), [viewport.width, viewport.height])

  // Z offsets initialised once; animation runs forever without reset
  const zPos = useRef(Array.from({ length: COUNT }, (_, i) => -sr(i * 3 + 2) * DEPTH))

  useFrame((_, delta) => {
    for (let i = 0; i < COUNT; i++) {
      zPos.current[i] += SPEED * delta
      if (zPos.current[i] > CAM_Z + 2) zPos.current[i] -= DEPTH

      const mesh = meshRefs.current[i]
      if (!mesh) continue

      // Responsive position update (x/y re-read from latest layout)
      mesh.position.x = layout[i].x
      mesh.position.y = layout[i].y
      mesh.position.z = zPos.current[i]

      // Elegant fade-in: images materialise as they emerge from the distance
      const dist = CAM_Z - mesh.position.z
      mesh.material.opacity = 1 - Math.max(0, Math.min(1,
        (dist - FADE_FULL) / (FADE_GONE - FADE_FULL)
      ))
    }
  })

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={1} />
      {layout.map((item, i) => (
        <ImagePlane
          key={i}
          ref={el => { meshRefs.current[i] = el }}
          x={item.x}
          y={item.y}
          z={zPos.current[i]}
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
