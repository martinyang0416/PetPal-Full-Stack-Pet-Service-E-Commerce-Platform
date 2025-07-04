# event_routes.py
from flask import Blueprint, jsonify, request, send_file
from bson import ObjectId
import json
import mimetypes
import base64
# import event_model
from src.models.event_model import Event
import io
from src.db_config import db, fs
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user_model import find_user_by_username
from src.socket_config import socketio

event_bp = Blueprint("event", __name__, url_prefix="/api/event")
event_collection = db["event"]

@event_bp.route("/", methods=["POST"], strict_slashes=False)
@jwt_required()
def create_event():

    #get user data from request
    user_name = get_jwt_identity()
    user = find_user_by_username(user_name)
    print("User data:", user)
    if not user:
        return jsonify({"msg": "Cannot identify the uploader."}), 404

    name = request.form.get("name")
    date = request.form.get("date")
    time = request.form.get("time")
    location = request.form.get("location")
    description = request.form.get("description")
    image = request.files.get("image")
    organizer = user["_id"]

    # Parse the location JSON string
    try:
        location = json.loads(location)
    except json.JSONDecodeError:
        return jsonify({"msg": "Invalid JSON format for location"}), 400
    
    # Check if all required fields are present
    if not name or not description or not date or not time or not location or not image:
        return jsonify({"msg": "Missing fields"}), 400

    print("Received data:", name, date, time, location, description, image, user_name)

    try:
        # Save the image to GridFS
        image_id = fs.put(image.stream, filename=image.filename)

        # Create a new event object
        new_event = Event(event_name=name, event_date=date, event_time=time, location=location, description=description, image=image_id, organizer=organizer)
       
        # Save the event to the database
        result = new_event.insert_event()
        new_event._id = result.inserted_id

        if not result:
            return jsonify({"msg": "Error saving event"}), 500
        
        # send socketio event
        socketio.emit("new_event", new_event.jsonify())
        
        return jsonify({"msg": "Event created successfully", "event_id": str(result.inserted_id)}), 201
    
    except Exception as e:
        print("Error creating event:", e)
        return jsonify({"msg": "Error creating event"}), 500

# fetch all events
@event_bp.route("", methods=["GET"])
@jwt_required()
def get_all_events():
    try:
        events = list(event_collection.find())
        for event in events:
            event["_id"] = str(event["_id"])
            event["image"] = str(event["image"])
            if "organizer" in event:
                event["organizer"] = str(event["organizer"])
            if "attendees" in event:
                event["attendees"] = [str(attendee) for attendee in event["attendees"]]
        return jsonify(events), 200
    except Exception as e:
        print("Error fetching events:", e)
        return jsonify({"msg": "Error fetching events"}), 500

@event_bp.route("/image/<image_id>", methods=["GET"])
def get_image(image_id):
    try:
        image_file = fs.get(ObjectId(image_id))
        image_data = image_file.read()
        
        mime_type, _ = mimetypes.guess_type(image_file.filename)
        if not mime_type:
            mime_type = "application/octet-stream"
        
        return send_file(
            io.BytesIO(image_data),
            mimetype=mime_type,
            download_name=image_file.filename,
        )
    except Exception as e:
        print("Error fetching image:", e)
        return jsonify({"msg": "Error fetching image"}), 500

@event_bp.route("/<event_id>", methods=["GET"])
def find_event(event_id):
    try:
        event = Event.find_event_by_str_id(event_id)
        if not event:
            return jsonify({"msg": "Event not found"}), 404
        event["_id"] = str(event["_id"])
        event["image"] = str(event["image"])
        if "organizer" in event:
            event["organizer"] = str(event["organizer"])
        if "attendees" in event:
            event["attendees"] = [str(attendee) for attendee in event["attendees"]]
        return jsonify(event), 200
    except Exception as e:
        print("Error fetching event:", e)
        return jsonify({"msg": "Error fetching event"}), 500

# change the attendee status
@event_bp.route("/attendance/<event_id>/", methods=["POST"], strict_slashes=False)
@jwt_required()
def attend_event(event_id):
    
    #get user data from request
    user_name = get_jwt_identity()
    user = find_user_by_username(user_name)
    print("User data:", user)
    if not user:
        return jsonify({"msg": "Cannot identify the user."}), 404
    
    # get the event data
    event = Event.find_event_by_str_id(event_id)
    if not event:
        return jsonify({"msg": "Event not found"}), 404
    
    # check if the user is already in the event, note that the attendees field is a list of user ids in objct id format
    if user["_id"] in event["attendees"]:
        # remove the user from the event
        event["attendees"].remove(user["_id"])
        Event.update_event_by_str_id(event_id, {"attendees": event["attendees"]})
    else:
        # add the user to the event
        event["attendees"].append(user["_id"])
        Event.update_event_by_str_id(event_id, {"attendees": event["attendees"]})
    

    socketio.emit("event_updated", Event.event_dict_to_json(event))
    return jsonify({"msg": "Event attendance toggled."}), 200

# delete an event by id
@event_bp.route("/<event_id>/", methods=["DELETE"], strict_slashes=False)
def delete_event(event_id):
    try:
        event = Event.delete_event_by_str_id(event_id)
        if event.deleted_count == 0:
            return jsonify({"msg": "Event not found"}), 404
        # send socketio event
        socketio.emit("event_deleted", event_id)
        return jsonify({"msg": "Event deleted successfully"}), 200
    except Exception as e:
        print("Error deleting event:", e)
        return jsonify({"msg": "Error deleting event"}), 500
    


