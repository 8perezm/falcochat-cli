#!/usr/bin/env node
// FalcoChat CLI - Interactive AI chat with OpenAI API-compatible providers

const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { program } = require('commander');

// Load environment variables
// Check global config first, then local
const os = require('os');
const globalEnvPath = path.join(os.homedir(), '.config', 'falcochat', '.env');
const globalConfigDir = path.join(os.homedir(), '.config', 'falcochat');
const configPath = path.join(globalConfigDir, 'config.json');
const localEnvPath = path.resolve('.env');

// Config management functions
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    // Ignore errors and return empty config
  }
  return {};
}

function saveConfig(config) {
  if (!fs.existsSync(globalConfigDir)) {
    fs.mkdirSync(globalConfigDir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

function getDefaultModel() {
  const config = loadConfig();
  return config.defaultModel || null;
}

async function validateAndSetModel(model) {
  try {
    console.log('Validating model...');
    const response = await fetch(`${apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': siteName,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.data || [];
    const modelExists = models.some(m => m.id === model);

    if (!modelExists) {
      console.error(`\n✗ Error: Model "${model}" not found.`);
      console.log('\nTo see available models, run:');
      console.log('  falcochat --list-models');
      console.log('\nExample valid models:');
      const examples = models.slice(0, 5);
      examples.forEach(m => console.log(`  - ${m.id}`));
      if (models.length > 5) {
        console.log(`  ... and ${models.length - 5} more`);
      }
      process.exit(1);
    }

    const config = loadConfig();
    config.defaultModel = model;
    saveConfig(config);
    console.log(`✓ Default model set to: ${model}`);
  } catch (error) {
    console.error('Error validating model:', error.message);
    process.exit(1);
  }
}

// Auto-create global config directory if it doesn't exist
if (!fs.existsSync(globalEnvPath)) {
  const globalConfigDir = path.dirname(globalEnvPath);
  if (!fs.existsSync(globalConfigDir)) {
    fs.mkdirSync(globalConfigDir, { recursive: true });
  }

  // Copy .env.example to global location - try multiple locations
  const possibleExamplePaths = [
    path.resolve(__dirname, '.env.example'),  // Relative to script
    path.join(__dirname, '.env.example'),        // For global install
    path.resolve('.env.example')                 // Current directory
  ];

  let copied = false;
  for (const examplePath of possibleExamplePaths) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, globalEnvPath);
      copied = true;
      break;
    }
  }

  if (copied) {
    console.log('✓ Created global config at:', globalEnvPath);
    console.log('Please edit it and add your API key');
  } else {
    console.log('Please create', globalEnvPath, 'with your API key');
  }
  process.exit(0);
}

// Try global config first (don't override system env vars)
if (fs.existsSync(globalEnvPath)) {
  dotenv.config({ path: globalEnvPath, quiet: true, override: false });
}

// Then load local .env (don't override system env vars or global config)
dotenv.config({ quiet: true, override: false });

// Get API key from environment
const apiKey = process.env.OPENAI_API_KEY;
// Priority: saved config > OPENAI_MODEL env var > default
const savedModel = getDefaultModel();
const model = savedModel || process.env.OPENAI_MODEL || 'openai/gpt-3.5-turbo';
const apiUrl = process.env.OPENAI_API_URL || 'https://openrouter.ai/api/v1';
const language = process.env.OPENAI_LANGUAGE; // Optional: language preference
const siteName = 'FalcoChat';
const siteUrl = 'https://falcochat.com';

// Check if API key is still the placeholder value
if (apiKey === 'your_api_key_here' || apiKey === '') {
  console.error('Error: OPENAI_API_KEY is not set or still contains placeholder value');
  console.error('Please edit', globalEnvPath, 'and replace "your_api_key_here" with your actual API key');
  console.error('Get your key from: https://openrouter.ai/keys (or your preferred provider)');
  process.exit(1);
}

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY is not set');
  console.error('Edit ~/.config/falcochat/.env and add your API key');
  console.error('Or create a local .env file in current directory');
  process.exit(1);
}

// Initialize OpenAI client with OpenRouter base URL
const client = new OpenAI({
  apiKey: apiKey,
  baseURL: apiUrl,
  defaultHeaders: {
    'HTTP-Referer': siteUrl,
    'X-Title': siteName,
  },
});

// Configure Commander.js
const packageJson = require('./package.json');
program
  .name('falcochat')
  .description('FalcoChat - Interactive AI chat with OpenAI API-compatible providers')
  .version(packageJson.version)
  .option('-m, --model <model>', 'Specify model', model)
  .option('--set-model <model>', 'Set default model for future sessions')
  .option('--list-models', 'List available models from the API')
  .option('-s, --stream', 'Stream the response')
  .option('-c, --conversation', 'Start interactive conversation mode (default)')
  .option('-1, --single', 'Send a single prompt (no conversation)')
  .option('-f, --file <path>', 'Read prompt from file')
  .allowUnknownOption()
  .addHelpText('after', `
Environment variables (loaded from ~/.config/falcochat/.env or ./.env):
  OPENAI_API_KEY        Your API key for any OpenAI-compatible provider
  OPENAI_API_URL         API URL (default: https://openrouter.ai/api/v1)
  OPENAI_MODEL           Default model (provider-specific, e.g. gpt-3.5-turbo)
  OPENAI_LANGUAGE        Language preference (optional, e.g., en, es, fr, de)
  OPENAI_SITE_NAME       Site name (mainly for OpenRouter rankings)
  OPENAI_SITE_URL        Site URL (mainly for OpenRouter rankings)

Examples:
  falcochat                             # Start conversation mode
  falcochat "What is 2+2?"             # Start conversation with initial prompt
  falcochat -s                         # Start streaming conversation
  falcochat -1 "What is 2+2?"          # Single prompt, no conversation
  falcochat -m "anthropic/claude-3-haiku" "Explain quantum"
  falcochat -f prompt.txt              # Load prompt from file
  falcochat --set-model "google/gemini-pro"  # Set default model
  falcochat --list-models              # List available models

Available models: https://openrouter.ai/models
`);

// Function to list available models
async function listModels() {
  try {
    console.log('Fetching available models from OpenRouter...\n');
    const response = await fetch(`${apiUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': siteName,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.data || [];

    if (models.length === 0) {
      console.log('No models found.');
      return;
    }

    console.log('Available models:\n');
    models.forEach((model, index) => {
      const pricing = model.pricing || {};
      const promptPrice = pricing.prompt ? `$${(pricing.prompt * 1000000).toFixed(2)}/1M tokens` : 'N/A';
      console.log(`${index + 1}. ${model.id}`);
      if (model.description) {
        console.log(`   ${model.description}`);
      }
      console.log(`   Pricing: ${promptPrice}`);
      console.log('');
    });

    console.log(`\nTotal: ${models.length} models`);
    console.log('Use: falcochat --set-model "<model-id>" to set a default model');
  } catch (error) {
    throw error;
  }
}

program.parse(process.argv);

const options = program.opts();
const prompt = program.args.join(' ');

// Ensure model is set correctly (priority: -m flag > saved config > env var > default)
if (!options.model) {
  options.model = model;
}

// Handle --set-model option
if (options.setModel) {
  validateAndSetModel(options.setModel).then(() => process.exit(0)).catch(() => process.exit(1));
  return;
}

// Handle --list-models option
if (options.listModels) {
  listModels().then(() => process.exit(0)).catch(err => {
    console.error('Error fetching models:', err.message);
    process.exit(1);
  });
  return;
}

// Determine if conversation mode is active
const isConversation = !options.single || options.conversation;
if (isConversation) {
  options.conversation = true;
}

async function chat(options) {
  console.log(`Using model: ${options.model}\n`);

  const messages = [];

  // Only add language preference if set in .env
  if (language) {
    messages.push({ role: 'system', content: `Please respond in ${language}.` });
  }

  messages.push({ role: 'user', content: options.prompt });

  const response = await client.chat.completions.create({
    model: options.model,
    messages: messages,
  });

  console.log(response.choices[0].message.content);
}

async function streamChat(options) {
  console.log(`Using model: ${options.model}\n`);

  const messages = [];

  // Only add language preference if set in .env
  if (language) {
    messages.push({ role: 'system', content: `Please respond in ${language}.` });
  }

  messages.push({ role: 'user', content: options.prompt });

  const stream = await client.chat.completions.create({
    model: options.model,
    messages: messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }
  process.stdout.write('\n');
}

async function conversationMode(options) {
  console.log(`Using model: ${options.model}\n`);

  const messages = [];

  // Only add language preference if set in .env
  if (language) {
    messages.push({ role: 'system', content: `Please respond in ${language}.` });
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Conversation mode started. Press Ctrl+C to exit.\n');

  const askQuestion = () => {
    return new Promise((resolve) => {
      rl.question('You: ', resolve);
    });
  };

  const sendMessage = async (content) => {
    messages.push({ role: 'user', content });

    try {
      if (options.stream) {
        process.stdout.write('AI: ');
        const stream = await client.chat.completions.create({
          model: options.model,
          messages: messages,
          stream: true,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          process.stdout.write(content);
          fullResponse += content;
        }
        process.stdout.write('\n\n');
        messages.push({ role: 'assistant', content: fullResponse });
      } else {
        const response = await client.chat.completions.create({
          model: options.model,
          messages: messages,
        });

        const aiResponse = response.choices[0].message.content;
        console.log('AI:', aiResponse);
        console.log();
        messages.push({ role: 'assistant', content: aiResponse });
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  // If initial prompt provided, send it first
  if (options.prompt) {
    await sendMessage(options.prompt);
  }

  // Main conversation loop
  try {
    while (true) {
      const userInput = await askQuestion();

      if (userInput.trim() === '') {
        continue;
      }

      await sendMessage(userInput);
    }
  } catch (error) {
    // Handle Ctrl+C or other errors
    console.log('\n\nExiting conversation mode.');
    rl.close();
    process.exit(0);
  }
}

async function main() {
  const prompt = program.args.join(' ');
  const options = {
    ...program.opts(),
    prompt: prompt || '',
  };

  try {
    if (options.conversation) {
      await conversationMode(options);
    } else if (options.stream) {
      await streamChat(options);
    } else {
      await chat(options);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
