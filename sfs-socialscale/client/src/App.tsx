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
    <div className="flex h-screen bg-sf-dark text-white">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App