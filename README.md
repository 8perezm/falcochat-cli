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

Install from npm:

```bash
npm i @falcochat/cli
```

If you are cloning the repository locally, install dependencies in the repo first:

```bash
npm install
```

If you want to use the CLI command globally from your machine while developing locally, link it after installing dependencies:

```bash
npm link
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
falcochat
falcochat "Hello!"                 # Start with initial prompt
falcochat -s                        # Streaming conversation
falcochat -m "openai/gpt-4o-mini"  # With model selection

# Single prompt (no conversation)
falcochat -1 "What is 2+2?"

# List available models
falcochat -l
falcochat --list-models

# Set a default model
falcochat --set-model "google/gemini-pro"

# Other options
falcochat -m "anthropic/claude-3-haiku" "Explain quantum"
falcochat -s "Tell me a story"         # Stream a single response
falcochat -f prompt.txt                 # Read prompt from file
```

## Local Development

For a local clone, use `npm link` to expose the command on your machine while you work:

```bash
npm install
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
