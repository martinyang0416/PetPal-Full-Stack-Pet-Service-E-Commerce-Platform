#!/usr/bin/env python3

import sys
import os
import json
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
import bcrypt

# Add the parent directory to path so we can import our modules
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Import our database config
from src.db_config import db

def create_test_vets():
    """
    Creates test veterinarian users in the database.
    """
    print("🔍 Checking if test vets exist...")
    
    # Test data for vets
    vets_data = [
        {
            "user_name": "drsmith",
            "email": "drsmith@pawfectly.com",
            "name": "Lily Sheng",
            "password": bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode(),
            "contact": {
                "phone_number": "555-123-4567",
                "email": "drsmith@pawfectly.com"
            },
            "location": {
                "city": "New York",
                "state": "NY",
                "country": "USA",
                "zip_code": "10001"
            },
            "identity": ["vet"],
            "bio": "Hi I am Lily! I'm a general veterinarian with over 10 years of experience in small animal care.",
            "specialty": "General Veterinarian",
            "availability": {
                "Monday_Morning": True,
                "Monday_Afternoon": True,
                "Monday_Evening": False,
                "Tuesday_Morning": True,
                "Tuesday_Afternoon": True,
                "Tuesday_Evening": False,
                "Wednesday_Morning": True,
                "Wednesday_Afternoon": True,
                "Wednesday_Evening": False,
                "Thursday_Morning": True,
                "Thursday_Afternoon": True,
                "Thursday_Evening": False,
                "Friday_Morning": True,
                "Friday_Afternoon": True,
                "Friday_Evening": False,
                "Saturday_Morning": False,
                "Saturday_Afternoon": False,
                "Saturday_Evening": False,
                "Sunday_Morning": False,
                "Sunday_Afternoon": False,
                "Sunday_Evening": False
            },
            "is_public": True,
            "profile_completion": 90,
            "has_completed_profile": True,
            "rating": 4.8,
            "review": [],
            "pets": [],
            "profile_picture": ""
        },
        {
            "user_name": "esnadmin",
            "email": "admin@esn.org",
            "name": "ESNAdmin",
            "password": bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode(),
            "contact": {
                "phone_number": "",
                "email": "admin@esn.org"
            },
            "location": {},
            "identity": ["vet", "admin"],
            "bio": "",
            "specialty": "General Veterinarian",
            "availability": {
                "Monday_Morning": False,
                "Monday_Afternoon": False,
                "Monday_Evening": False,
                "Tuesday_Morning": False,
                "Tuesday_Afternoon": False,
                "Tuesday_Evening": False,
                "Wednesday_Morning": False,
                "Wednesday_Afternoon": False,
                "Wednesday_Evening": False,
                "Thursday_Morning": False,
                "Thursday_Afternoon": False,
                "Thursday_Evening": False,
                "Friday_Morning": False,
                "Friday_Afternoon": False,
                "Friday_Evening": False,
                "Saturday_Morning": False,
                "Saturday_Afternoon": False,
                "Saturday_Evening": False,
                "Sunday_Morning": False,
                "Sunday_Afternoon": False,
                "Sunday_Evening": False
            },
            "is_public": True,
            "profile_completion": 30,
            "has_completed_profile": False,
            "rating": 0,
            "review": [],
            "pets": [],
            "profile_picture": ""
        }
    ]
    
    users_collection = db["users"]
    
    for vet_data in vets_data:
        # Check if user already exists
        existing_user = users_collection.find_one({"user_name": vet_data["user_name"]})
        
        if existing_user:
            print(f"✅ User {vet_data['user_name']} already exists - updating fields")
            # Update existing user with vet identity and relevant fields
            users_collection.update_one(
                {"user_name": vet_data["user_name"]},
                {"$set": {
                    "identity": vet_data["identity"],
                    "specialty": vet_data["specialty"],
                    "availability": vet_data["availability"],
                    "bio": vet_data["bio"],
                    "location": vet_data["location"],
                    "contact": vet_data["contact"],
                    "name": vet_data["name"]
                }}
            )
        else:
            print(f"🆕 Creating new vet user: {vet_data['user_name']}")
            # Insert new vet user
            users_collection.insert_one(vet_data)
    
    print("✅ Test vets created/updated successfully!")

if __name__ == "__main__":
    create_test_vets() 