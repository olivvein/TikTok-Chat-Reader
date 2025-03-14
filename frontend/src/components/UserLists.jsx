import { useState } from 'react';
import { searchUsers } from '../utils/UserApi';

const UserLists = ({ 
  friendsList = [], 
  undesirablesList = [], 
  removeFriend, 
  removeUndesirable,
  addToFriendsList,
  addToUndesirablesList,
  showUserLists,
  toggleUserLists
}) => {
  // Ensure lists are always arrays
  const friends = Array.isArray(friendsList) ? friendsList : [];
  const undesirables = Array.isArray(undesirablesList) ? undesirablesList : [];
  
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [undesirableReason, setUndesirableReason] = useState('');
  const [userToAddAsUndesirable, setUserToAddAsUndesirable] = useState(null);
  const [quickRemoveQuery, setQuickRemoveQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState({ friends: [], undesirables: [] });

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
      // Support both property naming conventions
      const tiktokId = userToAddAsUndesirable.tiktokId || userToAddAsUndesirable.tiktok_id;
      const nickname = userToAddAsUndesirable.nickname;
      
      addToUndesirablesList(
        tiktokId, 
        nickname, 
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

  // Handle quick remove functionality
  const handleQuickRemoveSearch = (query) => {
    setQuickRemoveQuery(query);
    
    if (!query.trim()) {
      setFilteredUsers({ friends: [], undesirables: [] });
      return;
    }
    
    const queryLower = query.toLowerCase();
    
    // Filter friends list
    const filteredFriends = friends.filter(friend => 
      friend.nickname.toLowerCase().includes(queryLower) || 
      friend.tiktokId.toLowerCase().includes(queryLower)
    );
    
    // Filter undesirables list
    const filteredUndesirables = undesirables.filter(undesirable => 
      undesirable.nickname.toLowerCase().includes(queryLower) || 
      undesirable.tiktokId.toLowerCase().includes(queryLower)
    );
    
    setFilteredUsers({
      friends: filteredFriends,
      undesirables: filteredUndesirables
    });
  };

  const handleQuickRemoveKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleQuickRemoveSearch(quickRemoveQuery);
    }
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
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'quickRemove' ? 'active' : ''}`} 
                onClick={() => setActiveTab('quickRemove')}
                role="tab"
              >
                Quick Remove
              </button>
            </li>
          </ul>
          
          <div className="tab-content">
            {/* Friends Tab */}
            <div className={`tab-pane ${activeTab === 'friends' ? 'show active' : ''}`} role="tabpanel">
              <h3>Friends List</h3>
              <div className="user-list">
                {friends.length === 0 ? (
                  <div className="empty-list-message">No friends in the list</div>
                ) : (
                  friends.map((friend, index) => (
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
                {undesirables.length === 0 ? (
                  <div className="empty-list-message">No undesirables in the list</div>
                ) : (
                  undesirables.map((undesirable, index) => (
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
                    // Support both snake_case and camelCase property names
                    const tiktokId = user.tiktokId || user.tiktok_id;
                    const nickname = user.nickname;
                    
                    // Check if the user is in either list
                    const isFriend = friends.some(f => 
                      (f.tiktokId === tiktokId) || (f.tiktok_id === tiktokId)
                    );
                    const isUndesirable = undesirables.some(u => 
                      (u.tiktokId === tiktokId) || (u.tiktok_id === tiktokId)
                    );
                    
                    return (
                      <div key={`search-${index}`} className="user-list-item card mb-2">
                        <div className="card-body">
                          <div className="user-info">
                            <a 
                              href={`https://www.tiktok.com/@${tiktokId}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="user-nickname"
                            >
                              {nickname}
                            </a>
                            <span className="user-id">@{tiktokId}</span>
                            {(user.is_friend || isFriend) && (
                              <span className="user-status friend badge bg-primary ms-2">Friend</span>
                            )}
                            {(user.is_undesirable || isUndesirable) && (
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
                                  onClick={() => addToFriendsList(tiktokId, nickname)}
                                >
                                  Add to Friends
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => openAddUndesirableModal({
                                    tiktok_id: tiktokId,
                                    nickname: nickname
                                  })}
                                >
                                  Add to Undesirables
                                </button>
                              </>
                            )}
                            {isFriend && (
                              <div className="d-flex align-items-center">
                                <span className="text-success me-2">
                                  <i className="bi bi-check-circle-fill me-1"></i>
                                  In Friends List
                                </span>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeFriend(tiktokId)}
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                            {isUndesirable && (
                              <div className="d-flex align-items-center">
                                <span className="text-danger me-2">
                                  <i className="bi bi-x-circle-fill me-1"></i>
                                  In Undesirables List
                                </span>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeUndesirable(tiktokId)}
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Remove Tab */}
            <div className={`tab-pane ${activeTab === 'quickRemove' ? 'show active' : ''}`} role="tabpanel">
              <h3>Quick Remove Users</h3>
              <div className="input-group mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search users to remove..." 
                  value={quickRemoveQuery}
                  onChange={(e) => handleQuickRemoveSearch(e.target.value)}
                  onKeyPress={handleQuickRemoveKeyPress}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleQuickRemoveSearch(quickRemoveQuery)}
                >
                  <i className="bi bi-search me-1"></i>
                  Filter
                </button>
              </div>

              {/* Friends section */}
              {filteredUsers.friends.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-primary">
                    <i className="bi bi-people-fill me-2"></i>
                    Friends ({filteredUsers.friends.length})
                  </h4>
                  <div className="list-group">
                    {filteredUsers.friends.map((friend, index) => (
                      <div key={`quick-friend-${index}`} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{friend.nickname}</strong>
                          <span className="text-muted ms-2">@{friend.tiktokId}</span>
                        </div>
                        <div>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => removeFriend(friend.tiktokId)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Undesirables section */}
              {filteredUsers.undesirables.length > 0 && (
                <div>
                  <h4 className="text-danger">
                    <i className="bi bi-person-x-fill me-2"></i>
                    Undesirables ({filteredUsers.undesirables.length})
                  </h4>
                  <div className="list-group">
                    {filteredUsers.undesirables.map((undesirable, index) => (
                      <div key={`quick-undesirable-${index}`} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{undesirable.nickname}</strong>
                          <span className="text-muted ms-2">@{undesirable.tiktokId}</span>
                          {undesirable.reason && (
                            <span className="badge bg-danger ms-2">{undesirable.reason}</span>
                          )}
                        </div>
                        <div>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => removeUndesirable(undesirable.tiktokId)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {quickRemoveQuery && filteredUsers.friends.length === 0 && filteredUsers.undesirables.length === 0 && (
                <div className="alert alert-info">
                  No users found matching "{quickRemoveQuery}"
                </div>
              )}

              {!quickRemoveQuery && (
                <div className="text-center text-muted my-4">
                  <i className="bi bi-search" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3">Type a username to find users to remove</p>
                </div>
              )}
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