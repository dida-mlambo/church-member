#!/bin/bash
# Quick start script for Church Registration System

echo "🏛️  Church Registration System"
echo "================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check if database exists
if [ ! -f "church.db" ]; then
    echo ""
    echo "❓ Database not found. Would you like to:"
    echo "   1) Start with empty database"
    echo "   2) Initialize with sample data"
    read -p "Enter choice (1 or 2): " choice
    
    if [ "$choice" = "2" ]; then
        echo "📊 Initializing sample data..."
        python init_sample_data.py
    else
        echo "✅ Starting with empty database..."
    fi
fi

echo ""
echo "🚀 Starting application..."
echo "📍 Open your browser to: http://localhost:5000"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""

python app.py

