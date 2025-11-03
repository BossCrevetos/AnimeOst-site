from django.urls import path
from .views import track_list, register_user, login_user, toggle_favorite, favorite_stats, logout_user, check_auth, get_csrf_token, check_favorite_status

urlpatterns = [
    path('tracks/', track_list, name='track-list'),
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('favorite/<int:track_id>/', toggle_favorite, name='toggle-favorite'),
    path('check-favorite/<int:track_id>/', check_favorite_status, name='check-favorite'),
    path('favorites/stats/', favorite_stats, name='favorite-stats'),
    path('logout/', logout_user, name='logout'),
    path('check-auth/', check_auth, name='check-auth'),
    path('get-csrf/', get_csrf_token, name='get-csrf'),
]