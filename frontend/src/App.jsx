import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import './App.css'

// Components
import ConnectionForm from './components/ConnectionForm'
import ChatContainer from './components/ChatContainer'
import GiftContainer from './components/GiftContainer'
import NotificationContainer from './components/NotificationContainer'
import RoomStats from './components/RoomStats'
import UserListsPanel from './components/UserListsPanel'

function App() {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [roomStats, setRoomStats] = useState({})
  const [userListsVisible, setUserListsVisible] = useState(false)
  const [settings, setSettings] = useState({
    enableSoundNotifications: false,
    showModeration: false,
    showResponses: false,
    enableMentionNotification: true,
    enableModerationNotification: true,
    yourUsername: '',
  })

  useEffect(() => {
    // Initialize socket connection
    try {
      const socketInstance = io(window.location.hostname === 'localhost' 
        ? 'http://localhost:8081' 
        : window.location.origin);
      
      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });
      
      setSocket(socketInstance);
      
      return () => {
        socketInstance.disconnect();
      };
    } catch (error) {
      console.error('Error setting up socket:', error);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for room stats updates
    socket.on('roomStats', (data) => {
      console.log('Received roomStats:', data);
      setRoomStats(data);
    });
    
    // Add connection status logging for debugging
    socket.on('connect', () => {
      console.log('Socket connected to server');
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected from server');
    });
    
    socket.on('tiktokConnected', (state) => {
      console.log('TikTok connected:', state);
      setConnected(true);
    });
    
    socket.on('tiktokDisconnected', (reason) => {
      console.log('TikTok disconnected:', reason);
      setConnected(false);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    return () => {
      socket.off('roomStats');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('tiktokConnected');
      socket.off('tiktokDisconnected');
      socket.off('error');
    }
  }, [socket, setConnected]);

  const toggleUserListsPanel = () => {
    setUserListsVisible(prev => !prev)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <NotificationContainer socket={socket} settings={settings} />
      
      <button 
        onClick={toggleUserListsPanel}
        className="fixed top-4 right-4 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-md transition-colors"
      >
        Gérer les listes d'utilisateurs
      </button>
      
      {userListsVisible && (
        <UserListsPanel 
          socket={socket} 
          onClose={toggleUserListsPanel} 
        />
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Lecteur de Chat TikTok LIVE</h1>
        
        <ConnectionForm 
          socket={socket}
          connected={connected}
          setConnected={setConnected}
          settings={settings}
          setSettings={setSettings}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-sm font-mono overflow-auto max-h-40">
              {JSON.stringify(roomStats, null, 2)}
            </pre>
          </div>
          <RoomStats roomStats={roomStats} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChatContainer socket={socket} settings={settings} />
          <GiftContainer socket={socket} />
        </div>
      </div>
    </div>
  )
}

export default App
