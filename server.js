require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const { clientBlocked } = require('./limiter');
const { OpenAI } = require('openai');
const axios = require('axios');

const app = express();
const httpServer = createServer(app);

// Default Ollama settings
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Enable cross origin resource sharing
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

// Function to get available Ollama models
async function getOllamaModels() {
    try {
        const response = await axios.get(`${OLLAMA_HOST}/api/tags`);
        return response.data.models || [];
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        return [];
    }
}

// Function to moderate text using OpenAI
async function moderateText(text, apiKey = null) {
    try {
        // Use provided API key or fall back to environment variable
        const openaiClient = apiKey ? 
            new OpenAI({ apiKey }) : 
            openai;
            
        const response = await openaiClient.moderations.create({
            model: "text-moderation-latest",
            input: text,
        });
        
        return response.results[0];
    } catch (error) {
        console.error('Error during OpenAI moderation:', error);
        return null;
    }
}

// Function to moderate text using Ollama
async function moderateTextWithOllama(text, model = 'llama3') {
    try {
        const moderationPrompt = `
You are a content moderation system. Analyze the following message and determine if it contains harmful content.
Please respond in XML format using these tags:
<flagged>true/false</flagged>
<reason>Specify the reason if flagged, such as: harassment, hate_speech, sexual, violence, self_harm, illegal_activity</reason>
<score>0.0 to 1.0 indicating severity</score>

Message to moderate: "${text}"
`;

        const response = await axios.post(`${OLLAMA_HOST}/v1/chat/completions`, {
            model: model,
            messages: [
                { role: "user", content: moderationPrompt }
            ],
            max_tokens: 200,
            temperature: 0.1,
        });
        
        const content = response.data.choices[0].message.content;
        
        // Parse XML response
        const flaggedMatch = content.match(/<flagged>(true|false)<\/flagged>/i);
        const reasonMatch = content.match(/<reason>(.*?)<\/reason>/i);
        const scoreMatch = content.match(/<score>(.*?)<\/score>/i);
        
        const flagged = flaggedMatch ? flaggedMatch[1].toLowerCase() === 'true' : false;
        const reason = reasonMatch ? reasonMatch[1] : '';
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.0;
        
        // Create a response format similar to OpenAI's moderation
        return {
            flagged: flagged,
            categories: {
                harassment: reason.includes('harassment'),
                hate: reason.includes('hate'),
                sexual: reason.includes('sexual'),
                violence: reason.includes('violence'),
                self_harm: reason.includes('self_harm'),
                illegal: reason.includes('illegal')
            },
            category_scores: {
                harassment: reason.includes('harassment') ? score : 0,
                hate: reason.includes('hate') ? score : 0,
                sexual: reason.includes('sexual') ? score : 0,
                violence: reason.includes('violence') ? score : 0,
                self_harm: reason.includes('self_harm') ? score : 0,
                illegal: reason.includes('illegal') ? score : 0
            },
            ollama_reason: reason
        };
    } catch (error) {
        console.error('Error during Ollama moderation:', error);
        return null;
    }
}

const systemPrompt = `
Vous êtes un assistant qui réponds au chat en direct TikTok.
Vous recevrez des commentaires du chat provenant du canal en direct. Pour chaque nouvelle mise à jour du chat, vous repondrez.
Pour le nom d'utilisateur, assurez-vous de le dire d'une façon facile à prononcer.
Pour les smileys ou les emojis, prononce les simplement. un seul par message, sinon, c'est trop long.
ne dis pas plusieurs emojis par messages. c'est trop long.
Si il y a des fautes d'orthographe ou des fautes des frappes dans le message, corrige les dans ta réponse.
Si le commentaire est une question, tu réponds par une phrase courte et concise.
Si le commentaire est faux, contredit le.
Essaye de reconnaitre le sarcasme et la critique des religions.
Defends la declaration universelle des droits de l'homme, le progressisme.
Tu combats les discriminations, les racismes, les sexismes, les agissements de nature homophobe, transphobe, etc.
`;

