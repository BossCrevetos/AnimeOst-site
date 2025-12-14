import React from 'react';

const TrackCard = ({ track }) => {
  return (
    <div style={{
      background: '#303030',
      borderRadius: '10px',
      padding: '15px',
      textAlign: 'center',
      height: '100%'
    }}>
      <img 
        src={track.image ? `http://localhost:8000${track.image}` : '/default-image.jpg'}
        alt={track.title}
        style={{
          width: '100%',
          height: '120px',
          objectFit: 'cover',
          borderRadius: '8px',
          marginBottom: '10px'
        }}
      />
      <h3 style={{ 
        fontSize: '1.1rem', 
        marginBottom: '8px',
        color: 'white',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {track.title}
      </h3>
      <p style={{ 
        color: '#954cda',
        marginBottom: '5px',
        fontSize: '0.9rem'
      }}>
        {track.artist}
      </p>
      <p style={{ 
        color: '#888',
        fontSize: '0.8rem'
      }}>
        {track.anime}
      </p>
    </div>
  );
};

export default TrackCard;