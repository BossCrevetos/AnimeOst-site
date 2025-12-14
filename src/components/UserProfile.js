import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const UserProfile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [userInfo, setUserInfo] = useState({ 
    username: '', 
    email: '', 
    total_count: 0 
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('favorites');
  
  // Состояния для модальных окон
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Состояния для форм
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
  try {
    // Проверяем авторизацию через API, а не через проп user
    const authCheck = await apiService.checkAuth();
    if (!authCheck.data.authenticated) {
      navigate('/');
      return;
    }

    // Получаем данные профиля
    const profileResponse = await apiService.getProfile();
    const favoritesResponse = await apiService.getUserFavorites();
    
    setUserInfo({
      username: profileResponse.data.username,
      email: profileResponse.data.email,
      total_count: profileResponse.data.favorites_count
    });
    
    setFavorites(favoritesResponse.data.favorites || []);
    setLoading(false);
  } catch (error) {
    console.error('Error loading user profile:', error);
    navigate('/');
    setLoading(false);
  }
};

  // Функция для маскировки email
  const maskEmail = (email) => {
    if (!email || email === 'user@example.com') return 'user@example.com';
    
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return '*'.repeat(localPart.length) + '@' + domain;
    }
    
    const visiblePart = localPart.slice(-3);
    const hiddenPart = '*'.repeat(localPart.length - 3);
    return hiddenPart + visiblePart + '@' + domain;
  };

  const handleRemoveFavorite = async (trackId) => {
    try {
      await apiService.addToFavorites(trackId);
      loadUserProfile();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Валидация для смены email
  const validateEmailForm = () => {
    const newErrors = {};
    
    if (!currentEmail.trim()) {
      newErrors.currentEmail = 'Текущий email обязателен';
    } else if (currentEmail !== userInfo.email) {
      newErrors.currentEmail = 'Текущий email указан неверно';
    }
    
    if (!newEmail.trim()) {
      newErrors.newEmail = 'Новый email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      newErrors.newEmail = 'Некорректный формат email';
    } else if (newEmail === userInfo.email) {
      newErrors.newEmail = 'Новый email не должен совпадать с текущим';
    }
    
    if (!emailPassword) {
      newErrors.emailPassword = 'Пароль обязателен для смены email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Валидация для смены пароля
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = 'Текущий пароль обязателен';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'Новый пароль обязателен';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Пароль должен быть не менее 6 символов';
    } else if (newPassword.length > 50) {
      newErrors.newPassword = 'Пароль должен быть не более 50 символов';
    } else if (!/(?=.*[a-zA-Z])/.test(newPassword)) {
      newErrors.newPassword = 'Пароль должен содержать хотя бы одну букву';
    } else if (newPassword.includes(' ')) {
      newErrors.newPassword = 'Пароль не может содержать пробелы';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите новый пароль';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Функции для смены email
  const handleChangeEmail = async () => {
  if (!validateEmailForm()) {
    return;
  }

  setLoadingAction(true);
  try {
    await apiService.changeEmail({
      current_email: currentEmail,
      new_email: newEmail,
      password: emailPassword
    });
    
    // Обновляем email в состоянии
    setUserInfo(prev => ({ ...prev, email: newEmail }));
    alert('Email успешно изменен!');
    handleCloseEmailModal();
  } catch (error) {
    console.error('Error changing email:', error);
    const errorMessage = error.response?.data?.error || error.message;
    
    if (errorMessage.includes('Неверный пароль') || errorMessage.includes('Invalid password')) {
      setErrors(prev => ({ ...prev, emailPassword: 'Неверный пароль' }));
    } else if (errorMessage.includes('Email уже используется') || errorMessage.includes('already exists')) {
      setErrors(prev => ({ ...prev, newEmail: 'Email уже используется' }));
    } else if (errorMessage.includes('Текущий email указан неверно') || errorMessage.includes('Current email incorrect')) {
      setErrors(prev => ({ ...prev, currentEmail: 'Текущий email указан неверно' }));
    } else {
      alert('Ошибка при изменении email. Проверьте правильность данных.');
    }
  } finally {
    setLoadingAction(false);
  }
};

  // Функции для смены пароля
  const handleChangePassword = async () => {
  if (!validatePasswordForm()) {
    return;
  }

  setLoadingAction(true);
  try {
    await apiService.changePassword({
      current_password: currentPassword,
      new_password: newPassword
    });
    
    alert('Пароль успешно изменен!');
    handleClosePasswordModal();
  } catch (error) {
    console.error('Error changing password:', error);
    const errorMessage = error.response?.data?.error || error.message;
    
    if (errorMessage.includes('Неверный текущий пароль') || errorMessage.includes('Invalid current password')) {
      setErrors(prev => ({ ...prev, currentPassword: 'Неверный текущий пароль' }));
    } else {
      alert('Ошибка при изменении пароля. Проверьте правильность данных.');
    }
  } finally {
    setLoadingAction(false);
  }
};

  // Функции для удаления аккаунта
  const handleDeleteAccount = async () => {
  try {
    console.log('Deleting account...');
    await apiService.deleteAccount();
    
    alert('Аккаунт успешно удален!');
    
    // Выход
    onLogout();
    
    // ДОБАВЬ РЕДИРЕКТ НА ГЛАВНУЮ
    navigate('/');
    
  } catch (error) {
    console.error('Error deleting account:', error);
    console.error('Error response:', error.response?.data);
    
    if (error.response?.data?.error) {
      alert(`Ошибка: ${error.response.data.error}`);
    } else {
      alert('Ошибка при удалении аккаунта');
    }
  }
};

  // Закрытие модальных окон и сброс данных
  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setCurrentEmail('');
    setNewEmail('');
    setEmailPassword('');
    setErrors({});
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div style={{ 
      background: '#252525ff', 
      minHeight: '100vh',
      color: '#d8d8d8ff',
      padding: '2rem'
    }}>
      {/* Шапка личного кабинета */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #333'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          background: '#8024c3ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '1rem',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          {userInfo.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>{userInfo.username}</h1>
          <p style={{ margin: 0, color: '#a2a2a2ff', fontSize: '14px' }}>
            {userInfo.total_count} {userInfo.total_count === 1 ? 'трек' : userInfo.total_count < 5 ? 'трека' : 'треков'} в избранном
          </p>
        </div>
      </div>

      {/* Панель навигации */}
      <div style={navPanelStyle}>
        <button 
          onClick={() => setActiveSection('favorites')}
          style={{
            ...navButtonStyle,
            background: activeSection === 'favorites' ? '#7a1bc1' : '#303030'
          }}
        >
          <img 
            src="/images/heart.png" 
            alt="Избранное" 
            style={iconStyle}
          />
          Моё избранное
        </button>
        <button 
          onClick={() => setActiveSection('security')}
          style={{
            ...navButtonStyle,
            background: activeSection === 'security' ? '#7a1bc1' : '#303030'
          }}
        >
          <img 
            src="/images/lock.png" 
            alt="Безопасность" 
            style={iconStyle}
          />
          Безопасность и данные
        </button>
      </div>

      {/* Контент в зависимости от выбранного раздела */}
      {activeSection === 'favorites' ? (
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '20px' }}>Мои избранные треки</h2>
          
          {favorites.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>♡</div>
              <p>У вас пока нет избранных треков</p>
              <p style={{ fontSize: '14px' }}>Добавляйте треки в избранное, нажимая на сердечко</p>
            </div>
          ) : (
            <div style={favoritesGridStyle}>
              {favorites.map((track, index) => (
                <div key={track.id} style={trackItemStyle}>
                  <div style={trackNumberStyle}>
                    {index + 1}
                  </div>
                  
                  <img 
                    src={track.image ? `http://localhost:8000${track.image}` : '/images/background.jpg'} 
                    alt={track.title}
                    style={trackImageStyle}
                  />
                  
                  <div style={trackInfoStyle}>
                    <div style={trackTitleStyle}>{track.title}</div>
                    <div style={trackArtistStyle}>{track.artist}</div>
                    <div style={trackAnimeStyle}>{track.anime}</div>
                  </div>
                  
                  <button 
                    onClick={() => handleRemoveFavorite(track.id)}
                    style={removeButtonStyle}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '20px' }}>Безопасность и данные</h2>
          <div style={securitySectionStyle}>
            <div style={securityItemStyle}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Электронная почта</h3>
              <p style={{ color: '#888', margin: 0 }}>{maskEmail(userInfo.email)}</p>
              <button 
                style={changeButtonStyle}
                onClick={() => setShowEmailModal(true)}
              >
                Изменить email
              </button>
            </div>
            
            <div style={securityItemStyle}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Пароль</h3>
              <p style={{ color: '#888', margin: 0 }}>••••••••</p>
              <button 
                style={changeButtonStyle}
                onClick={() => setShowPasswordModal(true)}
              >
                Изменить пароль
              </button>
            </div>
            
            <div style={securityItemStyle}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Аккаунт</h3>
              <button 
                style={deleteButtonStyle}
                onClick={() => setShowDeleteModal(true)}
              >
                Удалить аккаунт
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для смены email */}
      {showEmailModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#d8d8d8ff' }}>Изменение email</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                placeholder="Текущий email"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                autoComplete="new-email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{
                  ...inputStyle,
                  border: `1px solid ${errors.currentEmail ? '#ff4757' : '#444'}`
                }}
              />
              {errors.currentEmail && (
                <div style={errorTextStyle}>
                  {errors.currentEmail}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                placeholder="Новый email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="new-email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{
                  ...inputStyle,
                  border: `1px solid ${errors.newEmail ? '#ff4757' : '#444'}`
                }}
              />
              {errors.newEmail && (
                <div style={errorTextStyle}>
                  {errors.newEmail}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="password"
                placeholder="Текущий пароль"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{
                  ...inputStyle,
                  border: `1px solid ${errors.emailPassword ? '#ff4757' : '#444'}`
                }}
              />
              {errors.emailPassword && (
                <div style={errorTextStyle}>
                  {errors.emailPassword}
                </div>
              )}
            </div>
            
            <div style={modalButtonsStyle}>
              <button onClick={handleCloseEmailModal} style={cancelButtonStyle}>
                Отмена
              </button>
              <button 
                onClick={handleChangeEmail} 
                disabled={loadingAction}
                style={{
                  ...confirmButtonStyle,
                  background: loadingAction ? '#555' : '#7a1bc1',
                  cursor: loadingAction ? 'not-allowed' : 'pointer'
                }}
              >
                {loadingAction ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для смены пароля */}
      {showPasswordModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#d8d8d8ff' }}>Изменение пароля</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Текущий пароль"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{
                  ...inputStyle,
                  border: `1px solid ${errors.currentPassword ? '#ff4757' : '#444'}`
                }}
              />
              {errors.currentPassword && (
                <div style={errorTextStyle}>
                  {errors.currentPassword}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{
                  ...inputStyle,
                  border: `1px solid ${errors.newPassword ? '#ff4757' : '#444'}`
                }}
              />
              {errors.newPassword && (
                <div style={errorTextStyle}>
                  {errors.newPassword}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="password"
                placeholder="Подтвердите новый пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{
                  ...inputStyle,
                  border: `1px solid ${errors.confirmPassword ? '#ff4757' : '#444'}`
                }}
              />
              {errors.confirmPassword && (
                <div style={errorTextStyle}>
                  {errors.confirmPassword}
                </div>
              )}
            </div>
            
            <div style={modalButtonsStyle}>
              <button onClick={handleClosePasswordModal} style={cancelButtonStyle}>
                Отмена
              </button>
              <button 
                onClick={handleChangePassword} 
                disabled={loadingAction}
                style={{
                  ...confirmButtonStyle,
                  background: loadingAction ? '#555' : '#7a1bc1',
                  cursor: loadingAction ? 'not-allowed' : 'pointer'
                }}
              >
                {loadingAction ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для удаления аккаунта */}
      {showDeleteModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#d8d8d8ff' }}>Удаление аккаунта</h3>
            <p style={{ color: '#ff4757', fontSize: '14px', marginBottom: '1.5rem' }}>
              Внимание! Это действие необратимо. Все ваши данные будут удалены.
            </p>
            <p style={{ color: '#a2a2a2ff', fontSize: '14px', marginBottom: '1.5rem' }}>
              Вы уверены что хотите удалить аккаунт?
            </p>
            <div style={modalButtonsStyle}>
              <button onClick={() => setShowDeleteModal(false)} style={cancelButtonStyle}>
                Нет, отмена
              </button>
              <button onClick={handleDeleteAccount} style={deleteConfirmButtonStyle}>
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Стили
const navPanelStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  paddingBottom: '2rem',
  borderBottom: '1px solid #333'
};

const navButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  border: '0px solid #444',
  color: 'rgba(218, 217, 217, 1)',
  padding: '10px 20px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background 0.2s'
};

const iconStyle = {
  width: '20px',
  height: '20px',
  scale: '170%',
  filter: 'brightness(1.2)'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '3rem',
  color: '#888',
  background: '#242424',
  borderRadius: '12px'
};

const favoritesGridStyle = {
  display: 'grid',
  gap: '1rem'
};

const trackItemStyle = {
  background: '#303030ff',
  borderRadius: '12px',
  padding: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const trackNumberStyle = {
  color: '#7a1bc1',
  fontWeight: 'bold',
  minWidth: '30px',
  fontSize: '14px'
};

const trackImageStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '8px',
  objectFit: 'cover'
};

const trackInfoStyle = {
  flex: 1
};

const trackTitleStyle = {
  fontWeight: 'bold',
  marginBottom: '4px',
  fontSize: '16px'
};

const trackArtistStyle = {
  color: '#ccc',
  fontSize: '14px',
  marginBottom: '2px'
};

const trackAnimeStyle = {
  color: '#888',
  fontSize: '12px'
};

const removeButtonStyle = {
  background: 'rgba(255, 71, 87, 0.1)',
  border: '1px solid rgba(255, 71, 87, 0.3)',
  color: '#ff4757',
  padding: '8px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '12px'
};

const securitySectionStyle = {
  display: 'grid',
  gap: '1.5rem'
};

const securityItemStyle = {
  background: '#303030',
  padding: '1.5rem',
  borderRadius: '12px'
};

const changeButtonStyle = {
  background: '#7a1bc1',
  border: 'none',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  marginTop: '0.5rem'
};

const deleteButtonStyle = {
  background: 'rgba(255, 0, 21, 0.1)',
  border: '1px solid rgba(248, 115, 126, 0.3)',
  color: '#ff4757',
  padding: '8px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

// Стили для модальных окон
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  background: '#252525ff',
  padding: '2rem',
  borderRadius: '12px',
  minWidth: '400px',
  maxWidth: '500px',
  border: '1px solid #333'
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '0.5rem',
  background: '#303030',
  border: '1px solid #444',
  borderRadius: '6px',
  color: '#d8d8d8ff',
  fontSize: '14px',
  boxSizing: 'border-box'
};

const errorTextStyle = {
  color: '#ff4757',
  fontSize: '12px',
  marginTop: '0.25rem'
};

const modalButtonsStyle = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end'
};

const confirmButtonStyle = {
  background: '#7a1bc1',
  border: 'none',
  color: 'white',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

const cancelButtonStyle = {
  background: '#303030',
  border: '1px solid #444',
  color: '#d8d8d8ff',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

const deleteConfirmButtonStyle = {
  background: 'rgba(255, 71, 87, 0.1)',
  border: '1px solid rgba(255, 71, 87, 0.3)',
  color: '#ff4757',
  padding: '10px 20px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

export default UserProfile;