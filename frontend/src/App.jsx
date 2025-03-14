import { useState, useEffect, useRef } from 'react'
import './App.css'
import TikTokConnection from './utils/TikTokConnection'
import flvjs from 'flv.js'

function App() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  
  // Counters
  const [viewerCount, setViewerCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [diamondsCount, setDiamondsCount] = useState(0)
  
  // Chat & gifts state
  const [chatMessages, setChatMessages] = useState([])
  const [gifts, setGifts] = useState([])
  
  // AI response state
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false)
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  
  // Settings
  const [showModeration, setShowModeration] = useState(false)
  const [showAIResponses, setShowAIResponses] = useState(false)
  const [enableSoundNotifications, setEnableSoundNotifications] = useState(false)
  const [enableMentionNotifications, setEnableMentionNotifications] = useState(true)
  const [yourUsername, setYourUsername] = useState('')
  const [aiProvider, setAiProvider] = useState('openai')
  const [aiModel, setAiModel] = useState('')
  const [darkTheme, setDarkTheme] = useState(true)
  const [enableFlvStream, setEnableFlvStream] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  
  // User lists
  const [friendsList, setFriendsList] = useState([])
  const [undesirablesList, setUndesirablesList] = useState([])
  
  // Moderation stats
  const [moderationStats, setModerationStats] = useState({
    total: 0,
    flagged: 0,
    safe: 0,
    categories: {
      harassment: 0,
      hate: 0,
      sexual: 0,
      violence: 0,
      self_harm: 0,
      illegal: 0
    }
  })
  
  // Notifications state
  const [notifications, setNotifications] = useState([])
  
  // Refs
  const connectionRef = useRef(null)
  const chatContainerRef = useRef(null)
  const videoPlayerRef = useRef(null)
  const flvPlayerRef = useRef(null)
  const flaggedCommentSoundRef = useRef(null)
  
  // Initialize connection
  useEffect(() => {
    // With the proxy configuration, we can connect to the same origin
    // If running from file://, use the demo backend
    const backendUrl = location.protocol === 'file:' 
      ? "https://tiktok-chat-reader.zerody.one/" 
      : undefined; // Will connect to same origin, proxied to port 8081
    connectionRef.current = new TikTokConnection(backendUrl);
    
    // Load settings from localStorage
    const loadSetting = (key, stateSetter, defaultValue = null) => {
      const savedValue = localStorage.getItem(key);
      if (savedValue !== null) {
        try {
          if (typeof defaultValue === 'boolean') {
            // Handle boolean values
            stateSetter(savedValue === 'true');
          } else {
            // Handle other values
            stateSetter(savedValue);
          }
        } catch (e) {
          console.error(`Error loading setting ${key}:`, e);
        }
      }
    };
    
    // Load all settings
    loadSetting('darkTheme', setDarkTheme, true);
    loadSetting('showModeration', setShowModeration, false);
    loadSetting('showAIResponses', setShowAIResponses, false);
    loadSetting('enableSoundNotifications', setEnableSoundNotifications, false);
    loadSetting('enableMentionNotifications', setEnableMentionNotifications, true);
    loadSetting('enableFlvStream', setEnableFlvStream, true);
    loadSetting('tiktokUsername', setYourUsername, '');
    loadSetting('openaiApiKey', setOpenaiApiKey, '');
    loadSetting('aiProvider', setAiProvider, 'openai');
    loadSetting('aiModel', setAiModel, '');
    loadSetting('autoScroll', setAutoScroll, true);
    
    // Load user lists from localStorage
    const loadedFriends = localStorage.getItem('friendsList')
    const loadedUndesirables = localStorage.getItem('undesirablesList')
    
    if (loadedFriends) {
      try {
        setFriendsList(JSON.parse(loadedFriends))
      } catch (e) {
        console.error('Error loading friends list', e)
      }
    }
    
    if (loadedUndesirables) {
      try {
        setUndesirablesList(JSON.parse(loadedUndesirables))
      } catch (e) {
        console.error('Error loading undesirables list', e)
      }
    }
    
    // Initialize sound
    flaggedCommentSoundRef.current = new Audio('https://www.soundjay.com/misc/small-bell-ring-01a.mp3')
    
    return () => {
      // Cleanup
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy()
      }
    }
  }, [])
  
  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current && autoScroll) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, autoScroll])
  
  // Connect to TikTok LIVE
  const connect = async () => {
    if (!username) {
      setError('Please enter a username')
      return
    }
    
    setIsConnecting(true)
    setError('')
    
    try {
      await connectionRef.current.connect(username, {
        enableExtendedGiftInfo: true
      })
      
      setIsConnected(true)
      setupEventListeners()
      
      if (enableFlvStream && flvjs.isSupported()) {
        initializeVideoPlayer()
      }
    } catch (err) {
      setError(`Connection failed: ${err}`)
    } finally {
      setIsConnecting(false)
    }
  }
  
  const disconnect = () => {
    if (flvPlayerRef.current) {
      flvPlayerRef.current.destroy()
      flvPlayerRef.current = null
    }
    
    // This would ideally call a disconnect method on the connection
    // but we'll just reset state for now
    setIsConnected(false)
    setChatMessages([])
    setGifts([])
    setViewerCount(0)
    setLikeCount(0)
    setDiamondsCount(0)
  }
  
  const setupEventListeners = () => {
    const conn = connectionRef.current
    
    // Viewer stats
    conn.on('roomUser', (data) => {
      setViewerCount(data.viewerCount)
    })
    
    conn.on('like', (data) => {
      setLikeCount(prevCount => prevCount + data.likeCount)
    })
    
    conn.on('gift', (data) => {
      if (data.diamondCount > 0) {
        setDiamondsCount(prevCount => prevCount + data.diamondCount)
      }
      
      // Add gift to the list
      setGifts(prevGifts => {
        const newGifts = [...prevGifts, data]
        // Keep only the most recent 200 gifts
        if (newGifts.length > 200) {
          return newGifts.slice(newGifts.length - 200)
        }
        return newGifts
      })
    })
    
    // Chat messages
    conn.on('chat', (data) => {
      const userStatus = checkUserStatus(data)
      
      // Generate AI response if enabled
      let aiResponsePromise = null;
      if (showAIResponses) {
        aiResponsePromise = generateAIResponse(data.comment);
        data.pendingResponse = true;
      }
      
      // Apply moderation if enabled
      if (showModeration) {
        // In a real app, you'd make an API call to a moderation service here
        // For demo, we'll just add a mock moderation result
        const mockModerationResult = {
          flagged: Math.random() < 0.1, // 10% chance of being flagged
          categories: {
            harassment: Math.random() < 0.05,
            hate: Math.random() < 0.03,
            sexual: Math.random() < 0.02,
            violence: Math.random() < 0.04,
            self_harm: Math.random() < 0.01,
            illegal: Math.random() < 0.02
          },
          category_scores: {
            harassment: Math.random(),
            hate: Math.random(),
            sexual: Math.random(),
            violence: Math.random(),
            self_harm: Math.random(),
            illegal: Math.random()
          }
        }
        
        if (mockModerationResult.flagged && enableSoundNotifications) {
          playFlaggedCommentSound()
          
          // Show moderation notification
          showModerationNotification(data, data.comment, mockModerationResult)
        }
        
        // Add moderation result to the message
        data.moderationResult = mockModerationResult
        updateModerationStats(mockModerationResult)
      }
      
      // Check for mentions
      if (enableMentionNotifications && yourUsername && data.comment.toLowerCase().includes(yourUsername.toLowerCase())) {
        // Show mention notification
        showMentionNotification(data)
      }
      
      // Add message to chat using sanitized text to prevent XSS
      const sanitizedComment = sanitize(data.comment)
      setChatMessages(prevMessages => {
        const newMessages = [...prevMessages, {...data, comment: sanitizedComment, userStatus}]
        // Keep only the most recent 1000 messages
        if (newMessages.length > 1000) {
          return newMessages.slice(newMessages.length - 1000)
        }
        return newMessages
      })
      
      // If AI response was requested, update the message when it's ready
      if (aiResponsePromise) {
        aiResponsePromise.then(aiResponse => {
          setChatMessages(prevMessages => {
            return prevMessages.map(msg => {
              if (msg.msgId === data.msgId) {
                return {
                  ...msg,
                  pendingResponse: false,
                  suggestedResponse: aiResponse
                };
              }
              return msg;
            });
          });
        }).catch(error => {
          console.error('Error generating AI response:', error);
          setChatMessages(prevMessages => {
            return prevMessages.map(msg => {
              if (msg.msgId === data.msgId) {
                return {
                  ...msg,
                  pendingResponse: false,
                  suggestedResponse: "Error generating response"
                };
              }
              return msg;
            });
          });
        });
      }
    })
    
    // Member join
    conn.on('member', (data) => {
      const userStatus = checkUserStatus(data)
      
      setChatMessages(prevMessages => {
        const newMessages = [...prevMessages, {...data, type: 'join', userStatus}]
        if (newMessages.length > 1000) {
          return newMessages.slice(newMessages.length - 1000)
        }
        return newMessages
      })
    })
    
    // Follow
    conn.on('follow', (data) => {
      const userStatus = checkUserStatus(data)
      
      setChatMessages(prevMessages => {
        const newMessages = [...prevMessages, {...data, type: 'follow', userStatus}]
        if (newMessages.length > 1000) {
          return newMessages.slice(newMessages.length - 1000)
        }
        return newMessages
      })
    })
  }
  
  const initializeVideoPlayer = () => {
    // Use the proxy to connect to the server
    const streamUrl = `/stream/${username}/flv`
    
    if (flvjs.isSupported() && videoPlayerRef.current) {
      const flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url: streamUrl,
        isLive: true,
      })
      
      flvPlayer.attachMediaElement(videoPlayerRef.current)
      flvPlayer.load()
      flvPlayer.play()
      
      flvPlayerRef.current = flvPlayer
    }
  }
  
  const checkUserStatus = (data) => {
    // Check if user is in friends or undesirables list
    const isFriend = friendsList.some(friend => friend.tiktokId === data.userId)
    const isUndesirable = undesirablesList.some(undesirable => undesirable.tiktokId === data.userId)
    
    return {
      isFriend,
      isUndesirable
    }
  }
  
  const playFlaggedCommentSound = () => {
    if (flaggedCommentSoundRef.current) {
      flaggedCommentSoundRef.current.play().catch(e => console.error('Error playing sound', e))
    }
  }
  
  const updateModerationStats = (moderationResult) => {
    setModerationStats(prevStats => {
      const newStats = {...prevStats}
      newStats.total += 1
      
      if (moderationResult.flagged) {
        newStats.flagged += 1
        
        // Update category counts if available
        Object.keys(moderationResult.categories || {}).forEach(category => {
          if (newStats.categories[category] !== undefined) {
            newStats.categories[category] += 1
          }
        })
      } else {
        newStats.safe += 1
      }
      
      return newStats
    })
  }
  
  const addToFriendsList = (userId, nickname) => {
    const newFriend = {
      tiktokId: userId,
      nickname: nickname,
      addedAt: new Date().toISOString()
    }
    
    setFriendsList(prevList => {
      // Don't add duplicates
      if (prevList.some(item => item.tiktokId === userId)) {
        return prevList
      }
      
      const newList = [...prevList, newFriend]
      localStorage.setItem('friendsList', JSON.stringify(newList))
      return newList
    })
    
    // Remove from undesirables if present
    setUndesirablesList(prevList => {
      const newList = prevList.filter(item => item.tiktokId !== userId)
      localStorage.setItem('undesirablesList', JSON.stringify(newList))
      return newList
    })
  }
  
  const addToUndesirablesList = (userId, nickname, reason = '') => {
    const newUndesirable = {
      tiktokId: userId,
      nickname: nickname,
      reason: reason,
      addedAt: new Date().toISOString()
    }
    
    setUndesirablesList(prevList => {
      // Don't add duplicates
      if (prevList.some(item => item.tiktokId === userId)) {
        return prevList
      }
      
      const newList = [...prevList, newUndesirable]
      localStorage.setItem('undesirablesList', JSON.stringify(newList))
      return newList
    })
    
    // Remove from friends if present
    setFriendsList(prevList => {
      const newList = prevList.filter(item => item.tiktokId !== userId)
      localStorage.setItem('friendsList', JSON.stringify(newList))
      return newList
    })
  }
  
  const removeFriend = (userId) => {
    setFriendsList(prevList => {
      const newList = prevList.filter(item => item.tiktokId !== userId)
      localStorage.setItem('friendsList', JSON.stringify(newList))
      return newList
    })
  }
  
  const removeUndesirable = (userId) => {
    setUndesirablesList(prevList => {
      const newList = prevList.filter(item => item.tiktokId !== userId)
      localStorage.setItem('undesirablesList', JSON.stringify(newList))
      return newList
    })
  }
  
  // Sanitize text to prevent XSS
  const sanitize = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  // Function to generate AI response
  const generateAIResponse = async (userComment) => {
    setIsGeneratingResponse(true);
    
    try {
      // If OpenAI API key is provided and OpenAI is selected
      if (aiProvider === 'openai' && openaiApiKey) {
        // This would be a real API call to OpenAI in a production app
        console.log('Would call OpenAI API with:', userComment);
        
        // For demo purposes, we'll still return a mock response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockAIResponse = `AI response to: "${userComment.substring(0, 30)}${userComment.length > 30 ? '...' : ''}"`;
        setIsGeneratingResponse(false);
        return mockAIResponse;
      } 
      // If Ollama is selected
      else if (aiProvider === 'ollama' && aiModel) {
        // This would be a real API call to Ollama in a production app
        console.log('Would call Ollama API with model:', aiModel);
        
        // For demo purposes, we'll still return a mock response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockAIResponse = `${aiModel} response to: "${userComment.substring(0, 30)}${userComment.length > 30 ? '...' : ''}"`;
        setIsGeneratingResponse(false);
        return mockAIResponse;
      }
      // Default mock responses
      else {
        // Just for demo - return a random response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockResponses = [
          "Thanks for your comment!",
          "That's interesting, tell me more!",
          "I appreciate your perspective.",
          "Great point!",
          "Thanks for joining the stream!",
          "Welcome to the chat!",
          "I'm glad you're here!"
        ];
        
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        setIsGeneratingResponse(false);
        return randomResponse;
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setIsGeneratingResponse(false);
      return "Error generating response";
    }
  };
  
  // Function to show moderation notification
  const showModerationNotification = (data, text, moderationResult) => {
    // Get the reason for flagging
    let reason = '';
    if (moderationResult.categories) {
      for (const category in moderationResult.categories) {
        if (moderationResult.categories[category]) {
          reason += (reason ? ', ' : '') + category;
        }
      }
    }
    
    // Add to notifications
    const notification = {
      id: Date.now(),
      type: 'moderation',
      title: `Inappropriate content detected from ${data.uniqueId}`,
      message: text,
      reason: reason || 'Not specified',
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  }
  
  // Function to show mention notification
  const showMentionNotification = (data) => {
    // Add to notifications
    const notification = {
      id: Date.now(),
      type: 'mention',
      title: `${data.uniqueId} mentioned you`,
      message: data.comment,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
    
    // Try to show browser notification if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${data.uniqueId} mentioned you`, {
        body: data.comment,
        icon: '/favicon.ico'
      });
    }
  }
  
  // Function to remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }
  
  // Function to request browser notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }
  
  return (
    <div className={`app-container ${darkTheme ? 'dark' : 'light'}`}>
      {/* Notification container */}
      <div className="notification-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            <button 
              className="notification-close" 
              onClick={() => removeNotification(notification.id)}
            >
              ✕
            </button>
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
            {notification.reason && (
              <div className="notification-reason">Reason: {notification.reason}</div>
            )}
          </div>
        ))}
      </div>
      
      <header className="app-header">
        <h1>TikTok LIVE Chat Reader</h1>
        
        {!isConnected ? (
          <div className="connection-form">
            <input
              type="text"
              placeholder="TikTok Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="username-input"
            />
            <button 
              onClick={connect} 
              disabled={isConnecting || !username}
              className="connect-button"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="settings-container">
              <h3>Settings</h3>
              
              <div className="setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={darkTheme} 
                    onChange={(e) => {
                      setDarkTheme(e.target.checked);
                      localStorage.setItem('darkTheme', e.target.checked);
                    }} 
                  />
                  Dark Theme
                </label>
              </div>
              
              <div className="setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={showModeration} 
                    onChange={(e) => {
                      setShowModeration(e.target.checked);
                      localStorage.setItem('showModeration', e.target.checked);
                    }} 
                  />
                  Show Moderation
                </label>
              </div>
              
              <div className="setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={showAIResponses} 
                    onChange={(e) => {
                      setShowAIResponses(e.target.checked);
                      localStorage.setItem('showAIResponses', e.target.checked);
                    }} 
                  />
                  Show AI Responses
                </label>
              </div>
              
              <div className="setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={enableSoundNotifications} 
                    onChange={(e) => {
                      setEnableSoundNotifications(e.target.checked);
                      localStorage.setItem('enableSoundNotifications', e.target.checked);
                    }} 
                  />
                  Enable Sound Notifications
                </label>
              </div>
              
              <div className="setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={enableFlvStream} 
                    onChange={(e) => {
                      setEnableFlvStream(e.target.checked);
                      localStorage.setItem('enableFlvStream', e.target.checked);
                    }} 
                  />
                  Enable Video Stream
                </label>
              </div>
              
              <div className="setting-row">
                <label>
                  <input 
                    type="checkbox" 
                    checked={enableMentionNotifications} 
                    onChange={(e) => {
                      setEnableMentionNotifications(e.target.checked);
                      localStorage.setItem('enableMentionNotifications', e.target.checked);
                    }} 
                  />
                  Enable Mention Notifications
                </label>
              </div>
              
              <div className="setting-row">
                <label>Your Username:</label>
                <input 
                  type="text" 
                  value={yourUsername} 
                  onChange={(e) => {
                    let username = e.target.value.trim();
                    // Remove @ symbol if present
                    if (username.startsWith('@')) {
                      username = username.substring(1);
                    }
                    setYourUsername(username);
                    if (username) {
                      localStorage.setItem('tiktokUsername', username);
                    } else {
                      localStorage.removeItem('tiktokUsername');
                    }
                  }} 
                  className="settings-input"
                  placeholder="For mention notifications"
                />
              </div>
              
              <div className="setting-row">
                <label>AI Provider:</label>
                <div className="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      name="aiProvider" 
                      value="openai" 
                      checked={aiProvider === 'openai'} 
                      onChange={() => {
                        setAiProvider('openai');
                        localStorage.setItem('aiProvider', 'openai');
                      }} 
                    />
                    OpenAI
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="aiProvider" 
                      value="ollama" 
                      checked={aiProvider === 'ollama'} 
                      onChange={() => {
                        setAiProvider('ollama');
                        localStorage.setItem('aiProvider', 'ollama');
                      }} 
                    />
                    Ollama
                  </label>
                </div>
              </div>
              
              {aiProvider === 'ollama' && (
                <div className="setting-row">
                  <label>Ollama Model:</label>
                  <select 
                    value={aiModel} 
                    onChange={(e) => {
                      setAiModel(e.target.value);
                      localStorage.setItem('aiModel', e.target.value);
                    }} 
                    className="settings-select"
                  >
                    <option value="">Select Model</option>
                    <option value="llama2">Llama 2</option>
                    <option value="mistral">Mistral</option>
                    <option value="gemma">Gemma</option>
                  </select>
                </div>
              )}
              
              {aiProvider === 'openai' && (
                <div className="setting-row">
                  <label>OpenAI API Key:</label>
                  <input 
                    type="password" 
                    value={openaiApiKey} 
                    onChange={(e) => {
                      setOpenaiApiKey(e.target.value);
                      localStorage.setItem('openaiApiKey', e.target.value);
                    }} 
                    className="settings-input"
                    placeholder="sk-..."
                  />
                </div>
              )}
              
              {enableMentionNotifications && (
                <div className="setting-row">
                  <button 
                    onClick={requestNotificationPermission}
                    className="settings-button"
                  >
                    Enable Browser Notifications
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="connected-header">
            <h2>Connected to: {username}</h2>
            <div className="stats-container">
              <div className="stat">
                <span className="stat-icon">👁️</span>
                <span className="stat-value">{viewerCount}</span>
              </div>
              <div className="stat">
                <span className="stat-icon">❤️</span>
                <span className="stat-value">{likeCount}</span>
              </div>
              <div className="stat">
                <span className="stat-icon">💎</span>
                <span className="stat-value">{diamondsCount}</span>
              </div>
            </div>
            <button onClick={disconnect} className="disconnect-button">
              Disconnect
            </button>
          </div>
        )}
      </header>
      
      {isConnected && (
        <div className="content-container">
          <div className="main-content">
            {enableFlvStream && (
              <div className="video-container">
                <video ref={videoPlayerRef} controls autoPlay muted className="video-player"></video>
              </div>
            )}
            
            <div className="chat-gifts-container">
              <div className="chat-container" ref={chatContainerRef}>
                {chatMessages.map((msg, index) => {
                  let messageContent;
                  let messageClass = 'chat-message';
                  
                  if (msg.type === 'join') {
                    messageContent = <p>{msg.uniqueId} joined the room</p>;
                    messageClass += ' join-message';
                  } else if (msg.type === 'follow') {
                    messageContent = <p>{msg.uniqueId} followed the host</p>;
                    messageClass += ' follow-message';
                  } else {
                    messageContent = (
                      <>
                        <span className="username">{msg.uniqueId}: </span>
                        <span className="message-text">{msg.comment}</span>
                        
                        {showModeration && msg.moderationResult && (
                          <div className={`moderation-result ${msg.moderationResult.flagged ? 'flagged' : 'safe'}`}>
                            <div className="moderation-badge">
                              {msg.moderationResult.flagged ? '⚠️ Flagged' : '✅ Safe'}
                            </div>
                            
                            {msg.moderationResult.flagged && (
                              <div className="moderation-categories">
                                {Object.entries(msg.moderationResult.categories).map(([category, isFlagged]) => 
                                  isFlagged && (
                                    <span key={category} className="moderation-category">
                                      {category}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {showAIResponses && (
                          <div className="ai-response">
                            {msg.pendingResponse ? (
                              <div className="loading-response">Generating AI response...</div>
                            ) : msg.suggestedResponse ? (
                              <div className="suggested-response">
                                <span className="response-label">AI Response: </span>
                                <span className="response-text">{msg.suggestedResponse}</span>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </>
                    );
                  }
                  
                  // Add user status classes
                  if (msg.userStatus) {
                    if (msg.userStatus.isFriend) messageClass += ' friend-message';
                    if (msg.userStatus.isUndesirable) messageClass += ' undesirable-message';
                  }
                  
                  return (
                    <div key={`msg-${index}`} className={messageClass}>
                      {messageContent}
                      
                      <div className="user-actions">
                        <button 
                          onClick={() => addToFriendsList(msg.userId, msg.uniqueId)}
                          className="friend-button"
                          title="Add to Friends"
                        >
                          👍
                        </button>
                        <button 
                          onClick={() => addToUndesirablesList(msg.userId, msg.uniqueId)}
                          className="undesirable-button"
                          title="Add to Undesirables"
                        >
                          👎
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <div className="chat-controls">
                  <div className="auto-scroll-toggle">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={autoScroll} 
                        onChange={(e) => {
                          setAutoScroll(e.target.checked);
                          localStorage.setItem('autoScroll', e.target.checked);
                          
                          // If auto-scroll was just re-enabled, scroll to bottom
                          if (e.target.checked && chatContainerRef.current) {
                            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                          }
                        }} 
                      />
                      Auto-scroll
                    </label>
                  </div>
                  
                  {!autoScroll && (
                    <button 
                      className="jump-to-latest-button"
                      onClick={() => {
                        if (chatContainerRef.current) {
                          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                        }
                      }}
                    >
                      Jump to Latest
                    </button>
                  )}
                </div>
              </div>
              
              <div className="gifts-container">
                <h3>Gifts</h3>
                {gifts.map((gift, index) => (
                  <div key={`gift-${index}`} className="gift-item">
                    <p>
                      <span className="username">{gift.uniqueId}</span> sent {gift.repeatCount}x {gift.giftName}
                      {gift.diamondCount > 0 && <span className="diamond-count"> ({gift.diamondCount} 💎)</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="side-panel">
            <div className="user-lists-container">
              <h3>Friends List</h3>
              <div className="user-list friends-list">
                {friendsList.length === 0 ? (
                  <p>No friends yet</p>
                ) : (
                  friendsList.map((friend, index) => (
                    <div key={`friend-${index}`} className="user-list-item">
                      <span className="user-nickname">{friend.nickname}</span>
                      <button 
                        onClick={() => removeFriend(friend.tiktokId)}
                        className="remove-button"
                      >
                        ❌
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <h3>Undesirables List</h3>
              <div className="user-list undesirables-list">
                {undesirablesList.length === 0 ? (
                  <p>No undesirables yet</p>
                ) : (
                  undesirablesList.map((undesirable, index) => (
                    <div key={`undesirable-${index}`} className="user-list-item">
                      <span className="user-nickname">{undesirable.nickname}</span>
                      <span className="user-reason">{undesirable.reason}</span>
                      <button 
                        onClick={() => removeUndesirable(undesirable.tiktokId)}
                        className="remove-button"
                      >
                        ❌
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {showModeration && (
              <div className="moderation-stats">
                <h3>Moderation Stats</h3>
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{moderationStats.total}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Flagged:</span>
                    <span className="stat-value">{moderationStats.flagged}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Safe:</span>
                    <span className="stat-value">{moderationStats.safe}</span>
                  </div>
                </div>
                
                <h4>Categories</h4>
                <div className="categories-stats">
                  {Object.entries(moderationStats.categories).map(([category, count]) => (
                    <div key={category} className="category-stat">
                      <span className="category-label">{category}:</span>
                      <span className="category-value">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
