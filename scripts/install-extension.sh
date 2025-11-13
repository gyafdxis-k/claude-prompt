#!/bin/bash

echo "🔧 Chrome Extension Auto-Install Script"
echo ""

EXTENSION_DIR="$(cd "$(dirname "$0")/../extension" && pwd)"
CHROME_EXTENSIONS_DIR=""

if [[ "$OSTYPE" == "darwin"* ]]; then
  CHROME_EXTENSIONS_DIR="$HOME/Library/Application Support/Google/Chrome/Default/Extensions"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  CHROME_EXTENSIONS_DIR="$HOME/.config/google-chrome/Default/Extensions"
else
  echo "❌ Unsupported OS: $OSTYPE"
  exit 1
fi

echo "⚠️  Note: Chrome extensions cannot be auto-installed in production mode."
echo "   This is a Chrome security restriction."
echo ""
echo "📝 To install the extension manually:"
echo ""
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select this folder: $EXTENSION_DIR"
echo ""
echo "🚀 Or use this one-liner to open Chrome extensions page:"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "   open -a 'Google Chrome' 'chrome://extensions/'"
  echo ""
  read -p "Open Chrome extensions page now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    open -a 'Google Chrome' 'chrome://extensions/'
    echo "✓ Chrome extensions page opened!"
    echo "  Now manually load the extension from: $EXTENSION_DIR"
  fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "   google-chrome chrome://extensions/"
  echo ""
  read -p "Open Chrome extensions page now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    google-chrome chrome://extensions/ &
    echo "✓ Chrome extensions page opened!"
    echo "  Now manually load the extension from: $EXTENSION_DIR"
  fi
fi

echo ""
echo "📁 Extension location: $EXTENSION_DIR"
