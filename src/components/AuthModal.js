import React, { useState, useEffect } from 'react';
import { apiService, saveToken } from '../services/api';

const AuthModal = ({ isOpen, onClose, onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Автоматическое скрытие ошибки через 5 секунд
  useEffect(() => {
    if (errors.general) {
      const timer = setTimeout(() => {
        setErrors(prev => ({ ...prev, general: null }));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [errors.general]);

  if (!isOpen) return null;

  // Улучшенная валидация формы
  const validateForm = () => {
    const newErrors = {};

    // Проверка имени пользователя (тримим пробелы по краям)
    const username = formData.username.trim();
    const usernameWithoutSpaces = username.replace(/\s/g, '');
    
    if (!username) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (username.length < 3) {
      newErrors.username = 'Имя должно быть не менее 3 символов';
    } else if (username.length > 20) {
      newErrors.username = 'Имя должно быть не более 20 символов';
    } else if (usernameWithoutSpaces.length === 0) {
      newErrors.username = 'Имя не может состоять только из пробелов';
    } else if (usernameWithoutSpaces.length < 3) {
      newErrors.username = 'Имя должно содержать не менее 3 непробельных символов';
    }

    // Проверка email (только для регистрации)
    if (!isLogin) {
      const email = formData.email.trim();
      if (!email) {
        newErrors.email = 'Email обязателен';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Некорректный формат email';
      } else if (email.length > 100) {
        newErrors.email = 'Email слишком длинный';
      }
    }

    // Проверка пароля
    const password = formData.password;
    if (!password) {
      newErrors.password = 'Пароль обязателен';
    } else if (password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    } else if (password.length > 50) {
      newErrors.password = 'Пароль должен быть не более 50 символов';
    } else if (!/(?=.*[a-zA-Z])/.test(password)) {
      newErrors.password = 'Пароль должен содержать хотя бы одну букву';
    }

    // Проверка подтверждения пароля (только для регистрации)
    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Подтвердите пароль';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Пароли не совпадают';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Валидация в реальном времени при вводе
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'username':
        const username = value.trim();
        const usernameWithoutSpaces = username.replace(/\s/g, '');
        
        if (!username) {
          newErrors.username = 'Имя пользователя обязательно';
        } else if (username.length < 3) {
          newErrors.username = 'Имя должно быть не менее 3 символов';
        } else if (username.length > 20) {
          newErrors.username = 'Имя должно быть не более 20 символов';
        } else if (usernameWithoutSpaces.length === 0) {
          newErrors.username = 'Имя не может состоять только из пробелов';
        } else if (usernameWithoutSpaces.length < 3) {
          newErrors.username = 'Имя должно содержать не менее 3 непробельных символов';
        } else {
          delete newErrors.username;
        }
        break;
        
      case 'email':
        if (!isLogin) {
          const email = value.trim();
          if (!email) {
            newErrors.email = 'Email обязателен';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Некорректный формат email';
          } else {
            delete newErrors.email;
          }
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors.password = 'Пароль обязателен';
        } else if (value.length < 6) {
          newErrors.password = 'Пароль должен быть не менее 6 символов';
        } else if (value.length > 50) {
          newErrors.password = 'Пароль должен быть не более 50 символов';
        } else if (!/(?=.*[a-zA-Z])/.test(value)) {
          newErrors.password = 'Пароль должен содержать хотя бы одну букву';
        } else {
          delete newErrors.password;
        }
        
        // Если есть подтверждение пароля, проверяем его тоже
        if (formData.confirmPassword && !isLogin) {
          if (value !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Пароли не совпадают';
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;
        
      case 'confirmPassword':
        if (!isLogin) {
          if (!value) {
            newErrors.confirmPassword = 'Подтвердите пароль';
          } else if (formData.password !== value) {
            newErrors.confirmPassword = 'Пароли не совпадают';
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидируем форму
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      let response;
      if (isLogin) {
        response = await apiService.login({
          username: formData.username.trim(),
          password: formData.password
        });
      } else {
        response = await apiService.register({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password
        });
      }

      // Сохраняем токен
      if (response.data.token) {
        saveToken(response.data.token);
        console.log('Token saved:', response.data.token);
      }

      // Передаем данные пользователя
      onAuth({ 
        username: response.data.username,
        email: formData.email.trim(),
        token: response.data.token 
      });
      
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = error.response?.data?.error || error.message;
      
      // Показываем ошибки с сервера
      if (errorMessage.includes('Username already exists')) {
        setErrors({ username: 'Имя пользователя уже занято' });
      } else if (errorMessage.includes('Email already exists')) {
        setErrors({ email: 'Email уже используется' });
      } else if (errorMessage.includes('Invalid email format')) {
        setErrors({ email: 'Некорректный формат email' });
      } else if (errorMessage.includes('Invalid credentials')) {
        setErrors({ general: 'Неверное имя пользователя или пароль' });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Для username: запрещаем пробелы в начале
    if (name === 'username') {
      // Удаляем пробелы в начале строки
      processedValue = value.replace(/^\s+/, '');
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    
    // Валидация в реальном времени
    validateField(name, processedValue);
  };

  const handleFormSwitch = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  // Проверка можно ли отправить форму
  const isFormValid = () => {
    const { username, password, email, confirmPassword } = formData;
    
    // Базовые проверки на заполненность
    if (!username.trim() || !password) return false;
    if (!isLogin && (!email.trim() || !confirmPassword)) return false;
    
    // Если есть ошибки валидации - блокируем
    return Object.keys(errors).length === 0;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#333',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        position: 'relative'
      }}>
        <h2 style={{ marginTop: '0', marginBottom: '1.5rem', color: 'white' }}>
          {isLogin ? 'Вход' : 'Регистрация'}
        </h2>
        
        {/* Общая ошибка - абсолютное позиционирование */}
        {errors.general && (
          <div style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#ff4757',
            background: 'rgba(255, 71, 87, 0.1)',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            border: '1px solid rgba(255, 71, 87, 0.3)',
            whiteSpace: 'nowrap',
            zIndex: 1001,
            backdropFilter: 'blur(10px)'
          }}>
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <input 
              type="text"
              name="username"
              placeholder="Имя пользователя"
              value={formData.username}
              onChange={handleInputChange}
              autoComplete={isLogin ? "username" : "new-username"}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              style={{
                width: '100%',
                padding: '12px',
                background: '#242424',
                border: `1px solid ${errors.username ? '#ff4757' : '#555'}`,
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px'
              }}
            />
            {/* Ошибка для username - абсолютное позиционирование */}
            {errors.username && (
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '0',
                color: '#ff4757',
                fontSize: '12px',
                background: 'rgba(255, 71, 87, 0.1)',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 71, 87, 0.3)',
                zIndex: 1
              }}>
                {errors.username}
              </div>
            )}
          </div>
          
          {!isLogin && (
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <input 
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="new-email"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#242424',
                  border: `1px solid ${errors.email ? '#ff4757' : '#555'}`,
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              {/* Ошибка для email - абсолютное позиционирование */}
              {errors.email && (
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '0',
                  color: '#ff4757',
                  fontSize: '12px',
                  background: 'rgba(255, 71, 87, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 71, 87, 0.3)',
                  zIndex: 1
                }}>
                  {errors.email}
                </div>
              )}
            </div>
          )}
          
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <input 
              type="password"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              style={{
                width: '100%',
                padding: '12px',
                background: '#242424',
                border: `1px solid ${errors.password ? '#ff4757' : '#555'}`,
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px'
              }}
            />
            {/* Ошибка для password - абсолютное позиционирование */}
            {errors.password && (
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '0',
                color: '#ff4757',
                fontSize: '12px',
                background: 'rgba(255, 71, 87, 0.1)',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 71, 87, 0.3)',
                zIndex: 1
              }}>
                {errors.password}
              </div>
            )}
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <input 
                type="password"
                name="confirmPassword"
                placeholder="Подтвердите пароль"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#242424',
                  border: `1px solid ${errors.confirmPassword ? '#ff4757' : '#555'}`,
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              {/* Ошибка для confirmPassword - абсолютное позиционирование */}
              {errors.confirmPassword && (
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '0',
                  color: '#ff4757',
                  fontSize: '12px',
                  background: 'rgba(255, 71, 87, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 71, 87, 0.3)',
                  zIndex: 1
                }}>
                  {errors.confirmPassword}
                </div>
              )}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading} // Убрал проверку isFormValid() чтобы кнопка всегда была активна
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#555' : '#7a1bc1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            onClick={handleFormSwitch}
            style={{
              background: 'none',
              border: 'none',
              color: '#7a1bc1',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px'
            }}
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
          </button>
        </div>
        
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '24px',
            cursor: 'pointer',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default AuthModal;