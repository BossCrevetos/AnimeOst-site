// Глобальные переменные для авторизации
let currentUser = null;
let isAuthenticated = false;
let authToken = null;

// Функции для работы с localStorage
function saveAuthToLocalStorage(username, token) {
    localStorage.setItem('authUsername', username);
    localStorage.setItem('authToken', token);
    localStorage.setItem('authTimestamp', Date.now());
    console.log('✅ Auth saved to localStorage:', username);
}

function loadAuthFromLocalStorage() {
    const username = localStorage.getItem('authUsername');
    const token = localStorage.getItem('authToken');
    const timestamp = localStorage.getItem('authTimestamp');
    
    if (username && token && timestamp) {
        const isExpired = Date.now() - parseInt(timestamp) > 7 * 24 * 60 * 60 * 1000; // 7 дней
        if (!isExpired) {
            currentUser = username;
            authToken = token;
            isAuthenticated = true;
            console.log('✅ User loaded from localStorage:', username);
            return true;
        } else {
            clearAuthFromLocalStorage();
        }
    }
    return false;
}

function clearAuthFromLocalStorage() {
    localStorage.removeItem('authUsername');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTimestamp');
    currentUser = null;
    authToken = null;
    isAuthenticated = false;
    console.log('✅ Auth cleared from localStorage');
}

// Функция для проверки авторизации
async function checkAuth() {
    if (loadAuthFromLocalStorage()) {
        console.log('✅ User authenticated via localStorage');
        updateAuthUI(true);
        return true;
    }
    
    currentUser = null;
    isAuthenticated = false;
    authToken = null;
    updateAuthUI(false);
    return false;
}

// Функция для обновления интерфейса в зависимости от авторизации
function updateAuthUI(isAuthenticated) {
    const registerBtn = document.getElementById('showRegister');
    
    if (isAuthenticated && currentUser) {
        if (registerBtn) {
            registerBtn.innerHTML = `
                <img src="картинки/pencil.png" alt="" class="register-icon">
                ${currentUser} (Выйти)
            `;
            registerBtn.onclick = logoutUser;
        }
    } else {
        if (registerBtn) {
            registerBtn.innerHTML = `
                <img src="картинки/pencil.png" alt="" class="register-icon">
                Вход/Регистрация
            `;
            registerBtn.onclick = showRegisterModal;
        }
    }
}

// Функция для показа модалки авторизации
function showRegisterModal(e) {
    e.preventDefault();
    document.getElementById('registerFormContainer').style.display = 'block';
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('registerModal').classList.add('active');
}

// Функция для получения CSRF токена
async function getCSRFToken() {
    try {
        const response = await fetch('http://localhost:8000/api/get-csrf/', {
            credentials: 'include'
        });
        const data = await response.json();
        return data.csrfToken;
    } catch (error) {
        console.error('CSRF token error:', error);
        return null;
    }
}

// Функция регистрации
async function registerUser(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        const csrfToken = await getCSRFToken();
        
        const response = await fetch('http://localhost:8000/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Сохраняем токен
            saveAuthToLocalStorage(result.username, result.token);
            currentUser = result.username;
            authToken = result.token;
            isAuthenticated = true;
            
            alert('Регистрация успешна!');
            document.getElementById('registerModal').classList.remove('active');
            form.reset();
            updateAuthUI(true);
            
            console.log('✅ Registration successful');
            
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        alert('Ошибка сети: ' + error.message);
    }
}

// Функция входа
async function loginUser(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
        const csrfToken = await getCSRFToken();
        
        const response = await fetch('http://localhost:8000/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Сохраняем токен
            saveAuthToLocalStorage(result.username, result.token);
            currentUser = result.username;
            authToken = result.token;
            isAuthenticated = true;
            
            alert('Вход успешен!');
            document.getElementById('registerModal').classList.remove('active');
            form.reset();
            updateAuthUI(true);
            
            console.log('✅ Login successful');
            
        } else {
            alert('Ошибка: ' + result.error);
        }
    } catch (error) {
        alert('Ошибка сети: ' + error.message);
    }
}

