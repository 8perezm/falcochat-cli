const { program } = require('commander');
const packageJson = require('../package.json');
const config = require('./config');
const models = require('./models');
const chat = require('./chat');

function setupCLI() {
    const savedModel = config.getDefaultModel();
    const defaultModel = savedModel || process.env.OPENAI_MODEL || 'openai/gpt-3.5-turbo';

    program
        .name('falcochat')
        .description('FalcoChat - Interactive AI chat with OpenAI API-compatible providers')
        .version(packageJson.version)
        .option('-m, --model <model>', 'Specify model', defaultModel)
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

    return program;
}

async function handleCommands(options, program) {
    const apiConfig = config.getApiConfig();

    // Handle --set-model option
    if (options.setModel) {
        await models.validateAndSetModel(
            options.setModel,
            apiConfig.apiUrl,
            apiConfig.apiKey,
            apiConfig.siteUrl,
            apiConfig.siteName
        );
        process.exit(0);
    }

    // Handle --list-models option
    if (options.listModels) {
        await models.listModels(
            apiConfig.apiUrl,
            apiConfig.apiKey,
            apiConfig.siteUrl,
            apiConfig.siteName
        );
        process.exit(0);
    }
}

function getPrompt(options, program) {
    const prompt = program.args.join(' ');

    // Read from file if -f option is used
    if (options.file) {
        const fs = require('fs');
        try {
            return fs.readFileSync(options.file, 'utf8');
        } catch (error) {
            console.error('Error reading file:', error.message);
            process.exit(1);
        }
    }

    return prompt;
}

async function main() {
    const program = setupCLI();
    program.parse(process.argv);

    const options = program.opts();
    const prompt = getPrompt(options, program);

    // Ensure config exists
    if (!config.ensureConfig()) {
        process.exit(0);
    }

    // Load environment variables
    config.loadEnv();

    // Get API config
    const apiConfig = config.getApiConfig();

    // Validate API key
    if (!config.validateApiKey(apiConfig.apiKey)) {
        process.exit(1);
    }

    // Handle special commands
    await handleCommands(options, program);

    // Ensure model is set correctly
    if (!options.model) {
        options.model = apiConfig.model;
    }

    // Determine if conversation mode is active
    const isConversation = !options.single || options.conversation;
    if (isConversation) {
        options.conversation = true;
    }

    // Create OpenAI client
    const client = chat.createClient(
        apiConfig.apiKey,
        apiConfig.apiUrl,
        apiConfig.siteName,
        apiConfig.siteUrl
    );

    const chatOptions = {
        client,
        model: options.model,
        language: apiConfig.language,
        prompt: prompt || '',
        stream: options.stream,
    };

    try {
        if (options.conversation) {
            await chat.conversationMode(chatOptions);
        } else if (options.stream) {
            await chat.streamChat(chatOptions);
        } else {
            await chat.chat(chatOptions);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

module.exports = {
    setupCLI,
    handleCommands,
    getPrompt,
    main,
};
