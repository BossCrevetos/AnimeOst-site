import os
from dotenv import load_dotenv

print("=== TESTING .env LOADING ===")
load_dotenv()

print(f"MAL_CLIENT_ID: {os.getenv('MAL_CLIENT_ID')}")
print(f"SPOTIFY_CLIENT_ID: {os.getenv('SPOTIFY_CLIENT_ID')}")
print(f"SPOTIFY_CLIENT_SECRET: {os.getenv('SPOTIFY_CLIENT_SECRET')}")

# Проверяем что ключи не пустые
mal_key = os.getenv('MAL_CLIENT_ID')
if mal_key and len(mal_key) > 10:
    print("✅ .env file is loading correctly!")
else:
    print("❌ .env file NOT loading correctly!")