import json
from pathlib import Path
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["clearcare"]

# Path to mock data file
BASE_DIR = Path(__file__).resolve().parent.parent.parent
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


#Do this because we do not have enough mock prices and to fill with more will take too long
def generate_mock_prices(hospitals, payers, procedures):
    mock_prices = []

    for hospital_index, hospital in enumerate(hospitals):
        npi = hospital["npi"]

        for payer_index, payer in enumerate(payers):
            payer_name = payer["name"]

            for procedure_index, procedure in enumerate(procedures):
                procedure_code = procedure["code"]

                # formula for prices
                base_price = 100 + (procedure_index * 125)
                hospital_adjustment = hospital_index * 35
                payer_adjustment = payer_index * 20

                negotiated_rate = base_price + hospital_adjustment + payer_adjustment

                mock_prices.append({
                    "npi": npi,
                    "payer": payer_name,
                    "procedure_code": procedure_code,
                    "negotiated_rate": negotiated_rate
                })

    return mock_prices


# Insert data into separate collections
db.payers.insert_many(mock_data.get("payers", []))
db.procedures.insert_many(mock_data.get("procedures", []))


#db.mock_prices.insert_many(mock_data.get("mock_prices", []))
#instead now we call the function as a param for mock_prices
generated_prices = generate_mock_prices(
    hospitals=hospitals,
    payers=mock_data.get("payers", []),
    procedures=mock_data.get("procedures", [])
)

db.mock_prices.insert_many(generated_prices)


db.hospitals.insert_many(hospitals)

#print("Database seeded successfully from mock_data.json") # We can keep this later if it works
