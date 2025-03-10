import { useState, useEffect } from 'react'

const UserListsPanel = ({ socket, onClose }) => {
  const [activeTab, setActiveTab] = useState('friends')
  const [friendsList, setFriendsList] = useState([])
  const [undesirablesList, setUndesirablesList] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!socket) return

    // Load user lists when component mounts
    loadUserLists()

    // Listen for user list updates
    socket.on('userListsUpdated', loadUserLists)

    return () => {
      socket.off('userListsUpdated', loadUserLists)
    }
  }, [socket])

  const loadUserLists = () => {
    socket.emit('getUserLists', (response) => {
      if (response.success) {
        setFriendsList(response.friends || [])
        setUndesirablesList(response.undesirables || [])
      }
    })
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    socket.emit('searchUsers', { query: searchQuery }, (response) => {
      setIsLoading(false)
      if (response.success) {
        setSearchResults(response.results || [])
      } else {
        setSearchResults([])
      }
    })
  }

  const addToFriendsList = (tiktokId, nickname) => {
    socket.emit('addToFriendsList', { tiktokId, nickname }, (response) => {
      if (response.success) {
        loadUserLists()
      }
    })
  }

  const addToUndesirablesList = (tiktokId, nickname, reason = '') => {
    socket.emit('addToUndesirablesList', { tiktokId, nickname, reason }, (response) => {
      if (response.success) {
        loadUserLists()
      }
    })
  }

  const removeFriend = (tiktokId) => {
    socket.emit('removeFriend', { tiktokId }, (response) => {
      if (response.success) {
        loadUserLists()
      }
    })
  }

  const removeUndesirable = (tiktokId) => {
    socket.emit('removeUndesirable', { tiktokId }, (response) => {
      if (response.success) {
        loadUserLists()
      }
    })
  }

  const moveToUndesirable = (tiktokId, nickname) => {
    const reason = prompt('Raison de l\'ajout aux indésirables (optionnel):')
    socket.emit('moveToUndesirable', { tiktokId, nickname, reason }, (response) => {
      if (response.success) {
        loadUserLists()
      }
    })
  }

  const moveToFriend = (tiktokId, nickname) => {
    socket.emit('moveToFriend', { tiktokId, nickname }, (response) => {
      if (response.success) {
        loadUserLists()
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 bg-gray-700">
          <h2 className="text-xl font-bold">Listes d'utilisateurs</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex border-b border-gray-700">
          <button 
            className={`px-4 py-2 ${activeTab === 'friends' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
            onClick={() => setActiveTab('friends')}
          >
            Amis
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'undesirables' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
            onClick={() => setActiveTab('undesirables')}
          >
            Indésirables
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'search' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
            onClick={() => setActiveTab('search')}
          >
            Recherche
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'friends' && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Liste des amis</h3>
              {friendsList.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  Aucun ami dans la liste
                </div>
              ) : (
                <div className="space-y-2">
                  {friendsList.map(user => (
                    <div key={user.tiktok_id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <a 
                          href={`https://www.tiktok.com/@${user.tiktok_id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-medium text-blue-400 hover:underline"
                        >
                          {user.nickname}
                        </a>
                        <div className="text-sm text-gray-400">@{user.tiktok_id}</div>
                        <div className="text-xs text-gray-500">
                          Dernière apparition: {new Date(user.last_seen).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => moveToUndesirable(user.tiktok_id, user.nickname)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-2 py-1 rounded"
                        >
                          Déplacer vers indésirables
                        </button>
                        <button 
                          onClick={() => removeFriend(user.tiktok_id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-2 py-1 rounded"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'undesirables' && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Liste des indésirables</h3>
              {undesirablesList.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  Aucun utilisateur indésirable dans la liste
                </div>
              ) : (
                <div className="space-y-2">
                  {undesirablesList.map(user => (
                    <div key={user.tiktok_id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <a 
                          href={`https://www.tiktok.com/@${user.tiktok_id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="font-medium text-blue-400 hover:underline"
                        >
                          {user.nickname}
                        </a>
                        <div className="text-sm text-gray-400">@{user.tiktok_id}</div>
                        {user.reason && (
                          <div className="text-sm text-red-400">
                            Raison: {user.reason}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Dernière apparition: {new Date(user.last_seen).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => moveToFriend(user.tiktok_id, user.nickname)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm px-2 py-1 rounded"
                        >
                          Déplacer vers amis
                        </button>
                        <button 
                          onClick={() => removeUndesirable(user.tiktok_id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-2 py-1 rounded"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'search' && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Rechercher des utilisateurs</h3>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Nom d'utilisateur ou @identifiant"
                />
                <button 
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
              
              {searchResults.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  {isLoading ? 'Recherche en cours...' : 'Aucun résultat trouvé'}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(user => (
                    <div key={user.tiktok_id} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <a 
                            href={`https://www.tiktok.com/@${user.tiktok_id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="font-medium text-blue-400 hover:underline"
                          >
                            {user.nickname}
                          </a>
                          <div className="text-sm text-gray-400">@{user.tiktok_id}</div>
                          <div className="text-xs text-gray-500">
                            Dernière apparition: {new Date(user.last_seen).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {user.is_friend ? (
                            <span className="bg-green-800 text-green-200 text-xs px-2 py-1 rounded">Ami</span>
                          ) : (
                            <button 
                              onClick={() => addToFriendsList(user.tiktok_id, user.nickname)}
                              className="bg-green-600 hover:bg-green-700 text-white text-sm px-2 py-1 rounded"
                            >
                              Ajouter aux amis
                            </button>
                          )}
                          
                          {user.is_undesirable ? (
                            <span className="bg-red-800 text-red-200 text-xs px-2 py-1 rounded">Indésirable</span>
                          ) : (
                            <button 
                              onClick={() => {
                                const reason = prompt('Raison de l\'ajout aux indésirables (optionnel):')
                                addToUndesirablesList(user.tiktok_id, user.nickname, reason)
                              }}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-2 py-1 rounded"
                            >
                              Ajouter aux indésirables
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {user.is_undesirable && user.reason && (
                        <div className="text-sm text-red-400 mt-1">
                          Raison: {user.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserListsPanel 