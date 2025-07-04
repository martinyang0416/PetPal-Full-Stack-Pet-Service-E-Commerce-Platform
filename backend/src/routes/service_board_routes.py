from flask import Blueprint, request, jsonify, Response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from bson import ObjectId
from src.db_config import fs
from src.models.service_model import *
from src.models.user_model import users_collection
import time


service_board_bp = Blueprint("service_board", __name__, url_prefix="/services")

CATEGORY_TO_INT = {
    "pet_spa": 0,
    "pet_walking": 1,
    "pet_daycare": 2,
    "pet_house_sitting": 3,
}

STATUS_TO_INT = {
    "pending": 0,
    "matched": 1,
    "completed": 2,
    "canceled": 3
}

INT_TO_CATEGORY = {v: k for k, v in CATEGORY_TO_INT.items()}

def parse_iso(post_time_str):
    # Remove trailing Z and parse
    return datetime.fromisoformat(post_time_str.replace('Z', ''))

@service_board_bp.route("/", methods=["GET"])
def get_services():
    try:
        # Get all services
        services = list(services_collection.find({}))
        # Convert ObjectId to string
        for service in services:
            service["_id"] = str(service["_id"])
            if "service_category" in service:
                service["service_category"] = INT_TO_CATEGORY.get(service["service_category"], service["service_category"])
            if "pet_image" in service:
                service["pet_image"] = str(service["pet_image"])
            if "user_id" in service:
                service["user_id"] = str(service["user_id"])
            # Normalize matched_user
            if "matched_user" in service and service["matched_user"]:
                matched = service["matched_user"]
                service["matched_user"] = {
                    "user_id": str(matched["_id"]),
                    "user_name": matched.get("user_name")
                }
        services.sort(key=lambda s:parse_iso(s.get("post_time", "9999-12-31T23:59:59.999Z")), reverse=True)
        return jsonify(services), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@service_board_bp.route("/images/<image_id>", methods=["GET"])
def get_pet_image(image_id):
    try:
        if image_id.lower() == "none" or not image_id.strip():
            return Response(status=204)
        image_file = fs.get(ObjectId(image_id))
        return Response(image_file.read(), content_type=image_file.content_type)
    except Exception as e:
        return jsonify({"error": str(e)}), 404
    
