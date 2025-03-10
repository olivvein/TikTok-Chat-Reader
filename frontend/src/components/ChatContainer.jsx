import { useState, useEffect, useRef } from 'react'

const ChatContainer = ({ socket, settings }) => {
  const [chatMessages, setChatMessages] = useState([])
  const chatContainerRef = useRef(null)

  useEffect(() => {
    if (!socket) return

    const handleChat = (data) => {
      // Create a chat item with the provided data
      const chatItem = {
        id: Date.now() + Math.random(), // Unique ID
        profilePicture: data.profilePictureUrl,
        nickname: data.nickname,
        uniqueId: data.uniqueId,
        text: data.comment,
        color: getUsernameColor(data.uniqueId),
        isFriend: false,
        isUndesirable: false,
        moderationResult: data.moderationResult,
        responseData: data.response,
        timestamp: new Date()
      }

      // Add the chat item to the state
      setChatMessages(prev => [...prev, chatItem])
    }

    const handleUserStatus = (data) => {
      // Update existing messages from this user with their status
      setChatMessages(prev => prev.map(msg => {
        if (msg.uniqueId === data.uniqueId) {
          return {
            ...msg,
            isFriend: data.is_friend,
            isUndesirable: data.is_undesirable,
            undesirableReason: data.reason
          }
        }
        return msg
      }))
    }

    // Register event listeners
    socket.on('chat', handleChat)
    socket.on('userStatus', handleUserStatus)

    // Clean up event listeners
    return () => {
      socket.off('chat', handleChat)
      socket.off('userStatus', handleUserStatus)
    }
  }, [socket])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Generate a consistent color based on the user ID
  const getUsernameColor = (userId) => {
    const colors = [
      'text-blue-400', 'text-green-400', 'text-purple-400', 'text-yellow-400', 
      'text-pink-400', 'text-indigo-400', 'text-red-400', 'text-teal-400'
    ]
    
    // Simple hash function to convert username to color index
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  // Get user status styling
  const getUserStatusClass = (message) => {
    if (message.isUndesirable) return 'bg-red-900/30'
    if (message.isFriend) return 'bg-green-900/30'
    return ''
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <h3 className="text-xl font-semibold p-4 bg-gray-700">Messages</h3>
      <div 
        ref={chatContainerRef}
        className="p-4 h-[500px] overflow-y-auto"
      >
        {chatMessages.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            Aucun message. Connectez-vous à un stream pour voir les messages.
          </div>
        ) : (
          chatMessages.map(message => (
            <div 
              key={message.id} 
              className={`mb-3 p-2 rounded ${getUserStatusClass(message)}`}
            >
              <div className="flex items-start gap-2">
                {message.profilePicture && (
                  <img 
                    src={message.profilePicture} 
                    alt={message.nickname} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className={`font-bold ${message.color}`}>{message.nickname}</span>
                    <span className="text-xs text-gray-400">@{message.uniqueId}</span>
                    {message.isFriend && (
                      <span className="bg-green-800 text-green-200 text-xs px-1 rounded">Ami</span>
                    )}
                    {message.isUndesirable && (
                      <span className="bg-red-800 text-red-200 text-xs px-1 rounded">Indésirable</span>
                    )}
                  </div>
                  <div className="mt-1">{message.text}</div>
                  
                  {/* Moderation information */}
                  {settings.showModeration && message.moderationResult && (
                    <div className={`text-xs mt-2 p-2 rounded ${message.moderationResult.flagged ? 'bg-red-900/30' : 'bg-green-900/30'}`}>
                      <div className="font-bold mb-1">
                        Modération: 
                        <span className={message.moderationResult.flagged ? 'text-red-400 ml-1' : 'text-green-400 ml-1'}>
                          {message.moderationResult.flagged ? 'Signalé' : 'Sécuritaire'}
                        </span>
                      </div>
                      
                      {message.moderationResult.flagged && message.moderationResult.flagged_reason && (
                        <div className="text-red-300 mb-2">
                          Raison: {message.moderationResult.flagged_reason}
                        </div>
                      )}
                      
                      {message.moderationResult.categories && (
                        <div className="grid grid-cols-2 gap-1">
                          {Object.entries(message.moderationResult.categories).map(([category, score]) => (
                            <div 
                              key={category}
                              className={`px-2 py-1 rounded ${parseFloat(score) > 0.5 ? 'bg-red-800/50' : 'bg-green-800/50'}`}
                            >
                              <span className="capitalize">{category}:</span> {(parseFloat(score) * 100).toFixed(1)}%
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* AI Response */}
                  {settings.showResponses && message.responseData && (
                    <div className="text-xs mt-2 p-2 rounded bg-blue-900/30">
                      <div className="font-bold mb-1">Réponse suggérée par l'IA:</div>
                      <div>{message.responseData.text}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChatContainer 