import os
from dotenv import load_dotenv

load_dotenv()

print("=== CHECKING API KEYS ===")
print(f"MAL_CLIENT_ID: {'SET' if os.getenv('MAL_CLIENT_ID') else 'MISSING'}")
print(f"SPOTIFY_CLIENT_ID: {'SET' if os.getenv('SPOTIFY_CLIENT_ID') else 'MISSING'}")
print(f"SPOTIFY_CLIENT_SECRET: {'SET' if os.getenv('SPOTIFY_CLIENT_SECRET') else 'MISSING'}")

# Покажем первые 10 символов ключей для проверки
mal_key = os.getenv('MAL_CLIENT_ID')
spotify_id = os.getenv('SPOTIFY_CLIENT_ID')
spotify_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

if mal_key:
    print(f"MAL key starts with: {mal_key[:10]}...")
if spotify_id:
    print(f"Spotify ID starts with: {spotify_id[:10]}...")
if spotify_secret:
    print(f"Spotify Secret starts with: {spotify_secret[:10]}...")