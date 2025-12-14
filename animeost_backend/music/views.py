from django.http import JsonResponse
from .models import Track, Favorite, Comment
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.views.decorators.csrf import csrf_exempt
import json
from django.middleware.csrf import get_token
import jwt
import datetime
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

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
            'lyrics': track.lyrics,
            'lyrics_romanized': track.lyrics_romanized,
            'anime_rating': track.anime_rating,
            'spotify_popularity': track.spotify_popularity,
            'calculated_score': track.calculated_score
        })
    return JsonResponse(data, safe=False)

def top_tracks(request):
    """Топ-6 треков по рейтингу для карусели"""
    tracks = Track.objects.all().order_by('-calculated_score')[:6]
    data = []
    for track in tracks:
        data.append({
            'id': track.id,
            'title': track.title,
            'artist': track.artist,
            'anime': track.anime,
            'image': track.image.url if track.image else None,
            'duration': track.duration,
            'lyrics': track.lyrics,
            'lyrics_romanized': track.lyrics_romanized,
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
            email = data.get('email', '').lower().strip()
            password = data.get('password')
            
            if User.objects.filter(username=username).exists():
                return JsonResponse({'error': 'Username already exists'}, status=400)
            
            if User.objects.filter(email=email).exists():
                return JsonResponse({'error': 'Email already exists'}, status=400)
            
            if not email or '@' not in email:
                return JsonResponse({'error': 'Invalid email format'}, status=400)
            
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

@csrf_exempt
def user_favorites(request):
    """Получить избранные треки текущего пользователя"""
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
        favorites = Favorite.objects.filter(user=user).select_related('track').order_by('-created_at')
        
        favorite_tracks = []
        for favorite in favorites:
            track = favorite.track
            favorite_tracks.append({
                'id': track.id,
                'title': track.title,
                'artist': track.artist,
                'anime': track.anime,
                'image': track.image.url if track.image else None,
                'duration': track.duration,
                'added_at': favorite.created_at.strftime('%d.%m.%Y %H:%M')
            })
        
        return JsonResponse({
            'favorites': favorite_tracks,
            'username': user.username,
            'email': user.email,
            'total_count': len(favorite_tracks)
        })
        
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=401)

@csrf_exempt
def get_profile(request):
    """Получить профиль пользователя"""
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
        return JsonResponse({
            'username': user.username,
            'email': user.email,
            'favorites_count': user.favorite_set.count()
        })
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=401)

@csrf_exempt
def change_email(request):
    """Смена email пользователя"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_jwt_token(token)
    
    if not payload:
        return JsonResponse({'error': 'Invalid token'}, status=401)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    user_id = payload.get('user_id')
    try:
        user = User.objects.get(id=user_id)
        data = json.loads(request.body)
        
        current_email = data.get('current_email', '').lower().strip()
        new_email = data.get('new_email', '').lower().strip()
        password = data.get('password')
        
        if user.email != current_email:
            return JsonResponse({'error': 'Текущий email указан неверно'}, status=400)
        
        if not user.check_password(password):
            return JsonResponse({'error': 'Неверный пароль'}, status=400)
        
        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return JsonResponse({'error': 'Email уже используется'}, status=400)
        
        user.email = new_email
        user.save()
        
        return JsonResponse({'message': 'Email успешно изменен'})
        
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def change_password(request):
    """Смена пароля пользователя"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_jwt_token(token)
    
    if not payload:
        return JsonResponse({'error': 'Invalid token'}, status=401)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    user_id = payload.get('user_id')
    try:
        user = User.objects.get(id=user_id)
        data = json.loads(request.body)
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not user.check_password(current_password):
            return JsonResponse({'error': 'Неверный текущий пароль'}, status=400)
        
        user.set_password(new_password)
        user.save()
        
        update_session_auth_hash(request, user)
        
        return JsonResponse({'message': 'Пароль успешно изменен'})
        
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=401)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

def favorite_stats(request):
    """Статистика по избранным трекам"""
    from django.db.models import Count, Max
    from django.utils import timezone
    from datetime import timedelta
    
    all_tracks_with_stats = Track.objects.annotate(
        favorite_count=Count('favorite'),
        last_favorite_time=Max('favorite__created_at')
    ).filter(favorite_count__gt=0).order_by('-favorite_count', '-last_favorite_time')
    
    top_favorites = []
    seen_single_favorites = False
    
    for track in all_tracks_with_stats:
        if track.favorite_count == 1:
            if not seen_single_favorites:
                top_favorites.append(track)
                seen_single_favorites = True
        else:
            top_favorites.append(track)
        
        if len(top_favorites) >= 5:
            break
    
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
    
    from django.db.models import Subquery, OuterRef
    
    latest_favorites = Favorite.objects.filter(
        track=OuterRef('pk')
    ).order_by('-created_at').values('created_at')[:1]
    
    tracks_with_latest_time = Track.objects.annotate(
        latest_favorite_time=Subquery(latest_favorites)
    ).filter(
        latest_favorite_time__isnull=False
    ).order_by('-latest_favorite_time')[:5]
    
    recent_data = []
    for track in tracks_with_latest_time:
        time_added = track.latest_favorite_time
        
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

