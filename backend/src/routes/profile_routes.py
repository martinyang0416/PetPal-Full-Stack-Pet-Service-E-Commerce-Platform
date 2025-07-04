from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_jwt_extended import set_access_cookies
from flask_jwt_extended import unset_jwt_cookies
from src.models.user_model import User, UserBuilder, find_user_by_username, insert_user, get_pet_ids_by_username
from src.models.pets_model import Pet, PetBuilder, find_pet_by_id, delete_pet_by_id, update_pet_by_id
from src.models.user_relationship_model import UserRelationship
from src.models.review import Review

from bson import ObjectId
from src.db_config import db
import gridfs
from io import BytesIO
import json
import re
from datetime import datetime
from werkzeug.utils import secure_filename
import os

fs = gridfs.GridFS(db)

profile_bp = Blueprint("profile", __name__, url_prefix="/api")

@profile_bp.route("/search_users", methods=["GET"])
@jwt_required()
def search_users():
    query = request.args.get("q", "").strip()
    current_user = get_jwt_identity()
    
    if not query:
        return jsonify([]), 200
        
    # Create a case-insensitive regex pattern for the search query
    pattern = re.compile(f".*{re.escape(query)}.*", re.IGNORECASE)
    
    # Search in the users collection
    users = db.users.find({
        "username": {"$ne": current_user},  # Exclude current user
        "$or": [
            {"name": pattern},
            {"username": pattern},
            {"identity": pattern},
            {"location.city": pattern},
            {"location.state": pattern},
            {"location.country": pattern}
        ]
    }).limit(10)  # Limit to 10 results for performance
    
    # Convert cursor to list and format the response
    results = []
    for user in users:
        results.append({
            "_id": str(user["_id"]),
            "name": user.get("name", ""),
            "user_name": user.get("user_name", ""),
            "profile_picture": user.get("profile_picture"),
            "identity": user.get("identity", []),
            "location": user.get("location", {}),
            "rating": user.get("rating", 0)
        })
    
    return jsonify(results), 200

@profile_bp.route("/complete_profile", methods=["POST"])
@jwt_required()
def complete_profile():
    user_name = get_jwt_identity()

    # Get JSON fields from 'data' field of FormData
    json_data = request.form.get("data")
    if not json_data:
        return jsonify({"msg": "Missing form data"}), 400

    try:
        update_data = json.loads(json_data)
    except Exception:
        return jsonify({"msg": "Invalid JSON format"}), 400

    profile_picture_file = request.files.get("profile_picture")
    if profile_picture_file:
        file_id = User.save_profile_picture(user_name, profile_picture_file)
        update_data["profile_picture"] = file_id 

    # Handle is_public field explicitly
    if "is_public" in update_data:
        update_data["is_public"] = bool(update_data["is_public"])

    # Update using the model method
    success = User.update_profile_by_username(user_name, update_data)

    if not success:
        return jsonify({"msg": "No changes made."}), 200

    return jsonify({"msg": "Profile updated successfully."}), 200



@profile_bp.route("/upload_profile_picture", methods=["POST"])
@jwt_required()
def upload_profile_picture():
    user_name = get_jwt_identity()
    if 'image' not in request.files:
        return jsonify({"msg": "No image file uploaded"}), 400

    image = request.files['image']
    file_id = User.save_profile_picture(user_name, image)

    if file_id:
        return jsonify({"msg": "Image uploaded", "file_id": file_id}), 200
    return jsonify({"msg": "Failed to upload image"}), 500

@profile_bp.route("/profile_picture/<file_id>", methods=["GET"])
def get_profile_picture(file_id):
    try:
        print("Trying to load image with file_id:", file_id)
        file = fs.get(ObjectId(file_id))
        return send_file(BytesIO(file.read()), mimetype=file.content_type)
    except Exception as e:
        print("Error retrieving image:", e)
        return jsonify({"msg": "Image not found"}), 404

@profile_bp.route("/create_pet", methods=["POST"])
@jwt_required()
def create_pet():
    user_id = get_jwt_identity()
    data = request.form.get("data")
    pet_picture_file = request.files.get("profile_picture")

    pet, error = Pet.create_from_form(user_id, data, pet_picture_file)
    if error:
        return jsonify({"msg": error}), 400

    return jsonify({"msg": "Pet created", "pet_id": pet.pet_id}), 201


