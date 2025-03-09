// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new TikTokIOConnection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

// Moderation settings
let showModerationResults = false;
// AI Response settings
let showAIResponses = false;
// Sound notification settings
let enableSoundNotifications = false;
// Notification settings
let enableMentionNotifications = true;
let enableModerationNotifications = true;
// User's own username (for mention notifications)
let yourUsername = '';
// AI provider settings
let aiProvider = 'openai';
let aiModel = '';
// Store available Ollama models
let availableOllamaModels = [];

// These settings are defined by obs.html
if (!window.settings) window.settings = {};

// Function to play notification sound for flagged comments
function playFlaggedCommentSound(force = false) {
    if (force || enableSoundNotifications) {
        const sound = document.getElementById('flaggedCommentSound');
        if (sound) {
            // Reset the sound to the beginning (in case it's already playing)
            sound.currentTime = 0;
            sound.play().catch(error => {
                // Handle autoplay issues (like Chrome requiring user interaction)
                console.warn('Erreur lors de la lecture du son de notification:', error);
            });
        }
    }
}

// Function to show notification when user is mentioned
function showMentionNotification(data, text) {
    if (!yourUsername || !enableMentionNotifications) return; // Skip if username not set or notifications disabled
    
    // Create notification element
    const notification = $(`
        <div class="notification mention">
            <div class="notification-title">Vous avez été mentionné par ${data.uniqueId}</div>
            <div class="notification-message">${sanitize(text)}</div>
        </div>
    `);
    
    // Add to notification container
    $('#notification-container').append(notification);
    
    // Play sound
    playFlaggedCommentSound(true);
    
    // Remove after animation completes (5 seconds)
    setTimeout(() => {
        notification.remove();
    }, 10000);
}

// Function to show notification for moderated content
function showModerationNotification(data, text, moderationResult) {
    if (!enableModerationNotifications) return; // Skip if notifications disabled
    
    // Get the reason for flagging
    let reason = '';
    if (moderationResult.categories) {
        for (const category in moderationResult.categories) {
            if (moderationResult.categories[category]) {
                reason += (reason ? ', ' : '') + category;
            }
        }
    }
    
    // Create notification element
    const notification = $(`
        <div class="notification moderation">
            <div class="notification-title">Contenu inapproprié détecté de ${data.uniqueId}</div>
            <div class="notification-message">${sanitize(text)}</div>
            <div class="notification-reason">Raison: ${reason || 'Non spécifiée'}</div>
        </div>
    `);
    
    // Add to notification container
    $('#notification-container').append(notification);
    
    // Play sound
    playFlaggedCommentSound(true);
    
    // Remove after animation completes
    setTimeout(() => {
        notification.remove();
    }, 10000);
}

