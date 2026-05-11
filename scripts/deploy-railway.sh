#!/bin/bash

# Railway Deployment Script
# Quick deploy to Railway with automatic URL retrieval

set -e

echo "🚀 PolicyPilot Railway Deployment"
echo "=================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check git repo status
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not a git repository. Please run from repo root."
    exit 1
fi

# Verify environment
echo "✓ Checking configuration..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. You'll need to add environment variables manually."
else
    echo "✓ .env.local found"
fi

if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found"
    exit 1
fi

if [ ! -f "railway.json" ]; then
    echo "❌ railway.json not found"
    exit 1
fi

echo "✓ Deployment files verified"
echo ""

# Railway login check
echo "🔐 Checking Railway authentication..."
if railway whoami > /dev/null 2>&1; then
    echo "✓ Logged in to Railway"
else
    echo "❌ Not logged in. Run: railway login"
    exit 1
fi

echo ""
echo "📦 Checking if project exists..."

# Try to get current project
if railway status > /dev/null 2>&1; then
    echo "✓ Using existing Railway project"
    PROJECT=$(railway status 2>&1 | grep "Project:" | cut -d' ' -f2)
    echo "  Project: $PROJECT"
else
    echo "ℹ️  No project linked. Run: railway link"
    echo ""
    echo "   To create a new project:"
    echo "   1. Go to https://railway.app"
    echo "   2. Click 'New Project'"
    echo "   3. Select this repository"
    echo "   4. Or run: railway link --new"
    exit 1
fi

echo ""
echo "🔧 Setting environment variables..."
echo "   You'll need to set:"
echo "   - GEMINI_KEY_API (get from .env.local)"
echo "   - NODE_ENV=production"
echo ""
echo "   Do this in Railway dashboard: Project → Variables"
echo "   Or use: railway variables set KEY=value"
echo ""

read -p "📦 Ready to deploy? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⬆️  Deploying to Railway..."
    railway up --detach

    echo ""
    echo "✅ Deployment started!"
    echo ""
    echo "📍 Check deployment status:"
    echo "   railway status"
    echo ""
    echo "📊 View logs:"
    echo "   railway logs"
    echo ""
    echo "🌐 Get public URL (once deployed):"
    echo "   railway logs | grep 'Public URL' || echo 'URL not yet available'"
    echo ""
    echo "⏳ Deployment typically takes 3-5 minutes."
    echo ""
fi
