# SFS SocialScale Parity Pack

A modern TypeScript/React social media management platform that integrates with your existing Flask social AI system.

## Architecture

- **Server**: TypeScript + Express + SQLite + WebSocket
- **Client**: React + Vite + TailwindCSS + React Query
- **Integration**: Can proxy to existing Python/Flask generator or use built-in AI fallback

## Quick Start

```bash
cd sfs-socialscale
cp .env.example .env
npm install
npm -w server install  
npm -w client install
npm run dev
```

- **Server**: http://localhost:8787
- **Client**: http://localhost:5173

## Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
PORT=8787
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=./data.sqlite
ADMIN_API_KEY=change-me

# AI Configuration
OPENAI_API_KEY=sk-...  # Optional: for AI fallback

# Python Integration
PYTHON_SERVICE_URL=http://localhost:5000  # Point to your Flask app
```

## Features

### 🎯 Core Features
- **Post Generator**: AI-powered content creation with topic input
- **Scheduler**: Create, schedule, and manage social media posts  
- **Analytics**: Real-time metrics with WebSocket updates
- **Templates**: Browse and create reusable post templates
- **Account Management**: Connect multiple social platform accounts
- **Dashboard**: Overview of performance and activity

### 🔧 Technical Features
- **Real-time Updates**: WebSocket integration for live analytics
- **Python Integration**: Proxies to existing Flask generator when available
- **SQLite Database**: Lightweight data storage with automatic schema creation
- **Modern UI**: Dark theme with SmartFlow gold accents
- **Responsive Design**: Works on desktop and mobile devices

### 🚀 Integration Options
- **Standalone**: Run as independent TypeScript application
- **Hybrid**: Integrate with existing Python/Flask social AI system
- **API First**: RESTful API that can be consumed by any frontend

## API Endpoints

```
GET  /api/health              # Health check
GET  /api/accounts            # List social accounts
POST /api/accounts            # Connect new account
GET  /api/templates           # List post templates  
POST /api/templates           # Create new template
GET  /api/posts               # List all posts
POST /api/posts               # Create/schedule new post
POST /api/generate_posts      # Generate AI content
GET  /api/analytics/:postId   # Get post analytics
POST /api/admin/seed          # Seed demo data (requires API key)
```

## Database Schema

- **accounts**: Social media account connections
- **templates**: Reusable post templates with variables
- **posts**: Created and scheduled social media posts
- **analytics**: Performance metrics and engagement data

## Development

### Server Development
```bash
npm -w server run dev  # Auto-restart on changes
npm -w server run seed # Create demo data
npm -w server run metrics:seed  # Generate analytics
```

### Client Development  
```bash
npm -w client run dev     # Start dev server
npm -w client run build   # Build for production
npm -w client run preview # Preview production build
```

### Production Build
```bash
npm run build  # Build both server and client
npm start      # Start production server
```

## Python Integration

To integrate with your existing Flask social AI system:

1. **Keep Flask Running**: Start your Flask app on port 5000
2. **Set Environment**: Add `PYTHON_SERVICE_URL=http://localhost:5000` to `.env`
3. **API Compatibility**: Ensure Flask has `/api/generate_posts` endpoint

The system will automatically proxy generation requests to Python when available, falling back to built-in AI when not.

### Flask Endpoint Example
```python
@app.route('/api/generate_posts', methods=['POST'])
def generate_posts():
    data = request.get_json()
    topic = data.get('topic')
    platform = data.get('platform', 'x')
    count = data.get('count', 3)
    
    # Your existing generation logic
    posts = your_generator_function(topic, platform, count)
    
    return jsonify({
        "ok": True,
        "data": posts  # Array of {text, alt_text, hashtags}
    })
```

## Deployment

### Replit Deployment
1. Set environment variables in Replit Secrets
2. Configure run command: `cd sfs-socialscale && npm start`
3. Database will be created automatically

### Manual Deployment
```bash
# Install dependencies
npm install

# Build client
npm run build

# Start server (serves both API and static files)
npm start
```

## Real-time Features

The application includes WebSocket support for:
- **Live Analytics**: Real-time engagement updates
- **Post Status**: Live scheduling and publishing updates  
- **Activity Feed**: Recent actions and notifications

Connect from client:
```typescript
import { io } from 'socket.io-client'
const socket = io('http://localhost:8787')
socket.on('analytics:update', (data) => {
  // Handle real-time analytics
})
```

## Security

- **API Keys**: Admin endpoints protected with configurable API key
- **CORS**: Configured for client origin only
- **Input Validation**: All endpoints validate input data
- **Token Storage**: Social tokens stored securely (demo mode uses hints only)

## Customization

### Theming
The UI uses CSS custom properties for easy theming:
```css
:root {
  --sf-dark: #1a1a1a;
  --sf-gold: #d4af37;
  --sf-gold-light: #f4e29b;
}
```

### Adding Platforms
To add new social platforms:
1. Update `Account` type in `server/src/db.ts`
2. Add platform icon in `client/src/pages/Accounts.tsx`
3. Update generation logic for platform-specific content

## Troubleshooting

### Common Issues

**Server won't start**
- Check port 8787 is available
- Verify environment variables are set
- Check SQLite database permissions

**Client build fails**
- Clear node_modules and reinstall
- Check TypeScript version compatibility
- Verify all dependencies are installed

**Python integration not working**  
- Ensure Flask app is running on configured port
- Check PYTHON_SERVICE_URL in .env
- Verify Flask has required API endpoints

### Debug Mode
Enable debug logging:
```env
NODE_ENV=development
DEBUG=true
```

## License

MIT License - see main project for details

---

Built with ❤️ as part of SmartFlow Systems Social AI Platform