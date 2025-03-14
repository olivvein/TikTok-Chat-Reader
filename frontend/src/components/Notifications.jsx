const Notifications = ({ notifications, removeNotification }) => {
  return (
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
  )
}

export default Notifications 