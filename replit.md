# Overview

SmartFlow Systems is a comprehensive Flask-based booking and workflow automation platform with multi-tenant user management, Stripe checkout integration, and automated reminder capabilities via email and SMS.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture
- **Flask Framework**: Python web framework with SQLAlchemy ORM for database operations
- **Multi-tenant Architecture**: Support for multiple tenants with role-based access control
- **Stripe Integration**: Complete checkout flow with webhook handling for subscriptions and one-time payments
- **Automated Scheduling**: APScheduler for booking reminders with configurable timing

## Data Storage
- **SQLite Database**: File-based database with SQLAlchemy models
- **Multi-tenant Data Model**: Tenants, Users, Memberships, Invitations, Bookings, and Audit Logs
- **Notification Settings**: Configurable email and SMS preferences per tenant

## Communication Systems
- **Email Integration**: SMTP-based email notifications for onboarding and reminders
- **SMS Integration**: Vonage API for SMS notifications and appointment reminders
- **Notification Preferences**: Per-tenant toggles for email/SMS with configurable reminder timing

## User Management
- **Invitation System**: Token-based user invitations with expiration
- **Role-based Access**: Owner, Admin, Staff, and Analyst roles with appropriate permissions
- **Status Management**: User suspension and activation capabilities
- **Audit Logging**: Complete audit trail for all user actions and system events

# Current Status (August 16, 2025)

## Recent Changes
- **Complete FastAPI Rebuild**: Implemented comprehensive social media management platform with all premium features
- **WSGI Compatibility Layer**: Added asgiref adapter to run FastAPI with existing gunicorn workflow
- **Enhanced User Experience**: Complete dark brown/black + shiny gold theme with 7 comprehensive tabs
- **Comprehensive Feature Set**: All requested premium features including quotas, analytics, exports, and A/B testing

## Current Deployment Status
- **FastAPI Application**: Fully featured social media management platform
- **Pricing System**: Free plan (30 posts/month) vs Pro plan (300 posts/month) with upgrade-at-point-of-need
- **Template System**: Built-in templates + custom template CRUD with admin token protection
- **Analytics & Exports**: Full KPI dashboard, CSV/iCal exports, monthly analytics
- **Lead Capture**: Newsletter signup, referral system, NPS scoring
- **Smart Features**: Best-time analysis, bulk scheduling, smart reply generation, A/B experiments

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