@profile_bp.route("/pet_picture/<file_id>", methods=["GET"])
def get_pet_picture(file_id):
    try:
        file = fs.get(ObjectId(file_id))
        return send_file(BytesIO(file.read()), mimetype=file.content_type)
    except Exception:
        return jsonify({"msg": "Image not found"}), 404


@profile_bp.route("/pets", methods=["GET"])
@jwt_required()
def get_current_user_pets():
    user_name = get_jwt_identity()
    pet_ids = get_pet_ids_by_username(user_name)

    pets = []
    for pid in pet_ids:
        pet_doc = find_pet_by_id(pid)
        if pet_doc:
            pets.append(pet_doc)

    return jsonify(pets), 200

@profile_bp.route("/delete_pet/<pet_id>", methods=["DELETE"])
@jwt_required()
def delete_pet(pet_id):
    try:
        # First verify the pet exists
        pet = find_pet_by_id(pet_id)
        if not pet:
            print(f"Pet not found with ID: {pet_id}")
            return jsonify({"msg": "Pet not found"}), 404

        # Get current user
        current_user = get_jwt_identity()
        
        # Verify ownership (optional but recommended)
        if pet.get('owner_username') != current_user:
            print(f"Unauthorized deletion attempt: User {current_user} trying to delete pet {pet_id}")
            return jsonify({"msg": "Unauthorized"}), 403

        # Try to delete the pet
        success = delete_pet_by_id(pet_id)
        if success:
            print(f"Successfully deleted pet {pet_id}")
            return jsonify({"msg": "Pet deleted"}), 200
        else:
            print(f"Failed to delete pet {pet_id}")
            return jsonify({"msg": "Failed to delete pet"}), 500
            
    except Exception as e:
        print(f"Error deleting pet {pet_id}: {str(e)}")
        return jsonify({"msg": f"Error deleting pet: {str(e)}"}), 500


@profile_bp.route("/update_pet/<pet_id>", methods=["PUT"])
@jwt_required()
def update_pet(pet_id):
    picture = request.files.get("profile_picture")
    raw_data = request.form.get("data")
    if not raw_data:
        return jsonify({"error": "Missing data"}), 400

    try:
        data = json.loads(raw_data)
    except Exception:
        return jsonify({"error": "Invalid data format"}), 400

    update_fields = {
        "name": data.get("name"),
        "type": data.get("type"),
        "age": int(data.get("age") or 0),
        "weight": float(data.get("weight") or 0),
        "color": data.get("color", ""),
        "description": data.get("description", "")
    }

    if picture:
        file_id = fs.put(picture.stream, filename=picture.filename, content_type=picture.content_type)
        update_fields["profile_picture"] = str(file_id)

    update_pet_by_id(pet_id, update_fields)
    return jsonify({"message": "Pet updated"}), 200

@profile_bp.route("/profile/<username>", methods=["GET"])
@jwt_required()
def get_user_profile(username):
    current_user = get_jwt_identity()
    print(f"Checking profile for user {username}, requested by {current_user}")
    
    # Find target user
    target_user = db.users.find_one({"user_name": username})
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    # Check if following - no status check needed
    follow_relationship = db.user_relationships.find_one({
        "follower": current_user,
        "following": username
    })
    is_following = follow_relationship is not None
    
    print(f"Follow status check: {current_user} following {username}: {is_following}")
    if follow_relationship:
        print(f"Follow relationship found: {follow_relationship}")

    # Get follower and following counts using direct count for better performance
    followers_count = db.user_relationships.count_documents({"following": username})
    following_count = db.user_relationships.count_documents({"follower": username})
    
    print(f"Counts - Followers: {followers_count}, Following: {following_count}")
    
    # Debug: List all relationships for this user
    print("All follower relationships:")
    all_followers = list(db.user_relationships.find({"following": username}))
    for rel in all_followers:
        print(f"Follower: {rel}")
        
    print("All following relationships:")
    all_following = list(db.user_relationships.find({"follower": username}))
    for rel in all_following:
        print(f"Following: {rel}")

    is_public = target_user.get('is_public', True)  # Default to public if not set
    is_own_profile = current_user == username

    # Prepare basic profile data that's always visible
    profile_data = {
        "name": target_user.get('name', username),
        "user_name": target_user.get('user_name', username),
        "profile_picture": target_user.get('profile_picture'),
        "is_private": not is_public,
        "is_following": is_following,
        "followers_count": followers_count,
        "following_count": following_count
    }

    # If profile is public, own profile, or user is a follower, include all data
    if is_public or is_own_profile or is_following:
        profile_data.update({
            "identity": target_user.get('identity'),
            "location": target_user.get('location'),
            "bio": target_user.get('bio', ''),
            "contact": target_user.get('contact', {}),
            "availability": target_user.get('availability', {}),
            "preference": target_user.get('preference', {}),
            "rating": target_user.get('rating', 0)
        })
    else:
        # For private profiles where user is not following, return limited data
        profile_data.update({
            "identity": [],
            "location": {},
            "bio": "This profile is private. Follow to see more details.",
            "contact": {},
            "availability": {},
            "preference": {},
            "rating": 0
        })

    return jsonify(profile_data), 200