@service_board_bp.route("/request", methods=["POST"])
def post_request():
    try:
        # user_name = get_jwt_identity()
        # print(user_name)
        user_name = request.form.get("userName")
        pet_type = request.form.get("petType")
        breed = request.form.get("petBreed", None)
        pet_name = request.form.get("petName")
        service_category = request.form.get("serviceCategory")
        notes = request.form.get("notes", "")
        post_time = request.form.get("postTime")
        if "location" in request.form:
            location = {
                "place_name": request.form.get("location")
            }
        else:
            location = None
        coordinates = request.form.getlist("coordinates")  # might come as a string

        if isinstance(coordinates, list) and len(coordinates) == 2:
            location["coordinates"] = {
                "lat": float(coordinates[1]),
                "lng": float(coordinates[0])
            }
        
        availability = {
            "start": request.form.get("availableStart"),
            "end": request.form.get("availableEnd"),
        }
        # Get user from DB
        user = users_collection.find_one({"user_name": user_name})
        if not user:
            return jsonify({"error": "User not found"}), 404
        # GridFS: Save image to MongoDB
        image_id = None
        if 'petImage' in request.files:
            image = request.files['petImage']
            if image.name != '':
                image_id = fs.put(image.stream, filename=image.name)

        # Build service request using builder
        builder = ServiceRequestBuilder()
        product = (builder.set_user(user)
                          .set_pet_name(pet_name)
                          .set_pet_type(pet_type)
                          .set_pet_image(image_id)
                          .set_breed(breed)
                          .set_location(location)
                          .set_availability(availability)
                          .set_service_type()
                          .set_service_category(service_category)
                          .set_notes(notes)
                          .set_post_time(post_time)
                          .get_product())


        service_dict = product.to_dict()

        # Save to DB
        services_collection.insert_one(service_dict)
        service_dict.pop("_id", None)
        service_dict["user_id"] = str(service_dict["user_id"])

        # If returning the image_id, convert to str
        if "pet_image" in service_dict:
            service_dict["pet_image"] = str(service_dict["pet_image"])
        print("returned service dict", service_dict)

        return jsonify({"msg": "Request created successfully", "data": service_dict}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@service_board_bp.route("/offer", methods=["POST"])
def post_offer():
    try:
        # user_name = get_jwt_identity()
        # print(user_name)
        user_name = request.form.get("userName")
        pet_type = request.form.get("petType")
        service_category = request.form.get("serviceCategory")
        notes = request.form.get("notes", "")
        post_time = request.form.get("postTime")
        if "location" in request.form:
            location = {
                "place_name": request.form.get("location")
            }
        else:
            location = None
        coordinates = request.form.getlist("coordinates")  # might come as a string

        if isinstance(coordinates, list) and len(coordinates) == 2:
            location["coordinates"] = {
                "lat": float(coordinates[1]),
                "lng": float(coordinates[0])
            }
        
        availability = {
            "start": request.form.get("availableStart"),
            "end": request.form.get("availableEnd"),
        }
        # Get user from DB
        user = users_collection.find_one({"user_name": user_name})
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Build service request using builder
        builder = ServiceOfferBuilder()
        product = (builder.set_user(user)
                          .set_pet_type(pet_type)
                          .set_location(location)
                          .set_availability(availability)
                          .set_service_type()
                          .set_service_category(service_category)
                          .set_notes(notes)
                          .set_post_time(post_time)
                          .get_product())


        service_dict = product.to_dict()

        # Save to DB
        services_collection.insert_one(service_dict)
        service_dict.pop("_id", None)
        service_dict["user_id"] = str(service_dict["user_id"])


        return jsonify({"msg": "Request created successfully", "data": service_dict}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@service_board_bp.route("/<service_id>", methods=['DELETE'])
def delete_offer(service_id):
    try:
        delete_res = services_collection.delete_one({"_id": ObjectId(service_id)})
        if delete_res.deleted_count == 0:
            return jsonify({"error": "Service not exist"}), 404
        return jsonify({"msg": "Service deleted successfully"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@service_board_bp.route("/reply/<service_id>", methods=["GET"])
def get_replies(service_id):
    try:
        service = services_collection.find_one({"_id": ObjectId(service_id)})
        if not service:
            return jsonify({"error": "Service not found"}), 404

        replies = service.get("replies", {})  # Safe default to empty dict if not present
        return jsonify(replies), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@service_board_bp.route("/reply", methods=["POST"])
# @jwt_required()
def post_reply():
    try:
        service_id = request.form.get("serviceId")
        reply_user_name = request.form.get("userName")
        reply_content = request.form.get("replyContent", "").strip()
        reply_time = request.form.get("timestamp", time.time())
        thread_owner = request.form.get("threadOwner", reply_user_name)  # default: new thread
        if not service_id or not reply_content:
            return jsonify({"error": "Missing service ID or reply content"}), 400
        service = services_collection.find_one({"_id": ObjectId(service_id)})
        if not service:
            return jsonify({"error": "Service not found"}), 404
        new_reply_entry = {
            reply_user_name: [
                reply_content,
                reply_time
            ]
        }
        # Initialize replies if not present
        if "replies" not in service or not service["replies"]:
            service["replies"] = {}

        # Append to the user's reply thread
        if thread_owner not in service["replies"]:
            service["replies"][thread_owner] = [new_reply_entry]
        else:
            service["replies"][thread_owner].append(new_reply_entry)
        
        # Update the service document in DB
        services_collection.update_one(
            {"_id": ObjectId(service_id)},
            {"$set": {"replies": service["replies"]}}
        )
        return jsonify({"message": "Reply added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@service_board_bp.route("/match", methods=["PUT"])
def confirm_match():
    try:
        data = request.get_json()
        service_id = data.get("service_id",  "")
        service = services_collection.find_one({"_id": ObjectId(service_id)})
        if not service:
            return jsonify({"error": "Service does not exist"}), 404
        matched_user_name = data.get("matched_user", "")
        matched_user = users_collection.find_one({"user_name": matched_user_name})
        if not matched_user:
            return jsonify({"error": "Matched user not found"}), 404
        services_collection.update_one(
            {"_id": ObjectId(service_id)},
            {"$set": {
                "matched_user": matched_user,
                "status": STATUS_TO_INT["matched"]
            }}
        )
        return jsonify({"message": "updated status successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
