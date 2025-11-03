from django.contrib import admin
from .models import Track

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ['title', 'artist', 'anime', 'anime_rating', 'calculated_score']
    list_editable = ['anime_rating']  
    search_fields = ['title', 'artist', 'anime']