const ChatMessage = ({ 
  message, 
  showModeration,
  showAIResponses,
  addToFriendsList,
  addToUndesirablesList 
}) => {
  let messageContent;
  let messageClass = 'chat-message';
  
  if (message.type === 'join') {
    messageContent = <p>{message.uniqueId} joined the room</p>;
    messageClass += ' join-message';
  } else if (message.type === 'follow') {
    messageContent = <p>{message.uniqueId} followed the host</p>;
    messageClass += ' follow-message';
  } else {
    messageContent = (
      <>
        <span className="username">{message.uniqueId}: </span>
        <span className="message-text">{message.comment}</span>
        
        {showModeration && message.moderation && (
          <div className={`moderation-result ${message.moderation.flagged ? 'flagged' : 'safe'}`}>
            <div className="moderation-badge">
              {message.moderation.flagged ? '⚠️ Flagged' : '✅ Safe'}
            </div>
            
            {message.moderation.flagged && message.moderation.categories && (
              <div className="moderation-categories">
                {Object.entries(message.moderation.categories).map(([category, isFlagged]) => 
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
            {message.pendingResponse ? (
              <div className="loading-response">Generating AI response...</div>
            ) : message.suggestedResponse ? (
              <div className="suggested-response">
                <span className="response-label">AI Response: </span>
                <span className="response-text">{message.suggestedResponse}</span>
              </div>
            ) : null}
          </div>
        )}
      </>
    );
  }
  
  // Add user status classes
  if (message.userStatus) {
    if (message.userStatus.isFriend) messageClass += ' friend-message';
    if (message.userStatus.isUndesirable) messageClass += ' undesirable-message';
  }
  
  return (
    <div className={messageClass}>
      {messageContent}
      
      <div className="user-actions">
        <button 
          onClick={() => addToFriendsList(message.userId, message.uniqueId)}
          className="friend-button"
          title="Add to Friends"
        >
          👍
        </button>
        <button 
          onClick={() => addToUndesirablesList(message.userId, message.uniqueId)}
          className="undesirable-button"
          title="Add to Undesirables"
        >
          👎
        </button>
      </div>
    </div>
  )
}

export default ChatMessage 