// Функция выхода
async function logoutUser(e) {
    e.preventDefault();
    
    try {
        const csrfToken = await getCSRFToken();
        const response = await fetch('http://localhost:8000/api/logout/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken
            }
        });
        
        if (response.ok) {
            currentUser = null;
            isAuthenticated = false;
            authToken = null;
            clearAuthFromLocalStorage();
            updateAuthUI(false);
            alert('Вы вышли из системы');
            console.log('✅ Logout successful');
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Функция создания HTML для трека
function createTrackHTML(track) {
    return `
        <div class="track-card">
            <img src="${track.image ? 'http://localhost:8000' + track.image : 'картинки/Без названия (2).jpg'}" alt="Обложка трека" class="track-image">
            <div class="track-content">
                <h3 class="track-title">${track.title}</h3>
                <p class="track-artist">${track.artist}</p>
                <p class="track-anime">${track.anime}</p>
                <div class="track-player">
                    <button class="play-btn"></button>
                    <div class="progress-container">
                        <div class="progress-bar"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Функция для добавления сердечка в карточку
function addHeartToTrack(trackHTML, trackId) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = trackHTML;
    
    const trackContent = tempDiv.querySelector('.track-content');
    const heartBtn = document.createElement('button');
    heartBtn.className = 'heart-btn';
    heartBtn.innerHTML = '♡';
    heartBtn.setAttribute('data-track-id', trackId);
    
    trackContent.appendChild(heartBtn);
    return tempDiv.innerHTML;
}

// Функция для загрузки статистики избранного
async function loadFavoritesStats() {
    try {
        
        const response = await fetch('http://localhost:8000/api/favorites/stats/');
        const stats = await response.json();
        
        const topTable = document.querySelector('.favorites-top-table');
        if (topTable) {
            topTable.innerHTML = '';
            
            if (stats.top_favorites.length === 0) {
                topTable.innerHTML = `
                    <tr>
                        <td colspan="3" class="empty-favorites">
                            Пока никто не добавил треки в избранное
                        </td>
                    </tr>
                `;
            } else {
                stats.top_favorites.forEach((track, index) => {
                    const rowHTML = `
                        <tr>
                            <td>${index + 1}</td>
                            <td>
                                <div class="favorite-track-info">
                                    <img src="${track.image ? 'http://localhost:8000' + track.image : 'картинки/Без названия (2).jpg'}" 
                                         alt="${track.title}" 
                                         class="favorite-track-image">
                                    <div class="favorite-track-details">
                                        <div class="favorite-track-title">${track.title}</div>
                                        <div class="favorite-track-artist">${track.artist}</div>
                                        <div class="favorite-track-anime">${track.anime}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="favorite-count">${track.favorite_count}</span>
                            </td>
                        </tr>
                    `;
                    topTable.innerHTML += rowHTML;
                });
            }
        }
        
        const recentTable = document.querySelector('.favorites-recent-table');
        if (recentTable) {
            recentTable.innerHTML = '';
            
            if (stats.recent_favorites.length === 0) {
                recentTable.innerHTML = `
                    <tr>
                        <td colspan="3" class="empty-favorites">
                            Пока нет недавно добавленных треков
                        </td>
                    </tr>
                `;
            } else {
                stats.recent_favorites.forEach((track, index) => {
                    const timeText = track.time_added || 'Недавно'; // fallback если время undefined
                    const rowHTML = `
                        <tr>
                            <td>${index + 1}</td>
                            <td>
                                <div class="favorite-track-info">
                                    <img src="${track.image ? 'http://localhost:8000' + track.image : 'картинки/Без названия (2).jpg'}" 
                                         alt="${track.title}" 
                                         class="favorite-track-image">
                                    <div class="favorite-track-details">
                                        <div class="favorite-track-title">${track.title}</div>
                                        <div class="favorite-track-artist">${track.artist}</div>
                                        <div class="favorite-track-anime">${track.anime}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span style="color: #888; font-size: 13px;">${track.time_added}</span>
                            </td>
                        </tr>
                    `;
                    recentTable.innerHTML += rowHTML;
                });
            }
        }
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Функция для привязки обработчиков к сердечкам
function bindHeartButtons() {
    const heartButtons = document.querySelectorAll('.heart-btn');
    
    heartButtons.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const trackId = this.getAttribute('data-track-id');
            
            if (!isAuthenticated || !authToken) {
                document.getElementById('registerModal').classList.add('active');
                return;
            }
            
            this.classList.add('bounce');
            
            try {
                const response = await fetch(`http://localhost:8000/api/favorite/${trackId}/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                const result = await response.json();
                console.log('Favorite response:', result);
                
                if (response.ok) {
                    if (result.status === 'added') {
                        this.innerHTML = '♥';
                        this.classList.add('added');
                    } else {
                        this.innerHTML = '♡';
                        this.classList.remove('added');
                    }
                    loadFavoritesStats();
                } else {
                    if (response.status === 401) {
                        clearAuthFromLocalStorage();
                        updateAuthUI(false);
                        alert('Сессия истекла. Пожалуйста, войдите снова.');
                    }
                }
            } catch (error) {
                console.error('Ошибка добавления в избранное:', error);
            }
            
            setTimeout(() => {
                this.classList.remove('bounce');
            }, 300);
        });
    });
}

// Функция для загрузки треков
async function loadTracks() {
    try {
        console.log('Начинаю загрузку треков...');
        
        const response = await fetch('http://localhost:8000/api/tracks/');
        console.log('Ответ от API:', response);
        
        const tracks = await response.json();
        console.log('Получены треки:', tracks);
        
        const trackList = document.querySelector('.track-list');
        trackList.innerHTML = '';
        
        console.log('Найдено треков:', tracks.length);
        
        tracks.forEach(track => {
            console.log('Добавляю трек:', track.title);
            
            let trackHTML = createTrackHTML(track);
            trackHTML = addHeartToTrack(trackHTML, track.id);
            trackList.innerHTML += trackHTML;
        });
        
        bindPlayButtons();
        bindHeartButtons();
        
        if (isAuthenticated) {
            setTimeout(() => checkAllFavoritesStatus(), 500);
        }
        
        console.log('Треки успешно загружены!');
        
    } catch (error) {
        console.error('Ошибка загрузки треков:', error);
    }
}

// Функция для привязки обработчиков к кнопкам play
function bindPlayButtons() {
    const playButtons = document.querySelectorAll('.play-btn');
    
    playButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const trackCard = this.closest('.track-card');
            const isPlaying = trackCard.classList.contains('playing');
            
            document.querySelectorAll('.track-card.playing').forEach(card => {
                if (card !== trackCard) {
                    card.classList.remove('playing');
                    const otherProgressBar = card.querySelector('.progress-bar');
                    if (otherProgressBar) {
                        otherProgressBar.style.width = '0%';
                    }
                }
            });
            
            if (isPlaying) {
                trackCard.classList.remove('playing');
                const progressBar = trackCard.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            } else {
                trackCard.classList.add('playing');
                
                const progressBar = trackCard.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = '0%';
                    setTimeout(() => {
                        progressBar.style.width = '100%';
                    }, 10);
                }
            }
        });
    });
}

// Функция для проверки статуса избранного для трека
async function checkFavoriteStatus(trackId, heartBtn) {
    if (!isAuthenticated || !authToken) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:8000/api/check-favorite/${trackId}/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.is_favorite) {
                heartBtn.innerHTML = '♥';
                heartBtn.classList.add('added');
            } else {
                heartBtn.innerHTML = '♡';
                heartBtn.classList.remove('added');
            }
        }
    } catch (error) {
        console.error('Error checking favorite status:', error);
    }
}

