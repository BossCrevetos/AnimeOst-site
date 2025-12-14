from django.urls import path
from .views import (
    track_list, register_user, login_user, toggle_favorite, 
    favorite_stats, logout_user, check_auth, get_csrf_token, 
    check_favorite_status, user_favorites, get_profile,
    change_email, change_password, top_tracks,
    track_comments, delete_comment, track_favorite_count,
    mark_comments_as_deleted,
    delete_account
)

urlpatterns = [
    path('tracks/', track_list, name='track-list'),
    path('top-tracks/', top_tracks, name='top-tracks'),
    path('user/favorites/', user_favorites, name='user-favorites'),
    path('profile/', get_profile, name='get-profile'),
    path('change-email/', change_email, name='change-email'),
    path('change-password/', change_password, name='change-password'),
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('favorite/<int:track_id>/', toggle_favorite, name='toggle-favorite'),
    path('check-favorite/<int:track_id>/', check_favorite_status, name='check-favorite'),
    path('favorites/stats/', favorite_stats, name='favorite-stats'),
    path('tracks/<int:track_id>/favorite-count/', track_favorite_count, name='track-favorite-count'),
    path('logout/', logout_user, name='logout'),
    path('check-auth/', check_auth, name='check-auth'),
    path('get-csrf/', get_csrf_token, name='get-csrf'),
    # Комментарии
    path('tracks/<int:track_id>/comments/', track_comments, name='track-comments'),
    path('comments/<int:comment_id>/', delete_comment, name='delete-comment'),
    # ДОБАВЬ ЭТОТ ПУТЬ
    path('users/<int:user_id>/mark-comments-deleted/', mark_comments_as_deleted, name='mark-comments-deleted'),
    path('delete-account/', delete_account, name='delete-account'),  
]