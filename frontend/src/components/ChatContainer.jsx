import { useRef, useEffect } from 'react';

function ChatContainer({ chatItems, addToFriendsList, addToUndesirablesList }) {
  const chatContainerRef = useRef(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [chatItems]);
  
  // Generate username link with @ symbol
  const generateUsernameLink = (data) => {
    return (
      <a 
        href={`https://www.tiktok.com/@${data.uniqueId}`} 
        target="_blank" 
        rel="noreferrer" 
        className="username"
      >
        @{data.uniqueId}
      </a>
    );
  };
  
  // Create user action buttons (add to friends/undesirables)
  const createUserActionButtons = (data) => {
    return (
      <div className="user-actions">
        <button 
          className="add-friend" 
          onClick={() => addToFriendsList(data.uniqueId, data.nickname)}
        >
          <span className="action-icon">+</span>
        </button>
        <button 
          className="add-undesirable" 
          onClick={() => {
            const reason = prompt('Raison de l\'ajout aux indésirables (optionnel):');
            addToUndesirablesList(data.uniqueId, data.nickname, reason);
          }}
        >
          <span className="action-icon">-</span>
        </button>
      </div>
    );
  };
  
  // Render a chat message
  const renderChatItem = (item) => {
    const { data, text, type, timestamp, originalComment } = item;
    
    // Handle AI response
    if (type === 'ai-response') {
      return (
        <div className="chat-item ai-response" key={item.id}>
          <div className="chat-header">
            <span className="ai-label">IA</span>
            <span className="timestamp">{new Date(timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="chat-message">
            <div className="original-comment">
              <span className="reply-to">En réponse à: </span>
              {originalComment}
            </div>
            <div className="ai-response-text">{text}</div>
          </div>
        </div>
      );
    }
    
    // Regular chat message
    return (
      <div className="chat-item" key={item.id}>
        <div className="chat-header">
          <span className="nickname">{data.nickname}</span>
          {generateUsernameLink(data)}
          {createUserActionButtons(data)}
          <span className="timestamp">{new Date(timestamp).toLocaleTimeString()}</span>
        </div>
        <div className="chat-message">
          {text}
        </div>
      </div>
    );
  };

  return (
    <div className="chatcontainer">
      <h3 className="containerheader">Messages</h3>
      <div className="chat-items" ref={chatContainerRef}>
        {chatItems.map(item => renderChatItem(item))}
      </div>
    </div>
  );
}

export default ChatContainer; 