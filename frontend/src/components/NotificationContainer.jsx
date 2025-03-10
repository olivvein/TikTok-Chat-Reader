import { useEffect } from 'react';

function NotificationContainer({ notifications, setNotifications }) {
  useEffect(() => {
    // Auto-remove notifications after a delay
    const timers = notifications.map(notification => {
      return setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 7000); // 7 seconds total (same as original)
    });
    
    // Clean up timers
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, setNotifications]);
  
  // Render different notification types
  const renderNotification = (notification) => {
    switch (notification.type) {
      case 'user-join':
        return renderJoinNotification(notification, false);
      case 'follower-join':
        return renderJoinNotification(notification, true);
      case 'mention':
        return renderMentionNotification(notification);
      case 'moderation':
        return renderModerationNotification(notification);
      default:
        return null;
    }
  };
  
  // Render join notification (regular user or follower)
  const renderJoinNotification = (notification, isFollower) => {
    const { data } = notification;
    const notificationClass = isFollower ? 'follower-notification' : 'join-notification';
    const notificationTitle = isFollower ? 'Abonné(e) a rejoint' : 'Utilisateur a rejoint';
    
    return (
      <div className={`notification ${notificationClass}`} key={notification.id}>
        <div className="notification-title">{notificationTitle}</div>
        <div className="notification-message">
          <b>{data.nickname}</b> (@{data.uniqueId}) a rejoint le chat
        </div>
      </div>
    );
  };
  
  // Render mention notification
  const renderMentionNotification = (notification) => {
    const { data, text } = notification;
    
    return (
      <div className="notification mention-notification" key={notification.id}>
        <div className="notification-title">Vous avez été mentionné</div>
        <div className="notification-message">
          <b>{data.nickname}</b> (@{data.uniqueId}) vous a mentionné: <br />
          <span className="notification-text">{text}</span>
        </div>
      </div>
    );
  };
  
  // Render moderation notification
  const renderModerationNotification = (notification) => {
    const { data, text, moderationResult } = notification;
    
    // Extract specific flagged categories for more detailed display
    const flaggedCategories = [];
    const categories = moderationResult.categories || {};
    
    Object.keys(categories).forEach(category => {
      if (categories[category]) {
        switch (category) {
          case 'sexual':
            flaggedCategories.push('Contenu sexuel');
            break;
          case 'hate':
            flaggedCategories.push('Discours haineux');
            break;
          case 'harassment':
            flaggedCategories.push('Harcèlement');
            break;
          case 'self-harm':
            flaggedCategories.push('Auto-mutilation');
            break;
          case 'sexual/minors':
            flaggedCategories.push('Contenu sexuel impliquant des mineurs');
            break;
          case 'hate/threatening':
            flaggedCategories.push('Menaces haineuses');
            break;
          case 'violence/graphic':
            flaggedCategories.push('Violence graphique');
            break;
          case 'self-harm/intent':
            flaggedCategories.push('Intention d\'auto-mutilation');
            break;
          case 'self-harm/instructions':
            flaggedCategories.push('Instructions d\'auto-mutilation');
            break;
          case 'harassment/threatening':
            flaggedCategories.push('Menaces de harcèlement');
            break;
          case 'violence':
            flaggedCategories.push('Violence');
            break;
          default:
            flaggedCategories.push(category);
        }
      }
    });
    
    return (
      <div className="notification moderation-notification" key={notification.id}>
        <div className="notification-title">Message signalé</div>
        <div className="notification-message">
          <b>{data.nickname}</b> (@{data.uniqueId}) : <br />
          <span className="notification-text">{text}</span>
          <div className="notification-categories">
            <span className="categories-title">Catégories signalées :</span>
            {flaggedCategories.map((category, index) => (
              <span className="flagged-category" key={index}>{category}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="notification-container">
      {notifications.map(notification => renderNotification(notification))}
    </div>
  );
}

export default NotificationContainer; 