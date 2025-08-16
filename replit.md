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
- **FastAPI Framework**: Asynchronous Python web framework for REST API endpoints
- **Single-file JSON Storage**: Simple file-based data persistence using `Store` class with async locking
- **Dataclass Models**: Uses Python dataclasses for `PostRecord` and `State` with automatic serialization
- **Static File Serving**: Serves frontend assets directly through FastAPI

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