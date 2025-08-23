import { useEffect, useState } from 'react'

export function Dashboard() {
  const [accounts, setAccounts] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, postsRes] = await Promise.all([
          fetch('http://localhost:8787/api/accounts'),
          fetch('http://localhost:8787/api/posts')
        ])
        
        const accountsData = await accountsRes.json()
        const postsData = await postsRes.json()
        
        if (accountsData.ok) setAccounts(accountsData.data)
        if (postsData.ok) setPosts(postsData.data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div style={{padding: '20px', textAlign: 'center'}}>
        <h2 style={{color: '#ffd700', marginBottom: '16px'}}>Loading Dashboard...</h2>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{fontSize: '32px', fontWeight: 'bold', color: '#ffd700', marginBottom: '24px'}}>
        SocialScale Dashboard
      </h1>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px'}}>
        <div style={{backgroundColor: '#222', padding: '20px', borderRadius: '12px', border: '1px solid #333'}}>
          <h3 style={{color: '#ffd700', fontSize: '18px', marginBottom: '16px'}}>Connected Accounts</h3>
          {accounts.length === 0 ? (
            <p style={{color: '#888'}}>No accounts connected yet</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {accounts.map((account: any) => (
                <div key={account.id} style={{
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: '#333',
                  borderRadius: '6px'
                }}>
                  <span style={{fontWeight: '500'}}>{account.handle}</span>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    backgroundColor: account.platform === 'x' ? '#1DA1F2' : '#0A66C2',
                    color: 'white',
                    borderRadius: '4px'
                  }}>
                    {account.platform.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{backgroundColor: '#222', padding: '20px', borderRadius: '12px', border: '1px solid #333'}}>
          <h3 style={{color: '#ffd700', fontSize: '18px', marginBottom: '16px'}}>Recent Posts</h3>
          {posts.length === 0 ? (
            <p style={{color: '#888'}}>No posts created yet</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {posts.slice(0, 3).map((post: any) => (
                <div key={post.id} style={{
                  padding: '12px',
                  backgroundColor: '#333',
                  borderRadius: '6px',
                  borderLeft: '3px solid #ffd700'
                }}>
                  <p style={{marginBottom: '8px', fontSize: '14px'}}>{post.body.substring(0, 80)}...</p>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888'}}>
                    <span style={{
                      color: post.status === 'posted' ? '#00ff00' : post.status === 'scheduled' ? '#ffaa00' : '#888'
                    }}>
                      {post.status.toUpperCase()}
                    </span>
                    {post.posted_at && <span>{new Date(post.posted_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{backgroundColor: '#222', padding: '20px', borderRadius: '12px', border: '1px solid #333'}}>
        <h3 style={{color: '#ffd700', fontSize: '18px', marginBottom: '16px'}}>Quick Actions</h3>
        <div style={{display: 'flex', gap: '16px'}}>
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#ffd700',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Generate New Posts
          </button>
          <button style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#ffd700',
            border: '2px solid #ffd700',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            View Analytics
          </button>
        </div>
      </div>
    </div>
  )
}