$(document).ready(() => {
    $('#connectButton').click(connect);
    $('#uniqueIdInput').on('keyup', function (e) {
        if (e.key === 'Enter') {
            connect();
        }
    });
    
    // AI Provider Selection
    $('input[name="aiProvider"]').change(function() {
        aiProvider = $(this).val();
        
        // Show/hide the appropriate settings section
        if (aiProvider === 'openai') {
            $('#openaiSettings').show();
            $('#ollamaSettings').hide();
        } else if (aiProvider === 'ollama') {
            $('#openaiSettings').hide();
            $('#ollamaSettings').show();
        }
    });
    
    // Update username when input changes
    $('#yourUsernameInput').on('change', function() {
        yourUsername = $(this).val().trim().toLowerCase();
    });
    
    // Feature toggle handlers
    $('#showModerationToggle').on('change', function() {
        showModerationResults = $(this).is(':checked');
    });
    
    $('#showResponsesToggle').on('change', function() {
        showAIResponses = $(this).is(':checked');
    });
    
    $('#enableMentionNotification').on('change', function() {
        enableMentionNotifications = $(this).is(':checked');
    });
    
    $('#enableModerationNotification').on('change', function() {
        enableModerationNotifications = $(this).is(':checked');
    });
    
    $('#enableSoundToggle').on('change', function() {
        enableSoundNotifications = $(this).is(':checked');
    });
    
    // Initialize values from URL parameters (for OBS overlay)
    if (window.settings.showModeration !== undefined) {
        showModerationResults = !!window.settings.showModeration;
        $('#showModerationToggle').prop('checked', showModerationResults);
    }
    
    if (window.settings.showResponses !== undefined) {
        showAIResponses = !!window.settings.showResponses;
        $('#showResponsesToggle').prop('checked', showAIResponses);
    }
    
    if (window.settings.enableSound !== undefined) {
        enableSoundNotifications = !!window.settings.enableSound;
        $('#enableSoundToggle').prop('checked', enableSoundNotifications);
    }
    
    if (window.settings.enableMentionNotification !== undefined) {
        enableMentionNotifications = !!window.settings.enableMentionNotification;
        $('#enableMentionNotification').prop('checked', enableMentionNotifications);
    }
    
    if (window.settings.enableModerationNotification !== undefined) {
        enableModerationNotifications = !!window.settings.enableModerationNotification;
        $('#enableModerationNotification').prop('checked', enableModerationNotifications);
    }
    
    if (window.settings.yourUsername !== undefined) {
        yourUsername = window.settings.yourUsername;
        $('#yourUsernameInput').val(yourUsername);
    }
    
    // Handle Ollama model selection
    $('#ollamaModel').change(function() {
        aiModel = $(this).val();
    });
    
    // Save user's username when entered
    $('#yourUsernameInput').on('change', function() {
        yourUsername = $(this).val().trim();
        // Remove @ symbol if present
        if (yourUsername.startsWith('@')) {
            yourUsername = yourUsername.substring(1);
        }
        
        // Store in localStorage for convenience
        if (yourUsername) {
            localStorage.setItem('tiktokUsername', yourUsername);
        } else {
            localStorage.removeItem('tiktokUsername');
        }
    });
    
    // Load username from localStorage if available
    const savedUsername = localStorage.getItem('tiktokUsername');
    if (savedUsername) {
        $('#yourUsernameInput').val(savedUsername);
        yourUsername = savedUsername;
    }

    // Add moderation toggle to the page
    $('.inputFields').append(`
        <div style="margin-top: 10px;">
            <label>
                <input type="checkbox" id="showModerationToggle"> Afficher les résultats de modération
            </label>
        </div>
    `);

    // Add AI responses toggle to the page
    $('.inputFields').append(`
        <div style="margin-top: 10px;">
            <label>
                <input type="checkbox" id="showResponsesToggle"> Afficher les réponses suggérées par l'IA
            </label>
        </div>
    `);

    // Add sound notification toggle to the page
    $('.inputFields').append(`
        <div style="margin-top: 10px;">
            <label>
                <input type="checkbox" id="enableSoundToggle"> Jouer un son pour les commentaires signalés
            </label>
        </div>
    `);

    // Handle moderation toggle
    $('#showModerationToggle').change(function() {
        showModerationResults = $(this).is(':checked');
        if (showModerationResults) {
            $('body').addClass('show-moderation');
        } else {
            $('body').removeClass('show-moderation');
        }
    });

    // Handle AI responses toggle
    $('#showResponsesToggle').change(function() {
        showAIResponses = $(this).is(':checked');
        if (showAIResponses) {
            $('body').addClass('show-responses');
        } else {
            $('body').removeClass('show-responses');
        }
    });

    // Handle sound notification toggle
    $('#enableSoundToggle').change(function() {
        enableSoundNotifications = $(this).is(':checked');
        
        // Play a test sound when enabled
        if (enableSoundNotifications) {
            playFlaggedCommentSound();
        }
    });

    if (window.settings.username) connect();
    
    // Listen for Ollama models from the server
    connection.on('ollamaModels', (models) => {
        availableOllamaModels = models;
        
        // Populate the model dropdown
        const $modelSelect = $('#ollamaModel');
        $modelSelect.empty();
        
        if (models.length === 0) {
            $modelSelect.append('<option value="">Aucun modèle disponible</option>');
            $('.ollamaStatus').text('Aucun modèle trouvé sur le serveur Ollama ou serveur inaccessible').addClass('error');
        } else {
            // Add models to the dropdown
            models.forEach(model => {
                $modelSelect.append(`<option value="${model.name}">${model.name} (${model.details.parameter_size || 'Taille inconnue'})</option>`);
            });
            
            // Select the first model by default
            if (models.length > 0) {
                aiModel = models[0].name;
                $modelSelect.val(aiModel);
            }
            
            $('.ollamaStatus').text(`Connecté au serveur Ollama avec ${models.length} modèles disponibles`).removeClass('error').addClass('success');
        }
    });
})

