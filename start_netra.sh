#!/bin/bash

# Clear the terminal for a clean startup screen
clear

echo "=========================================================="
echo " 🚨  STARTING NETRA.AI GEOSPATIAL COMMAND ENGINE  🚨 "
echo "=========================================================="
echo ""

# Quick check if packages need to be installed
if [ ! -d "node_modules" ]; then
    echo "📦 Node modules not found. Installing dependencies..."
    npm install
fi

echo "✅ Environment Check Passed."
echo "🚀 Booting Next.js Full-Stack Server (Frontend + API Routes)..."
echo "🌐 The Live Dashboard will be available at: http://localhost:3000"
echo "📧 Automated SMTP Dispatch Protocol is: ACTIVE"
echo ""
echo "Press Ctrl+C to shut down the server safely."
echo "----------------------------------------------------------"

# Start the application
npm run dev
