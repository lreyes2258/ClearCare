import json
from pathlib import Path
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["clearcare"]

# Path to mock data file
BASE_DIR = Path(__file__).resolve().parent.parent
MOCK_DATA_PATH = BASE_DIR / "Database" / "clearcare.mock_data.json"
HOSPITALS_PATH = BASE_DIR / "Database" / "clearcare.hospitals.json"

# Load JSON file
with open(MOCK_DATA_PATH, "r") as file:
    mock_data = json.load(file)

with open(HOSPITALS_PATH, "r") as file:
    hospitals = json.load(file)

# Remove _id field if present
for hospital in hospitals:
    hospital.pop("_id", None)


# Clear existing data
db.payers.delete_many({})
db.procedures.delete_many({})
db.mock_prices.delete_many({})
db.hospitals.delete_many({})

# Insert data into separate collections
db.payers.insert_many(mock_data.get("payers", []))
db.procedures.insert_many(mock_data.get("procedures", []))
db.mock_prices.insert_many(mock_data.get("mock_prices", []))
db.hospitals.insert_many(hospitals)

#print("Database seeded successfully from mock_data.json") # We can keep this later if it works
