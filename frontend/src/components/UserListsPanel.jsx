import { useState } from 'react';

function UserListsPanel({ 
  userLists, 
  loadUserLists, 
  addToFriendsList, 
  addToUndesirablesList, 
  removeFriend, 
  removeUndesirable,
  moveToFriend,
  moveToUndesirable
}) {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // Handle tab switching
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    
    // Refresh lists when showing the friends or undesirables tab
    if (tabId !== 'search') {
      loadUserLists();
    }
  };
  
  // Handle user search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    fetch(`/api/users/search?query=${encodeURIComponent(searchQuery.trim())}`)
      .then(response => response.json())
      .then(data => {
        setSearchResults(data);
      })
      .catch(error => {
        console.error('Error searching users:', error);
        setSearchResults([]);
      });
  };
  
  // Add user to undesirables with reason prompt
  const handleAddToUndesirables = (tiktokId, nickname) => {
    const reason = prompt('Raison de l\'ajout aux indésirables (optionnel):');
    addToUndesirablesList(tiktokId, nickname, reason);
  };
  
  // Render friends list
  const renderFriendsList = () => {
    const { friends } = userLists;
    
    if (!friends || friends.length === 0) {
      return <div className="empty-list-message">Aucun ami dans la liste</div>;
    }
    
    return (
      <div className="user-list">
        {friends.map(user => (
          <div className="user-list-item" key={user.tiktok_id} data-tiktok-id={user.tiktok_id}>
            <div className="user-info">
              <a 
                href={`https://www.tiktok.com/@${user.tiktok_id}`} 
                target="_blank" 
                rel="noreferrer" 
                className="user-nickname"
              >
                {user.nickname}
              </a>
              <span className="user-id">@{user.tiktok_id}</span>
              <span className="user-last-seen">
                Dernière apparition: {new Date(user.last_seen).toLocaleString()}
              </span>
            </div>
            <div className="user-actions">
              <button 
                onClick={() => moveToUndesirable(user.tiktok_id, user.nickname)}
                className="move-to-undesirables"
              >
                Déplacer vers indésirables
              </button>
              <button 
                onClick={() => removeFriend(user.tiktok_id)}
                className="remove-friend"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render undesirables list
  const renderUndesirablesList = () => {
    const { undesirables } = userLists;
    
    if (!undesirables || undesirables.length === 0) {
      return <div className="empty-list-message">Aucun utilisateur indésirable dans la liste</div>;
    }
    
    return (
      <div className="user-list">
        {undesirables.map(user => (
          <div className="user-list-item" key={user.tiktok_id} data-tiktok-id={user.tiktok_id}>
            <div className="user-info">
              <a 
                href={`https://www.tiktok.com/@${user.tiktok_id}`} 
                target="_blank" 
                rel="noreferrer" 
                className="user-nickname"
              >
                {user.nickname}
              </a>
              <span className="user-id">@{user.tiktok_id}</span>
              {user.reason && (
                <span className="undesirable-reason">Raison: {user.reason}</span>
              )}
              <span className="user-last-seen">
                Dernière apparition: {new Date(user.last_seen).toLocaleString()}
              </span>
            </div>
            <div className="user-actions">
              <button 
                onClick={() => moveToFriend(user.tiktok_id, user.nickname)}
                className="move-to-friends"
              >
                Déplacer vers amis
              </button>
              <button 
                onClick={() => removeUndesirable(user.tiktok_id)}
                className="remove-undesirable"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render search results
  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return <div className="empty-list-message">Aucun résultat trouvé</div>;
    }
    
    return (
      <div className="user-list">
        {searchResults.map(user => (
          <div className="user-list-item" key={user.tiktok_id} data-tiktok-id={user.tiktok_id}>
            <div className="user-info">
              <a 
                href={`https://www.tiktok.com/@${user.tiktok_id}`} 
                target="_blank" 
                rel="noreferrer" 
                className="user-nickname"
              >
                {user.nickname}
              </a>
              <span className="user-id">@{user.tiktok_id}</span>
              
              {user.is_friend && (
                <span className="user-status friend">Ami</span>
              )}
              
              {user.is_undesirable && (
                <>
                  <span className="user-status undesirable">Indésirable</span>
                  {user.reason && (
                    <span className="undesirable-reason">Raison: {user.reason}</span>
                  )}
                </>
              )}
              
              <span className="user-last-seen">
                Dernière apparition: {new Date(user.last_seen).toLocaleString()}
              </span>
            </div>
            <div className="user-actions">
              {!user.is_friend && (
                <button 
                  onClick={() => addToFriendsList(user.tiktok_id, user.nickname)}
                  className="add-to-friends-search"
                >
                  Ajouter aux amis
                </button>
              )}
              
              {!user.is_undesirable && (
                <button 
                  onClick={() => handleAddToUndesirables(user.tiktok_id, user.nickname)}
                  className="add-to-undesirables-search"
                >
                  Ajouter aux indésirables
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div id="user-lists-panel">
      <h2>Listes d'utilisateurs</h2>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`} 
          onClick={() => handleTabClick('friends')}
        >
          Amis
        </div>
        <div 
          className={`tab ${activeTab === 'undesirables' ? 'active' : ''}`}
          onClick={() => handleTabClick('undesirables')}
        >
          Indésirables
        </div>
        <div 
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => handleTabClick('search')}
        >
          Recherche
        </div>
      </div>
      
      <div className={`tab-content ${activeTab === 'friends' ? 'active' : ''}`} id="friends-tab">
        <h3>Liste des amis</h3>
        {renderFriendsList()}
      </div>
      
      <div className={`tab-content ${activeTab === 'undesirables' ? 'active' : ''}`} id="undesirables-tab">
        <h3>Liste des indésirables</h3>
        {renderUndesirablesList()}
      </div>
      
      <div className={`tab-content ${activeTab === 'search' ? 'active' : ''}`} id="search-tab">
        <h3>Rechercher des utilisateurs</h3>
        <div className="search-form">
          <input 
            type="text" 
            id="userSearchInput" 
            placeholder="Nom d'utilisateur ou @identifiant"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            id="userSearchButton"
            onClick={handleSearch}
          >
            Rechercher
          </button>
        </div>
        <div id="searchResults">
          {renderSearchResults()}
        </div>
      </div>
    </div>
  );
}

export default UserListsPanel; 