import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { endpoints } from '../api/client'
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react'
import { io } from 'socket.io-client'

export function Analytics() {
  const [realtimeMetrics, setRealtimeMetrics] = useState<any[]>([])

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: () => endpoints.getPosts().then(r => r.data.data)
  })

  // Connect to WebSocket for real-time analytics
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787'
    const socket = io(API_BASE.replace('/api', ''))
    
    socket.on('analytics:update', (data) => {
      setRealtimeMetrics(prev => [...prev.slice(-10), { ...data, timestamp: Date.now() }])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const totalPosts = posts?.length || 0
  const publishedPosts = posts?.filter((p: any) => p.status === 'posted').length || 0
  const scheduledPosts = posts?.filter((p: any) => p.status === 'scheduled').length || 0

  // Mock engagement metrics (in a real app, these would come from the API)
  const mockMetrics = {
    totalViews: 12547,
    totalLikes: 2847,
    totalShares: 456,
    totalComments: 189,
    engagementRate: 28.4
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'views': return <Eye size={16} />
      case 'likes': return <Heart size={16} />
      case 'shares': return <Share2 size={16} />
      case 'comments': return <MessageCircle size={16} />
      default: return <TrendingUp size={16} />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-gray-400">Track your social media performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-sf-gold">{mockMetrics.totalViews.toLocaleString()}</p>
            </div>
            <Eye className="text-sf-gold" size={24} />
          </div>
        </div>
        
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Likes</p>
              <p className="text-2xl font-bold text-sf-gold">{mockMetrics.totalLikes.toLocaleString()}</p>
            </div>
            <Heart className="text-sf-gold" size={24} />
          </div>
        </div>
        
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Shares</p>
              <p className="text-2xl font-bold text-sf-gold">{mockMetrics.totalShares.toLocaleString()}</p>
            </div>
            <Share2 className="text-sf-gold" size={24} />
          </div>
        </div>
        
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Comments</p>
              <p className="text-2xl font-bold text-sf-gold">{mockMetrics.totalComments.toLocaleString()}</p>
            </div>
            <MessageCircle className="text-sf-gold" size={24} />
          </div>
        </div>
        
        <div className="sf-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Engagement Rate</p>
              <p className="text-2xl font-bold text-sf-gold">{mockMetrics.engagementRate}%</p>
            </div>
            <TrendingUp className="text-sf-gold" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post Performance */}
        <div className="sf-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Post Performance
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Posts</span>
              <span className="font-medium">{totalPosts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Published</span>
              <span className="font-medium text-green-400">{publishedPosts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Scheduled</span>
              <span className="font-medium text-yellow-400">{scheduledPosts}</span>
            </div>
          </div>

          {posts && posts.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">Recent Posts</h4>
              <div className="space-y-2">
                {posts.slice(0, 5).map((post: any) => (
                  <div key={post.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <p className="text-sm truncate flex-1 mr-3">{post.body.substring(0, 50)}...</p>
                    <span className={`text-xs px-2 py-1 rounded capitalize ${
                      post.status === 'posted' ? 'bg-green-900 text-green-400' :
                      post.status === 'scheduled' ? 'bg-yellow-900 text-yellow-400' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Real-time Activity */}
        <div className="sf-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Real-time Activity
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2"></span>
          </h3>
          
          {realtimeMetrics.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for real-time updates...</p>
              <p className="text-xs mt-1">Activity will appear here as it happens</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {realtimeMetrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                  <div className="flex-shrink-0 text-sf-gold">
                    {getMetricIcon(metric.metric)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="capitalize">{metric.metric}</span> update: +{metric.value}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}