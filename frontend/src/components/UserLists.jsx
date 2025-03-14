const UserLists = ({ 
  friendsList, 
  undesirablesList, 
  removeFriend, 
  removeUndesirable 
}) => {
  return (
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
  )
}

export default UserLists 