function connect() {
    let uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {

        $('#stateText').text('Connexion en cours...');

        // Include AI provider settings in connection options
        const options = {
            enableExtendedGiftInfo: true,
            aiProvider: aiProvider,
            aiModel: aiModel
        };
        
        // Add OpenAI API key if OpenAI is selected and key is provided
        if (aiProvider === 'openai') {
            const openaiApiKey = $('#openaiApiKey').val();
            if (openaiApiKey) {
                options.openaiApiKey = openaiApiKey;
            }
        }

        connection.connect(uniqueId, options).then(state => {
            $('#stateText').text(`Connecté à la salle ${state.roomId}`);

            // reset stats
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateRoomStats();
            
            // Play a test sound on successful connection to verify it works
            playFlaggedCommentSound(true); // Force play the sound on connection

        }).catch(errorMessage => {
            $('#stateText').text(errorMessage);

            // schedule next try if obs username set
            if (window.settings.username) {
                setTimeout(() => {
                    connect(window.settings.username);
                }, 30000);
            }
        })

    } else {
        alert("Aucun nom d'utilisateur saisi");
    }
}

// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function updateRoomStats() {
    $('#roomStats').html(`Spectateurs: <b>${viewerCount.toLocaleString()}</b> J'aime: <b>${likeCount.toLocaleString()}</b> Diamants gagnés: <b>${diamondsCount.toLocaleString()}</b>`)
}

