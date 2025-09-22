import requests
import random
import time
from datetime import datetime

API_URL = "http://localhost:4000/backend/insertData"
API_KEY = "KMdpL9MQibPD_fF1lKHJlaJM8_aF1cVw__UQDESSz84"

# Initialize sensor values at 50
sensor_values = {f"s{i}": 400 for i in range(1, 17)}

def generate_data():
    global sensor_values
    data = {
        "deviceName": "XY001",
        "timestamp": datetime.now().strftime("%Y-%m-%d,%H:%M:%S"),
    }

    # Increment sensor values by a random step
    for i in range(1, 17):
        increment_step = random.uniform(0.5, 1.5)  # Random step between 5 and 15
        sensor_values[f"s{i}"] += increment_step

        if sensor_values[f"s{i}"] >= 450:  
            sensor_values[f"s{i}"] = 350
        
        data[f"s{i}"] = str(f"{sensor_values[f's{i}']:.2f}")
    
    return data

def send_data():
    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }

    while True:
        data = generate_data()
 
        try:
            response = requests.post(API_URL, json=data, headers=headers)
            print(f"Sent: {data}")
            print(f"Response: {response.status_code}")
        except requests.RequestException as e:
            print(f"Request failed: {e}")
        
        time.sleep(60) 

if __name__ == "__main__":
    send_data()
