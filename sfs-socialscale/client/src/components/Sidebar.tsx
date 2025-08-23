import { BarChart3, Calendar, FileTemplate, Home, MessageSquare, Settings, Users } from 'lucide-react'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: any) => void
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'generator', label: 'Generator', icon: MessageSquare },
  { id: 'scheduler', label: 'Scheduler', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'templates', label: 'Templates', icon: FileTemplate },
  { id: 'accounts', label: 'Accounts', icon: Users },
]

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  return (
    <div style={{width: '256px', backgroundColor: '#111', borderRight: '1px solid #333', padding: '16px'}}>
      <div style={{marginBottom: '32px'}}>
        <h1 style={{fontSize: '20px', fontWeight: 'bold', color: '#ffd700', marginBottom: '8px'}}>SmartFlow SocialScale</h1>
        <p style={{fontSize: '14px', color: '#888'}}>Advanced Social Media Management</p>
      </div>
      
      <nav style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? '#ffd700' : 'transparent',
                color: isActive ? '#000' : '#ccc',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#333'
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}