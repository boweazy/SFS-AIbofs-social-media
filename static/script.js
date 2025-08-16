// Smart Flow Systems — Social AI Frontend
class SocialAI {
  constructor() {
    this.init();
    this.loadPosts();
    this.startPolling();
  }

  init() {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Bind event listeners
    document.getElementById('saveToken').addEventListener('click', () => this.saveToken());
    document.getElementById('genForm').addEventListener('submit', (e) => this.generateDrafts(e));
    document.getElementById('scheduleForm').addEventListener('submit', (e) => this.schedulePost(e));
  }

  async saveToken() {
    const platform = document.getElementById('platform').value;
    const token = document.getElementById('token').value.trim();
    
    if (!token) {
      this.showError('Please enter an access token');
      return;
    }

    try {
      const response = await fetch('/auth/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, access_token: token })
      });

      if (response.ok) {
        this.showSuccess('Token saved successfully');
        document.getElementById('token').value = '';
      } else {
        const error = await response.json();
        this.showError(error.detail || 'Failed to save token');
      }
    } catch (err) {
      this.showError('Network error: ' + err.message);
    }
  }

  async generateDrafts(e) {
    e.preventDefault();
    
    const topic = document.getElementById('topic').value.trim();
    const tone = document.getElementById('tone').value;
    const count = parseInt(document.getElementById('count').value);

    if (!topic) {
      this.showError('Please enter a topic');
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Generating...';

    try {
      const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, count })
      });

      if (response.ok) {
        const drafts = await response.json();
        this.renderDrafts(drafts);
      } else {
        const error = await response.json();
        this.showError(error.detail || 'Failed to generate drafts');
      }
    } catch (err) {
      this.showError('Network error: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create drafts';
    }
  }

  renderDrafts(drafts) {
    const container = document.getElementById('drafts');
    
    if (drafts.length === 0) {
      container.innerHTML = '<div class="muted">No drafts generated</div>';
      return;
    }

    container.innerHTML = drafts.map(draft => `
      <div class="draft" onclick="app.selectDraft('${this.escapeHtml(draft.content)}')">
        <div class="draft-content">${this.escapeHtml(draft.content)}</div>
        <div class="draft-meta">
          <span class="draft-hashtags">${draft.hashtags.join(' ')}</span>
          <span class="draft-score">Score: ${draft.score}</span>
        </div>
      </div>
    `).join('');
  }

  selectDraft(content) {
    document.getElementById('content').value = content;
    document.getElementById('content').focus();
  }

  async schedulePost(e) {
    e.preventDefault();
    
    const platform = document.getElementById('schedPlatform').value;
    const content = document.getElementById('content').value.trim();
    const when = document.getElementById('when').value;

    if (!content) {
      this.showError('Please enter content for your post');
      return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Scheduling...';

    try {
      const payload = { platform, content };
      
      if (when) {
        // Convert local datetime to UTC
        const localDate = new Date(when);
        payload.scheduled_time = localDate.toISOString();
      }

      const response = await fetch('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        this.showSuccess('Post scheduled successfully');
        document.getElementById('scheduleForm').reset();
        this.loadPosts(); // Refresh posts list
      } else {
        const error = await response.json();
        this.showError(error.detail || 'Failed to schedule post');
      }
    } catch (err) {
      this.showError('Network error: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Schedule';
    }
  }

  async loadPosts() {
    try {
      const response = await fetch('/posts');
      if (response.ok) {
        const posts = await response.json();
        this.renderPosts(posts);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  }

  renderPosts(posts) {
    const tbody = document.getElementById('postsBody');
    
    if (posts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No posts yet</td></tr>';
      return;
    }

    tbody.innerHTML = posts.map(post => {
      const scheduledTime = post.scheduled_time 
        ? this.formatDateTime(post.scheduled_time)
        : '—';
      
      const externalId = post.external_id || '—';
      const error = post.error || '—';
      
      return `
        <tr>
          <td>${post.id}</td>
          <td>${this.capitalize(post.platform)}</td>
          <td><span class="status status-${post.status}">${post.status}</span></td>
          <td>${scheduledTime}</td>
          <td>${this.escapeHtml(externalId)}</td>
          <td>${this.escapeHtml(error)}</td>
        </tr>
      `;
    }).join('');
  }

  formatDateTime(isoString) {
    try {
      const date = new Date(isoString);
      // Format in UK locale with London timezone
      return date.toLocaleString('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (err) {
      return isoString;
    }
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Simple notification system
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 6px;
      color: white;
      font-weight: 600;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      ${type === 'success' ? 'background: var(--success);' : 'background: var(--error);'}
    `;

    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  startPolling() {
    // Poll for post updates every 10 seconds
    setInterval(() => this.loadPosts(), 10000);
  }
}

// Add slide-in animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Initialize app
const app = new SocialAI();
