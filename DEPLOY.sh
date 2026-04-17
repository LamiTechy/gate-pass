#!/bin/bash

# Gate-Pass Vercel Deployment Quick Commands
# Copy & paste these commands one by one

echo "Gate-Pass Vercel Deployment"
echo "============================"
echo ""

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "✅ Dependencies installed"
echo ""
echo "Step 2: MANUAL - Create Neon Database"
echo "  1. Go to https://neon.tech"
echo "  2. Sign up and create project"
echo "  3. Copy connection string"
echo "  4. Save for next steps"
echo ""
read -p "Press Enter once Neon is created and connection string is copied..."

# Step 3: Create local env file
echo ""
echo "Step 3: Creating .env.local..."
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://paste_your_neon_connection_string_here
VITE_API_URL=http://localhost:4001
NODE_ENV=development
EOF

echo "✅ .env.local created"
echo "  (Edit it with your Neon connection string)"
echo ""

# Step 4: Build test
echo "Step 4: Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - fix errors and try again"
    exit 1
fi

echo ""
echo "Step 5: Testing lint..."
npm run lint

echo ""
echo "Step 6: MANUAL - GitHub Setup"
echo "  Run these commands:"
echo ""
echo "  git add ."
echo "  git commit -m 'Setup Vercel deployment with PostgreSQL'"
echo "  git push origin main"
echo ""
read -p "Press Enter once pushed to GitHub..."

echo ""
echo "Step 7: MANUAL - Vercel Deployment"
echo "  1. Go to https://vercel.com/new"
echo "  2. Import your GitHub repository"
echo "  3. Keep defaults for build settings"
echo "  4. Add environment variables:"
echo "     - DATABASE_URL = (your Neon connection string)"
echo "     - NODE_ENV = production"
echo "  5. Click Deploy"
echo ""
read -p "Press Enter once deployed on Vercel..."

echo ""
echo "✅ ALL DONE!"
echo ""
echo "Next: Visit your Vercel domain and test the app"
echo "  - Register account"
echo "  - Login"
echo "  - Create event"
echo "  - Register guest"
echo ""
echo "If errors occur, check:"
echo "  - Vercel logs"
echo "  - DATABASE_URL is correct"
echo "  - See VERCEL_SETUP.md for troubleshooting"
echo ""
