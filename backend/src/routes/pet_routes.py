from flask import Blueprint, request, jsonify, send_file
from bson import ObjectId
from bson.errors import InvalidId
import json
import io
import mimetypes
from src.db_config import db, fs
from src.specifications.pet_specifications import PriceRangeSpec, TypeSpec, DistanceSpec, combine_specifications
import math

pet_bp = Blueprint("pet", __name__, url_prefix="/pets")
pets_collection = db["pets"]

# ADD Pet Item
@pet_bp.route("/upload", methods=["POST"])
def upload_pet():
    try:
        name = request.form.get("name")
        condition = request.form.get("condition")
        price = int(request.form.get("price"))
        type_ = request.form.get("type")
        location_data = request.form.get("location")
        image = request.files.get("image")

        if not all([name, condition, price, type_, location_data, image]):
            return jsonify({"msg": "Missing required fields"}), 400

        # Parse location data
        try:
            location = json.loads(location_data)
            # Ensure we have lat/lng values
            if "lat" not in location or "lng" not in location:
                return jsonify({"msg": "Invalid location format, must include lat and lng"}), 400
            
            # Convert to proper GeoJSON format
            geo_location = {
                "type": "Point",
                "coordinates": [float(location["lng"]), float(location["lat"])]
            }
            print(f"📍 Storing location: {geo_location}")
        except Exception as e:
            print(f"❌ Error parsing location: {e}, raw data: {location_data}")
            return jsonify({"msg": "Invalid location format"}), 400

        image_id = fs.put(image.stream, filename=image.filename)

        pet_data = {
            "name": name,
            "condition": condition,
            "price": price,
            "type": type_,
            "location": geo_location,
            "image": image_id
        }

        result = pets_collection.insert_one(pet_data)
        
        # Verify the document was created correctly
        created_pet = pets_collection.find_one({"_id": result.inserted_id})
        print(f"✅ Pet created: {created_pet}")
        
        return jsonify({"msg": "Pet uploaded", "pet_id": str(result.inserted_id)}), 201

    except Exception as e:
        print("❌ Error uploading pet:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"msg": "Internal server error"}), 500


# GET ALL OR FILTERED PET ITEMS
@pet_bp.route("/", methods=["GET"])
def get_all_pets():
    try:
        specs = []
        original_query = {}

        min_price = request.args.get("min_price", type=float)
        max_price = request.args.get("max_price", type=float)
        if min_price is not None and max_price is not None:
            specs.append(PriceRangeSpec(min_price, max_price))

        pet_type = request.args.get("type")
        if pet_type:
            specs.append(TypeSpec(pet_type))
            print(f"📦 Filtering by type: {pet_type}")

        lat = request.args.get("lat", type=float)
        lng = request.args.get("lng", type=float)
        distance = request.args.get("distance", type=float)
        using_geo_filter = False

        print(f"📍 Received filters  min_price={min_price}  max_price={max_price}"
              f"  type={pet_type!r}  lat={lat}  lng={lng}  distance={distance}")

        
        if lat is not None and lng is not None and distance is not None:
            # Convert distance to meters
            distance_meters = distance * 1000  
            using_geo_filter = True
            print(f"📍 Filtering by location: {lat}, {lng} within {distance}km ({distance_meters}m)")
            
            # Store original query before adding geo filter
            original_query = combine_specifications(specs)
            
            # Add geospatial filter
            specs.append(DistanceSpec(lng, lat, distance_meters))
            print("🔍 Adding geospatial spec:", specs[-1].to_query())


        query = combine_specifications(specs)
        print("📦 Filter query:", query)
        print("🔎 Final MongoDB query object:", query)

        
        # Get a sample for debugging
        sample = pets_collection.find_one()
        if sample:
            print("📦 Sample data format:", sample.get("location"))
            print("📦 Sample data fields:", list(sample.keys()))
        
        # Helper function to calculate distance in kilometers
        def calculate_distance(pet_location, user_lat, user_lng):
            import math
            
            # Approximate radius of earth in km
            R = 6371.0
            
            if not pet_location or 'type' not in pet_location or pet_location['type'] != 'Point':
                return None
                
            try:
                # Extract coordinates
                pet_lng, pet_lat = pet_location['coordinates']
                
                # Convert coordinates to radians
                lat1 = math.radians(pet_lat)
                lon1 = math.radians(pet_lng)
                lat2 = math.radians(user_lat)
                lon2 = math.radians(user_lng)
                
                # Haversine formula
                dlon = lon2 - lon1
                dlat = lat2 - lat1
                a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                distance = R * c
                
                return round(distance, 1)  # Round to 1 decimal place
            except Exception as e:
                print(f"Error calculating distance: {e}")
                return None
        
        # First try with geospatial filter if applicable
        pets = list(pets_collection.find(query))
        print(f"🐾 MongoDB returned {len(pets)} documents")

        
        # If no results and using geo filter, try again without geo filter but calculate distances manually
        if len(pets) == 0 and using_geo_filter:
            print("⚠️ No results with geospatial filter, falling back to manual distance calculation")
            pets = list(pets_collection.find(original_query))
            
            # Filter manually by distance
            filtered_pets = []
            for pet in pets:
                if "location" in pet:
                    calculated_distance = calculate_distance(pet.get("location"), lat, lng)
                    if calculated_distance is not None and calculated_distance <= distance:
                        pet["distance"] = calculated_distance
                        filtered_pets.append(pet)
                    else:
                        print(f"Pet {pet.get('name')} excluded: distance={calculated_distance}, max={distance}")
                else:
                    print(f"Pet {pet.get('name')} has no location data")
            
            pets = filtered_pets
        
        # Format pet data for response
        for pet in pets:
            pet["_id"] = str(pet["_id"])
            if "image" in pet:
                pet["image"] = str(pet["image"])
            
            # Calculate and add distance information if user location is provided
            if lat is not None and lng is not None and "location" in pet and "distance" not in pet:
                calculated_distance = calculate_distance(pet.get("location"), lat, lng)
                if calculated_distance is not None:
                    pet["distance"] = calculated_distance
        
        print(f"📦 Found {len(pets)} matching pets")
        for pet in pets:
            print(f"  - {pet.get('name')} (type: {pet.get('type')}, distance: {pet.get('distance')}km)")
        
        return jsonify(pets), 200
    except Exception as e:
        print("❌ Error fetching pets:", e)
        import traceback
        traceback.print_exc()
        return jsonify([]), 200


# GET SINGLE PET ITEM
@pet_bp.route("/<pet_id>", methods=["GET"])
def get_pet(pet_id):
    try:
        pet = pets_collection.find_one({"_id": ObjectId(pet_id)})
        if not pet:
            return jsonify({"msg": "Pet not found"}), 404
        pet["_id"] = str(pet["_id"])
        pet["image"] = str(pet["image"])
        return jsonify(pet), 200
    except Exception as e:
        print("❌ Error getting pet:", e)
        return jsonify({"msg": "Invalid ID"}), 400


# GET IMAGE
@pet_bp.route("/image/<image_id>", methods=["GET"])
def get_pet_image(image_id):
    try:
        image_file = fs.get(ObjectId(image_id))
        image_data = image_file.read()

        mime_type, _ = mimetypes.guess_type(image_file.filename)
        if not mime_type:
            mime_type = "application/octet-stream"

        return send_file(
            io.BytesIO(image_data),
            mimetype=mime_type,
            download_name=image_file.filename
        )

    except (InvalidId, Exception) as e:
        print("❌ Error fetching image:", e)
        return jsonify({"msg": "Image not found"}), 404


# UPDATE PET ITEM
@pet_bp.route("/<pet_id>", methods=["PUT"])
def update_pet(pet_id):
    try:
        data = request.get_json()
        update_data = {}

        for field in ["name", "condition", "price", "type", "location"]:
            if field in data:
                update_data[field] = data[field]

        result = pets_collection.update_one(
            {"_id": ObjectId(pet_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"msg": "Pet not found"}), 404

        return jsonify({"msg": "Pet updated"}), 200
    except Exception as e:
        print("❌ Error updating pet:", e)
        return jsonify({"msg": "Update failed"}), 400


# DELETE PET ITEM
@pet_bp.route("/<pet_id>", methods=["DELETE"])
def delete_pet(pet_id):
    try:
        result = pets_collection.delete_one({"_id": ObjectId(pet_id)})
        if result.deleted_count == 0:
            return jsonify({"msg": "Pet not found"}), 404
        return jsonify({"msg": "Pet deleted"}), 200
    except Exception as e:
        print("❌ Error deleting pet:", e)
        return jsonify({"msg": "Delete failed"}), 400
