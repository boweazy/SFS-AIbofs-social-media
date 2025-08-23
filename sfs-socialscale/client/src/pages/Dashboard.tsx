import { useQuery } from '@tanstack/react-query'
import { endpoints } from '../api/client'
import { Activity, Calendar, MessageSquare, TrendingUp, Users } from 'lucide-react'

export function Dashboard() {
  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: () => endpoints.getPosts().then(r => r.data.data)
  })
  
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => endpoints.getAccounts().then(r => r.data.data)
  })

  const stats = {
    totalPosts: posts?.length || 0,
    scheduledPosts: posts?.filter((p: any) => p.status === 'scheduled').length || 0,
    connectedAccounts: accounts?.filter((a: any) => a.connected).length || 0,
    engagement: 2847 // Mock engagement metric
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your social media performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Posts</p>
              <p className="text-2xl font-bold text-sf-gold">{stats.totalPosts}</p>
            </div>
            <MessageSquare className="text-sf-gold" size={24} />
          </div>
        </div>
        
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Scheduled</p>
              <p className="text-2xl font-bold text-sf-gold">{stats.scheduledPosts}</p>
            </div>
            <Calendar className="text-sf-gold" size={24} />
          </div>
        </div>
        
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Connected Accounts</p>
              <p className="text-2xl font-bold text-sf-gold">{stats.connectedAccounts}</p>
            </div>
            <Users className="text-sf-gold" size={24} />
          </div>
        </div>
        
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Engagement</p>
              <p className="text-2xl font-bold text-sf-gold">{stats.engagement}</p>
            </div>
            <TrendingUp className="text-sf-gold" size={24} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="sf-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity size={20} />
            Recent Posts
          </h3>
          <div className="space-y-3">
            {posts?.slice(0, 5).map((post: any) => (
              <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-700 rounded">
                <div className="w-8 h-8 bg-sf-gold rounded-full flex items-center justify-center text-black font-bold text-xs">
                  {post.account_id.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300 line-clamp-2">{post.body}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: <span className={`capitalize ${
                      post.status === 'posted' ? 'text-green-400' :
                      post.status === 'scheduled' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>{post.status}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sf-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} />
            Connected Accounts
          </h3>
          <div className="space-y-3">
            {accounts?.map((account: any) => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    account.connected ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="font-medium">{account.handle}</p>
                    <p className="text-sm text-gray-400 capitalize">{account.platform}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  account.connected 
                    ? 'bg-green-900 text-green-400' 
                    : 'bg-red-900 text-red-400'
                }`}>
                  {account.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}