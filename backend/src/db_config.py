# db_config.py
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from gridfs import GridFS

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), "../../.env.local")
load_dotenv(dotenv_path)

# Get MongoDB URI (without database)
MONGO_URI = os.getenv("MONGO_URI")

# Ensure MONGO_URI is loaded
if not MONGO_URI:
    raise ValueError("Error: MONGO_URI is missing. Check your .env file!")


# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client["pawfectly"]
fs = GridFS(db)
print("✅ Connected to MongoDB:", db.name)
print("Collections:", db.list_collection_names())

# 创建地理空间索引
try:
    # Get existing indexes
    existing_indexes = list(db["pets"].list_indexes())
    index_names = [index["name"] for index in existing_indexes]
    
    # Check if geospatial index already exists
    if "location_2dsphere" not in index_names:
        db["pets"].create_index([("location", "2dsphere")], name="location_2dsphere")
        print("✅ GeoSpatial index created for pets collection")
    else:
        print("✅ GeoSpatial index already exists for pets collection")
    
    # List all indexes to confirm
    print("📊 Current indexes:", [idx["name"] for idx in db["pets"].list_indexes()])
except Exception as e:
    print("❌ Error creating GeoSpatial index:", e)
    import traceback
    traceback.print_exc()
    
# Check for any existing pet data and verify location format
try:
    sample = db["pets"].find_one()
    if sample:
        print("📋 Sample pet data:", sample)
        if "location" in sample:
            print("📍 Location format:", sample["location"])
            # Check if location is in the correct format
            if not isinstance(sample["location"], dict) or "type" not in sample["location"] or sample["location"]["type"] != "Point":
                print("⚠️ Warning: Some pet data may have incorrect location format!")
except Exception as e:
    print("❌ Error checking sample data:", e)
