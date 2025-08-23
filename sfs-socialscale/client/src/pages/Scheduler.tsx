import { useQuery } from '@tanstack/react-query'
import { endpoints } from '../api/client'
import { Calendar, Clock, Eye } from 'lucide-react'

export function Scheduler() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => endpoints.getPosts().then(r => r.data.data)
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => endpoints.getAccounts().then(r => r.data.data)
  })

  const getAccountHandle = (accountId: string) => {
    const account = accounts?.find((a: any) => a.id === accountId)
    return account ? `${account.handle} (${account.platform})` : 'Unknown Account'
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'text-green-400 bg-green-900'
      case 'scheduled': return 'text-yellow-400 bg-yellow-900'
      case 'failed': return 'text-red-400 bg-red-900'
      default: return 'text-gray-400 bg-gray-700'
    }
  }

  const scheduledPosts = posts?.filter((p: any) => p.status === 'scheduled') || []
  const recentPosts = posts?.filter((p: any) => p.status === 'posted').slice(0, 10) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Scheduler</h1>
          <p className="text-gray-400">Manage your scheduled posts</p>
        </div>
        <div className="sf-card">
          <p className="text-center py-8">Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Scheduler</h1>
        <p className="text-gray-400">Manage your scheduled posts and view publishing history</p>
      </div>

      {/* Scheduled Posts */}
      <div className="sf-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-sf-gold" />
          Scheduled Posts ({scheduledPosts.length})
        </h3>
        
        {scheduledPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No posts scheduled</p>
            <p className="text-sm">Create posts and schedule them to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledPosts.map((post: any) => (
              <div key={post.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{getAccountHandle(post.account_id)}</p>
                    <p className="text-sm text-gray-400">
                      Scheduled for {formatDateTime(post.scheduled_at)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(post.status)}`}>
                    {post.status}
                  </span>
                </div>
                
                <div className="bg-gray-700 p-3 rounded text-sm mb-3">
                  {post.body}
                </div>
                
                {post.hashtags && (
                  <div className="flex flex-wrap gap-2">
                    {post.hashtags.split(' ').filter(Boolean).map((tag: string, i: number) => (
                      <span key={i} className="bg-sf-gold text-black px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Posts */}
      <div className="sf-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye size={20} className="text-sf-gold" />
          Recent Posts
        </h3>
        
        {recentPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No posts published yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentPosts.map((post: any) => (
              <div key={post.id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{getAccountHandle(post.account_id)}</p>
                    <p className="text-sm text-gray-400">
                      Published {post.posted_at ? formatDateTime(post.posted_at) : 'Unknown'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(post.status)}`}>
                    {post.status}
                  </span>
                </div>
                
                <div className="bg-gray-700 p-3 rounded text-sm mb-3">
                  {post.body}
                </div>
                
                {post.hashtags && (
                  <div className="flex flex-wrap gap-2">
                    {post.hashtags.split(' ').filter(Boolean).map((tag: string, i: number) => (
                      <span key={i} className="bg-sf-gold text-black px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}