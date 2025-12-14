import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const Carousel = ({ onFavoriteUpdate, user, onAuthClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [tracks, setTracks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTopTracks = async () => {
      try {
        const response = await apiService.getTopTracks();
        setTracks(response.data);
      } catch (error) {
        console.error('Error loading top tracks:', error);
      }
    };
    
    loadTopTracks();
  }, []);

  useEffect(() => {
    if (tracks.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tracks.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [tracks.length]);

  useEffect(() => {
    if (tracks.length > 0) {
      loadFavorites();
    }
  }, [tracks]);

  const loadFavorites = async () => {
    try {
      const favoriteStatuses = await Promise.all(
        tracks.map(track => apiService.checkFavorite(track.id))
      );
      
      const favoriteIds = favoriteStatuses
        .map((response, index) => ({
          id: tracks[index].id,
          isFavorite: response.data.is_favorite
        }))
        .filter(item => item.isFavorite)
        .map(item => item.id);
      
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (trackId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      if (onAuthClick) {
        onAuthClick();
      }
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, [trackId]: true }));
    
    try {
      const wasFavorite = favorites.includes(trackId);
      if (wasFavorite) {
        setFavorites(favorites.filter(id => id !== trackId));
      } else {
        setFavorites([...favorites, trackId]);
      }
      
      await apiService.addToFavorites(trackId);
      
      setTimeout(() => {
        loadFavorites();
      }, 100);
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      if (favorites.includes(trackId)) {
        setFavorites(favorites.filter(id => id !== trackId));
      } else {
        setFavorites([...favorites, trackId]);
      }
      
      if (error.response?.status === 401) {
        alert('Для добавления в избранное необходимо авторизоваться');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [trackId]: false }));
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % tracks.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleCardClick = (trackId, e) => {
    // Проверяем, что клик был не по интерактивным элементам
    if (e.target.closest('.heart-btn') || 
        e.target.closest('.play-btn') || 
        e.target.closest('.progress-container')) {
      return;
    }
    navigate(`/track/${trackId}`);
  };

  if (tracks.length === 0) {
    return (
      <section className="popular-tracks">
        <h2>Популярные треки</h2>
        <div className="carousel-container">
          <p>Загрузка треков...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="popular-tracks">
      <h2>Популярные треки</h2>
      <div className="carousel-container">
        <button className="carousel-btn carousel-btn-prev" onClick={prevSlide}>‹</button>
        
        <div className="carousel">
          <div className="carousel-track">
            {tracks.map((track, index) => {
              let position = index - currentIndex;
              
              if (position > Math.floor(tracks.length / 2)) {
                position -= tracks.length;
              } else if (position < -Math.floor(tracks.length / 2)) {
                position += tracks.length;
              }
              
              const isFavorite = favorites.includes(track.id);
              const isLoading = loadingStates[track.id];
              
              return (
                <div
                  key={`track-${track.id}-${index}`}
                  className="carousel-card"
                  data-position={position}
                  onClick={(e) => handleCardClick(track.id, e)}
                >
                  <img 
                    src={track.image ? `http://localhost:8000${track.image}` : '/images/background.jpg'} 
                    alt="Обложка трека" 
                    className="track-image"
                  />
                  <div className="track-content">
                    <h3 className="track-title">{track.title}</h3>
                    <p className="track-artist">{track.artist}</p>
                    <p className="track-anime">{track.anime}</p>
                    <div className="track-player">
                      <button 
                        className={`heart-btn ${isFavorite ? 'added' : ''} ${isLoading ? 'loading' : ''}`}
                        onClick={(e) => toggleFavorite(track.id, e)}
                        onMouseDown={(e) => e.preventDefault()}
                        onTouchStart={(e) => e.preventDefault()}
                        disabled={isLoading}
                        type="button"
                      >
                        {isFavorite ? '♥' : '♡'}
                      </button>
                      <button className="play-btn"></button>
                      <div className="progress-container">
                        <div className="progress-bar"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <button className="carousel-btn carousel-btn-next" onClick={nextSlide}>›</button>
        
        <div className="carousel-dots">
          {tracks.map((_, index) => (
            <div
              key={`dot-${index}`}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Carousel;