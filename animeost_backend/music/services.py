import os
from dotenv import load_dotenv

load_dotenv()

def get_mal_anime_rating(anime_title):
    """Локальная база рейтингов популярных аниме"""
    
    anime_ratings = {
        'oshi no ko': 8.64,
        'jujutsu kaisen': 8.77,
        'kimetsu no yaiba': 8.99,
        'demon slayer': 8.99,
        
        'attack on titan': 8.52,
        'shingeki no kyojin': 8.52,
        'one piece': 8.71,
        'naruto': 7.99,
        'death note': 8.62,
        'fullmetal alchemist brotherhood': 9.11,
        'hunter x hunter': 9.10,
        'steins gate': 9.11,
        'code geass': 8.71,
        'tokyo ghoul': 7.79,
        'my hero academia': 7.99,
        'dr stone': 8.04,
        'chainsaw man': 8.67,
        'spy x family': 8.67,
        'bleach': 7.92,
        'dragon ball': 7.92,
    }
    
    lower_title = anime_title.lower()
    for anime_name, rating in anime_ratings.items():
        if anime_name in lower_title:
            print(f"✅ Found local rating for {anime_title}: {rating}")
            return rating
    
    print(f"❌ No local rating found for {anime_title}, using default")
    return 7.5  