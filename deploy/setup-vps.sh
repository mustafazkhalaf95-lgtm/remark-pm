#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Remark PM — VPS Setup Script (Hostinger Ubuntu)
# Run this on a fresh VPS to set up everything needed
# ═══════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════"
echo "  🚀 Remark PM — VPS Setup Starting..."
echo "═══════════════════════════════════════════════"

# ─── 1. System Update ───
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# ─── 2. Install Node.js 20 LTS (via NodeSource) ───
echo "📦 Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "   Node: $(node -v)"
echo "   NPM:  $(npm -v)"

# ─── 3. Install PostgreSQL ───
echo "📦 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# ─── 4. Create PostgreSQL Database & User ───
echo "🗄️  Setting up PostgreSQL database..."
DB_NAME="remark_pm"
DB_USER="remark_user"
DB_PASS="$(openssl rand -base64 32 | tr -d '=/+' | head -c 32)"

# Create user and database (ignore if exists)
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASS"
echo ""
echo "   ⚠️  SAVE THIS PASSWORD! You'll need it for .env"
echo "   DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# ─── 5. Install PM2 ───
echo "📦 Installing PM2..."
sudo npm install -g pm2
pm2 startup systemd -u $(whoami) --hp $HOME 2>/dev/null || true

# ─── 6. Install Git ───
echo "📦 Installing Git..."
sudo apt install -y git

# ─── 7. Create App Directory ───
APP_DIR="/var/www/remark-pm"
echo "📁 Creating app directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $(whoami):$(whoami) $APP_DIR

# ─── 8. Install Nginx (if not present) ───
echo "📦 Checking Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ VPS Setup Complete!"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "  1. Clone/upload the project to $APP_DIR"
echo "  2. Create .env with the DATABASE_URL above"
echo "  3. Run: cd $APP_DIR && npm install"
echo "  4. Run: npx prisma db push && npx prisma db seed"
echo "  5. Run: npm run build"
echo "  6. Run: pm2 start ecosystem.config.js"
echo "  7. Configure Nginx (see deploy/nginx.conf)"
echo ""
