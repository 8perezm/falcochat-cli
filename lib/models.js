async function listModels(apiUrl, apiKey, siteUrl, siteName) {
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

async function validateAndSetModel(model, apiUrl, apiKey, siteUrl, siteName) {
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

        const config = require('./config');
        config.setDefaultModel(model);
        console.log(`✓ Default model set to: ${model}`);
    } catch (error) {
        console.error('Error validating model:', error.message);
        process.exit(1);
    }
}

module.exports = {
    listModels,
    validateAndSetModel,
};
