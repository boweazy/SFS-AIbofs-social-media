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

# Current Status (August 16, 2025)

## Recent Changes
- **Applied main.py with absolute path resolution**: Updated FastAPI application to use `BASE_DIR = Path(__file__).resolve().parent` for reliable static file serving
- **Verified static files**: Confirmed static/ folder contains index.html, style.css, app.js files
- **Fixed datetime typo**: Corrected `fromisostring` to `fromisoformat` in scheduler code
- **Tested FastAPI import**: Application imports successfully with 11 routes configured

## Current Deployment Status
- **Working Flask Application**: Successfully converted from FastAPI to Flask for gunicorn compatibility
- **Server Configuration**: Now running properly with gunicorn sync worker on port 5000
- **All Endpoints Working**: 
  - `/healthz` returns `{"ok":true,"brand":"Smart Flow Systems"}`
  - `/` serves static HTML correctly
  - `/static/*` serves CSS, JS files properly
  - `/auth/manual` accepts authentication tokens
  - `/generate` creates content drafts with hashtags and scoring
  - `/posts` handles post creation and scheduling
- **Background Scheduler**: Running in separate thread for auto-publishing scheduled posts
- **Static Files**: Confirmed working with absolute path resolution

## Ready for Next Steps
1. **UI Testing**: Application ready for full user interface testing
2. **Post Scheduling**: Ready to test the complete workflow from draft generation to publishing
3. **OpenAI Integration**: Ready to add OpenAI content generation with GBP cost toggle and safety filter

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