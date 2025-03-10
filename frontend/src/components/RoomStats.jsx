import React from 'react'

const RoomStats = ({ roomStats }) => {
  const {
    roomId,
    viewerCount,
    likeCount,
    diamondsCount,
    followersCount,
    totalChats,
    uniqueChatters,
  } = roomStats || {}

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4">Statistiques du Stream</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Viewers</p>
          <p className="text-xl font-bold">{viewerCount || 0}</p>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Likes</p>
          <p className="text-xl font-bold text-pink-400">{formatNumber(likeCount) || 0}</p>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Diamants</p>
          <p className="text-xl font-bold text-blue-400">{formatNumber(diamondsCount) || 0}</p>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Nouveaux Followers</p>
          <p className="text-xl font-bold text-green-400">{formatNumber(followersCount) || 0}</p>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Total Messages</p>
          <p className="text-xl font-bold">{formatNumber(totalChats) || 0}</p>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Participants Uniques</p>
          <p className="text-xl font-bold">{formatNumber(uniqueChatters) || 0}</p>
        </div>
      </div>
      
      {roomId && (
        <div className="mt-4 text-center text-sm text-gray-400">
          ID de la Salle: {roomId}
        </div>
      )}
    </div>
  )
}

// Helper function to format numbers (e.g., 1000 -> 1K)
const formatNumber = (num) => {
  if (!num) return '0'
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  
  return num.toString()
}

export default RoomStats 