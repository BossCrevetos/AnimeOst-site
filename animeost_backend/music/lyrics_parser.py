import lyricsgenius
import os
import time
from django.conf import settings

# Замени на свой API ключ
GENIUS_API_KEY = 'cRnR-w0vo9L6qq7gy1uH7VEIRInts4tzBI3KrTjsUjJFvue4R3b9UF0ni3Hwctt1'

def get_lyrics_from_genius(track_title, artist_name):
    """
    Получает текст песни с Genius
    """
    if not GENIUS_API_KEY or GENIUS_API_KEY == 'ВАШ_API_КЛЮЧ_ЗДЕСЬ':
        print("Please set GENIUS_API_KEY in lyrics_parser.py")
        return None
    
    try:
        genius = lyricsgenius.Genius(GENIUS_API_KEY)
        genius.verbose = False  # Убираем лишние сообщения
        genius.remove_section_headers = True  # Убираем [Припев], [Куплет]
        genius.skip_non_songs = True  # Пропускаем не-песни
        
        print(f"Searching lyrics for: {artist_name} - {track_title}")
        
        # Ищем песню
        song = genius.search_song(track_title, artist_name)
        
        if song and song.lyrics:
            print(f"Found lyrics for: {artist_name} - {track_title}")
            return song.lyrics
        else:
            print(f"Lyrics not found for: {artist_name} - {track_title}")
            return None
        
    except Exception as e:
        print(f"Error getting lyrics from Genius: {e}")
        return None

def update_track_lyrics(track):
    """
    Обновляет текст песни для трека
    """
    try:
        if not track.lyrics:  # Обновляем только если текста еще нет
            lyrics = get_lyrics_from_genius(track.title, track.artist)
            
            if lyrics:
                track.lyrics = lyrics
                track.save()
                print(f"✅ Updated lyrics for: {track.title} - {track.artist}")
                return True
            else:
                print(f"❌ Could not find lyrics for: {track.title} - {track.artist}")
                return False
        return True
        
    except Exception as e:
        print(f"❌ Error updating lyrics for {track.title}: {e}")
        return False

def update_all_tracks_lyrics():
    """
    Обновляет тексты для всех треков без lyrics
    """
    from .models import Track
    
    tracks_without_lyrics = Track.objects.filter(lyrics__isnull=True) | Track.objects.filter(lyrics='')
    
    print(f"Found {tracks_without_lyrics.count()} tracks without lyrics")
    
    for track in tracks_without_lyrics:
        update_track_lyrics(track)
        time.sleep(1)  # Задержка чтобы не заблочили API