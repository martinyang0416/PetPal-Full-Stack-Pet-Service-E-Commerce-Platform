from src.db_config import db, fs
from bson.objectid import ObjectId

event_collection = db["event"]

class Event:

    def __init__(self, event_name, event_date, event_time, location, description, image, organizer):
        self.event_name = event_name
        self.description = description
        self.event_date = event_date
        self.event_time = event_time
        self.location = location
        self.image = image
        self.organizer = organizer
        self.attendees = [organizer]
        

    def to_dict(self):
        return {
            "event_name": self.event_name,
            "description": self.description,
            "event_date": self.event_date,
            "event_time": self.event_time,
            "location": self.location,
            "image": self.image,
            "organizer": self.organizer,
            "attendees": self.attendees
        }
    
    def jsonify(self):
        return {
            "event_name": self.event_name,
            "description": self.description,
            "event_date": self.event_date,
            "event_time": self.event_time,
            "location": self.location,
            "image": str(self.image),
            "organizer": str(self.organizer),
            "attendees": [str(attendee) for attendee in self.attendees],
            "_id": str(self._id),
        }
    
    def insert_event(self):
        try:
            return event_collection.insert_one(self.to_dict())
        except Exception as e:
            print(f"An error occurred while inserting the event: {e}")
            return None
        
    @staticmethod
    def event_dict_to_json(event_dict):
        if event_dict:
            event_dict["_id"] = str(event_dict["_id"])
            event_dict["image"] = str(event_dict["image"])
            if "organizer" in event_dict:
                event_dict["organizer"] = str(event_dict["organizer"])
            if "attendees" in event_dict:
                event_dict["attendees"] = [str(attendee) for attendee in event_dict["attendees"]]
        return event_dict

    
    @staticmethod
    def update_event_by_str_id(event_id, update_data):
        try:
            return event_collection.update_one({"_id": ObjectId(event_id)}, {"$set": update_data})
        except Exception as e:
            print(f"An error occurred while updating the event: {e}")
            return None
    
    @staticmethod
    def delete_event_by_str_id(event_id):
        try:
            return event_collection.delete_one({"_id": ObjectId(event_id)})
        except Exception as e:
            print(f"An error occurred while deleting the event: {e}")
            return None
    
    @staticmethod
    def find_event_by_str_id(event_id):
        try:
            result = event_collection.find_one({"_id": ObjectId(event_id)})
            print(f"Event found: {result}")
            return result
        except Exception as e:
            print(f"An error occurred while finding the event: {e}")
            return None


