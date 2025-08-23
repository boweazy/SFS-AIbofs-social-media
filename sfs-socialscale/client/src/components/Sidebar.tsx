import { BarChart3, Calendar, FileTemplate, Home, MessageSquare, Settings, Users } from 'lucide-react'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
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
    <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-sf-gold">SmartFlow SocialScale</h1>
        <p className="text-sm text-gray-400">Advanced Social Media Management</p>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentPage === item.id
                  ? 'bg-sf-gold text-black'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
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