// Function to generate a suggested response using Ollama
async function generateResponseWithOllama(text, model = 'llama3') {
    try {
        const response = await axios.post(`${OLLAMA_HOST}/v1/chat/completions`, {
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });
        
        let content = response.data.choices[0].message.content;
        
        // Remove thinking tags and their content
        content = removeThinkingContent(content);
        
        return content;
    } catch (error) {
        console.error('Error generating response with Ollama:', error);
        return null;
    }
}

// Helper function to remove content within <thinking> tags
function removeThinkingContent(text) {
    if (!text) return text;
    
    const originalText = text;
    
    // Remove all content between <thinking> and </thinking> tags (case insensitive)
    let processed = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    
    // Also handle other common thinking tag variants
    processed = processed.replace(/<think>[\s\S]*?<\/think>/gi, '');
    processed = processed.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    processed = processed.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
    
    // Clean up any leftover empty lines and extra spaces
    processed = processed.replace(/\n\s*\n+/g, '\n\n');
    
    // Log if thinking content was removed
    if (processed.length !== originalText.length) {
        console.log('Removed thinking content from Ollama response');
    }
    
    return processed.trim();
}

// Function to generate a suggested response using GPT-4o-mini
async function generateResponseWithOpenAI(text, apiKey = null) {
    try {
        // Use provided API key or fall back to environment variable
        const openaiClient = apiKey ? 
            new OpenAI({ apiKey }) : 
            openai;
            
        const response = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });
        
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error generating response with OpenAI:', error);
        return null;
    }
}

// Main function to generate a response using the selected provider
async function generateResponse(text, provider = 'openai', model = null, apiKey = null) {
    if (provider === 'ollama' && model) {
        return generateResponseWithOllama(text, model);
    } else {
        return generateResponseWithOpenAI(text, apiKey);
    }
}

