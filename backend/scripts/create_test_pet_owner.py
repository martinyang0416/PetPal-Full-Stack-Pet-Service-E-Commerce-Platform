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

def create_test_pet_owner():
    """
    Creates a test pet owner with pets in the database.
    """
    print("🔍 Checking if test pet owner exists...")
    
    # Test data for pet owner
    owner_data = {
        "user_name": "petlover",
        "email": "petlover@example.com",
        "name": "Alex Johnson",
        "password": bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode(),
        "contact": {
            "phone_number": "555-987-6543",
            "email": "petlover@example.com"
        },
        "location": {
            "city": "Boston",
            "state": "MA",
            "country": "USA",
            "zip_code": "02108"
        },
        "identity": ["pet_owner"],
        "bio": "Animal lover with two dogs and a cat. Passionate about pet health and nutrition.",
        "is_public": True,
        "profile_completion": 90,
        "has_completed_profile": True,
        "rating": 0,
        "review": [],
        "pets": [],
        "profile_picture": ""
    }
    
    users_collection = db["users"]
    pets_collection = db["pets"]
    
    # Check if user already exists
    existing_user = users_collection.find_one({"user_name": owner_data["user_name"]})
    
    if existing_user:
        print(f"✅ User {owner_data['user_name']} already exists - updating fields")
        user_id = existing_user['_id']
        # Update existing user
        users_collection.update_one(
            {"user_name": owner_data["user_name"]},
            {"$set": {
                "identity": owner_data["identity"],
                "bio": owner_data["bio"],
                "location": owner_data["location"],
                "contact": owner_data["contact"],
                "name": owner_data["name"]
            }}
        )
    else:
        print(f"🆕 Creating new pet owner: {owner_data['user_name']}")
        # Insert new pet owner
        result = users_collection.insert_one(owner_data)
        user_id = result.inserted_id
    
    # Add test pets for this owner
    pets_data = [
        {
            "name": "Max",
            "species": "Dog",
            "breed": "Golden Retriever",
            "age": 3,
            "gender": "Male",
            "weight": 65,
            "medical_history": "Annual checkups, vaccinated",
            "owner_id": str(user_id)
        },
        {
            "name": "Luna",
            "species": "Cat",
            "breed": "Siamese",
            "age": 5,
            "gender": "Female",
            "weight": 10,
            "medical_history": "Spayed, regular checkups",
            "owner_id": str(user_id)
        }
    ]
    
    # Add or update pets
    pet_ids = []
    for pet_data in pets_data:
        # Check if pet already exists
        existing_pet = pets_collection.find_one({
            "name": pet_data["name"],
            "owner_id": pet_data["owner_id"]
        })
        
        if existing_pet:
            print(f"✅ Pet {pet_data['name']} already exists - updating")
            pets_collection.update_one(
                {"_id": existing_pet["_id"]},
                {"$set": pet_data}
            )
            pet_ids.append(str(existing_pet["_id"]))
        else:
            print(f"🆕 Creating new pet: {pet_data['name']}")
            result = pets_collection.insert_one(pet_data)
            pet_ids.append(str(result.inserted_id))
    
    # Update the user's pets array
    users_collection.update_one(
        {"_id": user_id},
        {"$set": {"pets": pet_ids}}
    )
    
    print("✅ Test pet owner and pets created/updated successfully!")

if __name__ == "__main__":
    create_test_pet_owner() 