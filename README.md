    
    ██████╗ ██████╗ ██████╗ ███████╗██████╗ ███████╗██╗   ██╗██╗███████╗██╗    ██╗███████╗██████╗ 
    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝██║   ██║██║██╔════╝██║    ██║██╔════╝██╔══██╗
    ██║     ██║   ██║██║  ██║█████╗  ██████╔╝█████╗  ██║   ██║██║█████╗  ██║ █╗ ██║█████╗  ██████╔╝
    ██║     ██║   ██║██║  ██║██╔══╝  ██╔══██╗██╔══╝  ╚██╗ ██╔╝██║██╔══╝  ██║███╗██║██╔══╝  ██╔══██╗
    ╚██████╗╚██████╔╝██████╔╝███████╗██║  ██║███████╗ ╚████╔╝ ██║███████╗╚███╔███╔╝███████╗██║  ██║
     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝.ai

# 🚀  Code Review CLI

> Entertainment • Development • Productivity • A Well Being

AI-powered code review tool that helps developers write better code with real-time feedback from Gemini, Claude, or OpenAI.

## ✨ Features

- 🤖 **Multiple AI Providers**: Choose between Google Gemini, Anthropic Claude, or OpenAI
- ⚡ **Auto Review Mode**: Automatic code review on file save with smart debouncing
- 👤 **Manual Review Mode**: Review files on-demand with simple commands
- 💬 **Interactive Chat**: Ask questions and get code suggestions
- 🔄 **Git Integration**: Review staged files before commit
- 📚 **Context Awareness**: Maintains conversation history for better suggestions
- 🎯 **Configurable Depth**: Quick, standard, or deep analysis modes
- 📊 **Review History**: Track all your code reviews with scores

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git (optional, for git integration)

### Setup Steps

```bash
# 1. Clone or create project directory
mkdir codereview
cd codereview

# 2. Initialize npm project
npm init -y

# 3. Install dependencies
npm install commander inquirer@9.2.12 chalk@4.1.2 chalk-animation figlet gradient-string chokidar simple-git axios dotenv conf@11.0.2 ora@5.4.1 boxen@5.1.2 cli-table3 nanospinner

# 4. Install dev dependencies
npm install -D typescript @types/node @types/figlet @types/gradient-string ts-node

# 5. Copy all source files to respective directories
# Copy package.json, tsconfig.json
# Copy src/ directory with all files

# 6. Build the project
npm run build

# 7. Link globally (for development)
npm link

# OR install globally after publishing
npm install -g codereview
```

## 🎯 Quick Start

### First Time Setup

```bash
# Run the configuration wizard
awd config

# Or use long form
awesomediagns config
```

Follow the interactive prompts to:
1. Select your AI provider (Gemini/Claude/OpenAI)
2. Enter your API key
3. Choose your preferred model
4. Set review mode (Auto/Manual)
5. Configure advanced settings

### Initialize in Your Project

```bash
# Navigate to your project
cd my-project

# Initialize AwesomeDiagns
awd init
```

### Review Your Code

```bash
# Review a specific file
awd review src/index.js

# Review all modified files
awd review

# Review staged files (git)
awd review --staged

# Review all files in project
awd review --all
```

### Auto Mode (Watch files)

```bash
# Start watching files
awd watch

# Files will be automatically reviewed on save
# Press Ctrl+C to stop
```

### Interactive Chat

```bash
# Start chat mode
awd chat

# Ask questions like:
# "How can I optimize this function?"
# "What's the best way to handle errors in async functions?"
# "Review my recent changes"
```

## 📋 All Commands

```bash
awd                    # Show home screen
awd init              # Initialize in current project
awd config            # Run configuration wizard
awd config --show     # Show current configuration
awd config --provider # Change AI provider
awd config --mode     # Change review mode
awd review [file]     # Review file(s)
awd review --all      # Review all project files
awd review --staged   # Review staged git files
awd watch             # Start auto-review mode
awd chat              # Interactive chat with AI
awd status            # Show configuration status
awd history           # View review history
awd history --clear   # Clear history
awd help              # Show all commands
```

## 🔧 Configuration

### Global Configuration
Stored in: `~/.config/awesomediagns/config.json`

Contains:
- AI provider settings
- API keys
- Review preferences
- Mode settings

### Project Configuration
Stored in: `.awesomediagns/config.json` in your project

Contains:
- Watched file patterns
- Ignore patterns
- Git settings
- Project-specific settings

### API Keys

#### Google Gemini
1. Visit: https://makersuite.google.com/app/apikey
2. Create API key
3. Free tier available!

#### Anthropic Claude
1. Visit: https://console.anthropic.com/
2. Create account and get API key
3. Requires payment method

#### OpenAI
1. Visit: https://platform.openai.com/api-keys
2. Create API key
3. Requires payment method

## 📁 Project Structure

```
my-project/
├── .awesomediagns/
│   ├── config.json          # Project config
│   └── history/
│       ├── reviews.json     # Review history
│       └── chat.json        # Chat history
├── src/
└── ...
```

## 🎨 Customization

### Watched File Patterns
Edit `.awesomediagns/config.json`:

```json
{
  "watchedFiles": [
    "**/*.js",
    "**/*.ts",
    "**/*.jsx",
    "**/*.tsx",
    "**/*.py"
  ],
  "ignoredPatterns": [
    "node_modules/**",
    "dist/**",
    "build/**"
  ]
}
```

### Review Depth
- **Quick**: Fast scan, critical issues only
- **Standard**: Balanced review (recommended)
- **Deep**: Thorough analysis with security, performance, architecture

### Auto Save Delay
Configure delay (1-30 seconds) before auto-review triggers after file save.

## 🔒 Privacy & Security

- API keys stored locally in config files
- Code is sent to AI providers for review
- Conversation history stored locally
- No data sent to AwesomeDiagns servers (we don't have any!)

## 🐛 Troubleshooting

### API Key Issues
```bash
# Reconfigure provider
awd config --provider
```

### Project Not Initialized
```bash
# Re-run init
awd init
```

### Clear Everything
```bash
awd config --reset
awd history --clear
```

## 📝 Examples

### Example Review Output
```
╭──────────────────────────────────────────╮
│ 📋 Code Review: index.js                │
│                                          │
│ Summary:                                 │
│ Good code structure. Found 2 issues     │
│ and 3 optimization opportunities.       │
│                                          │
│ 🐛 Issues Found:                        │
│ 1. Missing error handling               │
│    Line 42                              │
│    💡 Add try-catch block              │
│                                          │
│ ⚡ Optimizations:                       │
│ 1. Use async/await instead of .then()  │
│ 2. Cache API responses                  │
│                                          │
│ Score: 8/10                             │
╰──────────────────────────────────────────╯
```

## 🚀 Advanced Usage

### Git Hooks Integration
Coming soon! Pre-commit hooks for automatic review.

### VS Code Extension
Planned for future release.

### Team Features
- Shared configurations
- Team review standards
- Custom rules engine

## 📄 License
MIT License

Copyright (c) 2026 methreamarnath1

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create feature branch
3. Submit pull request

## 📞 Support

- GitHub Issues: [methreamarnath1]
- Email: methreamarnath@gamil.com


## 🌟 Star Us!

If you find this tool helpful, please star the repo!

---

Made with ❤️ for developers who care about code quality