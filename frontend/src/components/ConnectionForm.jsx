import { useState, useEffect } from 'react';

function ConnectionForm({ connect, settings, updateSettings }) {
  const [uniqueId, setUniqueId] = useState('');
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaStatus, setOllamaStatus] = useState('Vérification de la connexion au serveur Ollama...');

  useEffect(() => {
    // Check Ollama connection and fetch available models
    fetch('/api/ollama/models')
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setOllamaStatus('Impossible de se connecter au serveur Ollama. Veuillez vérifier qu\'il est en cours d\'exécution.');
        } else {
          setOllamaModels(data.models || []);
          setOllamaStatus(data.models?.length > 0 
            ? `Connecté au serveur Ollama - ${data.models.length} modèles disponibles` 
            : 'Connecté au serveur Ollama - Aucun modèle disponible');
        }
      })
      .catch(() => {
        setOllamaStatus('Impossible de se connecter au serveur Ollama. Veuillez vérifier qu\'il est en cours d\'exécution.');
      });
  }, []);

  const handleConnect = () => {
    connect(uniqueId);
  };

  const handleSettingChange = (key, value) => {
    updateSettings({ [key]: value });
  };

  const generateOverlay = () => {
    if (!uniqueId) {
      alert("Entrez un nom d'utilisateur");
      return;
    }

    const showModeration = settings.showModeration ? 1 : 0;
    const showResponses = settings.showResponses ? 1 : 0;
    const enableSound = settings.enableSoundNotifications ? 1 : 0;
    const enableMentionNotification = settings.enableMentionNotification ? 1 : 0;
    const enableModerationNotification = settings.enableModerationNotification ? 1 : 0;
    
    let url = `/obs.html?username=${uniqueId}&showLikes=1&showChats=1&showGifts=1&showFollows=1&showJoins=1&showModeration=${showModeration}&showResponses=${showResponses}&enableSound=${enableSound}&bgColor=rgb(24,23,28)&fontColor=rgb(227,229,235)&fontSize=1.3em&aiProvider=${settings.aiProvider}`;
    
    // Add model parameter if Ollama is selected
    if (settings.aiProvider === 'ollama' && settings.aiModel) {
      url += `&aiModel=${encodeURIComponent(settings.aiModel)}`;
    }
    
    // Add OpenAI API key if OpenAI is selected and key is provided
    if (settings.aiProvider === 'openai' && settings.openaiApiKey) {
      url += `&openaiApiKey=${encodeURIComponent(settings.openaiApiKey)}`;
    }
    
    // Add notifications settings
    if (enableMentionNotification) {
      url += `&enableMentionNotification=1`;
    }
    
    if (enableModerationNotification) {
      url += `&enableModerationNotification=1`;
    }
    
    // Add the user's username for mentions if provided
    if (settings.yourUsername) {
      url += `&yourUsername=${encodeURIComponent(settings.yourUsername)}`;
    }

    window.open(url, '_blank');
  };

  return (
    <div className="input-fields">
      <p>Entrez le <b>@nom d'utilisateur</b> d'une personne actuellement en direct :</p>
      <input 
        type="text" 
        value={uniqueId} 
        onChange={(e) => setUniqueId(e.target.value)} 
      />
      <button onClick={handleConnect}>Connecter</button>
      <a href="#" onClick={generateOverlay}>Générer l'URL de superposition</a>
      
      <p>Entrez <b>votre</b> nom d'utilisateur TikTok (pour recevoir des notifications quand vous êtes mentionné) :</p>
      <input 
        type="text" 
        placeholder="Votre nom d'utilisateur TikTok" 
        value={settings.yourUsername}
        onChange={(e) => handleSettingChange('yourUsername', e.target.value)}
      />
      
      {/* AI Provider Selection */}
      <div className="ai-settings">
        <h3>Fournisseur de Réponses IA</h3>
        <div className="provider-selection">
          <label>
            <input 
              type="radio" 
              name="aiProvider" 
              value="openai" 
              checked={settings.aiProvider === 'openai'} 
              onChange={() => handleSettingChange('aiProvider', 'openai')}
            /> 
            OpenAI
          </label>
          <label>
            <input 
              type="radio" 
              name="aiProvider" 
              value="ollama" 
              checked={settings.aiProvider === 'ollama'} 
              onChange={() => handleSettingChange('aiProvider', 'ollama')}
            /> 
            Ollama
          </label>
        </div>
        
        {/* OpenAI Settings */}
        {settings.aiProvider === 'openai' && (
          <div className="provider-settings">
            <label htmlFor="openaiApiKey">Votre clé API OpenAI:</label>
            <input 
              type="password" 
              id="openaiApiKey" 
              placeholder="sk-..." 
              value={settings.openaiApiKey}
              onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)}
            />
            <p className="info-text">Utilisation du modèle GPT-4o-mini d'OpenAI</p>
            <p className="info-text">
              Vous devez fournir votre propre clé API OpenAI. Vous pouvez en obtenir une sur <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com/api-keys</a>.
            </p>
          </div>
        )}
        
        {/* Ollama Settings */}
        {settings.aiProvider === 'ollama' && (
          <div className="provider-settings">
            <label htmlFor="ollamaModel">Sélectionnez un modèle Ollama :</label>
            <select 
              id="ollamaModel" 
              value={settings.aiModel}
              onChange={(e) => handleSettingChange('aiModel', e.target.value)}
            >
              <option value="">Sélectionnez un modèle</option>
              {ollamaModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <p className="info-text ollamaStatus">{ollamaStatus}</p>
            <p className="info-text">Note : Tout contenu <code>&lt;thinking&gt;</code> du modèle sera filtré des réponses.</p>
          </div>
        )}
      </div>

      {/* Feature Toggles */}
      <div className="feature-settings">
        <h3>Paramètres des Fonctionnalités</h3>
        
        {/* Moderation Toggle */}
        <div className="feature-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={settings.showModeration}
              onChange={(e) => handleSettingChange('showModeration', e.target.checked)}
            /> 
            Activer la modération de contenu
          </label>
          <p className="info-text">Analyser les messages pour détecter le contenu inapproprié et afficher les détails de modération</p>
        </div>
        
        {/* AI Responses Toggle */}
        <div className="feature-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={settings.showResponses}
              onChange={(e) => handleSettingChange('showResponses', e.target.checked)}
            /> 
            Activer les réponses suggérées par l'IA
          </label>
          <p className="info-text">Générer des réponses automatiques aux messages</p>
        </div>
        
        {/* Notifications Settings */}
        <div className="notification-settings">
          <h4>Notifications</h4>
          
          {/* Username Mention Notification Toggle */}
          <div className="feature-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={settings.enableMentionNotification}
                onChange={(e) => handleSettingChange('enableMentionNotification', e.target.checked)}
              /> 
              Notifications de mention d'utilisateur
            </label>
            <p className="info-text">Recevoir une notification lorsque votre nom d'utilisateur est mentionné</p>
          </div>
          
          {/* Moderation Alert Notification Toggle */}
          <div className="feature-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={settings.enableModerationNotification}
                onChange={(e) => handleSettingChange('enableModerationNotification', e.target.checked)}
              /> 
              Alertes de modération
            </label>
            <p className="info-text">Recevoir une notification pour les messages signalés</p>
          </div>
          
          {/* Sound Notification Toggle */}
          <div className="feature-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={settings.enableSoundNotifications}
                onChange={(e) => handleSettingChange('enableSoundNotifications', e.target.checked)}
              /> 
              Activer les sons de notification
            </label>
            <p className="info-text">Jouer un son lors des notifications</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectionForm; 