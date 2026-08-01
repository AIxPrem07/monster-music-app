#!/usr/bin/env bash
# build.sh - Render build script
set -e

echo "Installing yt-dlp..."
pip3 install yt-dlp

echo "Verifying yt-dlp..."
yt-dlp --version

echo "Installing node dependencies..."
npm install --production

echo "Build complete."