function generateUsernameLink(data) {
    return `<a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.uniqueId}</a>`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

/**
 * Add a new message to the chat container
 */
function addChatItem(color, data, text, summarize) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

    container.find('.temporary').remove();
    
    // Check if message mentions the user
    if (yourUsername && text) {
        // Check for @username pattern (case insensitive)
        const mentionRegex = new RegExp(`@${yourUsername}\\b`, 'i');
        if (mentionRegex.test(text)) {
            // Show notification and play sound
            showMentionNotification(data, text);
        }
    }

    // Create the main chat div
    let chatDiv = $(
        `<div class=${summarize ? 'temporary' : 'static'} data-msg-id="${data.msgId}">
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> 
                <span style="color:${color}">${sanitize(text)}</span>
                ${data.pendingModeration ? 
                    '<span class="moderation-toggle loading">[Modération <span class="loading-spinner"></span>]</span>' : 
                    (data.moderation ? '<span class="moderation-toggle">[Modération]</span>' : '')}
                ${data.pendingResponse ? 
                    '<span class="response-toggle loading">[Réponse IA <span class="loading-spinner"></span>]</span>' : 
                    (data.suggestedResponse ? '<span class="response-toggle">[Réponse IA]</span>' : '')}
            </span>
        </div>`
    );

    // Add moderation info if available
    if (data.moderation) {
        let moderationClass = data.moderation.flagged ? 'moderation-flagged' : 'moderation-safe';
        let moderationInfoDiv = $(`<div class="moderation-info ${moderationClass}"></div>`);
        
        // Add flagged status
        moderationInfoDiv.append(`<div><strong>${data.moderation.flagged ? 'SIGNALÉ' : 'SÛR'}</strong></div>`);
        
        // Add flagged categories if any
        if (data.moderation.flagged) {
            // Play notification sound for flagged comments
            playFlaggedCommentSound();
            
            // Show moderation notification if enabled
            if (enableModerationNotifications) {
                showModerationNotification(data, text, data.moderation);
            }
            
            // Add Ollama reason if available
            if (data.moderation.ollama_reason) {
                moderationInfoDiv.append(`<div class="moderation-reason"><strong>Raison:</strong> ${data.moderation.ollama_reason}</div>`);
            }
            
            // Add category information (for OpenAI moderation)
            let categoriesDiv = $('<div></div>');
            for (const [category, value] of Object.entries(data.moderation.categories)) {
                if (value) {
                    const score = data.moderation.category_scores[category].toFixed(2);
                    categoriesDiv.append(`<span class="moderation-category">${category}: ${score}</span>`);
                }
            }
            
            // Only append categories div if it has content
            if (categoriesDiv.children().length > 0) {
                moderationInfoDiv.append(categoriesDiv);
            }
        }
        
        chatDiv.append(moderationInfoDiv);
        
        // Add click handler for the moderation toggle
        chatDiv.find('.moderation-toggle').click(function(e) {
            e.preventDefault();
            moderationInfoDiv.toggle();
        });
    } else if (data.pendingModeration) {
        // Add empty placeholder for the moderation info
        let loadingDiv = $(`<div class="moderation-info" style="display:none;">
            <div class="loading-text">Analyse de modération en cours...</div>
        </div>`);
        chatDiv.append(loadingDiv);
    }

    // Add suggested response if available
    if (data.suggestedResponse) {
        let responseInfoDiv = $(`<div class="response-info"><strong>Réponse suggérée par l'IA :</strong> <p>${sanitize(data.suggestedResponse)}</p></div>`);
        chatDiv.append(responseInfoDiv);
        
        // Add click handler for the response toggle
        chatDiv.find('.response-toggle').click(function(e) {
            e.preventDefault();
            responseInfoDiv.toggle();
        });
    } else if (data.pendingResponse) {
        // Add empty placeholder for the response
        let loadingDiv = $(`<div class="response-info" style="display:none;">
            <div class="loading-text">Génération de la réponse IA en cours...</div>
        </div>`);
        chatDiv.append(loadingDiv);
    }

    container.append(chatDiv);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 400);
}

/**
 * Add a new gift to the gift container
 */
function addGiftItem(data) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.giftcontainer');

    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    let streakId = data.userId.toString() + '_' + data.giftId;

    let html = `
        <div data-streakid=${isPendingStreak(data) ? streakId : ''}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> <span>${data.describe}</span><br>
                <div>
                    <table>
                        <tr>
                            <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                            <td>
                                <span>Nom: <b>${data.giftName}</b> (ID:${data.giftId})<span><br>
                                <span>Répétition: <b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()}</b><span><br>
                                <span>Coût: <b>${(data.diamondCount * data.repeatCount).toLocaleString()} Diamants</b><span>
                            </td>
                        </tr>
                    </table>
                </div>
            </span>
        </div>
    `;

    let existingStreakItem = container.find(`[data-streakid='${streakId}']`);

    if (existingStreakItem.length) {
        existingStreakItem.replaceWith(html);
    } else {
        container.append(html);
    }

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}

// viewer stats
connection.on('roomUser', (msg) => {
    if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
})

// like stats
connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }

    if (window.settings.showLikes === "0") return;

    if (typeof msg.likeCount === 'number') {
        addChatItem('#447dd4', msg, msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} j'aime`))
    }
})

// Member join
let joinMsgDelay = 0;
connection.on('member', (msg) => {
    if (window.settings.showJoins === "0") return;

    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        addChatItem('#21b2c2', msg, 'a rejoint', true);
    }, joinMsgDelay);
})

// New chat comment received
connection.on('chat', (msg) => {
    if (window.settings.showChats === "0") return;

    addChatItem('', msg, msg.comment);
})

