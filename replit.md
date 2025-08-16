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
- **FastAPI Application**: Fully implemented with all premium features
- **New Endpoints Added**:
  - `/templates` - Browse content templates by purpose
  - `/templates/render` - Render templates with variables  
  - `/agent/ask` - AI agent for content advice
  - `/best-time` - Optimal posting time analysis
  - `/feedback` - User feedback system
  - `/pricing` - GBP pricing tiers
- **Environment Configuration**: RUN_SCHEDULER env var guards background scheduler
- **OpenAI Integration**: Optional with GBP cost estimation (requires OPENAI_API_KEY)
- **Static Files**: Complete tabbed UI with Compose, Templates, Agent, Best Time, Feedback, Pricing
- **Dark Theme**: Black/dark-brown with gold accents maintained

## Features Implemented
1. **Compose Tab**: Generate drafts with OpenAI or stub generator, schedule posts
2. **Templates Tab**: Browse and render pre-built content templates
3. **Agent Tab**: Get content advice based on goals and platforms
4. **Best Time Tab**: Analyze optimal posting times from history
5. **Feedback Tab**: Collect and display user feedback
6. **Pricing Tab**: Display GBP pricing tiers and features

## Server Configuration
- **FastAPI + Uvicorn**: Requires uvicorn for ASGI compatibility (not gunicorn)
- **Absolute Paths**: Uses BASE_DIR resolution to avoid 500 errors
- **Environment Variables**: Configurable LLM provider, costs, scheduler

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