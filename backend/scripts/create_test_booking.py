#!/usr/bin/env python3

import sys
import os
import json
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId

# Add the parent directory to path so we can import our modules
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Import our database config
from src.db_config import db

def create_test_booking():
    """
    Creates a test booking between the test pet owner and vet.
    """
    print("🔍 Getting user data...")
    
    users_collection = db["users"]
    pets_collection = db["pets"]
    vet_services_collection = db["vet_services"]
    
    # Find the vet
    vet = users_collection.find_one({"user_name": "drsmith"})
    if not vet:
        print("❌ Vet 'drsmith' not found. Run create_test_vets.py first.")
        return
    
    # Find the pet owner
    owner = users_collection.find_one({"user_name": "petlover"})
    if not owner:
        print("❌ Pet owner 'petlover' not found. Run create_test_pet_owner.py first.")
        return
    
    # Find the pet
    pet = pets_collection.find_one({"owner_id": str(owner["_id"])})
    if not pet:
        print("❌ No pets found for owner. Run create_test_pet_owner.py first.")
        return
    
    print(f"✅ Found vet: {vet.get('name')}")
    print(f"✅ Found owner: {owner.get('name')}")
    print(f"✅ Found pet: {pet.get('name')}")
    
    # Create booking data
    booking = {
        'petId': str(pet['_id']),
        'petName': pet.get('name', ''),
        'petSpecies': pet.get('species', ''),
        'petBreed': pet.get('breed', ''),
        'vetId': str(vet['_id']),
        'vetName': vet.get('name', ''),
        'ownerId': str(owner['_id']),
        'ownerName': owner.get('name', ''),
        'ownerContact': {
            'phone': owner.get('contact', {}).get('phone_number', ''),
            'email': owner.get('contact', {}).get('email', '')
        },
        'serviceCategory': 'checkup',
        'serviceType': 'in_person',
        'timeSlot': 'Monday_Morning',
        'notes': 'This is a test booking for my pet. I noticed some unusual behavior recently.',
        'status': 'confirmed',
        'tracking': [
            {'step': 'check-in', 'completed': False},
            {'step': 'examination', 'completed': False},
            {'step': 'treatment', 'completed': False},
            {'step': 'checkout', 'completed': False}
        ],
        'images': [],
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }
    
    # Check if booking already exists
    existing_booking = vet_services_collection.find_one({
        'petId': booking['petId'],
        'vetId': booking['vetId'],
        'status': {'$in': ['pending', 'confirmed', 'in_progress']}
    })
    
    if existing_booking:
        print(f"✅ Booking already exists - updating")
        vet_services_collection.update_one(
            {"_id": existing_booking["_id"]},
            {"$set": {
                "notes": booking["notes"],
                "updatedAt": datetime.utcnow()
            }}
        )
        booking_id = existing_booking["_id"]
    else:
        print(f"🆕 Creating new booking")
        result = vet_services_collection.insert_one(booking)
        booking_id = result.inserted_id
    
    print(f"✅ Test booking created/updated with ID: {booking_id}")
    print("✅ You can now test the vet service management functionality!")

if __name__ == "__main__":
    create_test_booking() 