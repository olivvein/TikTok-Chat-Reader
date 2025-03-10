import { useRef, useEffect } from 'react';

function GiftContainer({ giftItems }) {
  const giftContainerRef = useRef(null);
  
  // Auto-scroll to bottom when new gifts arrive
  useEffect(() => {
    if (giftContainerRef.current) {
      const container = giftContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [giftItems]);
  
  // Format gift value
  const formatGiftValue = (diamondValue) => {
    if (diamondValue >= 1000) {
      return `${(diamondValue / 1000).toFixed(1)}K`;
    }
    return diamondValue.toString();
  };
  
  // Render a gift item
  const renderGiftItem = (item) => {
    const { data, timestamp } = item;
    const isPendingStreak = data.repeatEnd === 1;
    
    return (
      <div className={`gift-item ${isPendingStreak ? 'pending-streak' : ''}`} key={item.id}>
        <div className="gift-header">
          <span className="nickname">{data.nickname}</span>
          <a 
            href={`https://www.tiktok.com/@${data.uniqueId}`} 
            target="_blank" 
            rel="noreferrer" 
            className="username"
          >
            @{data.uniqueId}
          </a>
          <span className="timestamp">{new Date(timestamp).toLocaleTimeString()}</span>
        </div>
        <div className="gift-info">
          <div className="gift-name">
            {data.giftName}
            {data.repeatCount > 1 && !isPendingStreak && (
              <span className="gift-repeat"> x{data.repeatCount}</span>
            )}
            {isPendingStreak && (
              <span className="gift-streak-pending"> (Combo en cours...)</span>
            )}
          </div>
          <div className="gift-value">
            <span className="diamond-icon">💎</span>
            <span className="diamond-value">
              {formatGiftValue(data.diamondCount * (isPendingStreak ? 1 : data.repeatCount))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="giftcontainer">
      <h3 className="containerheader">Cadeaux</h3>
      <div className="gift-items" ref={giftContainerRef}>
        {giftItems.map(item => renderGiftItem(item))}
      </div>
    </div>
  );
}

export default GiftContainer; 