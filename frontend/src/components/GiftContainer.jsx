import { useState, useEffect, useRef } from 'react'

const GiftContainer = ({ socket }) => {
  const [gifts, setGifts] = useState([])
  const giftContainerRef = useRef(null)

  useEffect(() => {
    if (!socket) return

    const handleGift = (data) => {
      // Create a gift item with the provided data
      const giftItem = {
        id: Date.now() + Math.random(), // Unique ID
        profilePicture: data.profilePictureUrl,
        nickname: data.nickname,
        uniqueId: data.uniqueId,
        giftPictureUrl: data.giftPictureUrl,
        giftName: data.giftName,
        repeatCount: data.repeatCount,
        diamondCount: data.diamondCount,
        timestamp: new Date()
      }

      // Add the gift item to the state
      setGifts(prev => [...prev, giftItem])
    }

    // Register event listeners
    socket.on('gift', handleGift)

    // Clean up event listeners
    return () => {
      socket.off('gift', handleGift)
    }
  }, [socket])

  // Scroll to bottom when new gifts arrive
  useEffect(() => {
    if (giftContainerRef.current) {
      giftContainerRef.current.scrollTop = giftContainerRef.current.scrollHeight
    }
  }, [gifts])

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <h3 className="text-xl font-semibold p-4 bg-gray-700">Cadeaux</h3>
      <div 
        ref={giftContainerRef}
        className="p-4 h-[500px] overflow-y-auto"
      >
        {gifts.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            Aucun cadeau reçu. Connectez-vous à un stream pour voir les cadeaux.
          </div>
        ) : (
          gifts.map(gift => (
            <div key={gift.id} className="mb-3 p-2 rounded bg-pink-900/20 border border-pink-800/30">
              <div className="flex items-center gap-2">
                {gift.profilePicture && (
                  <img 
                    src={gift.profilePicture} 
                    alt={gift.nickname} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-bold text-pink-400">{gift.nickname}</span>
                    <span className="text-xs text-gray-400">@{gift.uniqueId}</span>
                  </div>
                  <div className="flex items-center mt-2">
                    {gift.giftPictureUrl && (
                      <img 
                        src={gift.giftPictureUrl} 
                        alt={gift.giftName} 
                        className="w-10 h-10 mr-2"
                      />
                    )}
                    <div>
                      <div className="font-medium">{gift.giftName}</div>
                      <div className="flex gap-2 text-xs text-gray-300">
                        <span>x{gift.repeatCount}</span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1 fill-current text-blue-400" viewBox="0 0 24 24">
                            <path d="M12 2L14.85 8.4L22 9.24L17 14.18L18.18 21.32L12 17.77L5.82 21.32L7 14.18L2 9.24L9.15 8.4L12 2Z" />
                          </svg>
                          {gift.diamondCount} diamants
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default GiftContainer 