#!/bin/bash

# Helper script to generate MCP client configuration

echo "=== sql-mcp Configuration Generator ==="
echo ""

# Get absolute path to project
PROJECT_PATH="$(cd "$(dirname "$0")" && pwd)"

echo "Project detected at: $PROJECT_PATH"
echo ""

# Check if built
if [ ! -f "$PROJECT_PATH/dist/index.js" ]; then
    echo "⚠️  Project not built. Building now..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please run 'npm install' and 'npm run build' manually."
        exit 1
    fi
fi

echo "✅ Project is built"
echo ""

# Generate configuration
CONFIG=$(cat <<EOF
{
  "mcpServers": {
    "sql-mcp": {
      "command": "node",
      "args": [
        "$PROJECT_PATH/dist/index.js",
        "--stdio"
      ],
      "env": {}
    }
  }
}
EOF
)

echo "📋 Your MCP client configuration:"
echo ""
echo "$CONFIG"
echo ""
echo "---"
echo ""

# Detect OS and show config location
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    echo "For Claude Desktop on macOS, edit:"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
    echo "For Claude Desktop on Linux, edit:"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
    echo "For Claude Desktop on Windows, edit:"
else
    CONFIG_PATH="[See README for your OS]"
    echo "Config file location:"
fi

echo "  $CONFIG_PATH"
echo ""

# Offer to copy to clipboard if available
if command -v pbcopy &> /dev/null; then
    echo "$CONFIG" | pbcopy
    echo "✅ Configuration copied to clipboard!"
elif command -v xclip &> /dev/null; then
    echo "$CONFIG" | xclip -selection clipboard
    echo "✅ Configuration copied to clipboard!"
elif command -v clip &> /dev/null; then
    echo "$CONFIG" | clip
    echo "✅ Configuration copied to clipboard!"
else
    echo "💡 Copy the configuration above to your MCP client config file"
fi

echo ""
echo "Next steps:"
echo "1. Edit your MCP client config file"
echo "2. Paste the configuration above"
echo "3. Restart your MCP client"
echo "4. Run 'node debug-server.js' to verify the server works"
echo ""
echo "For troubleshooting, see: TROUBLESHOOTING.md"
