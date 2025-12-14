import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const TrackPage = ({ user, onAuthClick }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState(null);
  const [favoriteStats, setFavoriteStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Авто-расширение текстового поля
  const autoResizeTextarea = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  useEffect(() => {
    loadTrackData();
  }, [id]);

  const loadTrackData = async () => {
    try {
      const response = await apiService.getTracks();
      const foundTrack = response.data.find(t => t.id === parseInt(id));
      
      if (foundTrack) {
        setTrack(foundTrack);
        await loadFavoriteStatus(foundTrack.id);
        await loadFavoriteStats(foundTrack.id);
        await loadComments(foundTrack.id);
      } else {
        console.error('Track not found');
      }
    } catch (error) {
      console.error('Error loading track:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteStatus = async (trackId) => {
    try {
      const response = await apiService.checkFavorite(trackId);
      setIsFavorite(response.data.is_favorite);
    } catch (error) {
      console.error('Error loading favorite status:', error);
    }
  };

  const loadFavoriteStats = async (trackId) => {
    try {
      const response = await apiService.getTrackFavoriteCount(trackId);
      setFavoriteStats({
        favorite_count: response.data.favorite_count,
        id: trackId
      });
    } catch (error) {
      console.error('Error loading favorite stats:', error);
      // Если ошибка, ставим 0
      setFavoriteStats({
        favorite_count: 0,
        id: trackId
      });
    }
  };

  const loadComments = async (trackId) => {
    try {
      const response = await apiService.getComments(trackId);
      setComments(response.data);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      onAuthClick();
      return;
    }
    
    setIsFavoriteLoading(true);
    
    try {
      await apiService.addToFavorites(track.id);
      setIsFavorite(!isFavorite);
      await loadFavoriteStats(track.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    // Проверка на длину комментария
    if (newComment.length > 100) {
      alert('Комментарий не может превышать 100 символов');
      return;
    }

    try {
      const response = await apiService.addComment(track.id, newComment);
      setComments([response.data, ...comments]);
      setNewComment('');
      
      // Сбрасываем высоту текстового поля после отправки
      const textarea = document.querySelector('.comment-form textarea');
      if (textarea) {
        textarea.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!track) {
    return (
      <div className="track-detail-page">
        <div className="track-detail-not-found">
          <h2>Трек не найден</h2>
          <button onClick={() => navigate('/')}>Вернуться на главную</button>
        </div>
      </div>
    );
  }

  return (
    <div className="track-detail-page">
      <div className="track-detail-header">
        <div className="track-detail-image">
          <img 
            src={track.image ? `http://localhost:8000${track.image}` : '/images/background.jpg'} 
            alt={track.title}
          />
        </div>
        
        <div className="track-detail-info">
          <h1 className="track-detail-title">{track.title}</h1>
          <p className="track-detail-artist">{track.artist}</p>
          <p className="track-detail-anime">{track.anime}</p>
          
          <div className="track-detail-actions">
            <button className="track-detail-play-btn">
              <span>▶</span>
              Слушать
            </button>
            
            <div className="track-detail-favorite-section">
              <button 
                className={`track-heart-btn ${isFavorite ? 'added' : ''} ${isFavoriteLoading ? 'loading' : ''}`}
                onClick={toggleFavorite}
                disabled={isFavoriteLoading}
              >
                {isFavorite ? '♥' : '♡'}
              </button>
              <span className="track-favorite-count">
                {favoriteStats?.favorite_count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="track-detail-content">
        <div className="lyrics-section">
          <h2>Текст песни</h2>
          <div className="lyrics-text">
            {track.lyrics_romanized ? (
              <pre>{track.lyrics_romanized}</pre>
            ) : track.lyrics ? (
              <pre>{track.lyrics}</pre>
            ) : (
              <p>Текст песни будет добавлен позже...</p>
            )}
          </div>
        </div>

        <div className="comments-section">
          <h2>Комментарии</h2>
          
          {/* Форма добавления комментария */}
          {user ? (
            <form className="comment-form" onSubmit={handleAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onInput={autoResizeTextarea}
                placeholder="Напишите ваш комментарий (максимум 100 символов)..."
                rows="1"
                maxLength={100}
                style={{
                  resize: 'none',
                  WebkitResize: 'none',
                  MozResize: 'none',
                  msResize: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || newComment.length > 100}
              >
                Отправить
              </button>
            </form>
          ) : (
            <p className="login-to-comment">
              <button onClick={onAuthClick}>Войдите</button>, чтобы оставить комментарий
            </p>
          )}

          {/* Список комментариев */}
          <div className="comments-list">
            {comments.length > 0 ? (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    {comment.user.avatar ? (
                      <img src={comment.user.avatar} alt={comment.user.username} />
                    ) : (
                      <div className={`avatar-placeholder ${comment.user.is_deleted ? 'deleted-account' : ''}`}>
                        {comment.user.is_deleted ? '🗑️' : comment.user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className={`comment-author ${comment.user.is_deleted ? 'deleted-account' : ''}`}>
                        {comment.user.username}
                        {comment.user.is_deleted && <span className="deleted-badge"> (удален)</span>}
                      </span>
                      <span className="comment-date">
                        {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-comments">Пока нет комментариев. Будьте первым!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackPage;