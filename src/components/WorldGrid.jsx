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

const COUNT     = 25    // 5 copies of each source
const DEPTH     = 60
const SPEED     = 1.5
const CAM_Z     = 10
const FADE_FULL = 42
const FADE_GONE = 56
const TILES     = COUNT / SOURCES.length   // 5 copies of each source

function sr(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// ─── Stable z-slots computed once at module level ──────────────────────────
// Each source gets TILES evenly-spaced z-bands so the same face never
// appears twice in close succession. Within each band a small jitter is
// added so images don't arrive in lock-step.
const BAND = DEPTH / TILES   // 15 units per band
const Z_INITS = Array.from({ length: COUNT }, (_, i) => {
  const srcIdx  = i % SOURCES.length
  const tileIdx = Math.floor(i / SOURCES.length)
  const jitter  = sr(i * 11 + 7) * BAND * 0.6   // up to 60 % of band
  return -((tileIdx * BAND + jitter) % DEPTH)
})

// ─── ImagePlane ────────────────────────────────────────────────────────────
const ImagePlane = forwardRef(function ImagePlane({ x, y, z, url, scale }, ref) {
  const texture = useTexture(url)
  const W = scale
  const H = W * (5 / 4)
  return (
    <mesh ref={ref} position={[x, y, z]}>
      <planeGeometry args={[W, H]} />
      {/* starts invisible; useFrame drives opacity by depth */}
      <meshBasicMaterial map={texture} transparent opacity={0} />
    </mesh>
  )
})

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  const { viewport } = useThree()
  const meshRefs = useRef([])

  // Viewport-responsive layout.
  // Images are placed in one of 4 quadrants, offset far enough from centre
  // that the middle of the screen stays clear for composited type.
  // At FADE_FULL distance (42 u) each image is at least ~30 % of
  // half-viewport away from the screen centre in BOTH x and y.
  const layout = useMemo(() => Array.from({ length: COUNT }, (_, i) => {
    const srcIdx  = i % SOURCES.length
    const tileIdx = Math.floor(i / SOURCES.length)

    // Rotate quadrant each time a source reappears → no face is always
    // on the same side of the screen
    const q  = (srcIdx + tileIdx) % 4
    const sx = (q === 0 || q === 3) ? 1 : -1   // right (+) or left (−)
    const sy = (q === 0 || q === 1) ? 1 : -1   // up   (+) or down (−)

    // rx / ry ∈ [0.42, 1.0] — the 0.42 floor is the "safe zone" guarantee
    const rx = 0.42 + sr(i * 5 + 0) * 0.58
    const ry = 0.42 + sr(i * 5 + 1) * 0.58

    return {
      url:   SOURCES[srcIdx],
      x:     sx * rx * viewport.width  * 1.7,
      y:     sy * ry * viewport.height * 1.7,
      scale: (1.2 + sr(i * 5 + 2) * 1.4) * viewport.height * 0.22,
    }
  }), [viewport.width, viewport.height])

  // Z animation state — initialised once from stable Z_INITS
  const zPos = useRef([...Z_INITS])

  useFrame((_, delta) => {
    for (let i = 0; i < COUNT; i++) {
      zPos.current[i] += SPEED * delta
      if (zPos.current[i] > CAM_Z + 2) zPos.current[i] -= DEPTH

      const mesh = meshRefs.current[i]
      if (!mesh) continue

      mesh.position.x = layout[i].x
      mesh.position.y = layout[i].y
      mesh.position.z = zPos.current[i]

      // Fade in as image emerges from the far end of the tunnel
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

// ─── Loading overlay ───────────────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <Html center>
      <p style={{ color: '#333', fontFamily: 'sans-serif', fontSize: 13, letterSpacing: '0.1em' }}>
        Loading…
      </p>
    </Html>
  )
}

// ─── Vignette border ───────────────────────────────────────────────────────
// Four fixed gradient panels — top / bottom / left / right — that fade from
// the page background colour to transparent. They sit above everything and
// give the impression of content softly dissolving into the viewport edge,
// like a lens vignette, without touching or blurring page content.
const BG = '#000000'
const BASE = { position: 'fixed', pointerEvents: 'none', zIndex: 9999 }

function LensBorder() {
  return (
    <>
      <div aria-hidden style={{ ...BASE, top: 0, left: 0, right: 0, height: '22%',
        background: `linear-gradient(to bottom, ${BG} 0%, transparent 100%)` }} />
      <div aria-hidden style={{ ...BASE, bottom: 0, left: 0, right: 0, height: '22%',
        background: `linear-gradient(to top,   ${BG} 0%, transparent 100%)` }} />
      <div aria-hidden style={{ ...BASE, top: 0, bottom: 0, left: 0, width: '16%',
        background: `linear-gradient(to right, ${BG} 0%, transparent 100%)` }} />
      <div aria-hidden style={{ ...BASE, top: 0, bottom: 0, right: 0, width: '16%',
        background: `linear-gradient(to left,  ${BG} 0%, transparent 100%)` }} />
    </>
  )
}

// ─── Root export ───────────────────────────────────────────────────────────
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
      <LensBorder />
    </div>
  )
}
