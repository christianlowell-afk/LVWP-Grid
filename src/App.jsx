import WorldGrid from './components/WorldGrid'

// Images copied to /public/images/ with clean ASCII filenames.
// Add or remove entries here to change what appears in the gallery.
const IMAGES = [
  { url: '/images/frank-geelen.png',      label: 'Frank Geelen' },
  { url: '/images/carole-forestier.png',  label: 'Carole Forestier Kasapi' },
  { url: '/images/francois-overstake.png',label: 'François-Xavier Overstake' },
  { url: '/images/kari-voutilainen.png',  label: 'Kari Voutilainen' },
  { url: '/images/group-75.png',          label: 'Group 75' },
]

export default function App() {
  return (
    // Outer wrapper fills the viewport; background matches scene colour
    // so there's no flash before the Canvas paints.
    <div style={{ width: '100vw', height: '100vh', background: '#07070f', position: 'relative' }}>

      {/* Brand / title overlay ─ sits above the Canvas */}
      <header style={{
        position: 'absolute',
        top: 24,
        left: 0,
        width: '100%',
        textAlign: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <h1 style={{
          color: '#e8e8f0',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 'clamp(18px, 3vw, 28px)',
          fontWeight: 300,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          WorldGrid
        </h1>
        <p style={{
          color: '#667',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          letterSpacing: '0.12em',
          marginTop: 6,
        }}>
          Drag to rotate &nbsp;·&nbsp; Scroll to zoom
        </p>
      </header>

      {/* The 3-D sphere gallery – fills the full viewport */}
      <WorldGrid images={IMAGES} radius={4} />
    </div>
  )
}
