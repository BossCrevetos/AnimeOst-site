import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchSuggestions from './SearchSuggestions';
import { normalizeForSearch } from '../utils/transliterate';

const Header = ({ user, onAuthClick, onLogout, tracks }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Поиск треков
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 1) {
      const normalizedQuery = normalizeForSearch(query);
      
      const filtered = tracks.filter(track => {
        // Нормализуем названия для поиска
        const normalizedTitle = normalizeForSearch(track.title);
        const normalizedArtist = normalizeForSearch(track.artist);
        const normalizedAnime = normalizeForSearch(track.anime);
        
        // Ищем по нормализованным версиям
        return normalizedTitle.includes(normalizedQuery) ||
               normalizedArtist.includes(normalizedQuery) ||
               normalizedAnime.includes(normalizedQuery);
      }).slice(0, 5);
      
      setSearchSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const normalizedQuery = normalizeForSearch(searchQuery.trim());
      
      const exactMatch = tracks.find(track => {
        const normalizedTitle = normalizeForSearch(track.title);
        return normalizedTitle === normalizedQuery;
      });
      
      if (exactMatch) {
        navigate(`/track/${exactMatch.id}`);
        setSearchQuery('');
        setShowSuggestions(false);
      }
    }
  };

  // Закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('menu-open');
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('menu-open');
    };
  }, [mobileMenuOpen]);

  const handleDropdownToggle = (e) => {
    e.preventDefault();
    setDropdownOpen(!dropdownOpen);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header style={headerStyle}>
      <nav>
        <div 
          className="logo" 
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          AnimeOst
        </div>
        
        <button 
          className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
          onClick={handleMobileMenuToggle}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <ul className={`menu ${mobileMenuOpen ? 'active' : ''}`} ref={mobileMenuRef}>
          <li className="dropdown" ref={dropdownRef}>
            <a href="#" className="dropbtn" onClick={handleDropdownToggle}>
              Главная ⏷
            </a>
            <ul className={`dropdown-content ${dropdownOpen ? 'show' : ''}`}>                       
              <li><a href="#" className="dropdown-section">Типы музыки</a></li>
              <li><a href="#">Опенинги</a></li>
              <li><a href="#">Эндинги</a></li>
              <li><a href="#">Темы/Саундтреки</a></li>
              
              <li><a href="#" className="dropdown-section">Подборки</a></li>
              <li><a href="#">Популярное</a></li>
              <li><a href="#">Новое</a></li>
              <li><a href="#">Лучшее из недооцененных</a></li>
            </ul>
          </li>
          
          <li>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Иконка профиля */}
                <button 
                  onClick={() => {
                    navigate('/profile');
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#8024c3ff'
                  }}
                  title="Личный кабинет"
                >
                  <span style={{ 
                    color: 'white', 
                    fontSize: '16px', 
                    fontWeight: 'bold' 
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </button>
                
                {/* Кнопка выхода */}
                <a href="#" className="register-btn" onClick={(e) => {
                  e.preventDefault();
                  onLogout();
                  setMobileMenuOpen(false);
                }}>
                  <img src="/images/pencil.png" alt="" className="register-icon" />
                  Выйти
                </a>
              </div>
            ) : (
              <a href="#" className="register-btn" onClick={(e) => {
                e.preventDefault();
                onAuthClick();
                setMobileMenuOpen(false);
              }}>
                <img src="/images/pencil.png" alt="" className="register-icon" />
                Вход/Регистрация
              </a>
            )}
          </li>
        </ul>

        {mobileMenuOpen && (
          <div 
            className="mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        <div className="search-container" ref={searchRef}>
          <div className="search-icon">
            <img src="/images/magnifying-glass.png" alt="Поиск" />
          </div>
          <input 
            type="text" 
            placeholder="Поиск аниме/саундтреков..." 
            className="search-box"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleSearchSubmit}
            onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
          />
          
          <SearchSuggestions 
            suggestions={searchSuggestions}
            onSelect={() => {
              setShowSuggestions(false);
              setSearchQuery('');
            }}
            visible={showSuggestions}
          />
        </div>
      </nav>
    </header>
  );
};

const headerStyle = {
  background: 'rgba(26, 26, 26, 0.95)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid #333',
  zIndex: 100,
  width: '100%',
  boxSizing: 'border-box'
};

export default Header;