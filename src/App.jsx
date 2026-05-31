export default function App() {
  return (
    <div style={{
      background: '#07111f',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#f0c040',
      fontFamily: 'sans-serif',
      gap: 16,
      padding: 20,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 60 }}>⚽</div>
      <div style={{ fontSize: 28, fontWeight: 'bold', letterSpacing: 2 }}>
        POLLA MUNDIALISTA 2026
      </div>
      <div style={{
        background: '#0c1a2e',
        border: '1px solid #1c3352',
        borderRadius: 10,
        padding: '12px 24px',
        color: '#3ddc84',
        fontSize: 16
      }}>
        ✅ App desplegada correctamente
      </div>
      <div style={{ color: '#4d7a9e', fontSize: 14 }}>
        Si ves esto, el deploy funciona. El siguiente paso es cargar la app completa.
      </div>
    </div>
  )
}
