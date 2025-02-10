import requests

def fetch_random_dog_image():
    url = "https://dog.ceo/api/breeds/image/random"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        dog_image_url = data['message']
        print(f"Random Dog Image URL: {dog_image_url}")
    else:
        print(f"Failed to retrieve data: {response.status_code}")

# Run the function
fetch_random_dog_image()
