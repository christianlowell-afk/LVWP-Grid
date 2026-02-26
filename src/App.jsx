import WorldGrid from './components/WorldGrid'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>

      {/* 3-D gallery fills the entire viewport */}
      <WorldGrid />

      {/* ── Top-left branding ── */}
      <div style={{
        position: 'absolute',
        top: 24,
        left: 28,
        zIndex: 10,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <p style={{
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          margin: 0,
          lineHeight: 1,
        }}>
          WorldGrid
        </p>
        <span style={{
          display: 'inline-block',
          marginTop: 7,
          background: '#1a1a1a',
          color: '#666',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 10,
          letterSpacing: '0.12em',
          padding: '3px 8px',
          borderRadius: 3,
        }}>
          v_1.0
        </span>
      </div>

      {/* ── Bottom-left copyright ── */}
      <p style={{
        position: 'absolute',
        bottom: 22,
        left: 28,
        zIndex: 10,
        pointerEvents: 'none',
        userSelect: 'none',
        color: '#333',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 10,
        letterSpacing: '0.1em',
        margin: 0,
      }}>
        ©NOTHING 2025
      </p>

    </div>
  )
}
