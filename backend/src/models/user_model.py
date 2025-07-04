from src.db_config import db
import gridfs
from bson.objectid import ObjectId
from werkzeug.datastructures import FileStorage

users_collection = db["users"]
fs = gridfs.GridFS(db)

# Fields to evaluate for profile completion
PROFILE_COMPLETION_FIELDS = [
    "name",
    "contact.phone_number",
    "location.city",
    "location.state",
    "location.country",
    "identity",
    "bio",
    "availability",
    "preference.hobbies",
    "preference.work",
    "pets",
    "profile_picture"
]

class User:
    def __init__(self, builder):
        self.user_name = builder.user_name
        self.email = builder.email
        self.hashed_password = builder.hashed_password
        self.name = builder.name
        self.contact = builder.contact
        self.location = builder.location
        self.identity = builder.identity
        self.bio = builder.bio
        self.availability = builder.availability
        self.is_public = builder.is_public
        self.preference = builder.preference
        self.profile_picture = builder.profile_picture
        self.has_completed_profile = builder.has_completed_profile
        self.rating = builder.rating
        self.review = builder.review
        self.pets = builder.pets

    def to_dict(self):
        data = {
            "user_name": self.user_name,
            "password": self.hashed_password,
            "name": self.name,
            "contact": self.contact,
            "location": self.location,
            "identity": self.identity,
            "bio": self.bio,
            "availability": self.availability,
            "is_public": self.is_public,
            "preference": self.preference,
            "profile_picture": self.profile_picture,
            "has_completed_profile": self.has_completed_profile,
            "rating": self.rating,
            "review": self.review,
            "pets": self.pets
        }
        data["profile_completion"] = self.calculate_profile_completion(data)
        return data

    @staticmethod
    def calculate_profile_completion(user_doc):
        total = len(PROFILE_COMPLETION_FIELDS)
        completed = 0

        for field in PROFILE_COMPLETION_FIELDS:
            keys = field.split(".")
            value = user_doc
            for key in keys:
                if isinstance(value, dict):
                    value = value.get(key)
                else:
                    value = None
                    break
            if value and (not isinstance(value, list) or len(value) > 0):
                completed += 1

        return int((completed / total) * 100)

    def update_profile(self, update_data):
        update_fields = {}

        if "name" in update_data:
            update_fields["name"] = update_data["name"]
        if "phone_number" in update_data:
            update_fields["contact.phone_number"] = update_data["phone_number"]
        if "location" in update_data:
            update_fields["location"] = update_data["location"]
        if "identity" in update_data:
            identity = update_data["identity"]
            if isinstance(identity, str):
                identity = identity.strip().split()
            if isinstance(identity, list):
                update_fields["identity"] = identity
        if "bio" in update_data:
            update_fields["bio"] = update_data["bio"]
        if "availability" in update_data:
            update_fields["availability"] = update_data["availability"]
        if "is_public" in update_data:
            update_fields["is_public"] = update_data["is_public"]
        if "preference" in update_data and isinstance(update_data["preference"], dict):
            update_fields["preference"] = update_data["preference"]
        if "rating" in update_data:
            update_fields["rating"] = update_data["rating"]
        if "review" in update_data and isinstance(update_data["review"], list):
            update_fields["review"] = update_data["review"]

        if "profile_picture" in update_data and isinstance(update_data["profile_picture"], bytes):
            file_id = fs.put(
                update_data["profile_picture"],
                filename=f"{self.user_name}_profile_pic.jpg",
                content_type="image/jpeg"
            )
            update_fields["profile_picture"] = str(file_id)

        update_fields["has_completed_profile"] = True

        # Calculate updated completion score
        user_snapshot = users_collection.find_one({"user_name": self.user_name})
        if user_snapshot:
            merged_data = {**user_snapshot, **update_fields}
            update_fields["profile_completion"] = self.calculate_profile_completion(merged_data)

        result = users_collection.update_one(
            {"user_name": self.user_name},
            {"$set": update_fields}
        )

        return result.modified_count > 0

    @staticmethod
    def update_profile_by_username(user_name, update_data):
        user_data = find_user_by_username(user_name)
        if not user_data:
            return False

        builder = UserBuilder(user_data["user_name"], user_data["contact"]["email"], user_data["password"])
        user = builder.build()
        return user.update_profile(update_data)

    @staticmethod
    def save_profile_picture(user_name, image_file: FileStorage):
        if image_file:
            file_id = fs.put(image_file.stream, filename=image_file.filename, content_type=image_file.content_type)
            result = users_collection.update_one(
                {"user_name": user_name},
                {"$set": {"profile_picture": str(file_id)}}
            )
            return str(file_id) if result.modified_count > 0 else None
        return None

class UserBuilder:
    def __init__(self, user_name, email, hashed_password):
        self.user_name = user_name
        self.email = email
        self.hashed_password = hashed_password
        self.name = ""
        self.contact = {
            "phone_number": "",
            "email": email
        }
        self.location = {  
            "city": "",
            "state": "",
            "country": "",
            "zip_code": ""
        }
        self.identity = []
        self.bio = ""
        self.availability = {  
            "Monday": [],
            "Tuesday": [],
            "Wednesday": [],
            "Thursday": [],
            "Friday": [],
            "Saturday": [],
            "Sunday": []
        }
        self.is_public = False
        self.preference = {
            "hobbies": [],
            "work": []
        }
        self.profile_picture = ""
        self.has_completed_profile = False
        self.rating = 0
        self.review = []
        self.pets = []

    def set_name(self, name):
        self.name = name
        return self

    def set_phone_number(self, phone):
        self.contact["phone_number"] = phone
        return self

    def set_location(self, location):
        self.location = location
        return self

    def set_identity(self, identity):
        if isinstance(identity, str):
            identity = identity.strip().split()
        if isinstance(identity, list):
            self.identity = identity
        return self

    def set_bio(self, bio):
        self.bio = bio
        return self

    def set_availability(self, availability):
        self.availability = availability
        return self

    def set_is_public(self, is_public):
        self.is_public = is_public
        return self

    def set_preference(self, preference):
        self.preference = preference
        return self

    def set_profile_picture(self, picture):
        self.profile_picture = picture
        return self

    def set_has_completed_profile(self, flag=True):
        self.has_completed_profile = flag
        return self

    def set_rating(self, rating):
        self.rating = rating
        return self

    def set_review(self, review):
        self.review = review if isinstance(review, list) else []
        return self

    def build(self):
        return User(self)

def find_user_by_username(user_name):
    return users_collection.find_one({"user_name": user_name})

def insert_user(user_obj):
    return users_collection.insert_one(user_obj.to_dict())

def get_pet_ids_by_username(user_name):
    user = users_collection.find_one({"user_name": user_name}, {"pets": 1})
    if user and "pets" in user:
        return user["pets"]
    return []
