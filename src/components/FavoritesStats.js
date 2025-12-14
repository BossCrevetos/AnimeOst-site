import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const FavoritesStats = () => {
  const [stats, setStats] = useState({ top_favorites: [], recent_favorites: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Автообновление каждые 2 секунды
    const interval = setInterval(() => {
      loadStats();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.getFavoritesStats();
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Загрузка статистики...</div>;
  }

  return (
    <div className="favorites-stats">
      {/* Секция топ избранных треков */}
      <section className="favorites-section">
        <h2>Топ по добавлениям в "Любимое"</h2>
        <div className="favorites-table-container">
          <table className="favorites-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>№</th>
                <th>Трек</th>
                <th style={{ width: '100px' }}>Добавлений</th>
              </tr>
            </thead>
            <tbody className="favorites-top-table">
              {stats.top_favorites.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-favorites">
                    Пока никто не добавил треки в избранное
                  </td>
                </tr>
              ) : (
                stats.top_favorites.map((track, index) => (
                  <tr key={`top-${track.id}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="favorite-track-info">
                        <img 
                          src={track.image ? `http://localhost:8000${track.image}` : '/images/background.jpg'} 
                          alt={track.title} 
                          className="favorite-track-image"
                          onError={(e) => {
                            e.target.src = '/images/background.jpg';
                          }}
                        />
                        <div className="favorite-track-details">
                          <div className="favorite-track-title">{track.title}</div>
                          <div className="favorite-track-artist">{track.artist}</div>
                          <div className="favorite-track-anime">{track.anime}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="favorite-count">{track.favorite_count}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Секция последних избранных треков */}
      <section className="favorites-section">
        <h2>Последние добавленные в "Любимое"</h2>
        <div className="favorites-table-container">
          <table className="favorites-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>№</th>
                <th>Трек</th>
                <th style={{ width: '120px' }}>Когда добавлен</th>
              </tr>
            </thead>
            <tbody className="favorites-recent-table">
              {stats.recent_favorites.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-favorites">
                    Пока нет недавно добавленных треков
                  </td>
                </tr>
              ) : (
                stats.recent_favorites.map((track, index) => (
                  <tr key={`recent-${track.id}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="favorite-track-info">
                        <img 
                          src={track.image ? `http://localhost:8000${track.image}` : '/images/background.jpg'} 
                          alt={track.title} 
                          className="favorite-track-image"
                          onError={(e) => {
                            e.target.src = '/images/background.jpg';
                          }}
                        />
                        <div className="favorite-track-details">
                          <div className="favorite-track-title">{track.title}</div>
                          <div className="favorite-track-artist">{track.artist}</div>
                          <div className="favorite-track-anime">{track.anime}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#888', fontSize: '13px' }}>{track.time_added}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default FavoritesStats;