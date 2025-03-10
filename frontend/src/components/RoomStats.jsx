function RoomStats({ stats, moderationStats }) {
  if (!stats) {
    return <div id="roomStats">Chargement des statistiques...</div>;
  }

  return (
    <div id="roomStats">
      <div className="stats-section">
        <div className="stat-item">
          <span className="stat-label">Spectateurs:</span>
          <span className="stat-value">{stats.viewerCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Likes:</span>
          <span className="stat-value">{stats.likeCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Diamants:</span>
          <span className="stat-value">{stats.diamondCount}</span>
        </div>
      </div>
      
      {moderationStats && moderationStats.total > 0 && (
        <div className="moderation-stats">
          <h4>Statistiques de modération</h4>
          <div className="stat-item">
            <span className="stat-label">Messages analysés:</span>
            <span className="stat-value">{moderationStats.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Messages signalés:</span>
            <span className="stat-value">{moderationStats.flagged}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Messages propres:</span>
            <span className="stat-value">{moderationStats.clean}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Taux de signalement:</span>
            <span className="stat-value">
              {moderationStats.total > 0 
                ? `${((moderationStats.flagged / moderationStats.total) * 100).toFixed(1)}%` 
                : '0%'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomStats; 