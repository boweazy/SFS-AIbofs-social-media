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
- **Hybrid Flask + Node.js**: Flask serves main app and templates, Node.js provides AI chat API
- **Flask Routes**: PWA assets, admin dashboard, social media generator, booking system
- **Node.js API Server**: Express with OpenAI integration, security middleware, rate limiting
- **SQLAlchemy Models**: Multi-tenant database with Tenant, User, Booking, AuditLog models
- **Cross-Origin Setup**: CORS enabled for Flask-to-Node.js communication
- **Production Ready**: Gunicorn + Express with security headers and compression

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
- **AI Chat Integration**: Added premium AI chat widget with Node.js/Express backend and OpenAI integration
- **Hybrid Architecture**: Flask serves main app on port 5000, Node.js serves AI chat API on port 3000
- **Premium Chat Interface**: Black/brown/gold themed chat modal with accessibility features and rate limiting
- **Navigation Integration**: Added "AI Chat" link to main navigation for seamless user experience
- **SmartFlow AI System Prompt**: Configured for concise, premium responses with brand voice consistency

## Current Deployment Status
- **Dual-Server Architecture**: Flask app (port 5000) + Node.js AI service (port 3000)
- **Premium AI Chat**: Accessible via /chat route with OpenAI GPT-4o-mini integration
- **Brand Consistent**: Black/brown/gold theme matching SmartFlow design system
- **Security Features**: Helmet, CORS, rate limiting, and input sanitization
- **Accessibility**: Focus traps, ARIA labels, keyboard navigation support
- **Progressive Enhancement**: Works with or without AI service running

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