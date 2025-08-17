# Overview

Smart Flow Systems Social AI is a social media management application that allows users to generate AI-powered content drafts and schedule posts across multiple platforms (X/Twitter and LinkedIn). The application provides a clean, dark-themed interface for content creation, scheduling, and monitoring post status with real-time updates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Progressive Web App**: Vanilla HTML/CSS/JS with service worker for offline functionality
- **Dark Theme UI**: Black background with gold accent colors (#d4af37, #f5d67b), smooth animations
- **Canvas Effects**: Interactive hero section with animated golden rays following mouse movement
- **Responsive Design**: Mobile-optimized grid layouts, accessible navigation, reduced motion support
- **UK Localization**: en-GB locale for time formatting, GBP pricing display

## Backend Architecture  
- **Flask Framework**: Python web framework serving PWA assets and maintaining admin functionality
- **PWA Asset Serving**: Direct file serving for styles.css, script.js, manifest.webmanifest, service worker
- **SQLAlchemy Models**: Multi-tenant database with Tenant, User, Booking, AuditLog models
- **Static File Routing**: Assets served from /assets/ directory, legacy admin dashboard preserved
- **Gunicorn WSGI**: Production-ready server configuration with proper static file handling

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

# Current Status (August 17, 2025)

## Recent Changes
- **PWA Upgrade Complete**: Transformed Flask app into fast Progressive Web App with offline support
- **Vanilla HTML/CSS/JS**: Pure web technologies for instant loading and smooth animations
- **Service Worker**: Implemented offline caching with network-first strategy for HTML and cache-first for assets
- **PWA Manifest**: Installable app with dark theme and SmartFlow Systems branding
- **SmartFlow AIbot-Social**: New social media management interface with AI post generation

## Current Deployment Status
- **Progressive Web App**: Fast, installable app with offline functionality and instant updates
- **Service Worker Active**: Caches critical files, handles offline scenarios with fallback page
- **Social Media Demo**: Live post generator with platform-native copy for X/Twitter and LinkedIn  
- **PWA Features**: Manifest, favicon, offline.html, update toast notifications
- **Flask Backend**: Maintains admin dashboard and booking system for legacy functionality
- **Dark Theme**: Black+gold aesthetic with smooth animations and responsive design

## Comprehensive Features Implemented

### Core Features
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