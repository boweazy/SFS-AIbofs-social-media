import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { endpoints } from '../api/client'
import { Users, Plus, CheckCircle, XCircle, Twitter, Linkedin, Instagram } from 'lucide-react'

export function Accounts() {
  const [showConnectForm, setShowConnectForm] = useState(false)
  const [newAccount, setNewAccount] = useState({
    platform: 'x',
    handle: '',
    token_hint: ''
  })

  const queryClient = useQueryClient()

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => endpoints.getAccounts().then(r => r.data.data)
  })

  const connectMutation = useMutation({
    mutationFn: (data: typeof newAccount) => endpoints.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      setShowConnectForm(false)
      setNewAccount({ platform: 'x', handle: '', token_hint: '' })
    }
  })

  const handleConnect = () => {
    if (!newAccount.handle.trim()) return
    connectMutation.mutate(newAccount)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'x': return <Twitter size={20} />
      case 'linkedin': return <Linkedin size={20} />
      case 'instagram': return <Instagram size={20} />
      default: return <Users size={20} />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'x': return 'text-blue-400'
      case 'linkedin': return 'text-blue-600'
      case 'instagram': return 'text-pink-400'
      default: return 'text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Accounts</h1>
          <p className="text-gray-400">Manage your connected social media accounts</p>
        </div>
        <div className="sf-card">
          <p className="text-center py-8">Loading accounts...</p>
        </div>
      </div>
    )
  }

  const connectedAccounts = accounts?.filter((a: any) => a.connected) || []
  const totalAccounts = accounts?.length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Accounts</h1>
          <p className="text-gray-400">Manage your connected social media accounts</p>
        </div>
        <button
          onClick={() => setShowConnectForm(true)}
          className="sf-button-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Connect Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Accounts</p>
              <p className="text-2xl font-bold text-sf-gold">{totalAccounts}</p>
            </div>
            <Users className="text-sf-gold" size={24} />
          </div>
        </div>
        
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Connected</p>
              <p className="text-2xl font-bold text-green-400">{connectedAccounts.length}</p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
        
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Disconnected</p>
              <p className="text-2xl font-bold text-red-400">{totalAccounts - connectedAccounts.length}</p>
            </div>
            <XCircle className="text-red-400" size={24} />
          </div>
        </div>
      </div>

      {showConnectForm && (
        <div className="sf-card">
          <h3 className="text-lg font-semibold mb-4">Connect New Account</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  value={newAccount.platform}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, platform: e.target.value }))}
                  className="sf-input w-full"
                >
                  <option value="x">X (Twitter)</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Handle/Username</label>
                <input
                  type="text"
                  value={newAccount.handle}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, handle: e.target.value }))}
                  placeholder="@username or profile name"
                  className="sf-input w-full"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">API Token (Optional)</label>
              <input
                type="password"
                value={newAccount.token_hint}
                onChange={(e) => setNewAccount(prev => ({ ...prev, token_hint: e.target.value }))}
                placeholder="API token or access key"
                className="sf-input w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave empty for demo mode. Real tokens should be stored securely.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleConnect}
                disabled={connectMutation.isPending || !newAccount.handle.trim()}
                className="sf-button-primary disabled:opacity-50"
              >
                {connectMutation.isPending ? 'Connecting...' : 'Connect Account'}
              </button>
              <button
                onClick={() => setShowConnectForm(false)}
                className="sf-button-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="sf-card">
        <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
        
        {accounts && accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No accounts connected yet</p>
            <p className="text-sm">Connect your social media accounts to start posting</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts?.map((account: any) => (
              <div key={account.id} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 bg-gray-700 rounded-lg ${getPlatformColor(account.platform)}`}>
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div>
                    <h4 className="font-medium">{account.handle}</h4>
                    <p className="text-sm text-gray-400 capitalize">{account.platform}</p>
                    {account.token_hint && (
                      <p className="text-xs text-gray-500">Token: {account.token_hint.slice(0, 8)}...</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    account.connected
                      ? 'bg-green-900 text-green-400'
                      : 'bg-red-900 text-red-400'
                  }`}>
                    {account.connected ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {account.connected ? 'Connected' : 'Disconnected'}
                  </span>
                  
                  <button className="sf-button-secondary text-xs px-3 py-1">
                    {account.connected ? 'Disconnect' : 'Reconnect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}