#!/usr/bin/env python3

import sys
import os
import json
from pymongo import MongoClient
from bson.objectid import ObjectId

# Add the parent directory to path so we can import our modules
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Import our database config
from src.db_config import db

def check_vets():
    """
    Checks for all users with vet identity in the database and prints them
    """
    print("🔍 Checking for veterinarians in the database...")
    
    users_collection = db["users"]
    
    # Query using all possible formats of vet identity
    vets = list(users_collection.find({
        '$or': [
            {'identity': 'vet'},
            {'identity': ['vet']},
            {'identity': {'$in': ['vet']}},
            {'identity': {'$elemMatch': {'$eq': 'vet'}}}
        ]
    }))
    
    if not vets:
        print("❌ No veterinarians found in the database.")
        return
    
    print(f"✅ Found {len(vets)} veterinarians:")
    
    for i, vet in enumerate(vets, 1):
        print(f"\n--- Vet #{i} ---")
        print(f"ID: {vet.get('_id')}")
        print(f"Username: {vet.get('user_name')}")
        print(f"Name: {vet.get('name')}")
        print(f"Identity: {vet.get('identity')}")
        print(f"Type of identity: {type(vet.get('identity'))}")
        print(f"Specialty: {vet.get('specialty', 'Not specified')}")
        
        # Show if vet is properly configured
        if isinstance(vet.get('identity'), list) and 'vet' in vet.get('identity'):
            print("✅ Identity format is correct (list containing 'vet')")
        elif vet.get('identity') == 'vet':
            print("⚠️ Identity format is a string, should be a list")
        else:
            print("❌ Identity format is incorrect")
            
        # Check if vet has availability set
        if vet.get('availability'):
            avail_count = sum(1 for v in vet.get('availability', {}).values() if v)
            print(f"Availability: {avail_count} slots configured")
        else:
            print("⚠️ No availability configured")
    
    print("\n✅ Veterinarian check complete!")

if __name__ == "__main__":
    check_vets() 