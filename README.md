# FalcoChat

A modular command-line interface for interactive AI chat conversations with any OpenAI API-compatible provider (OpenRouter, OpenAI, Together AI, Ollama, etc.).

## Project Structure

```
falcochat/
├── bin/
│   └── falcochat.js       # CLI entry point
├── lib/
│   ├── config.js          # Config & env management
│   ├── models.js           # List & validate models
│   ├── chat.js             # Chat, stream & conversation modes
│   └── cli.js              # CLI setup & argument parsing
├── test.sh                 # Test suite
└── package.json
```

## Installation

```bash
npm install
```

Copy the environment file and add your API key:

```bash
cp .env.example .env
```

Then edit `.env` and add your API key and configure the API URL for your preferred provider.

## Usage

**Conversation mode is now the default!**

```bash
# Start interactive conversation (default mode)
node bin/falcochat.js
node bin/falcochat.js "Hello!"                 # Start with initial prompt
node bin/falcochat.js -s                        # Streaming conversation
node bin/falcochat.js -m "openai/gpt-4o-mini"  # With model selection

# Single prompt (no conversation)
node bin/falcochat.js -1 "What is 2+2?"

# List available models
node bin/falcochat.js -l
node bin/falcochat.js --list-models

# Set a default model
node bin/falcochat.js --set-model "google/gemini-pro"

# Other options
node bin/falcochat.js -m "anthropic/claude-3-haiku" "Explain quantum"
node bin/falcochat.js -s "Tell me a story"         # Stream a single response
node bin/falcochat.js -f prompt.txt                 # Read prompt from file
```

## Linking as a global command

```bash
npm link
falcochat                             # Start conversation mode
falcochat "Hello!"                    # Conversation with initial prompt
falcochat -1 "What is 2+2?"          # Single prompt
falcochat -l                          # List models
```

## Running Tests

```bash
./test.sh
```

Tests cover help, version, model listing, single prompts, streaming, model overrides, file input, and error handling. Requires a configured API key for chat tests (they skip gracefully if missing).

## Available Models

See [openrouter.ai/models](https://openrouter.ai/models) for all available models.

## Environment Variables

- `OPENAI_API_KEY` - Your API key for any OpenAI-compatible provider (required)
- `OPENAI_API_URL` - API URL (default: `https://openrouter.ai/api/v1`)
  - OpenRouter: `https://openrouter.ai/api/v1`
  - OpenAI: `https://api.openai.com/v1`
  - Together AI: `https://api.together.xyz/v1`
  - Ollama: `http://localhost:11434/v1`
- `OPENAI_MODEL` - Default model (provider-specific, e.g., `gpt-3.5-turbo`)
  - Recommended: `openai/gpt-4o-mini`, `anthropic/claude-3-haiku`, etc.
- `OPENAI_LANGUAGE` - Language preference (optional, e.g., `en`, `es`, `fr`, `de`)
- `OPENAI_SITE_NAME` - Site name (mainly for OpenRouter rankings)
- `OPENAI_SITE_URL` - Site URL (mainly for OpenRouter rankings)

## Config persistence

Default model selections are saved to `~/.config/falcochat/config.json`. Environment variables are loaded from `~/.config/falcochat/.env` (global) or `./.env` (local, project-specific).