io.on('connection', (socket) => {
    let tiktokConnectionWrapper;

    console.info('New connection from origin', socket.handshake.headers['origin'] || socket.handshake.headers['referer']);

    // Send available Ollama models to the client
    getOllamaModels().then(models => {
        socket.emit('ollamaModels', models);
    }).catch(error => {
        console.error('Error sending Ollama models:', error);
    });

    socket.on('setUniqueId', (uniqueId, options) => {

        // Prohibit the client from specifying these options (for security reasons)
        if (typeof options === 'object' && options) {
            delete options.requestOptions;
            delete options.websocketOptions;
            
            // Store AI provider settings in the socket object
            socket.aiProvider = options.aiProvider || 'openai';
            socket.aiModel = options.aiModel || null;
            
            // Store OpenAI API key if provided
            if (options.openaiApiKey) {
                socket.openaiApiKey = options.openaiApiKey;
                console.log('Client provided OpenAI API key');
            }
            
            console.log(`Client using AI provider: ${socket.aiProvider}${socket.aiModel ? ', model: ' + socket.aiModel : ''}`);
        } else {
            options = {};
            socket.aiProvider = 'openai';
            socket.aiModel = null;
        }

        // Session ID in .env file is optional
        if (process.env.SESSIONID) {
            options.sessionId = process.env.SESSIONID;
            console.info('Using SessionId');
        }

        // Check if rate limit exceeded
        if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
            socket.emit('tiktokDisconnected', 'You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
            return;
        }

        // Connect to the given username (uniqueId)
        try {
            tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
            tiktokConnectionWrapper.connect();
        } catch (err) {
            socket.emit('tiktokDisconnected', err.toString());
            return;
        }

        // Redirect wrapper control events once
        tiktokConnectionWrapper.once('connected', state => socket.emit('tiktokConnected', state));
        tiktokConnectionWrapper.once('disconnected', reason => socket.emit('tiktokDisconnected', reason));

        // Notify client when stream ends
        tiktokConnectionWrapper.connection.on('streamEnd', () => socket.emit('streamEnd'));

        // Redirect message events
        tiktokConnectionWrapper.connection.on('roomUser', msg => socket.emit('roomUser', msg));
        tiktokConnectionWrapper.connection.on('member', msg => socket.emit('member', msg));
        
        // Handle chat messages with moderation
        tiktokConnectionWrapper.connection.on('chat', async (msg) => {
            // Send message immediately
            const initialMsg = { ...msg, pendingModeration: true, pendingResponse: true };
            socket.emit('chat', initialMsg);
            
            // Apply moderation to comment based on provider
            if (msg.comment) {                
                if (socket.aiProvider === 'ollama' && socket.aiModel) {
                    const moderationResult = await moderateTextWithOllama(msg.comment, socket.aiModel);
                    if (moderationResult) {
                        msg.moderation = moderationResult;
                        console.log('Moderation result');
                        
                        // Log flagged content to server console
                        if (moderationResult.flagged) {
                            console.log('\nFlagged comment (Ollama):', msg.comment);
                            console.log('Reason:', moderationResult.ollama_reason);
                        }
                    } else {
                        console.log('No moderation result');
                    }
                } else if (socket.openaiApiKey || process.env.OPENAI_API_KEY) {
                    const moderationResult = await moderateText(msg.comment, socket.openaiApiKey || process.env.OPENAI_API_KEY);
                    if (moderationResult) {
                        msg.moderation = moderationResult;
                        
                        // Log flagged content to server console
                        if (moderationResult.flagged) {
                            console.log('\nFlagged comment (OpenAI):', msg.comment);
                            console.log('Flagged categories:');
                            for (const [category, value] of Object.entries(moderationResult.categories)) {
                                if (value) {
                                    console.log(`${category}: ${moderationResult.category_scores[category].toFixed(3)}`);
                                }
                            }
                        }
                    }
                }
                
                // Send moderation update
                msg.pendingModeration = false;
                socket.emit('chatUpdate', { id: msg.msgId, type: 'moderation', data: msg });
            }
            
            // Generate a suggested response using the selected provider and model
            try {
                console.log(msg);
                let theMessage=msg.nickname + ' à dit : "' + msg.comment + '"';
                // if msg comment start with @[username] make nickname à écrit à [username] : comment
                if (msg.comment.startsWith('@')) {
                    const username = msg.comment.slice(1);
                    theMessage = msg.nickname + ' à écrit à ' + username + ' : ' + msg.comment;
                }
                const suggestedResponse = await generateResponse(
                    theMessage, 
                    socket.aiProvider, 
                    socket.aiModel, 
                    socket.openaiApiKey || process.env.OPENAI_API_KEY
                );
                if (suggestedResponse) {
                    msg.suggestedResponse = suggestedResponse;
                }
            } catch (error) {
                console.error('Error generating response:', error);
            }
            
            // Send response update
            msg.pendingResponse = false;
            socket.emit('chatUpdate', { id: msg.msgId, type: 'response', data: msg });
        });
        
        tiktokConnectionWrapper.connection.on('gift', msg => socket.emit('gift', msg));
        tiktokConnectionWrapper.connection.on('social', msg => socket.emit('social', msg));
        tiktokConnectionWrapper.connection.on('like', msg => socket.emit('like', msg));
        tiktokConnectionWrapper.connection.on('questionNew', msg => socket.emit('questionNew', msg));
        tiktokConnectionWrapper.connection.on('linkMicBattle', msg => socket.emit('linkMicBattle', msg));
        tiktokConnectionWrapper.connection.on('linkMicArmies', msg => socket.emit('linkMicArmies', msg));
        tiktokConnectionWrapper.connection.on('liveIntro', msg => socket.emit('liveIntro', msg));
        tiktokConnectionWrapper.connection.on('emote', msg => socket.emit('emote', msg));
        tiktokConnectionWrapper.connection.on('envelope', msg => socket.emit('envelope', msg));
        tiktokConnectionWrapper.connection.on('subscribe', msg => socket.emit('subscribe', msg));
    });

    socket.on('disconnect', () => {
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }
    });
});

// Emit global connection statistics
setInterval(() => {
    io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
}, 2000)

// Serve frontend files
app.use(express.static('public'));

// Start http listener
const port = process.env.PORT || 8081;
httpServer.listen(port);
console.info(`Server running! Please visit http://localhost:${port}`);