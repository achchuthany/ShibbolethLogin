#!/bin/bash

# Quick GitHub Push Script
# Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME

if [ $# -eq 0 ]; then
    echo "Usage: $0 <github_username>"
    echo "Example: $0 johndoe"
    exit 1
fi

USERNAME=$1
REPO_NAME="ShibbolethLogin"

echo "=== Setting up GitHub remote for $USERNAME/$REPO_NAME ==="

# Check if remote already exists
if git remote get-url origin 2>/dev/null; then
    echo "Remote 'origin' already exists. Removing..."
    git remote remove origin
fi

# Add GitHub remote
echo "Adding GitHub remote..."
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git

# Rename branch to main (GitHub standard)
echo "Renaming branch to main..."
git branch -M main

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo "🌐 Repository URL: https://github.com/$USERNAME/$REPO_NAME"
echo ""
echo "Next steps:"
echo "1. Visit your repository on GitHub"
echo "2. Add repository description and topics"
echo "3. Review the README.md for setup instructions"
echo "4. Share with collaborators or make it public"
