#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Remark PM — Deployment Script
# Run this on the VPS after cloning/uploading the project
# ═══════════════════════════════════════════════════════════════

set -e

APP_DIR="/var/www/remark-pm"
cd $APP_DIR

echo "═══════════════════════════════════════════════"
echo "  🚀 Deploying Remark PM..."
echo "═══════════════════════════════════════════════"

# ─── 1. Pull latest code (if using git) ───
if [ -d ".git" ]; then
    echo "📥 Pulling latest code..."
    git pull origin main
fi

# ─── 2. Install dependencies ───
echo "📦 Installing dependencies..."
npm ci --production=false

# ─── 3. Generate Prisma client ───
echo "🔧 Generating Prisma client..."
npx prisma generate

# ─── 4. Run database migrations ───
echo "🗄️  Pushing database schema..."
npx prisma db push --accept-data-loss

# ─── 5. Seed database (first time only) ───
if [ "$1" = "--seed" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

# ─── 6. Build the app ───
echo "🏗️  Building Next.js app..."
npm run build

# ─── 7. Create logs directory ───
mkdir -p logs

# ─── 8. Restart with PM2 ───
echo "🔄 Restarting PM2..."
pm2 delete remark-pm 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "═══════════════════════════════════════════════"
echo ""
echo "  App running at: https://remark-agency.com/work/workflow"
echo "  PM2 status: pm2 status"
echo "  PM2 logs:   pm2 logs remark-pm"
echo ""
