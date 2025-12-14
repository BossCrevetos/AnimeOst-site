import React from 'react';
import { useNavigate } from 'react-router-dom';

const SearchSuggestions = ({ suggestions, onSelect, visible }) => {
  const navigate = useNavigate();

  const handleSuggestionClick = (track) => {
    navigate(`/track/${track.id}`);
    onSelect();
  };

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="search-suggestions">
      {suggestions.map(track => (
        <div
          key={track.id}
          className="search-suggestion-item"
          onClick={() => handleSuggestionClick(track)}
        >
          <div className="suggestion-image">
            {track.image && (
              <img 
                src={`http://localhost:8000${track.image}`} 
                alt={track.title}
              />
            )}
          </div>
          <div className="suggestion-info">
            <div className="suggestion-title">{track.title}</div>
            <div className="suggestion-artist">{track.artist}</div>
            <div className="suggestion-anime">{track.anime}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchSuggestions;