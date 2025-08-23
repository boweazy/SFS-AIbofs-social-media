# Overview

Smart Flow Systems Social AI is a social media management application that allows users to generate AI-powered content drafts and schedule posts across multiple platforms (X/Twitter and LinkedIn). The application provides a clean, dark-themed interface for content creation, scheduling, and monitoring post status with real-time updates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Single Page Application**: Uses vanilla JavaScript with a class-based architecture (`SocialAI` class)
- **Dark Theme UI**: Custom CSS with gold accent colors, responsive grid layout
- **Real-time Updates**: Polling mechanism to refresh post status and display updates
- **Localization**: Configured for UK market with en-GB locale, 24-hour time format, and GBP currency

## Backend Architecture
- **FastAPI Framework**: Asynchronous Python web framework for REST API endpoints (requires uvicorn, not gunicorn)
- **Absolute Path Resolution**: Uses `BASE_DIR = Path(__file__).resolve().parent` for reliable static file serving
- **Single-file JSON Storage**: Simple file-based data persistence using `Store` class with async locking
- **Dataclass Models**: Uses Python dataclasses for `PostRecord` and `State` with automatic serialization
- **Static File Serving**: Serves frontend assets directly through FastAPI with fallback error handling

## Data Storage
- **File-based Storage**: JSON file (`data.json`) containing application state
- **In-memory State Management**: Dataclass-based state with posts, accounts, and ID tracking
- **Async File Operations**: Thread-safe file operations with asyncio locks

## Content Management
- **Draft Generation**: AI-powered content creation with customizable topics and tones
- **Post Scheduling**: Time-based scheduling with status tracking (draft, scheduled, published, failed)
- **Multi-platform Support**: Designed for X (Twitter) and LinkedIn integration
- **Status Monitoring**: Real-time post status updates with error handling

## Authentication System
- **Manual Token Management**: Simple token storage per platform
- **Stub Implementation**: Basic authentication structure ready for real API integration

# Current Status (August 23, 2025)

## Recent Changes
- **UNIFIED PLATFORM ACHIEVEMENT**: Successfully unified SocialScale + SmartFlow to single public port (5000)
- **Interactive Tutorial System**: Implemented smooth onboarding with 6-step guided tooltips
- **Flask Coordination Server**: Unified landing page and route management on port 5000
- **Complete SocialScale Integration**: Full platform accessible at /socialscale with tutorial
- **API Proxying**: Seamless integration between Flask frontend and TypeScript backend
- **Professional Branding**: Consistent dark theme (#1a1a1a) with gold accents (#ffd700)

## Current Deployment Status
- **Single Port Access**: Everything unified and accessible through port 5000
- **Unified Landing Page**: Professional interface at / with system status and quick access
- **Complete SocialScale Platform**: Full tutorial and features at /socialscale  
- **Coordinated Services**: Flask (5000) coordinates TypeScript API (8787) and React client (5173)
- **Interactive Tutorial**: 6-step guided tour with tooltips, progress tracking, and completion memory
- **Working Integration**: Health checks, API proxy, static file serving, and backend connectivity

## SocialScale Parity Pack Integration

### Advanced TypeScript/React Architecture
A complete modern social media management platform has been added to complement the existing Flask system:

- **Server**: TypeScript + Express + SQLite + WebSocket real-time updates
- **Client**: React + Vite + TailwindCSS + React Query for state management  
- **Integration**: Seamlessly proxies to existing Flask AI generator or uses built-in OpenAI fallback
- **Database**: SQLite with automatic schema creation for accounts, templates, posts, and analytics
- **API**: Comprehensive REST endpoints with admin authentication

### Modern Features
- **Real-time Analytics**: WebSocket-powered live metrics and engagement updates
- **Advanced UI Components**: Professional dashboard with dark theme and gold accents
- **Template Management**: Create, browse, and use post templates with variable substitution
- **Multi-platform Support**: X (Twitter), LinkedIn, Instagram account management
- **Scheduler**: Visual post scheduling with status tracking
- **Post Generator**: AI-powered content creation with topic input
- **Admin Tools**: Seeding, metrics generation, and administrative controls

### Integration Capabilities
- **Hybrid Mode**: Runs alongside Flask system on port 8787 while Flask serves on 5000
- **Python Proxy**: Automatically detects and uses existing Flask `/api/generate_posts` endpoint
- **Fallback AI**: Uses OpenAI when Flask generator is unavailable
- **Unified Branding**: Maintains SmartFlow Systems styling and color scheme

## Comprehensive Features Implemented

### Original Core Features
1. **Compose Tab**: 
   - Generate drafts with OpenAI (Pro) or stub generator (Free)
   - Real-time cost estimation in GBP
   - Schedule posts with quota enforcement
   - Live post status monitoring

2. **Templates Tab**: 
   - Browse built-in templates by purpose (lead_gen, announcement, educational, etc.)
   - Render templates with variable substitution
   - **Bulk Schedule**: Create multiple posts from templates with variable rotation
   - Admin-only custom template creation (ADMIN_TOKEN required)

3. **Best Time Tab**: 
   - Analyze optimal posting times from historical data
   - **Smart Replies**: Generate context-aware comment responses (supportive, curious, challenging)
   - Default recommendations for new users

4. **Feedback/NPS Tab**: 
   - User feedback collection with optional names
   - **NPS Scoring**: 0-10 rating scale with comment capture
   - **Lead Capture**: Newsletter signup with name/email/message
   - Recent feedback display

5. **Pricing/Referral Tab**: 
   - Real-time plan status and quota usage
   - **Upgrade Flow**: Point-of-need upgrading (demo billing)
   - **Referral System**: Generate and track referral codes
   - Clear feature comparison between Free and Pro

6. **Export Tab**: 
   - **CSV Export**: Download all posts data
   - **iCal Export**: Calendar file for scheduled posts
   - **A/B Experiments**: Set feature flags for testing
   - Flag status monitoring

7. **Analytics Tab**: 
   - **KPI Dashboard**: Total posts, status breakdown, monthly usage
   - **Monthly Analytics**: Posts by month with status breakdown
   - Real-time quota tracking and remaining capacity

### Advanced Features
- **Quota System**: Enforced monthly limits with upgrade prompts
- **Onboarding**: Interactive 3-step checklist (connect account, generate draft, schedule post)
- **Smart Engagement**: Non-LLM reply generation for quick responses
- **Event Logging**: Optional webhook notifications (NOTIFY_WEBHOOK_URL)
- **Background Scheduler**: Automatic post publishing with status updates
- **Responsive Design**: Mobile-optimized dark theme with gold accents

## Technical Architecture
- **ASGI/WSGI Hybrid**: FastAPI with asgiref compatibility layer for gunicorn
- **Advanced Data Models**: UserProfile, quotas, referrals, NPS, leads, custom templates
- **Async Storage**: Thread-safe JSON file operations with asyncio locks
- **Environment Guards**: RUN_SCHEDULER, ADMIN_TOKEN, NOTIFY_WEBHOOK_URL protection
- **Absolute Path Resolution**: Reliable static file serving with BASE_DIR
- **GBP Cost Estimation**: Configurable OpenAI pricing with real-time calculations

# External Dependencies

## Core Framework Dependencies
- **FastAPI (>=0.111)**: Web framework for API development
- **Uvicorn (>=0.30)**: ASGI server for running the FastAPI application
- **Pydantic**: Data validation and serialization (via FastAPI)
- **Starlette**: Web framework components (via FastAPI)

## Runtime Environment
- **Python 3**: Primary runtime environment
- **Replit Platform**: Configured for cloud-based development and deployment

## Future Integration Points
- **Social Media APIs**: Placeholder structure for X (Twitter) and LinkedIn APIs
- **AI Content Generation**: Framework ready for AI service integration
- **Database Migration**: Current JSON storage can be easily migrated to PostgreSQL with Drizzle ORM