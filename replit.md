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
- **Working FastAPI Application**: Main app imports and runs correctly
- **Server Configuration**: Currently configured for gunicorn (WSGI) but FastAPI requires uvicorn (ASGI)
- **Healthz Endpoint**: `/healthz` returns `{"ok":true,"brand":"Smart Flow Systems"}` when running on uvicorn
- **Static Files**: Verified to exist in correct static/ folder structure

## Next Steps Required
1. **Server Configuration**: Update .replit workflow to use `uvicorn main:app --host 0.0.0.0 --port 5000 --reload` instead of gunicorn
2. **Port Configuration**: Application tested successfully on port 8000, needs port 5000 for deployment
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