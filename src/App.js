import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Carousel from './components/Carousel';
import FavoritesStats from './components/FavoritesStats';
import AuthModal from './components/AuthModal';
import UserProfile from './components/UserProfile';
import TrackPage from './components/TrackPage';
import { apiService, getToken } from './services/api';
import './App.css';

function App() {
  const [tracks, setTracks] = useState([]);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracks();
    checkAuthentication();
    
    const savedAuthModal = localStorage.getItem('authModalOpen');
    if (savedAuthModal) {
      setAuthModalOpen(JSON.parse(savedAuthModal));
    }

    document.body.style.overflowX = 'hidden';
  }, []);

  const loadTracks = async () => {
    try {
      const response = await apiService.getTracks();
      setTracks(response.data);
    } catch (error) {
      console.error('Error loading tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthentication = async () => {
    try {
      const token = getToken();
      if (token) {
        const response = await apiService.checkAuth();
        if (response.data.authenticated) {
          const profileResponse = await apiService.getProfile();
          setUser({ 
            username: profileResponse.data.username,
            email: profileResponse.data.email
          });
        } else {
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    }
  };

  const handleAuth = (userData) => {
    if (userData.email) {
      localStorage.setItem('userEmail', userData.email);
    }
    
    setUser({ 
      username: userData.username,
      email: userData.email || localStorage.getItem('userEmail') || 'user@example.com'
    });
    setAuthModalOpen(false);
    
    // Редирект через window.location вместо navigate
    window.location.href = '/profile';
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
    }
  };

  const handleFavoriteUpdate = () => {
    console.log('Favorite updated');
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="App">
      <Header 
        user={user} 
        onAuthClick={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        tracks={tracks}
      />

      <Routes>
        <Route path="/" element={
          <main>
            <section className="hero">
              <h1>Всё про музыку из ваших любимых аниме</h1>
              <p>Находите и узнавайте про опенинги, эндинги и осты понравившихся вам аниме</p>
            </section>
            <Carousel 
              onFavoriteUpdate={handleFavoriteUpdate}
              user={user}
              onAuthClick={() => setAuthModalOpen(true)}
            />
            <FavoritesStats />
          </main>
        } />
        
        <Route path="/profile" element={
          <UserProfile 
            user={user} 
            onLogout={handleLogout}
          />
        } />
        
        <Route path="/track/:id" element={
          <TrackPage 
            user={user} 
            onAuthClick={() => setAuthModalOpen(true)} 
          />
        } />
      </Routes>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuth={handleAuth}
      />
    </div>
  );
}

// Оборачиваем App в Router в index.js или тут:
export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}