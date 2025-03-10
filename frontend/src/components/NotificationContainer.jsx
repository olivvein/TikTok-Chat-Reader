import { useState, useEffect, useRef } from 'react'

const NotificationContainer = ({ socket, settings }) => {
  const [notifications, setNotifications] = useState([])
  const audioRef = useRef(null)

  useEffect(() => {
    if (!socket) return

    socket.on('mention', (data) => {
      if (settings.enableMentionNotification) {
        addNotification({
          type: 'mention',
          title: 'Mention',
          message: `Vous avez été mentionné par ${data.nickname} (@${data.uniqueId}): ${data.text}`,
          data
        })
        playSound()
      }
    })

    socket.on('moderationNotification', (data) => {
      if (settings.enableModerationNotification) {
        addNotification({
          type: 'moderation',
          title: 'Alerte Modération',
          message: `Message flaggé de ${data.nickname} (@${data.uniqueId}): ${data.text}`,
          reason: data.moderationResult?.flagged_reason,
          data
        })
        playSound()
      }
    })

    socket.on('userJoined', (data) => {
      // Check user status
      socket.emit('getUserStatus', data.uniqueId)
    })

    socket.on('userStatus', (data) => {
      if (data.is_friend) {
        addNotification({
          type: 'friend-join',
          title: 'Ami Rejoint',
          message: `${data.nickname} (@${data.uniqueId}) a rejoint le chat`,
          data
        })
        playSound()
      } else if (data.is_undesirable) {
        addNotification({
          type: 'undesirable-join',
          title: 'Utilisateur Indésirable',
          message: `⚠️ ${data.nickname} (@${data.uniqueId}) a rejoint le chat`,
          reason: data.reason,
          data
        })
        playSound()
      }
    })

    return () => {
      socket.off('mention')
      socket.off('moderationNotification')
      socket.off('userJoined')
      socket.off('userStatus')
    }
  }, [socket, settings])

  const addNotification = (notification) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { ...notification, id }])
    
    // Remove notification after 7 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 7000)
  }

  const playSound = () => {
    if (settings.enableSoundNotifications && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.error('Error playing sound:', e))
    }
  }

  return (
    <div className="fixed top-4 left-4 z-50 max-w-md">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`bg-gray-800 border-l-4 ${getNotificationClass(notification.type)} p-4 mb-3 shadow-lg rounded-r-md animate-slideIn`}
        >
          <div className="font-bold">{notification.title}</div>
          <div className="text-sm">{notification.message}</div>
          {notification.reason && (
            <div className="text-xs mt-1 text-red-300">
              Raison: {notification.reason}
            </div>
          )}
        </div>
      ))}
      <audio 
        ref={audioRef} 
        preload="auto" 
        src="https://www.soundjay.com/misc/small-bell-ring-01a.mp3"
      />
    </div>
  )
}

// Helper function to determine notification styling
const getNotificationClass = (type) => {
  switch (type) {
    case 'mention':
      return 'border-blue-500'
    case 'moderation':
      return 'border-red-500'
    case 'friend-join':
      return 'border-green-500'
    case 'undesirable-join':
      return 'border-yellow-500'
    default:
      return 'border-gray-500'
  }
}

export default NotificationContainer 