async function checkAllFavoritesStatus() {
    if (!isAuthenticated || !authToken) return;
    
    const heartButtons = document.querySelectorAll('.heart-btn');
    
    for (const btn of heartButtons) {
        const trackId = btn.getAttribute('data-track-id');
        await checkFavoriteStatus(trackId, btn);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuth().then(auth => {
        isAuthenticated = auth;
    });
    
    loadTracks();
    
    loadFavoritesStats();
    
    // Выпадающее меню
    const dropBtn = document.querySelector('.dropbtn');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    if (dropBtn) {
        dropBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
    }
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            dropdownContent.classList.remove('show');
        }
    });

    // Модальное окно регистрации
    const showRegisterBtn = document.getElementById('showRegister');
    const registerModal = document.getElementById('registerModal');
    const closeRegisterBtn = document.getElementById('closeRegister');

    if (showRegisterBtn && registerModal) {
        showRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            registerModal.classList.add('active');
        });

        closeRegisterBtn.addEventListener('click', function() {
            registerModal.classList.remove('active');
        });

        registerModal.addEventListener('click', function(e) {
            if (e.target === registerModal) {
                registerModal.classList.remove('active');
            }
        });
    }
});

// Обработчики для переключения форм в модалке
const showLoginForm = document.getElementById('showLoginForm');
const showRegisterForm = document.getElementById('showRegisterForm');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

if (showLoginForm) {
    showLoginForm.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('registerFormContainer').style.display = 'none';
        document.getElementById('loginFormContainer').style.display = 'block';
    });
}

if (showRegisterForm) {
    showRegisterForm.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('loginFormContainer').style.display = 'none';
        document.getElementById('registerFormContainer').style.display = 'block';
    });
}

// Обработчики форм
if (registerForm) {
    registerForm.addEventListener('submit', registerUser);
}

if (loginForm) {
    loginForm.addEventListener('submit', loginUser);
}
function startStatsAutoUpdate() {
    setInterval(() => {
        if (document.querySelector('.favorites-recent-table')) {
            loadFavoritesStats();
        }
    }, 60000); 
}

document.addEventListener('DOMContentLoaded', function() {
    startStatsAutoUpdate();
});
let currentCarouselIndex = 0;
let carouselTracks = [];
let carouselInterval;
function startCarouselAutoScroll() {
    stopCarouselAutoScroll();
    carouselInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}
function stopCarouselAutoScroll() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
}

function createCarouselTrackHTML(track) {
    return `
        <div class="carousel-card" data-track-id="${track.id}">
            <img src="${track.image ? 'http://localhost:8000' + track.image : 'картинки/Без названия (2).jpg'}" 
                 alt="Обложка трека" 
                 class="track-image">
            <div class="track-content">
                <h3 class="track-title">${track.title}</h3>
                <p class="track-artist">${track.artist}</p>
                <p class="track-anime">${track.anime}</p>
                <div class="track-player">
                    <button class="play-btn"></button>
                    <div class="progress-container">
                        <div class="progress-bar"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initCarousel(tracks) {
    const carouselTrack = document.getElementById('carouselTrack');
    const carouselDots = document.getElementById('carouselDots');
    
    if (!carouselTrack) return;
    
    carouselTrack.innerHTML = '';
    carouselDots.innerHTML = '';
    carouselTracks = tracks;
    
    tracks.forEach((track, index) => {
        const trackHTML = createCarouselTrackHTML(track);
        carouselTrack.innerHTML += trackHTML;
        
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.setAttribute('data-index', index);
        dot.addEventListener('click', () => goToSlide(index));
        carouselDots.appendChild(dot);
    });
    
    updateCarouselPositions();
    
    setTimeout(() => {
        bindCarouselHeartButtons();
        bindCarouselPlayButtons();
    }, 100);
}

function updateCarouselPositions() {
    const cards = document.querySelectorAll('.carousel-card');
    const totalCards = cards.length;
    
    cards.forEach((card, index) => {
        let position = index - currentCarouselIndex;
        
        if (position > Math.floor(totalCards / 2)) {
            position -= totalCards;
        } else if (position < -Math.floor(totalCards / 2)) {
            position += totalCards;
        }
        
        card.setAttribute('data-position', position);
        card.style.display = Math.abs(position) <= 3 ? 'block' : 'none';
    });
    
    document.querySelectorAll('.carousel-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentCarouselIndex);
    });
}

function goToSlide(index) {
    stopCarouselAutoScroll(); 
    currentCarouselIndex = index;
    updateCarouselPositions();
    startCarouselAutoScroll(); 
}

function nextSlide() {
    currentCarouselIndex = (currentCarouselIndex + 1) % carouselTracks.length;
    updateCarouselPositions();
    startCarouselAutoScroll();
}

function prevSlide() {
    currentCarouselIndex = (currentCarouselIndex - 1 + carouselTracks.length) % carouselTracks.length;
    updateCarouselPositions();
    startCarouselAutoScroll(); 
}

function bindCarouselHeartButtons() {
    const heartButtons = document.querySelectorAll('.carousel-card .track-content');
    
    heartButtons.forEach(content => {
        const trackId = content.closest('.carousel-card').getAttribute('data-track-id');
        
        if (!content.querySelector('.heart-btn')) {
            const heartBtn = document.createElement('button');
            heartBtn.className = 'heart-btn';
            heartBtn.innerHTML = '♡';
            heartBtn.setAttribute('data-track-id', trackId);
            content.appendChild(heartBtn);
            
            heartBtn.addEventListener('click', async function(e) {
                e.stopPropagation();
                
                if (!isAuthenticated || !authToken) {
                    document.getElementById('registerModal').classList.add('active');
                    return;
                }
                
                this.classList.add('bounce');
                
                try {
                    const response = await fetch(`http://localhost:8000/api/favorite/${trackId}/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    
                    const result = await response.json();
                    console.log('Carousel favorite response:', result);
                    
                    if (response.ok) {
                        if (result.status === 'added') {
                            this.innerHTML = '♥';
                            this.classList.add('added');
                        } else {
                            this.innerHTML = '♡';
                            this.classList.remove('added');
                        }
                        loadFavoritesStats();
                    }
                } catch (error) {
                    console.error('Ошибка добавления в избранное:', error);
                }
                
                setTimeout(() => {
                    this.classList.remove('bounce');
                }, 300);
            });
        }
    });
}

function bindCarouselPlayButtons() {
    const playButtons = document.querySelectorAll('.carousel-card .play-btn');
    
    playButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const trackCard = this.closest('.carousel-card');
            const isPlaying = trackCard.classList.contains('playing');
            
            document.querySelectorAll('.carousel-card.playing').forEach(card => {
                if (card !== trackCard) {
                    card.classList.remove('playing');
                    const otherProgressBar = card.querySelector('.progress-bar');
                    if (otherProgressBar) {
                        otherProgressBar.style.width = '0%';
                    }
                }
            });
            
            if (isPlaying) {
                trackCard.classList.remove('playing');
                const progressBar = trackCard.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            } else {
                trackCard.classList.add('playing');
                const progressBar = trackCard.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = '0%';
                    setTimeout(() => {
                        progressBar.style.width = '100%';
                    }, 10);
                }
            }
        });
    });
}

async function loadTracks() {
    try {
        console.log('Начинаю загрузку треков...');
        
        const response = await fetch('http://localhost:8000/api/tracks/');
        const tracks = await response.json();
        console.log('Получены треки:', tracks);
        
        initCarousel(tracks);
        
        loadFavoritesStats();
        
        console.log('Карусель успешно инициализирована!');
        
    } catch (error) {
        console.error('Ошибка загрузки треков:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    const prevBtn = document.querySelector('.carousel-btn-prev');
    const nextBtn = document.querySelector('.carousel-btn-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            stopCarouselAutoScroll();
            prevSlide();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            stopCarouselAutoScroll();
            nextSlide();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            stopCarouselAutoScroll();
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            stopCarouselAutoScroll();
            nextSlide();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('carousel-dot')) {
            stopCarouselAutoScroll();
            const index = parseInt(e.target.getAttribute('data-index'));
            goToSlide(index);
        }
    });
    
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', stopCarouselAutoScroll);
        carousel.addEventListener('mouseleave', startCarouselAutoScroll);
    }
    
    startCarouselAutoScroll();
});
function truncateText() {
    document.querySelectorAll('.track-artist').forEach(element => {
        const text = element.textContent;
        if (text.length > 15) {
            element.textContent = text.substring(0, 15) + '...';
        }
    });
}

setTimeout(truncateText, 100);