# КОММЕНТАРИИ
@csrf_exempt
def track_comments(request, track_id):
    """Получить комментарии трека или добавить новый"""
    try:
        track = Track.objects.get(id=track_id)
    except Track.DoesNotExist:
        return JsonResponse({'error': 'Track not found'}, status=404)
    
    if request.method == 'GET':
        comments = Comment.objects.filter(track=track).select_related('user').order_by('-created_at')
        comments_data = []
        for comment in comments:
            if comment.is_deleted_account or not comment.user:
                # Удаленный аккаунт
                comments_data.append({
                    'id': comment.id,
                    'text': comment.text,
                    'user': {
                        'username': comment.username_backup or 'Удаленный пользователь',
                        'avatar': None,
                        'is_deleted': True
                    },
                    'created_at': comment.created_at.isoformat()
                })
            else:
                # Активный аккаунт
                comments_data.append({
                    'id': comment.id,
                    'text': comment.text,
                    'user': {
                        'username': comment.user.username,
                        'avatar': None,
                        'is_deleted': False
                    },
                    'created_at': comment.created_at.isoformat()
                })
        return JsonResponse(comments_data, safe=False)
    
    elif request.method == 'POST':
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
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=401)
        
        data = json.loads(request.body)
        text = data.get('text', '').strip()
        
        if not text:
            return JsonResponse({'error': 'Comment text is required'}, status=400)
        
        comment = Comment.objects.create(
            user=user,
            track=track,
            text=text
        )
        
        return JsonResponse({
            'id': comment.id,
            'text': comment.text,
            'user': {
                'username': comment.user.username,
                'avatar': None
            },
            'created_at': comment.created_at.isoformat()
        }, status=201)

@csrf_exempt
def delete_comment(request, comment_id):
    """Удалить комментарий"""
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
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return JsonResponse({'error': 'Comment not found'}, status=404)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=401)
    
    if comment.user != user:
        return JsonResponse({'error': 'You can only delete your own comments'}, status=403)
    
    comment.delete()
    return JsonResponse({'message': 'Comment deleted'}, status=200)

# ДОБАВЬ ЭТУ ФУНКЦИЮ ДЛЯ КОЛИЧЕСТВА ИЗБРАННЫХ ТРЕКА
@csrf_exempt
def track_favorite_count(request, track_id):
    """Получить количество добавлений в избранное для конкретного трека"""
    try:
        track = Track.objects.get(id=track_id)
        favorite_count = Favorite.objects.filter(track=track).count()
        
        return JsonResponse({
            'track_id': track.id,
            'favorite_count': favorite_count
        })
    except Track.DoesNotExist:
        return JsonResponse({'error': 'Track not found'}, status=404)
@csrf_exempt
def mark_comments_as_deleted(request, user_id):
    """Отметить все комментарии пользователя как от удаленного аккаунта"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    try:
        user = User.objects.get(id=user_id)
        
        # Только отмечаем как удаленные, НЕ убираем связь
        Comment.objects.filter(user=user).update(
            is_deleted_account=True
            # user=None  - НЕ УБИРАЕМ ЭТУ СТРОКУ
        )
        
        return JsonResponse({'message': 'Comments marked as deleted'})
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
@csrf_exempt
def delete_account(request):
    """Удалить аккаунт пользователя - ВСЕ В ОДНОЙ ФУНКЦИИ"""
    print("=== DELETE ACCOUNT ===")
    
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    token = auth_header.split(' ')[1]
    payload = verify_jwt_token(token)
    
    if not payload:
        return JsonResponse({'error': 'Invalid token'}, status=401)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)
    
    user_id = payload.get('user_id')
    print(f"User ID from token: {user_id}")
    
    try:
        # 1. Находим пользователя
        user = User.objects.get(id=user_id)
        username = user.username
        print(f"Deleting user: {username}")
        
        # 2. Обновляем все комментарии этого пользователя
        # Сначала сохраняем имя пользователя
        comments = Comment.objects.filter(user=user)
        print(f"User has {comments.count()} comments")
        
        for comment in comments:
            if not comment.username_backup:
                comment.username_backup = username
                comment.is_deleted_account = True
                comment.save()
        
        # Убираем связь с пользователем
        Comment.objects.filter(user=user).update(user=None)
        
        # 3. Удаляем избранное
        favorites_count = Favorite.objects.filter(user=user).count()
        print(f"User has {favorites_count} favorites")
        Favorite.objects.filter(user=user).delete()
        
        # 4. Удаляем самого пользователя
        user.delete()
        
        print(f"Account {username} deleted successfully")
        return JsonResponse({'message': 'Account deleted successfully'})
        
    except User.DoesNotExist:
        print(f"User with ID {user_id} not found")
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        print(f"Error deleting account: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)