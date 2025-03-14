const GiftsContainer = ({ gifts }) => {
  return (
    <div className="gifts-container">
      <h3>Gifts</h3>
      {gifts.map((gift, index) => (
        <div key={`gift-${index}`} className="gift-item">
          <p>
            <span className="username">{gift.uniqueId}</span> sent {gift.repeatCount}x {gift.giftName}
            {gift.diamondCount > 0 && <span className="diamond-count"> ({gift.diamondCount} 💎)</span>}
          </p>
        </div>
      ))}
    </div>
  )
}

export default GiftsContainer 