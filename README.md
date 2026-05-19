# FalcoChat

A simple command-line interface for interactive AI chat conversations with any OpenAI API-compatible provider (OpenRouter, OpenAI, Together AI, Ollama, etc.).

## Installation

```bash
npm install
```

Copy the environment file and add your API key:

```bash
cp .env.example .env
```

Then edit `.env` and add your API key and configure the API URL for your preferred provider

## Usage

**Conversation mode is now the default!**

```bash
# Start interactive conversation (default mode)
falcochat
falcochat "Hello!"                      # Start with initial prompt
falcochat -s                             # Streaming conversation
falcochat -m "openai/gpt-3.5-turbo"    # With model selection

# Single prompt (no conversation)
falcochat -1 "What is 2+2?"            # Single prompt mode

# Other options
falcochat -m "anthropic/claude-3-haiku" "Explain quantum"
falcochat -s "Tell me a story"          # Stream a single response
falcochat -f prompt.txt                 # Read prompt from file
```

## Linking as a global command

```bash
npm link
falcochat                             # Start conversation mode
falcochat "Hello!"                    # Conversation with initial prompt
falcochat -1 "What is 2+2?"          # Single prompt
```

## Available Models

See https://openrouter.ai/models for all available models.

## Environment Variables

- `OPENAI_API_KEY` - Your API key for any OpenAI-compatible provider (required)
- `OPENAI_API_URL` - API URL (default: `https://openrouter.ai/api/v1`)
  - OpenRouter: `https://openrouter.ai/api/v1`
  - OpenAI: `https://api.openai.com/v1`
  - Together AI: `https://api.together.xyz/v1`
  - Ollama: `http://localhost:11434/v1`
- `OPENAI_MODEL` - Default model (provider-specific, e.g., `gpt-3.5-turbo`)
  - Note: Tencent models (like `tencent/hy3-preview`) may respond in Chinese by default
  - Recommended: `openai/gpt-3.5-turbo`, `anthropic/claude-3-haiku`, etc.
- `OPENAI_SITE_NAME` - Site name (mainly for OpenRouter rankings)
- `OPENAI_SITE_URL` - Site URL (mainly for OpenRouter rankings)
