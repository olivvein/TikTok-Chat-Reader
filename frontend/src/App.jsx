import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

// Components
import ConnectionForm from './components/ConnectionForm';
import ChatContainer from './components/ChatContainer';
import GiftContainer from './components/GiftContainer';
import RoomStats from './components/RoomStats';
import StateText from './components/StateText';
import NotificationContainer from './components/NotificationContainer';
import UserListsPanel from './components/UserListsPanel';

// TikTok IO Connection Class
class TikTokIOConnection {
  constructor(backendUrl = 'http://localhost:8081') {
    // Connect to socket server with explicit port 8081
    console.log(`Initializing socket connection to ${backendUrl}`);
    
    this.socket = io(backendUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true
    });
    
    this.uniqueId = null;
    this.options = null;
    this.serverStatus = 'initializing';

    // Set up basic event handlers
    this.socket.on('connect', () => {
      console.info(`Socket connected! ID: ${this.socket.id}`);
      this.serverStatus = 'connected';

      // Reconnect to streamer if uniqueId already set
      if (this.uniqueId) {
        console.log(`Reconnecting to ${this.uniqueId}`);
        this.setUniqueId();
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error(`Socket connection error: ${err.message}`);
      this.serverStatus = 'error';
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`Socket disconnected: ${reason}`);
      this.serverStatus = 'disconnected';
    });

    this.socket.on('error', (err) => {
      console.error(`Socket error: ${err}`);
      this.serverStatus = 'error';
    });

    this.socket.on('streamEnd', () => {
      console.warn("LIVE has ended!");
      this.uniqueId = null;
    });

    this.socket.on('tiktokDisconnected', (errMsg) => {
      console.warn("TikTok disconnected:", errMsg);
      if (errMsg && errMsg.includes('LIVE has ended')) {
        this.uniqueId = null;
      }
    });
  }

  getStatus() {
    return {
      connected: this.socket.connected,
      id: this.socket.id,
      serverStatus: this.serverStatus
    };
  }

  connect(uniqueId, options) {
    console.log(`Connecting to TikTok user: ${uniqueId}`, options);
    this.uniqueId = uniqueId;
    this.options = options || {};

    // Force reconnect if socket is already connected but in a bad state
    if (!this.socket.connected) {
      console.log('Socket not connected, connecting now...');
      this.socket.connect();
    } else {
      console.log('Socket already connected, setting uniqueId directly');
      this.setUniqueId();
    }

    return new Promise((resolve, reject) => {
      const connectedHandler = (state) => {
        console.log('TikTok connection successful:', state);
        resolve(state);
      };

      const disconnectedHandler = (reason) => {
        console.error('TikTok connection failed:', reason);
        reject(reason);
      };

      // Set up timeout to avoid hanging indefinitely
      const timeoutId = setTimeout(() => {
        // Remove listeners to avoid memory leaks
        this.socket.off('tiktokConnected', connectedHandler);
        this.socket.off('tiktokDisconnected', disconnectedHandler);
        reject('Connection Timeout (15s)');
      }, 15000);

      // Clear timeout when either event is received
      const cleanup = () => {
        clearTimeout(timeoutId);
      };

      this.socket.once('tiktokConnected', (state) => {
        cleanup();
        connectedHandler(state);
      });

      this.socket.once('tiktokDisconnected', (reason) => {
        cleanup();
        disconnectedHandler(reason);
      });
    });
  }

  setUniqueId() {
    console.log(`Setting uniqueId: ${this.uniqueId}`, this.options);
    this.socket.emit('setUniqueId', this.uniqueId, this.options);
  }

  on(eventName, eventHandler) {
    this.socket.on(eventName, eventHandler);
  }

  // Add a specific method for getting user status
  getUserStatus(uniqueId) {
    this.socket.emit('getUserStatus', uniqueId);
  }
  
  // Clean disconnect method
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
    }
  }
}

// Initialize connection
let connection = null;