// Handle chat updates (moderation and suggested responses)
connection.on('chatUpdate', (update) => {
    if (window.settings.showChats === "0") return;
    
    const msgId = update.id;
    const chatDiv = $(`.chatcontainer div[data-msg-id="${msgId}"], .eventcontainer div[data-msg-id="${msgId}"]`);
    
    if (!chatDiv.length) return;
    
    if (update.type === 'moderation') {
        // Update moderation
        const moderationToggle = chatDiv.find('.moderation-toggle');
        if (moderationToggle.length) {
            // Replace loading indicator with regular moderation toggle
            moderationToggle.removeClass('loading');
            moderationToggle.html('[Modération]');
            
            // Remove any existing moderation info
            chatDiv.find('.moderation-info').remove();
            
            // Add moderation info if available
            if (update.data.moderation) {
                let moderationClass = update.data.moderation.flagged ? 'moderation-flagged' : 'moderation-safe';
                let moderationInfoDiv = $(`<div class="moderation-info ${moderationClass}"></div>`);
                
                // Add flagged status
                moderationInfoDiv.append(`<div><strong>${update.data.moderation.flagged ? 'SIGNALÉ' : 'SÛR'}</strong></div>`);
                
                // Add flagged categories if any
                if (update.data.moderation.flagged) {
                    // Play notification sound for flagged comments
                    playFlaggedCommentSound();
                    
                    // Show moderation notification if enabled
                    if (enableModerationNotifications) {
                        showModerationNotification(update.data, update.data.comment, update.data.moderation);
                    }
                    
                    // Add Ollama reason if available
                    if (update.data.moderation.ollama_reason) {
                        moderationInfoDiv.append(`<div class="moderation-reason"><strong>Raison:</strong> ${update.data.moderation.ollama_reason}</div>`);
                    }
                    
                    // Add category information (for OpenAI moderation)
                    let categoriesDiv = $('<div></div>');
                    for (const [category, value] of Object.entries(update.data.moderation.categories)) {
                        if (value) {
                            const score = update.data.moderation.category_scores[category].toFixed(2);
                            categoriesDiv.append(`<span class="moderation-category">${category}: ${score}</span>`);
                        }
                    }
                    
                    // Only append categories div if it has content
                    if (categoriesDiv.children().length > 0) {
                        moderationInfoDiv.append(categoriesDiv);
                    }
                }
                
                chatDiv.append(moderationInfoDiv);
                
                // Add click handler for the moderation toggle
                moderationToggle.click(function(e) {
                    e.preventDefault();
                    moderationInfoDiv.toggle();
                });
            } else {
                // No moderation, remove the toggle
                moderationToggle.remove();
            }
        }
    } else if (update.type === 'response') {
        // Update response
        const responseToggle = chatDiv.find('.response-toggle');
        if (responseToggle.length) {
            // Replace loading indicator with regular response toggle if there's a response
            if (update.data.suggestedResponse) {
                responseToggle.removeClass('loading');
                responseToggle.html('[Réponse IA]');
                
                // Remove any existing response info
                chatDiv.find('.response-info').remove();
                
                // Add suggested response
                let responseInfoDiv = $(`<div class="response-info"><strong>Réponse suggérée par l'IA :</strong> <p>${sanitize(update.data.suggestedResponse)}</p></div>`);
                chatDiv.append(responseInfoDiv);
                
                // Add click handler for the response toggle
                responseToggle.click(function(e) {
                    e.preventDefault();
                    responseInfoDiv.toggle();
                });
            } else {
                // No response, remove the toggle and info
                responseToggle.remove();
                chatDiv.find('.response-info').remove();
            }
        }
    }
})

// New gift received
connection.on('gift', (data) => {
    if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);
        updateRoomStats();
    }

    if (window.settings.showGifts === "0") return;

    addGiftItem(data);
})

// share, follow
connection.on('social', (data) => {
    if (window.settings.showFollows === "0") return;

    let color = data.displayType.includes('follow') ? '#ff005e' : '#2fb816';
    addChatItem(color, data, data.label.replace('{0:user}', ''));
})

connection.on('streamEnd', () => {
    $('#stateText').text('Le direct est terminé.');

    // schedule next try if obs username set
    if (window.settings.username) {
        setTimeout(() => {
            connect(window.settings.username);
        }, 30000);
    }
})