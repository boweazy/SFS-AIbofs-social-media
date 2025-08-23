import { Bell, Settings, User } from 'lucide-react'

export function Header() {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      backgroundColor: '#222',
      borderBottom: '1px solid #333'
    }}>
      <div>
        <h2 style={{margin: 0, fontSize: '24px', color: '#ffd700'}}>SocialScale Dashboard</h2>
        <p style={{margin: 0, fontSize: '14px', color: '#888', marginTop: '4px'}}>
          Professional Social Media Management Platform
        </p>
      </div>
      
      <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
        <button style={{
          background: 'none',
          border: 'none',
          color: '#ccc',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '6px'
        }}>
          <Bell size={20} />
        </button>
        <button style={{
          background: 'none',
          border: 'none',
          color: '#ccc',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '6px'
        }}>
          <Settings size={20} />
        </button>
        <button style={{
          background: 'none',
          border: 'none',
          color: '#ccc',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '6px'
        }}>
          <User size={20} />
        </button>
      </div>
    </header>
  )
}