function App() {
  const [_isConnected, setIsConnected] = useState(false);
  const [stateText, setStateText] = useState('Déconnecté');
  const [roomStats, setRoomStats] = useState(null);
  const [userListsVisible, setUserListsVisible] = useState(false);
  const [chatItems, setChatItems] = useState([]);
  const [giftItems, setGiftItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    enableSoundNotifications: false,
    enableMentionNotification: true,
    enableModerationNotification: true,
    showModeration: false,
    showResponses: false,
    yourUsername: '',
    aiProvider: 'openai',
    aiModel: '',
    openaiApiKey: '',
  });
  
  const [userLists, setUserLists] = useState({
    friends: [],
    undesirables: []
  });
  
  const [moderationStats, setModerationStats] = useState({
    total: 0,
    flagged: 0,
    clean: 0
  });

  useEffect(() => {
    // Initialize the connection with explicit backend URL
    if (!connection) {
      try {
        connection = new TikTokIOConnection('http://localhost:8081');
        
        // Set up event listeners
        setupConnectionListeners();
        
        console.log('Connection initialized');
      } catch (err) {
        console.error('Failed to initialize connection:', err);
        setStateText(`Erreur de connexion: ${err.message}`);
      }
    }

    // Clean up on component unmount
    return () => {
      // Disconnect socket when component unmounts
      if (connection) {
        try {
          connection.disconnect();
        } catch (err) {
          console.error('Error disconnecting socket:', err);
        }
      }
    };
  }, []);

  // Connect to TikTok Live
  const connect = (username) => {
    if (!username) {
      alert("Entrez un nom d'utilisateur");
      return;
    }

    if (!connection) {
      console.error('Socket connection not initialized');
      setStateText('Erreur: Socket non initialisé');
      return;
    }

    setStateText(`Connexion à ${username}...`);
    
    // Create connection options from settings
    const options = {
      enableExtendedGiftInfo: true,
      showModeration: settings.showModeration,
      showResponses: settings.showResponses,
      aiProvider: settings.aiProvider,
      aiModel: settings.aiModel,
      openaiApiKey: settings.openaiApiKey,
      yourUsername: settings.yourUsername
    };

    // Connect to TikTok through our wrapper
    connection.connect(username, options)
      .then(state => {
        console.log(`Connected to roomId ${state.roomId}`);
      })
      .catch(err => {
        console.error('Failed to connect:', err);
        setStateText(`Échec de la connexion: ${err}`);
      });
  };
  
  // Socket event listeners
  const setupConnectionListeners = () => {
    connection.on('connect', () => {
      setIsConnected(true);
      setStateText('Connecté au serveur');
    });

    connection.socket.on('disconnect', () => {
      setIsConnected(false);
      setStateText('Déconnecté du serveur');
    });

    connection.on('tiktokDisconnected', (disconnectReason) => {
      setStateText(`Déconnecté de TikTok: ${disconnectReason}`);
    });

    connection.on('tiktokConnected', (streamerInfo) => {
      setStateText(`Connecté au live de ${streamerInfo.uniqueId}`);
    });

    connection.on('chat', (data) => {
      addChatItem(data);
      checkUserStatus(data);
    });

    connection.on('gift', (data) => {
      addGiftItem(data);
      checkUserStatus(data);
    });

    connection.on('roomUser', (data) => {
      setRoomStats(data);
    });

    connection.on('like', (data) => {
      // We could update a likes counter or show a like animation
      // For now, we're just using the roomStats data which already includes likes
      checkUserStatus(data);
    });

    connection.on('join', (data) => {
      showJoinNotification(data, 'regular');
      checkUserStatus(data);
    });

    connection.on('followerJoin', (data) => {
      showJoinNotification(data, 'follower');
      checkUserStatus(data);
    });

    connection.on('moderationResult', (data) => {
      updateModerationStats(data.result);
      
      // Only show notification for flagged content
      if (data.result.flagged && settings.enableModerationNotification) {
        showModerationNotification(data.data, data.text, data.result);
      }
    });

    connection.on('userStatus', (data) => {
      // Update UI based on user status
      // This could highlight friends/undesirables in the chat
      // or trigger other UI updates based on user status
      if (data && data.tiktokId) {
        // Example: console.log(`User status updated: ${data.tiktokId}, Friend: ${data.isFriend}, Undesirable: ${data.isUndesirable}`);
      }
    });
    
    connection.on('mention', (data) => {
      if (settings.enableMentionNotification) {
        showMentionNotification(data.data, data.text);
      }
    });
    
    // AI response event
    connection.on('aiResponse', (data) => {
      // Handle AI responses
      if (settings.showResponses) {
        const newChat = {
          id: `ai-${Date.now()}`,
          type: 'ai-response',
          data: { uniqueId: 'AI' },
          text: data.response,
          timestamp: new Date(),
          originalComment: data.originalComment
        };
        
        setChatItems(prevItems => [...prevItems, newChat]);
      }
    });
  };
  
  // Add a chat message to the UI
  const addChatItem = (data) => {
    const text = data.comment;
    const sanitizedText = sanitize(text);
    
    const newChat = {
      id: `chat-${Date.now()}`,
      type: 'chat',
      data: data,
      text: sanitizedText,
      timestamp: new Date()
    };
    
    setChatItems(prevItems => {
      const updatedItems = [...prevItems, newChat];
      // Limit number of displayed messages (optional)
      if (updatedItems.length > 200) {
        return updatedItems.slice(-200);
      }
      return updatedItems;
    });
  };
  
  // Add a gift to the UI
  const addGiftItem = (data) => {
    const newGift = {
      id: `gift-${Date.now()}`,
      data: data,
      timestamp: new Date()
    };
    
    setGiftItems(prevItems => {
      const updatedItems = [...prevItems, newGift];
      // Limit number of displayed gifts (optional)
      if (updatedItems.length > 200) {
        return updatedItems.slice(-200);
      }
      return updatedItems;
    });
  };
  
  // Show notification for user joins
  const showJoinNotification = (data, userType) => {
    const isFollower = userType === 'follower';
    
    const newNotification = {
      id: `join-${Date.now()}`,
      type: isFollower ? 'follower-join' : 'user-join',
      data: data,
      timestamp: new Date()
    };
    
    setNotifications(prevNotifications => {
      const updatedNotifications = [...prevNotifications, newNotification];
      return updatedNotifications;
    });
    
    // Play sound if enabled
    if (settings.enableSoundNotifications) {
      playFlaggedCommentSound(true);
    }
  };
  
  // Show notification for user mentions
  const showMentionNotification = (data, text) => {
    const newNotification = {
      id: `mention-${Date.now()}`,
      type: 'mention',
      data: data,
      text: text,
      timestamp: new Date()
    };
    
    setNotifications(prevNotifications => {
      const updatedNotifications = [...prevNotifications, newNotification];
      return updatedNotifications;
    });
    
    // Play sound if enabled
    if (settings.enableSoundNotifications) {
      playFlaggedCommentSound(true);
    }
  };
  
  // Show notification for moderation alerts
  const showModerationNotification = (data, text, moderationResult) => {
    const newNotification = {
      id: `moderation-${Date.now()}`,
      type: 'moderation',
      data: data,
      text: text,
      moderationResult: moderationResult,
      timestamp: new Date()
    };
    
    setNotifications(prevNotifications => {
      const updatedNotifications = [...prevNotifications, newNotification];
      return updatedNotifications;
    });
    
    // Play sound if enabled
    if (settings.enableSoundNotifications) {
      playFlaggedCommentSound(true);
    }
  };
  
  // Update moderation statistics
  const updateModerationStats = (moderationResult) => {
    setModerationStats(prevStats => ({
      total: prevStats.total + 1,
      flagged: prevStats.flagged + (moderationResult.flagged ? 1 : 0),
      clean: prevStats.clean + (moderationResult.flagged ? 0 : 1)
    }));
  };
  
  // Play notification sound
  const playFlaggedCommentSound = (force = false) => {
    if (settings.enableSoundNotifications || force) {
      const audio = document.getElementById('flaggedCommentSound');
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error('Failed to play sound:', e));
      }
    }
  };
  
  // Check user status
  const checkUserStatus = (data) => {
    if (data && data.uniqueId && connection) {
      connection.getUserStatus(data.uniqueId);
    }
  };
  
  // Toggle user lists panel
  const toggleUserListsPanel = () => {
    setUserListsVisible(!userListsVisible);
    
    if (!userListsVisible) {
      loadUserLists();
    }
  };
  
  // Load user lists from the server
  const loadUserLists = () => {
    // Fetch both lists in parallel using Promise.all
    Promise.all([
      fetch('/api/users/friends').then(response => response.json()),
      fetch('/api/users/undesirables').then(response => response.json())
    ])
      .then(([friends, undesirables]) => {
        setUserLists({
          friends: friends || [],
          undesirables: undesirables || []
        });
      })
      .catch(error => {
        console.error('Error loading user lists:', error);
      });
  };
  
  // Friend list management
  const addToFriendsList = (tiktokId, nickname) => {
    fetch('/api/users/friends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tiktokId, nickname })
    })
      .then(() => loadUserLists())
      .catch(error => console.error('Error adding friend:', error));
  };
  
  const removeFriend = (tiktokId) => {
    fetch(`/api/users/friends/${tiktokId}`, {
      method: 'DELETE'
    })
      .then(() => loadUserLists())
      .catch(error => console.error('Error removing friend:', error));
  };
  
  // Undesirables list management
  const addToUndesirablesList = (tiktokId, nickname, reason = '') => {
    fetch('/api/users/undesirables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tiktokId, nickname, reason })
    })
      .then(() => loadUserLists())
      .catch(error => console.error('Error adding undesirable:', error));
  };
  
  const removeUndesirable = (tiktokId) => {
    fetch(`/api/users/undesirables/${tiktokId}`, {
      method: 'DELETE'
    })
      .then(() => loadUserLists())
      .catch(error => console.error('Error removing undesirable:', error));
  };
  
  // Move between lists
  const moveToUndesirable = (tiktokId, nickname) => {
    removeFriend(tiktokId);
    const reason = prompt('Raison de l\'ajout aux indésirables (optionnel):');
    addToUndesirablesList(tiktokId, nickname, reason);
  };
  
  const moveToFriend = (tiktokId, nickname) => {
    removeUndesirable(tiktokId);
    addToFriendsList(tiktokId, nickname);
  };
  
  // Sanitize text to prevent XSS
  const sanitize = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };
  
  // Update settings
  const updateSettings = (newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  return (
    <div className="app-container">
      {/* Audio element for notification sounds */}
      <audio id="flaggedCommentSound" preload="auto">
        <source src="https://www.soundjay.com/misc/small-bell-ring-01a.mp3" type="audio/mpeg" />
      </audio>
      
      {/* Notifications */}
      <NotificationContainer notifications={notifications} setNotifications={setNotifications} />
      
      {/* User Lists Toggle Button */}
      <button id="toggleUserLists" onClick={toggleUserListsPanel}>
        Gérer les listes d'utilisateurs
      </button>
      
      {/* User Lists Panel */}
      {userListsVisible && (
        <UserListsPanel 
          userLists={userLists}
          loadUserLists={loadUserLists}
          addToFriendsList={addToFriendsList}
          addToUndesirablesList={addToUndesirablesList}
          removeFriend={removeFriend}
          removeUndesirable={removeUndesirable}
          moveToFriend={moveToFriend}
          moveToUndesirable={moveToUndesirable}
        />
      )}
      
      {/* Connection Form */}
      <ConnectionForm connect={connect} settings={settings} updateSettings={updateSettings} />
      
      {/* Stats and State */}
      <div className="split-state-table">
        <div className="state-text-container">
          <StateText text={stateText} />
        </div>
        <div className="room-stats-container">
          <RoomStats stats={roomStats} moderationStats={moderationStats} />
        </div>
      </div>
      
      {/* Chat and Gifts */}
      <div className="split-chat-table">
        <div className="chat-column">
          <ChatContainer 
            chatItems={chatItems} 
            addToFriendsList={addToFriendsList}
            addToUndesirablesList={addToUndesirablesList}
          />
        </div>
        <div className="gift-column">
          <GiftContainer giftItems={giftItems} />
        </div>
      </div>
    </div>
  );
}

export default App;
