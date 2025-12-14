from django.db import models
from django.contrib.auth.models import User
from .services import get_mal_anime_rating

class Track(models.Model):
    title = models.CharField(max_length=200, verbose_name="Название трека")
    artist = models.CharField(max_length=100, verbose_name="Исполнитель")
    anime = models.CharField(max_length=100, verbose_name="Аниме")
    image = models.ImageField(upload_to='track_images/', blank=True, null=True, verbose_name="Обложка")
    audio_file = models.FileField(upload_to='tracks/', verbose_name="Аудио файл")
    duration = models.IntegerField(default=0, verbose_name="Длительность (секунды)")
    
    # Тексты песен
    lyrics = models.TextField(blank=True, null=True, verbose_name="Текст песни (английский)")
    lyrics_romanized = models.TextField(blank=True, null=True, verbose_name="Текст песни (ромадзи)")
    
    anime_rating = models.FloatField(default=0, verbose_name="Рейтинг аниме на MAL")
    spotify_popularity = models.IntegerField(default=0, verbose_name="Популярность в Spotify")
    calculated_score = models.FloatField(default=0, verbose_name="Общий балл популярности")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.anime_rating:
            self.anime_rating = get_mal_anime_rating(self.anime)
        
        self.spotify_popularity = 50
        self.calculated_score = (self.anime_rating * 10)
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} - {self.artist}"

    class Meta:
        verbose_name = "Трек"
        verbose_name_plural = "Треки"

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    track = models.ForeignKey(Track, on_delete=models.CASCADE, verbose_name="Трек")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата добавления")
    
    class Meta:
        verbose_name = "Избранный трек"
        verbose_name_plural = "Избранные треки"
        unique_together = ['user', 'track']
    
    def __str__(self):
        return f"{self.user.username} - {self.track.title}"

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Пользователь")  # ИЗМЕНИЛОСЬ
    track = models.ForeignKey(Track, on_delete=models.CASCADE, verbose_name="Трек")
    text = models.TextField(verbose_name="Текст комментария")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    
    # ДОБАВЬ ЭТИ ПОЛЯ
    username_backup = models.CharField(max_length=150, blank=True, null=True, verbose_name="Имя пользователя (бэкап)")
    is_deleted_account = models.BooleanField(default=False, verbose_name="Удаленный аккаунт")
    
    class Meta:
        verbose_name = "Комментарий"
        verbose_name_plural = "Комментарии"
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Сохраняем имя пользователя на всякий случай
        if self.user and not self.username_backup:
            self.username_backup = self.user.username
        super().save(*args, **kwargs)
    
    def __str__(self):
        if self.is_deleted_account or not self.user:
            return f"Удаленный пользователь - {self.track.title}"
        return f"{self.user.username} - {self.track.title}"