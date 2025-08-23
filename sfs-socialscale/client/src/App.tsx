import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Dashboard } from './pages/Dashboard'
import { Generator } from './pages/Generator'
import { Scheduler } from './pages/Scheduler'
import { Analytics } from './pages/Analytics'
import { Templates } from './pages/Templates'
import { Accounts } from './pages/Accounts'

type Page = 'dashboard' | 'generator' | 'scheduler' | 'analytics' | 'templates' | 'accounts'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'generator': return <Generator />
      case 'scheduler': return <Scheduler />
      case 'analytics': return <Analytics />
      case 'templates': return <Templates />
      case 'accounts': return <Accounts />
      default: return <Dashboard />
    }
  }

  return (
    <div style={{display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', color: 'white'}}>
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        <Header />
        <main style={{flex: 1, padding: '24px', overflow: 'auto'}}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App