import os 
import django 
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'animeost_backend.settings') 
django.setup() 
 
from music.services import get_mal_anime_rating, get_spotify_track_popularity 
 
print("Testing MyAnimeList API...") 
rating = get_mal_anime_rating("Demon Slayer") 
print(f"Anime rating: {rating}") 
 
print("Testing Spotify API...") 
popularity = get_spotify_track_popularity("Gurenge", "LiSA") 
print(f"Track popularity: {popularity}") 
