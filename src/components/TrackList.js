import React from 'react';

const TrackList = ({ tracks }) => {
  return (
    <section style={{ padding: '2rem' }}>
      <h2>Все треки ({tracks.length})</h2>
      <div style={{ marginTop: '1rem' }}>
        {tracks.map(track => (
          <div key={track.id} style={{
            background: '#303030',
            padding: '1rem',
            margin: '0.5rem 0',
            borderRadius: '8px',
            border: '1px solid #444'
          }}>
            <h3>{track.title}</h3>
            <p>🎵 {track.artist}</p>
            <p>📺 {track.anime}</p>
            {track.image && (
              <img 
                src={`http://localhost:8000${track.image}`}
                alt={track.title}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginTop: '10px'
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrackList;