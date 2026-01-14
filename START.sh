#!/bin/bash

# SeattleSocial - Quick Start Script

echo "🔥 SeattleSocial - Starting Local Server..."
echo ""

# Check if we're in the right directory
if [ ! -d "client/dist" ]; then
    echo "❌ Error: client/dist directory not found"
    echo "Please run this script from the SeattleSocial root directory"
    exit 1
fi

cd client/dist

echo "📁 Serving from: $(pwd)"
echo ""
echo "🌐 Starting server..."
echo ""
echo "✅ Server will start on: http://localhost:8000"
echo ""
echo "📖 To view the site:"
echo "   1. Open your web browser"
echo "   2. Go to: http://localhost:8000"
echo ""
echo "⚠️  Press Ctrl+C to stop the server"
echo ""
echo "---"
echo ""

# Start Python HTTP server
python3 -m http.server 8000
