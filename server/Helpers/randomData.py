# import requests
# import random
# import time
# from datetime import datetime

# API_URL = "http://localhost:4000/backend/insertData"
# # API_URL = "http://34.47.187.43:4000/backend/insertData"

# API_KEY = "KMdpL9MQibPD_fF1lKHJlaJM8_aF1cVw__UQDESSz84"

# def generate_data():
#     data = {
#         "deviceName": "XY001",
#         "timestamp": datetime.now().strftime("%Y-%m-%d,%H:%M:%S"),
#     }
    
#     # Generate random values for s1 to s16 between 50 and 500
#     for i in range(1, 17):
#         data[f"s{i}"] = str(random.randint(50, 450))
    
#     return data

# def send_data():
#     headers = {
#         "Content-Type": "application/json",
#         "x-api-key": API_KEY  # Include API key in headers
#     }

#     while True:
#         data = generate_data()
#         try:
#             response = requests.post(API_URL, json=data, headers=headers)
#             print(f"Sent: {data}")
#             print(f"Response: {response.status_code}")
#         except requests.RequestException as e:
#             print(f"Request failed: {e}")
        
#         time.sleep(10)  # Wait for 10 seconds before sending again

# if __name__ == "__main__":
#     send_data()

import requests
import random
import time
from datetime import datetime

API_URL = "http://localhost:4000/backend/insertData"
# API_URL = "http://34.47.187.43:4000/backend/insertData"

API_KEY = "KMdpL9MQibPD_fF1lKHJlaJM8_aF1cVw__UQDESSz84"

# Initialize sensor values at 50
sensor_values = {f"s{i}": 400 for i in range(1, 17)}

def generate_data():
    global sensor_values
    data = {
        "deviceName": "XY001",
        "timestamp": datetime.now().strftime("%Y-%m-%d,%H:%M:%S"),
    }

    stop_sending = False

    # Increment sensor values by a random step
    for i in range(1, 17):
        increment_step = random.uniform(0.5, 1.5)  # Random step between 5 and 15
        sensor_values[f"s{i}"] += increment_step

        if sensor_values[f"s{i}"] >= 450:  
            stop_sending = True  # Stop condition met
        
        data[f"s{i}"] = str(f"{sensor_values[f's{i}']:.2f}")
    
    return data, stop_sending

def send_data():
    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }

    while True:
        data, stop_sending = generate_data()

        if stop_sending:
            print("A sensor has reached 450. Stopping data transmission.")
            break  # Stop the loop
        
        try:
            response = requests.post(API_URL, json=data, headers=headers)
            print(f"Sent: {data}")
            print(f"Response: {response.status_code}")
        except requests.RequestException as e:
            print(f"Request failed: {e}")
        
        time.sleep(30)  # Wait 1 second before sending again

if __name__ == "__main__":
    send_data()
