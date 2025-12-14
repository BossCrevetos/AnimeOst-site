from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Track, Favorite, Comment

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'anime', 'anime_rating', 'calculated_score']
    list_editable = ['anime_rating']  
    search_fields = ['title', 'artist', 'anime']
    
    # Добавляем inline для комментариев к треку
    inlines = []

# Админка для комментариев
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['get_user_info', 'track', 'get_text_preview', 'created_at', 'is_deleted_account']
    list_filter = ['is_deleted_account', 'created_at', 'user']
    search_fields = ['text', 'user__username', 'track__title']
    readonly_fields = ['created_at', 'username_backup', 'is_deleted_account']
    list_per_page = 20
    
    def get_user_info(self, obj):
        if obj.user:
            return f"{obj.user.username} ({obj.user.email})"
        elif obj.username_backup:
            return f"{obj.username_backup} (удален)"
        return "Без пользователя"
    get_user_info.short_description = 'Пользователь'
    get_user_info.admin_order_field = 'user__username'
    
    def get_text_preview(self, obj):
        if len(obj.text) > 50:
            return f"{obj.text[:50]}..."
        return obj.text
    get_text_preview.short_description = 'Текст'
    
    # Поля для отображения в форме
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'track', 'text', 'username_backup', 'is_deleted_account')
        }),
        ('Дополнительно', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        })
    )

# Админка для избранного
@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'track', 'created_at']
    list_filter = ['created_at', 'user']
    search_fields = ['user__username', 'track__title']
    readonly_fields = ['created_at']
    list_per_page = 20

# Inline для комментариев в админке пользователя
class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    readonly_fields = ['created_at', 'track', 'text_preview', 'is_deleted_account']
    fields = ['track', 'text_preview', 'created_at', 'is_deleted_account']
    
    def text_preview(self, obj):
        if len(obj.text) > 30:
            return f"{obj.text[:30]}..."
        return obj.text
    text_preview.short_description = 'Текст'
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

# Inline для избранного в админке пользователя
class FavoriteInline(admin.TabularInline):
    model = Favorite
    extra = 0
    readonly_fields = ['track', 'created_at']
    fields = ['track', 'created_at']
    
    def has_add_permission(self, request, obj=None):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

# Расширяем стандартную админку User
class CustomUserAdmin(UserAdmin):
    # Добавляем наши inline
    inlines = [CommentInline, FavoriteInline]
    
    # Расширяем список отображаемых полей
    list_display = ('username', 'email', 'date_joined', 'get_comment_count', 'get_favorite_count', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'date_joined', 'last_login')
    
    # Добавляем поиск по email
    search_fields = ('username', 'email')
    
    def get_comment_count(self, obj):
        count = obj.comment_set.count()
        deleted = obj.comment_set.filter(is_deleted_account=True).count()
        return f"{count} ({deleted} удал.)"
    get_comment_count.short_description = 'Комментарии'
    get_comment_count.admin_order_field = 'comment_count'
    
    def get_favorite_count(self, obj):
        return obj.favorite_set.count()
    get_favorite_count.short_description = 'Избранное'
    get_favorite_count.admin_order_field = 'favorite_count'
    
    # Добавляем информацию о комментариях на страницу пользователя
    fieldsets = UserAdmin.fieldsets + (
        ('Статистика', {
            'fields': ('get_user_stats',),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('get_user_stats',)
    
    def get_user_stats(self, obj):
        comment_count = obj.comment_set.count()
        favorite_count = obj.favorite_set.count()
        deleted_comments = obj.comment_set.filter(is_deleted_account=True).count()
        
        return f"""
        Всего комментариев: {comment_count}<br>
        Из них удаленных аккаунтов: {deleted_comments}<br>
        Избранных треков: {favorite_count}<br>
        Дата регистрации: {obj.date_joined.strftime('%d.%m.%Y %H:%M')}
        """
    get_user_stats.short_description = 'Статистика пользователя'

# Перерегистрируем User админку
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)