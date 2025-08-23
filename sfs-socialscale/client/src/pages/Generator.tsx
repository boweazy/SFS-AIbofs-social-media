import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { endpoints } from '../api/client'
import { Loader2, Sparkles, Copy, Check } from 'lucide-react'

export function Generator() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('x')
  const [count, setCount] = useState(3)
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => endpoints.getAccounts().then(r => r.data.data)
  })

  const generateMutation = useMutation({
    mutationFn: (data: { topic: string; platform: string; count: number }) => 
      endpoints.generatePosts(data),
    onSuccess: (response) => {
      if (response.data.ok) {
        setGeneratedPosts(response.data.data)
      }
    }
  })

  const handleGenerate = () => {
    if (!topic.trim()) return
    generateMutation.mutate({ topic, platform, count })
  }

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Post Generator</h1>
        <p className="text-gray-400">Generate AI-powered social media posts</p>
      </div>

      <div className="sf-card max-w-2xl">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-sf-gold" />
          Generate Posts
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What would you like to post about?"
              className="sf-input w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="sf-input w-full"
              >
                <option value="x">X (Twitter)</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Number of Posts</label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="sf-input w-full"
              >
                <option value={1}>1 post</option>
                <option value={3}>3 posts</option>
                <option value={5}>5 posts</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !topic.trim()}
            className="sf-button-primary w-full disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Sparkles size={16} className="mr-2" />
            )}
            Generate Posts
          </button>
        </div>
      </div>

      {generatedPosts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated Posts</h3>
          <div className="grid gap-4">
            {generatedPosts.map((post, index) => (
              <div key={index} className="sf-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Post #{index + 1}</h4>
                    <p className="text-sm text-gray-400 capitalize">{platform} Post</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(post.text, index)}
                    className="p-2 hover:bg-gray-700 rounded"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === index ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Post Content:</p>
                    <p className="bg-gray-700 p-3 rounded text-sm">{post.text}</p>
                  </div>
                  
                  {post.alt_text && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Image Alt Text:</p>
                      <p className="bg-gray-700 p-3 rounded text-sm">{post.alt_text}</p>
                    </div>
                  )}
                  
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Hashtags:</p>
                      <div className="flex flex-wrap gap-2">
                        {post.hashtags.map((tag: string, i: number) => (
                          <span key={i} className="bg-sf-gold text-black px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {generateMutation.isError && (
        <div className="sf-card border-red-500">
          <p className="text-red-400">
            Error generating posts. Make sure the API server is running and try again.
          </p>
        </div>
      )}
    </div>
  )
}