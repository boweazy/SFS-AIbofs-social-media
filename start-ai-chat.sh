#!/bin/bash
# SmartFlow AI Chat Service
echo "Starting Node.js AI Chat service on port 3000..."
npm start &
echo "AI Chat service started in background"
echo "Visit http://localhost:5000/chat to access the AI assistant"
echo "Main Flask app continues running on port 5000"