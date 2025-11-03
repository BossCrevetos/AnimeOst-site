import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_auth():
    print("=== Testing Authentication ===")
    
    # 1. Регистрация
    print("\n1. Testing registration...")
    reg_data = {
        "username": "testuser",
        "email": "test@test.com",
        "password": "testpass123"
    }
    
    session = requests.Session()  # Важно использовать сессию
    
    response = session.post(f"{BASE_URL}/register/", json=reg_data)
    print(f"Registration Status: {response.status_code}")
    print(f"Registration Response: {response.text}")
    
    # 2. Проверка авторизации
    print("\n2. Testing auth check...")
    response = session.get(f"{BASE_URL}/check-auth/")
    print(f"Auth Check Status: {response.status_code}")
    print(f"Auth Check Response: {response.text}")
    
    # 3. Добавление в избранное
    print("\n3. Testing favorite...")
    response = session.post(f"{BASE_URL}/favorite/1/")  # ID первого трека
    print(f"Favorite Status: {response.status_code}")
    print(f"Favorite Response: {response.text}")

if __name__ == "__main__":
    test_auth()