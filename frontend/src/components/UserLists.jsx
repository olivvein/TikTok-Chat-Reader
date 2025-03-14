import { useState } from 'react';
import { searchUsers } from '../utils/UserApi';

const UserLists = ({ 
  friendsList, 
  undesirablesList, 
  removeFriend, 
  removeUndesirable,
  addToFriendsList,
  addToUndesirablesList,
  showUserLists,
  toggleUserLists
}) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [undesirableReason, setUndesirableReason] = useState('');
  const [userToAddAsUndesirable, setUserToAddAsUndesirable] = useState(null);

  // Handle search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      setSearchError('Error searching users: ' + error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const openAddUndesirableModal = (user) => {
    setUserToAddAsUndesirable(user);
  };
  
  const confirmAddUndesirable = () => {
    if (userToAddAsUndesirable) {
      addToUndesirablesList(
        userToAddAsUndesirable.tiktok_id, 
        userToAddAsUndesirable.nickname, 
        undesirableReason
      );
      setUserToAddAsUndesirable(null);
      setUndesirableReason('');
    }
  };
  
  const cancelAddUndesirable = () => {
    setUserToAddAsUndesirable(null);
    setUndesirableReason('');
  };

  return (
    <div className={`user-lists-panel ${showUserLists ? 'show' : ''}`}>
      <div className="card shadow">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="mb-0">User Lists</h2>
          <button 
            className="btn-close" 
            onClick={toggleUserLists}
            aria-label="Close"
          ></button>
        </div>
        
        <div className="card-body">
          <ul className="nav nav-tabs mb-3" role="tablist">
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'friends' ? 'active' : ''}`} 
                onClick={() => setActiveTab('friends')}
                role="tab"
              >
                Friends
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'undesirables' ? 'active' : ''}`} 
                onClick={() => setActiveTab('undesirables')}
                role="tab"
              >
                Undesirables
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'search' ? 'active' : ''}`} 
                onClick={() => setActiveTab('search')}
                role="tab"
              >
                Search
              </button>
            </li>
          </ul>
          
          <div className="tab-content">
            {/* Friends Tab */}
            <div className={`tab-pane ${activeTab === 'friends' ? 'show active' : ''}`} role="tabpanel">
              <h3>Friends List</h3>
              <div className="user-list">
                {friendsList.length === 0 ? (
                  <div className="empty-list-message">No friends in the list</div>
                ) : (
                  friendsList.map((friend, index) => (
                    <div key={`friend-${index}`} className="user-list-item card mb-2">
                      <div className="card-body">
                        <div className="user-info">
                          <a 
                            href={`https://www.tiktok.com/@${friend.tiktokId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="user-nickname"
                          >
                            {friend.nickname}
                          </a>
                          <span className="user-id">@{friend.tiktokId}</span>
                        </div>
                        <div className="user-actions mt-2">
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeFriend(friend.tiktokId)}
                          >
                            Remove
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning ms-2"
                            onClick={() => openAddUndesirableModal({
                              tiktok_id: friend.tiktokId,
                              nickname: friend.nickname
                            })}
                          >
                            Move to Undesirables
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Undesirables Tab */}
            <div className={`tab-pane ${activeTab === 'undesirables' ? 'show active' : ''}`} role="tabpanel">
              <h3>Undesirables List</h3>
              <div className="user-list">
                {undesirablesList.length === 0 ? (
                  <div className="empty-list-message">No undesirables in the list</div>
                ) : (
                  undesirablesList.map((undesirable, index) => (
                    <div key={`undesirable-${index}`} className="user-list-item card mb-2">
                      <div className="card-body">
                        <div className="user-info">
                          <a 
                            href={`https://www.tiktok.com/@${undesirable.tiktokId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="user-nickname"
                          >
                            {undesirable.nickname}
                          </a>
                          <span className="user-id">@{undesirable.tiktokId}</span>
                          {undesirable.reason && (
                            <span className="undesirable-reason badge bg-danger ms-2">
                              Reason: {undesirable.reason}
                            </span>
                          )}
                        </div>
                        <div className="user-actions mt-2">
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeUndesirable(undesirable.tiktokId)}
                          >
                            Remove
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary ms-2"
                            onClick={() => addToFriendsList(undesirable.tiktokId, undesirable.nickname)}
                          >
                            Move to Friends
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Search Tab */}
            <div className={`tab-pane ${activeTab === 'search' ? 'show active' : ''}`} role="tabpanel">
              <h3>Search Users</h3>
              <div className="input-group mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Username or @identifier" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-1"></i>
                      Search
                    </>
                  )}
                </button>
              </div>
              
              {searchError && (
                <div className="alert alert-danger">{searchError}</div>
              )}
              
              <div className="user-list search-results">
                {searchResults.length === 0 ? (
                  <div className="empty-list-message">No results found</div>
                ) : (
                  searchResults.map((user, index) => {
                    const isFriend = friendsList.some(f => f.tiktokId === user.tiktok_id);
                    const isUndesirable = undesirablesList.some(u => u.tiktokId === user.tiktok_id);
                    
                    return (
                      <div key={`search-${index}`} className="user-list-item card mb-2">
                        <div className="card-body">
                          <div className="user-info">
                            <a 
                              href={`https://www.tiktok.com/@${user.tiktok_id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="user-nickname"
                            >
                              {user.nickname}
                            </a>
                            <span className="user-id">@{user.tiktok_id}</span>
                            {user.is_friend && (
                              <span className="user-status friend badge bg-primary ms-2">Friend</span>
                            )}
                            {user.is_undesirable && (
                              <span className="user-status undesirable badge bg-danger ms-2">Undesirable</span>
                            )}
                            {user.last_seen && (
                              <span className="user-last-seen text-muted">
                                Last seen: {new Date(user.last_seen).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="user-actions mt-2">
                            {!isFriend && !isUndesirable && (
                              <>
                                <button 
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={() => addToFriendsList(user.tiktok_id, user.nickname)}
                                >
                                  Add to Friends
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => openAddUndesirableModal(user)}
                                >
                                  Add to Undesirables
                                </button>
                              </>
                            )}
                            {isFriend && (
                              <span className="text-success">
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Already in Friends List
                              </span>
                            )}
                            {isUndesirable && (
                              <span className="text-danger">
                                <i className="bi bi-x-circle-fill me-1"></i>
                                Already in Undesirables List
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for adding undesirable with reason */}
      {userToAddAsUndesirable && (
        <div className="modal-backdrop show"></div>
      )}
      <div className={`modal ${userToAddAsUndesirable ? 'd-block' : ''}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add to Undesirables</h5>
              <button type="button" className="btn-close" onClick={cancelAddUndesirable} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {userToAddAsUndesirable && (
                <>
                  <p>Add user <strong>{userToAddAsUndesirable.nickname}</strong> to undesirables list?</p>
                  <div className="mb-3">
                    <label htmlFor="undesirableReason" className="form-label">Reason (optional):</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="undesirableReason" 
                      value={undesirableReason}
                      onChange={(e) => setUndesirableReason(e.target.value)}
                      placeholder="Enter reason for adding to undesirables"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={cancelAddUndesirable}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmAddUndesirable}>Add to Undesirables</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLists; 