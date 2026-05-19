const fs = require('fs');
const path = require('path');
const os = require('os');
const dotenv = require('dotenv');

const globalConfigDir = path.join(os.homedir(), '.config', 'falcochat');
const configPath = path.join(globalConfigDir, 'config.json');
const globalEnvPath = path.join(globalConfigDir, '.env');

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

function setDefaultModel(model) {
    const config = loadConfig();
    config.defaultModel = model;
    saveConfig(config);
}

// Load environment variables
function loadEnv() {
    // Try global config first (don't override system env vars)
    if (fs.existsSync(globalEnvPath)) {
        dotenv.config({ path: globalEnvPath, quiet: true, override: false });
    }

    // Then load local .env from project root (don't override system env vars or global config)
    const projectRoot = path.join(__dirname, '..');
    const localEnvPath = path.join(projectRoot, '.env');
    if (fs.existsSync(localEnvPath)) {
        dotenv.config({ path: localEnvPath, quiet: true, override: false });
    }
}

// Check and setup initial config
function ensureConfig() {
    if (!fs.existsSync(globalEnvPath)) {
        if (!fs.existsSync(globalConfigDir)) {
            fs.mkdirSync(globalConfigDir, { recursive: true });
        }

        // Copy .env.example to global location - try multiple locations
        const projectRoot = path.join(__dirname, '..');
        const possibleExamplePaths = [
            path.join(projectRoot, '.env.example'),
            path.resolve('.env.example'),
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
        return false;
    }
    return true;
}

// Get API configuration
function getApiConfig() {
    const apiKey = process.env.OPENAI_API_KEY;
    const savedModel = getDefaultModel();
    const model = savedModel || process.env.OPENAI_MODEL || 'openai/gpt-3.5-turbo';
    const apiUrl = process.env.OPENAI_API_URL || 'https://openrouter.ai/api/v1';
    const language = process.env.OPENAI_LANGUAGE;
    const siteName = process.env.OPENAI_SITE_NAME || 'FalcoChat';
    const siteUrl = process.env.OPENAI_SITE_URL || 'https://falcochat.com';

    return { apiKey, model, apiUrl, language, siteName, siteUrl };
}

// Validate API key
function validateApiKey(apiKey) {
    if (apiKey === 'your_api_key_here' || apiKey === '') {
        console.error('Error: OPENAI_API_KEY is not set or still contains placeholder value');
        console.error('Please edit', globalEnvPath, 'and replace "your_api_key_here" with your actual API key');
        console.error('Get your key from: https://openrouter.ai/keys (or your preferred provider)');
        return false;
    }

    if (!apiKey) {
        console.error('Error: OPENAI_API_KEY is not set');
        console.error('Edit ~/.config/falcochat/.env and add your API key');
        console.error('Or create a local .env file in current directory');
        return false;
    }

    return true;
}

module.exports = {
    loadConfig,
    saveConfig,
    getDefaultModel,
    setDefaultModel,
    loadEnv,
    ensureConfig,
    getApiConfig,
    validateApiKey,
    globalConfigDir,
    configPath,
    globalEnvPath,
};
