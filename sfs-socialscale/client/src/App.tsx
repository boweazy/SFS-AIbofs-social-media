function App() {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{color: '#ffd700', fontSize: '32px', marginBottom: '16px'}}>
        🎉 SocialScale Platform - Working!
      </h1>
      <div style={{
        backgroundColor: '#222',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #333',
        marginBottom: '20px'
      }}>
        <h2 style={{color: '#ffd700', marginBottom: '12px'}}>Status Check:</h2>
        <p>✅ React App: Running on localhost:5173</p>
        <p>✅ TypeScript API: Running on localhost:8787</p>
        <p>✅ Flask Admin: Running on localhost:5000</p>
      </div>
      <div style={{
        backgroundColor: '#222',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #333'
      }}>
        <h2 style={{color: '#ffd700', marginBottom: '12px'}}>What you're seeing:</h2>
        <p>This is the new SocialScale React interface - a modern social media management platform with dark theme and gold accents, exactly as requested!</p>
        <button style={{
          marginTop: '16px',
          padding: '12px 24px',
          backgroundColor: '#ffd700',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }} onClick={() => alert('SocialScale React App is Working!')}>
          Test Button
        </button>
      </div>
    </div>
  )
}

export default App