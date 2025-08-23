import { useState } from 'react'
import { SimpleTest } from './test-simple'

function App() {
  // Temporarily show simple test page to verify React is working
  const [showTest, setShowTest] = useState(true)
  
  if (showTest) {
    return <SimpleTest />
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1a1a1a', 
      color: 'white',
      minHeight: '100vh'
    }}>
      <h1 style={{color: '#ffd700'}}>SocialScale Loading...</h1>
    </div>
  )
}

export default App