@profile_bp.route("/follow/<username>", methods=["POST"])
@jwt_required()
def follow_user(username):
    try:
        current_user = get_jwt_identity()
        
        # Check if target user exists
        target_user = db.users.find_one({"user_name": username})
        if not target_user:
            return jsonify({"error": "User not found"}), 404

        # Check if already following
        existing_relationship = db.user_relationships.find_one({
            "follower": current_user,
            "following": username
        })
        
        if existing_relationship:
            return jsonify({"error": "Already following this user"}), 400

        # Create new relationship directly
        relationship = {
            "follower": current_user,
            "following": username,
            "created_at": datetime.utcnow()
        }
        
        # Insert the relationship
        db.user_relationships.insert_one(relationship)
        
        # Get updated counts
        follower_count = db.user_relationships.count_documents({
            "following": username
        })
        following_count = db.user_relationships.count_documents({
            "follower": username
        })

        return jsonify({
            "message": "Successfully followed user",
            "followers_count": follower_count,
            "following_count": following_count,
            "is_following": True
        }), 200

    except Exception as e:
        print(f"Error in follow_user: {str(e)}")
        return jsonify({"error": str(e)}), 500

@profile_bp.route("/unfollow/<username>", methods=["POST"])
@jwt_required()
def unfollow_user(username):
    try:
        current_user = get_jwt_identity()
        
        # First check if the relationship exists
        existing_relationship = db.user_relationships.find_one({
            "follower": current_user,
            "following": username
        })
        
        if not existing_relationship:
            return jsonify({"error": "Not following this user"}), 400
        
        # Delete the relationship
        db.user_relationships.delete_one({
            "follower": current_user,
            "following": username
        })

        # Update follower counts
        follower_count = db.user_relationships.count_documents({
            "following": username
        })
        following_count = db.user_relationships.count_documents({
            "follower": username
        })

        return jsonify({
            "message": "Successfully unfollowed user",
            "followers_count": follower_count,
            "following_count": following_count,
            "is_following": False
        }), 200

    except Exception as e:
        print(f"Error in unfollow_user: {str(e)}")
        return jsonify({"error": str(e)}), 500

@profile_bp.route("/user/<username>/pets", methods=["GET"])
@jwt_required()
def get_user_pets(username):
    # Find the user
    user = find_user_by_username(username)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Get the user's pet IDs
    pet_ids = get_pet_ids_by_username(username)
    
    # Get the pets
    pets = []
    for pid in pet_ids:
        pet_doc = find_pet_by_id(pid)
        if pet_doc:
            pets.append(pet_doc)
    
    return jsonify(pets), 200

@profile_bp.route("/followers/<username>", methods=["GET"])
@jwt_required()
def get_followers(username):
    target_user = find_user_by_username(username)
    if not target_user:
        return jsonify({"error": "User not found"}), 404
        
    # Get all followers from relationships - removed status filter
    followers = db.user_relationships.find({
        "following": username
    })
    
    users = []
    for follower in followers:
        user = db.users.find_one({"user_name": follower["follower"]})
        if user:
            users.append({
                "_id": str(user["_id"]),
                "name": user.get("name", ""),
                "user_name": user.get("user_name", ""),
                "profile_picture": user.get("profile_picture"),
                "identity": user.get("identity", []),
                "location": user.get("location", {})
            })
    
    return jsonify(users), 200

