#!/bin/bash
# Setup script for pushing sdk-js to GitHub

echo "🚀 Setting up GitHub repository for memphora-sdk-js"
echo ""

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' already exists"
    git remote -v
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    git remote remove origin
fi

# Add remote
echo "📦 Adding GitHub remote..."
git remote add origin https://github.com/Memphora/memphora-sdk-js.git

# Show current status
echo ""
echo "✅ Remote added. Current remotes:"
git remote -v

echo ""
echo "📤 Ready to push! Run:"
echo "   git push -u origin main"
echo ""
echo "Or if you want to push now, type 'y':"
read -p "Push now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin main
    echo ""
    echo "✅ Pushed to GitHub!"
    echo "🌐 Repository: https://github.com/Memphora/memphora-sdk-js"
else
    echo "Run 'git push -u origin main' when ready."
fi

