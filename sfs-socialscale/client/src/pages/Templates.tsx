import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { endpoints } from '../api/client'
import { FileTemplate, Plus, Star, Users } from 'lucide-react'

export function Templates() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'Marketing',
    premium: false,
    body: ''
  })

  const queryClient = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => endpoints.getTemplates().then(r => r.data.data)
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof newTemplate) => endpoints.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setShowCreateForm(false)
      setNewTemplate({ name: '', category: 'Marketing', premium: false, body: '' })
    }
  })

  const handleCreate = () => {
    if (!newTemplate.name.trim() || !newTemplate.body.trim()) return
    createMutation.mutate(newTemplate)
  }

  const categories = ['Marketing', 'News', 'Thought Leadership', 'Product', 'Community']

  const groupedTemplates = categories.reduce((acc, category) => {
    acc[category] = templates?.filter((t: any) => t.category === category) || []
    return acc
  }, {} as Record<string, any[]>)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Templates</h1>
          <p className="text-gray-400">Browse and manage post templates</p>
        </div>
        <div className="sf-card">
          <p className="text-center py-8">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Templates</h1>
          <p className="text-gray-400">Browse and manage post templates</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="sf-button-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Create Template
        </button>
      </div>

      {showCreateForm && (
        <div className="sf-card">
          <h3 className="text-lg font-semibold mb-4">Create New Template</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Template name"
                  className="sf-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  className="sf-input w-full"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Template Body</label>
              <textarea
                value={newTemplate.body}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Template content (use {{variable}} for placeholders)"
                rows={4}
                className="sf-input w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                Use double curly braces for variables: {'{{product}}'}, {'{{benefits}}'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="premium"
                checked={newTemplate.premium}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, premium: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="premium" className="text-sm">Premium template</label>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newTemplate.name.trim() || !newTemplate.body.trim()}
                className="sf-button-primary disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Template'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="sf-button-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {categories.map(category => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileTemplate size={20} className="text-sf-gold" />
              {category}
              <span className="text-sm text-gray-400">({groupedTemplates[category].length})</span>
            </h2>
            
            {groupedTemplates[category].length === 0 ? (
              <div className="sf-card text-center py-8 text-gray-400">
                <FileTemplate size={32} className="mx-auto mb-2 opacity-50" />
                <p>No templates in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedTemplates[category].map((template: any) => (
                  <div key={template.id} className="sf-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-gray-400">{template.category}</p>
                      </div>
                      {template.premium === 1 && (
                        <div className="flex items-center gap-1 text-sf-gold text-xs">
                          <Star size={12} />
                          Premium
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-700 p-3 rounded text-sm mb-4">
                      {template.body}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Template ID: {template.id.slice(0, 8)}</span>
                      <button className="sf-button-secondary text-xs px-3 py-1">
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}