@profile_bp.route("/following/<username>", methods=["GET"])
@jwt_required()
def get_following(username):
    target_user = find_user_by_username(username)
    if not target_user:
        return jsonify({"error": "User not found"}), 404
        
    # Get all users being followed - removed status filter
    following = db.user_relationships.find({
        "follower": username
    })
    
    users = []
    for follow in following:
        user = db.users.find_one({"user_name": follow["following"]})
        if user:
            users.append({
                "_id": str(user["_id"]),
                "name": user.get("name", ""),
                "user_name": user.get("user_name", ""),
                "profile_picture": user.get("profile_picture"),
                "identity": user.get("identity", []),
                "location": user.get("location", {})
            })
    
    return jsonify(users), 200

@profile_bp.route("/rate/<username>", methods=["POST"])
@jwt_required()
def rate_user(username):
    current_user = get_jwt_identity()
    
    # Check if trying to rate self
    if current_user == username:
        return jsonify({"error": "Cannot rate yourself"}), 400
        
    # Check if target user exists
    target_user = find_user_by_username(username)
    if not target_user:
        return jsonify({"error": "User not found"}), 404
        
    # Check if target user is a service provider
    if "service_provider" not in target_user.get("identity", []):
        return jsonify({"error": "Can only rate service providers"}), 400
        
    data = request.get_json()
    if not data or "rating" not in data:
        return jsonify({"error": "Rating is required"}), 400
        
    rating = float(data["rating"])
    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
    comment = data.get("comment", "")
    
    # Update user's rating and reviews
    current_rating = target_user.get("rating", 0)
    current_review_count = len(target_user.get("review", []))
    
    # Calculate new average rating
    new_rating = ((current_rating * current_review_count) + rating) / (current_review_count + 1)
    
    # Create review object
    review = {
        "rating": rating,
        "comment": comment,
        "reviewer": current_user,
        "date": datetime.now().isoformat()
    }
    
    # Update in database
    db.users.update_one(
        {"user_name": username},
        {
            "$push": {"review": review},
            "$set": {"rating": round(new_rating, 2)}
        }
    )
    
    return jsonify({
        "message": "Rating submitted successfully",
        "new_rating": round(new_rating, 2)
    }), 200

@profile_bp.route("/reviews/<username>", methods=["GET"])
@jwt_required()
def get_user_reviews(username):
    # Check if target user exists
    target_user = find_user_by_username(username)
    if not target_user:
        return jsonify({"error": "User not found"}), 404
        
    reviews = target_user.get("review", [])
    rating = target_user.get("rating", 0)
    
    return jsonify({
        "reviews": reviews,
        "rating": rating,
        "total_reviews": len(reviews)
    }), 200

@profile_bp.route("/user/<user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(user_id):
    current_user = get_jwt_identity()
    
    try:
        # Attempt to convert to ObjectId
        user_object_id = ObjectId(user_id)
        user = db.users.find_one({"_id": user_object_id})
    except Exception:
        # Fallback to find by username if not a valid ObjectId
        user = db.users.find_one({"user_name": user_id})
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get the username
    username = user.get("user_name")

    # Prepare the user data to return
    user_data = {
        "_id": str(user["_id"]),
        "name": user.get("name", ""),
        "user_name": username,
        "profile_picture": user.get("profile_picture"),
        "identity": user.get("identity", []),
        "location": user.get("location", {}),
        "rating": user.get("rating", 0),
        "followers_count": db.user_relationships.count_documents({
            "following": username,
            "status": "accepted"
        }),
        "following_count": db.user_relationships.count_documents({
            "follower": username,
            "status": "accepted"
        })
    }

    return jsonify(user_data), 200

@profile_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    try:
        current_user = get_jwt_identity()
        
        # Get unread notifications
        notifications = list(db.notifications.find({
            "user_name": current_user,
            "read": False
        }).sort("created_at", -1))
        
        # Format notifications
        formatted_notifications = []
        for notif in notifications:
            from_user = db.users.find_one({"user_name": notif["from_user"]})
            formatted_notifications.append({
                "id": str(notif["_id"]),
                "type": notif["type"],
                "from_user": {
                    "user_name": from_user.get("user_name"),
                    "name": from_user.get("name"),
                    "profile_picture": from_user.get("profile_picture")
                },
                "created_at": notif["created_at"].isoformat(),
                "request_id": notif.get("request_id")  # Only for follow requests
            })
        
        return jsonify(formatted_notifications), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

