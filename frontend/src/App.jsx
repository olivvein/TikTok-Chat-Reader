import { useState, useEffect, useRef } from 'react'
import './App.css'
import TikTokConnection from './utils/TikTokConnection'

// Import components
import ConnectionForm from './components/ConnectionForm'
import Settings from './components/Settings'
import StatsBar from './components/StatsBar'
import VideoPlayer from './components/VideoPlayer'
import ChatContainer from './components/ChatContainer'
import GiftsContainer from './components/GiftsContainer'
import UserLists from './components/UserLists'
import ModerationStats from './components/ModerationStats'
import Notifications from './components/Notifications'

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
      // Any cleanup code goes here
    }
  }, [])
  
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
        enableExtendedGiftInfo: true,
        aiProvider,
        aiModel,
        showModeration,
        showResponses: showAIResponses,
        openaiApiKey: aiProvider === 'openai' ? openaiApiKey : undefined
      })
      
      setIsConnected(true)
      setupEventListeners()
    } catch (err) {
      setError(`Connection failed: ${err}`)
    } finally {
      setIsConnecting(false)
    }
  }
  
  const disconnect = () => {
    // Properly disconnect from the socket
    if (connectionRef.current) {
      // The socket.io connection will remain active
      // Just reset our state
      connectionRef.current.isConnected = false;
      connectionRef.current.uniqueId = null;
      connectionRef.current.streamUrl = null;
    }
    
    // Reset all state
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
    
    // Chat messages - now using socket approach
    conn.on('chat', (data) => {
      const userStatus = checkUserStatus(data)
      
      // We now receive initial message from the server with pending moderation/response flags
      // Add message to chat using sanitized text to prevent XSS
      const sanitizedComment = sanitize(data.comment)

      // Check for mentions
      if (enableMentionNotifications && yourUsername && data.comment.toLowerCase().includes(yourUsername.toLowerCase())) {
        // Show mention notification
        showMentionNotification(data)
      }
      
      setChatMessages(prevMessages => {
        const newMessages = [...prevMessages, {...data, comment: sanitizedComment, userStatus}]
        // Keep only the most recent 1000 messages
        if (newMessages.length > 1000) {
          return newMessages.slice(newMessages.length - 1000)
        }
        return newMessages
      })
      
      // If moderation is enabled, we will get updates via chatUpdate
      if (showModeration) {
        setIsGeneratingResponse(true)
      }
    })
    
    // Handle chat updates from server (moderation results and AI responses)
    conn.on('chatUpdate', (update) => {
      // Update the message in the chat list
      setChatMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.msgId === update.id) {
            if (update.type === 'moderation') {
              // If we have moderation results
              if (update.data.moderation?.flagged && enableSoundNotifications) {
                playFlaggedCommentSound()
                
                // Show notification for flagged content
                if (enableMentionNotifications) {
                  showModerationNotification(update.data, update.data.comment, update.data.moderation)
                }
              }
              
              // Update moderation stats
              if (update.data.moderation) {
                updateModerationStats(update.data.moderation)
              }
              
              return {
                ...msg,
                pendingModeration: false,
                moderation: update.data.moderation
              }
            } else if (update.type === 'response') {
              // Handle AI response update
              setIsGeneratingResponse(false)
              return {
                ...msg,
                pendingResponse: false,
                suggestedResponse: update.data.suggestedResponse
              }
            }
          }
          return msg
        })
      })
    })
    
    // Available Ollama models
    conn.on('ollamaModels', (models) => {
      // Store available Ollama models
      console.log('Received Ollama models:', models)
      // If you have state for available models, update it here
    })
    
    // Handle stream end
    conn.on('streamEnd', () => {
      console.warn('LIVE has ended')
      
      // Add to notifications
      const notification = {
        id: Date.now(),
        type: 'info',
        title: 'Stream Ended',
        message: 'The LIVE stream has ended',
        timestamp: new Date()
      }
      
      setNotifications(prev => [...prev, notification])
      
      // Remove after 5 seconds
      setTimeout(() => {
        removeNotification(notification.id)
      }, 5000)
      
      // Disconnect
      disconnect()
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
        if (moderationResult.categories) {
          Object.keys(moderationResult.categories).forEach(category => {
            if (moderationResult.categories[category] && newStats.categories[category] !== undefined) {
              newStats.categories[category] += 1
            }
          })
        }
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
      <Notifications 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
      
      <header className="app-header">
        <h1>TikTok LIVE Chat Reader</h1>
        
        {!isConnected ? (
          <div className="connection-form">
            <ConnectionForm 
              username={username}
              setUsername={setUsername}
              connect={connect}
              isConnecting={isConnecting}
              error={error}
            />
            
            <Settings 
              darkTheme={darkTheme}
              setDarkTheme={setDarkTheme}
              showModeration={showModeration}
              setShowModeration={setShowModeration}
              showAIResponses={showAIResponses}
              setShowAIResponses={setShowAIResponses}
              enableSoundNotifications={enableSoundNotifications}
              setEnableSoundNotifications={setEnableSoundNotifications}
              enableFlvStream={enableFlvStream}
              setEnableFlvStream={setEnableFlvStream}
              enableMentionNotifications={enableMentionNotifications}
              setEnableMentionNotifications={setEnableMentionNotifications}
              yourUsername={yourUsername}
              setYourUsername={setYourUsername}
              aiProvider={aiProvider}
              setAiProvider={setAiProvider}
              aiModel={aiModel}
              setAiModel={setAiModel}
              openaiApiKey={openaiApiKey}
              setOpenaiApiKey={setOpenaiApiKey}
              requestNotificationPermission={requestNotificationPermission}
            />
          </div>
        ) : (
          <div className="connected-header">
            <h2>Connected to: {username}</h2>
            <StatsBar 
              viewerCount={viewerCount}
              likeCount={likeCount}
              diamondsCount={diamondsCount}
            />
            <button onClick={disconnect} className="disconnect-button">
              Disconnect
            </button>
          </div>
        )}
      </header>
      
      {isConnected && (
        <div className="content-container">
          <div className="main-content">
            <VideoPlayer 
              username={username}
              enableFlvStream={enableFlvStream}
              connectionRef={connectionRef}
            />
            
            <div className="chat-gifts-container">
              <ChatContainer 
                chatMessages={chatMessages}
                showModeration={showModeration}
                showAIResponses={showAIResponses}
                addToFriendsList={addToFriendsList}
                addToUndesirablesList={addToUndesirablesList}
                autoScroll={autoScroll}
                setAutoScroll={setAutoScroll}
                isGeneratingResponse={isGeneratingResponse}
              />
              
              <GiftsContainer gifts={gifts} />
            </div>
          </div>
          
          <div className="side-panel">
            <UserLists 
              friendsList={friendsList}
              undesirablesList={undesirablesList}
              removeFriend={removeFriend}
              removeUndesirable={removeUndesirable}
            />
            
            {showModeration && (
              <ModerationStats moderationStats={moderationStats} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
