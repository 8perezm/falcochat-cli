const { OpenAI } = require('openai');
const config = require('./config');

function createClient(apiKey, apiUrl, siteName, siteUrl) {
    return new OpenAI({
        apiKey: apiKey,
        baseURL: apiUrl,
        defaultHeaders: {
            'HTTP-Referer': siteUrl,
            'X-Title': siteName,
        },
    });
}

function buildMessages(prompt, language) {
    const messages = [];

    // Only add language preference if set in .env
    if (language) {
        messages.push({ role: 'system', content: `Please respond in ${language}.` });
    }

    messages.push({ role: 'user', content: prompt });
    return messages;
}

async function chat(options) {
    const { client, model, language, prompt } = options;
    console.log(`Using model: ${model}\n`);

    const messages = buildMessages(prompt, language);

    const response = await client.chat.completions.create({
        model: model,
        messages: messages,
    });

    console.log(response.choices[0].message.content);
}

async function streamChat(options) {
    const { client, model, language, prompt } = options;
    console.log(`Using model: ${model}\n`);

    const messages = buildMessages(prompt, language);

    const stream = await client.chat.completions.create({
        model: model,
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
    const { client, model, language, prompt } = options;
    console.log(`Using model: ${model}\n`);

    const messages = [];

    // Only add language preference if set in .env
    if (language) {
        messages.push({ role: 'system', content: `Please respond in ${language}.` });
    }

    const readline = require('readline');
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
                    model: model,
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
                    model: model,
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
    if (prompt) {
        await sendMessage(prompt);
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

module.exports = {
    createClient,
    chat,
    streamChat,
    conversationMode,
};
