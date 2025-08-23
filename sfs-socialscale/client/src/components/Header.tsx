import { Bell, Plus, Search, Settings } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search posts, accounts, templates..."
            className="sf-input pl-10 w-96"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="sf-button-primary flex items-center gap-2">
          <Plus size={16} />
          Create Post
        </button>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <Bell size={20} />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <Settings size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sf-gold rounded-full flex items-center justify-center text-black font-medium">
            SF
          </div>
          <div>
            <p className="text-sm font-medium">SmartFlow Systems</p>
            <p className="text-xs text-gray-400">Pro Plan</p>
          </div>
        </div>
      </div>
    </header>
  )
}