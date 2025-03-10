import { useState, useEffect } from 'react'

const ConnectionForm = ({ socket, connected, setConnected, settings, setSettings }) => {
  const [uniqueId, setUniqueId] = useState('')
  const [aiProvider, setAiProvider] = useState('openai')
  const [ollamaModel, setOllamaModel] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [ollamaStatus, setOllamaStatus] = useState('Vérification de la connexion au serveur Ollama...')
  const [ollamaModels, setOllamaModels] = useState([])

  useEffect(() => {
    if (!socket) return
    
    // Listen for connection status
    socket.on('connectStatus', (status) => {
      setConnected(status.success)
    })
    
    // Fetch Ollama models
    socket.emit('getOllamaModels')
    
    socket.on('ollamaModels', (data) => {
      if (data.success) {
        setOllamaModels(data.models)
        setOllamaStatus('Connecté au serveur Ollama.')
      } else {
        setOllamaStatus('Erreur de connexion au serveur Ollama: ' + data.error)
      }
    })
    
    return () => {
      socket.off('connectStatus')
      socket.off('ollamaModels')
    }
  }, [socket, setConnected])

  const handleConnect = () => {
    if (!uniqueId) {
      alert("Entrez un nom d'utilisateur")
      return
    }
    
    // The server expects uniqueId as the first parameter and options as the second
    socket.emit('setUniqueId', uniqueId, {
      ...settings,
      aiProvider,
      ollamaModel: aiProvider === 'ollama' ? ollamaModel : null,
      openaiApiKey: aiProvider === 'openai' ? openaiApiKey : null,
    })
  }

  const generateOverlay = () => {
    if (!uniqueId) {
      alert("Entrez un nom d'utilisateur")
      return
    }
    
    const { 
      showModeration, 
      showResponses, 
      enableSoundNotifications, 
      enableMentionNotification, 
      enableModerationNotification, 
      yourUsername 
    } = settings
    
    let url = `/obs.html?username=${uniqueId}&showLikes=1&showChats=1&showGifts=1&showFollows=1&showJoins=1&showModeration=${showModeration ? 1 : 0}&showResponses=${showResponses ? 1 : 0}&enableSound=${enableSoundNotifications ? 1 : 0}&bgColor=rgb(24,23,28)&fontColor=rgb(227,229,235)&fontSize=1.3em&aiProvider=${aiProvider}`
    
    if (aiProvider === 'ollama' && ollamaModel) {
      url += `&aiModel=${encodeURIComponent(ollamaModel)}`
    }
    
    if (aiProvider === 'openai' && openaiApiKey) {
      url += `&openaiApiKey=${encodeURIComponent(openaiApiKey)}`
    }
    
    if (enableMentionNotification) {
      url += `&enableMentionNotification=1`
    }
    
    if (enableModerationNotification) {
      url += `&enableModerationNotification=1`
    }
    
    if (yourUsername) {
      url += `&yourUsername=${encodeURIComponent(yourUsername)}`
    }
    
    window.open(url, '_blank')
  }

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="mb-6">
        <p className="mb-2">Entrez le <b>@nom d'utilisateur</b> d'une personne actuellement en direct :</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={uniqueId}
            onChange={(e) => setUniqueId(e.target.value)}
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Nom d'utilisateur"
          />
          <button 
            onClick={handleConnect}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md transition-colors"
            disabled={connected}
          >
            {connected ? 'Connecté' : 'Connecter'}
          </button>
          <button 
            onClick={generateOverlay}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Générer l'URL de superposition
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-2">Entrez <b>votre</b> nom d'utilisateur TikTok (pour recevoir des notifications quand vous êtes mentionné) :</p>
        <input 
          type="text" 
          value={settings.yourUsername}
          onChange={(e) => handleSettingChange('yourUsername', e.target.value)}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Votre nom d'utilisateur TikTok"
        />
      </div>

      {/* AI Provider Settings */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Fournisseur de Réponses IA</h3>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center">
            <input 
              type="radio" 
              name="aiProvider" 
              value="openai" 
              checked={aiProvider === 'openai'}
              onChange={() => setAiProvider('openai')}
              className="mr-2"
            /> 
            OpenAI
          </label>
          <label className="flex items-center">
            <input 
              type="radio" 
              name="aiProvider" 
              value="ollama" 
              checked={aiProvider === 'ollama'}
              onChange={() => setAiProvider('ollama')}
              className="mr-2"
            /> 
            Ollama
          </label>
        </div>
        
        {aiProvider === 'openai' ? (
          <div className="mb-4">
            <label htmlFor="openaiApiKey" className="block mb-1">Votre clé API OpenAI:</label>
            <input 
              type="password" 
              id="openaiApiKey"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="sk-..."
            />
            <p className="text-sm text-gray-400 mt-1">Utilisation du modèle GPT-4o-mini d'OpenAI</p>
            <p className="text-sm text-gray-400">
              Vous devez fournir votre propre clé API OpenAI. Vous pouvez en obtenir une sur <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">platform.openai.com/api-keys</a>.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <label htmlFor="ollamaModel" className="block mb-1">Sélectionnez un modèle Ollama :</label>
            <select 
              id="ollamaModel"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Choisir un modèle</option>
              {ollamaModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <p className={`text-sm mt-1 ${ollamaStatus.includes('Erreur') ? 'text-red-400' : 'text-gray-400'}`}>
              {ollamaStatus}
            </p>
            <p className="text-sm text-gray-400">Note : Tout contenu &lt;thinking&gt; du modèle sera filtré des réponses.</p>
          </div>
        )}
      </div>

      {/* Feature Settings */}
      <div className="p-4 bg-gray-700 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Paramètres des Fonctionnalités</h3>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.showModeration}
              onChange={(e) => handleSettingChange('showModeration', e.target.checked)}
              className="mr-2"
            /> 
            Activer la modération de contenu
          </label>
          <p className="text-sm text-gray-400 ml-6">Analyser les messages pour détecter le contenu inapproprié et afficher les détails de modération</p>
        </div>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={settings.showResponses}
              onChange={(e) => handleSettingChange('showResponses', e.target.checked)}
              className="mr-2"
            /> 
            Activer les réponses suggérées par l'IA
          </label>
          <p className="text-sm text-gray-400 ml-6">Générer des réponses automatiques aux messages</p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Notifications</h4>
          
          <div className="mb-2">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={settings.enableMentionNotification}
                onChange={(e) => handleSettingChange('enableMentionNotification', e.target.checked)}
                className="mr-2"
              /> 
              Notifications de mention d'utilisateur
            </label>
            <p className="text-sm text-gray-400 ml-6">Recevoir une notification lorsque votre nom d'utilisateur est mentionné</p>
          </div>
          
          <div className="mb-2">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={settings.enableModerationNotification}
                onChange={(e) => handleSettingChange('enableModerationNotification', e.target.checked)}
                className="mr-2"
              /> 
              Alertes de modération
            </label>
            <p className="text-sm text-gray-400 ml-6">Recevoir une notification pour les messages signalés</p>
          </div>
          
          <div>
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={settings.enableSoundNotifications}
                onChange={(e) => handleSettingChange('enableSoundNotifications', e.target.checked)}
                className="mr-2"
              /> 
              Activer les sons de notification
            </label>
            <p className="text-sm text-gray-400 ml-6">Jouer un son lors des notifications</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectionForm 