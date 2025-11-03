from django.http import JsonResponse
from .models import Track
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Track, Favorite
from django.middleware.csrf import get_token
import jwt
import datetime
from django.conf import settings

JWT_SECRET = 'animeost-secret-key-2024'

def create_jwt_token(user):
    """Создание JWT токена"""
    payload = {
        'user_id': user.id,
        'username': user.username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_jwt_token(token):
    """Проверка JWT токена"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def track_list(request):
    tracks = Track.objects.all().order_by('-calculated_score')
    data = []
    for track in tracks:
        data.append({
            'id': track.id,
            'title': track.title,
            'artist': track.artist,
            'anime': track.anime,
            'image': track.image.url if track.image else None,
            'duration': track.duration,
            'anime_rating': track.anime_rating,
            'spotify_popularity': track.spotify_popularity,
            'calculated_score': track.calculated_score
        })
    return JsonResponse(data, safe=False)

@csrf_exempt
def register_user(request):
    """Регистрация пользователя с JWT"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            
            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already exists'}, status=400)
            
            user = User.objects.create_user(username=username, email=email, password=password)
            user.save()
            
            token = create_jwt_token(user)
            
            return JsonResponse({
                'success': 'User created successfully',
                'username': user.username,
                'token': token
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def login_user(request):
    """Авторизация пользователя с JWT"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            user = authenticate(request, username=username, password=password)
            if user is not None:
                token = create_jwt_token(user)
                
                return JsonResponse({
                    'success': 'Login successful',
                    'username': user.username,
                    'token': token
                })
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def logout_user(request):
    """Выход пользователя"""
    return JsonResponse({'success': 'Logout successful'})

@csrf_exempt
def check_auth(request):
    """Проверка авторизации через JWT"""
    auth_header = request.headers.get('Authorization')
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = verify_jwt_token(token)
        
        if payload:
            user_id = payload.get('user_id')
            try:
                user = User.objects.get(id=user_id)
                return JsonResponse({
                    'authenticated': True,
                    'username': user.username
                })
            except User.DoesNotExist:
                pass
    
    return JsonResponse({'authenticated': False})

@csrf_exempt
def get_csrf_token(request):
    """Получение CSRF токена"""
    return JsonResponse({'csrfToken': get_token(request)})

@csrf_exempt
def toggle_favorite(request, track_id):
    """Добавить/удалить трек из избранного через JWT"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_jwt_token(token)
    
    if not payload:
        return JsonResponse({'error': 'Invalid token'}, status=401)
    
    user_id = payload.get('user_id')
    try:
        user = User.objects.get(id=user_id)
        track = Track.objects.get(id=track_id)
        favorite, created = Favorite.objects.get_or_create(user=user, track=track)
        
        if not created:
            favorite.delete()
            return JsonResponse({'status': 'removed', 'message': 'Track removed from favorites'})
        else:
            return JsonResponse({'status': 'added', 'message': 'Track added to favorites'})
    except Track.DoesNotExist:
        return JsonResponse({'error': 'Track not found'}, status=404)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=401)

@csrf_exempt
def check_favorite_status(request, track_id):
    """Проверка, добавлен ли трек в избранное через JWT"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'is_favorite': False})
    
    token = auth_header.split(' ')[1]
    payload = verify_jwt_token(token)
    
    if not payload:
        return JsonResponse({'is_favorite': False})
    
    user_id = payload.get('user_id')
    try:
        user = User.objects.get(id=user_id)
        track = Track.objects.get(id=track_id)
        is_favorite = Favorite.objects.filter(user=user, track=track).exists()
        return JsonResponse({'is_favorite': is_favorite})
    except (Track.DoesNotExist, User.DoesNotExist):
        return JsonResponse({'is_favorite': False})

def favorite_stats(request):
    """Статистика по избранным трекам"""
    from django.db.models import Count
    from django.utils import timezone
    from datetime import timedelta
    
    top_favorites = Track.objects.annotate(
        favorite_count=Count('favorite')
    ).filter(favorite_count__gt=0).order_by('-favorite_count')[:10]

    recent_favorites_data = Favorite.objects.select_related('track').order_by('-created_at')[:10]
    
    top_data = []
    for track in top_favorites:
        top_data.append({
            'id': track.id,
            'title': track.title,
            'artist': track.artist,
            'anime': track.anime,
            'image': track.image.url if track.image else None,
            'favorite_count': track.favorite_count
        })
    
    recent_data = []
    for favorite in recent_favorites_data:
        track = favorite.track
        time_added = favorite.created_at
        
        time_display = "Только что"
        if time_added:
            time_diff = timezone.now() - time_added
            if time_diff < timedelta(minutes=1):
                time_display = "Только что"
            elif time_diff < timedelta(hours=1):
                minutes = int(time_diff.total_seconds() / 60)
                time_display = f"{minutes} мин назад"
            elif time_diff < timedelta(days=1):
                hours = int(time_diff.total_seconds() / 3600)
                time_display = f"{hours} ч назад"
            else:
                days = time_diff.days
                time_display = f"{days} дн назад"
        
        recent_data.append({
            'id': track.id,
            'title': track.title,
            'artist': track.artist,
            'anime': track.anime,
            'image': track.image.url if track.image else None,
            'time_added': time_display
        })
    
    return JsonResponse({
        'top_favorites': top_data,
        'recent_favorites': recent_data
    })