from src.db_config import db
from bson.objectid import ObjectId
from werkzeug.datastructures import FileStorage
import gridfs
import json

pets_collection = db["pets"]
fs = gridfs.GridFS(db)

class Pet:
    def __init__(self, builder):
        self.pet_id = builder.pet_id
        self.owner_username = builder.owner_username
        self.name = builder.name
        self.type = builder.type
        self.age = builder.age
        self.weight = builder.weight
        self.color = builder.color
        self.description = builder.description
        self.profile_picture = builder.profile_picture
        self.rating = builder.rating
        self.review = builder.review

    def to_dict(self):
        doc = {
            "owner_username": self.owner_username,
            "name": self.name,
            "type": self.type,
            "age": self.age,
            "weight": self.weight,
            "color": self.color,
            "description": self.description,
            "profile_picture": self.profile_picture,
            "rating": self.rating,
            "review": self.review
        }
        if self.pet_id:
            doc["_id"] = ObjectId(self.pet_id)
        return doc

    @staticmethod
    def from_dict(data):
        builder = PetBuilder(
            owner_username=data.get("owner_username", ""),
            name=data.get("name", ""),
            pet_type=data.get("type", "")
        )
        builder.set_age(data.get("age"))
        builder.set_weight(data.get("weight"))
        builder.set_color(data.get("color"))
        builder.set_description(data.get("description"))
        builder.set_profile_picture(data.get("profile_picture"))
        builder.set_rating(data.get("rating"))
        builder.set_review(data.get("review"))
        if data.get("_id"):
            builder.set_pet_id(str(data["_id"]))
        return builder.build()

    def save(self):
        doc = self.to_dict()
        if "_id" not in doc or doc["_id"] is None:
            doc.pop("_id", None)
            result = pets_collection.insert_one(doc)
            self.pet_id = str(result.inserted_id)
        else:
            _id = doc.pop("_id")
            pets_collection.update_one({"_id": _id}, {"$set": doc})

    @classmethod
    def create_from_form(cls, user_name, form_data, picture_file: FileStorage = None):
        try:
            data = json.loads(form_data)
        except Exception:
            return None, "Invalid JSON format"

        builder = PetBuilder(
            owner_username=user_name,
            name=data.get("name", ""),
            pet_type=data.get("type", "")
        )
        builder.set_age(data.get("age"))
        builder.set_weight(data.get("weight"))
        builder.set_color(data.get("color"))
        builder.set_description(data.get("description"))
        builder.set_rating(data.get("rating"))
        builder.set_review(data.get("review"))

        if picture_file:
            file_id = fs.put(picture_file.stream, filename=picture_file.filename, content_type=picture_file.content_type)
            builder.set_profile_picture(str(file_id))

        pet = builder.build()
        pet.save()

        db.users.update_one(
            {"user_name": user_name},
            {"$push": {"pets": pet.pet_id}}
        )
        return pet, None

    @staticmethod
    def find_by_id(pet_id):
        doc = pets_collection.find_one({"_id": ObjectId(pet_id)})
        return Pet.from_dict(doc) if doc else None

    @staticmethod
    def find_by_owner(owner_username):
        cursor = pets_collection.find({"owner_username": owner_username})
        return [Pet.from_dict(doc) for doc in cursor]

    @staticmethod
    def delete(pet_id):
        pets_collection.delete_one({"_id": ObjectId(pet_id)})

class PetBuilder:
    def __init__(self, owner_username, name, pet_type):
        self.pet_id = None
        self.owner_username = owner_username
        self.name = name
        self.type = pet_type
        self.age = 0
        self.weight = 0.0
        self.color = ""
        self.description = ""
        self.profile_picture = ""
        self.rating = 0
        self.review = []

    def set_pet_id(self, pet_id):
        self.pet_id = pet_id
        return self

    def set_age(self, age):
        self.age = int(age) if age is not None else 0
        return self

    def set_weight(self, weight):
        self.weight = float(weight) if weight is not None else 0.0
        return self

    def set_color(self, color):
        self.color = color or ""
        return self

    def set_description(self, description):
        self.description = description or ""
        return self

    def set_profile_picture(self, picture_id):
        self.profile_picture = picture_id or ""
        return self

    def set_rating(self, rating):
        self.rating = float(rating) if rating is not None else 0.0
        return self

    def set_review(self, review_list):
        self.review = review_list if isinstance(review_list, list) else []
        return self

    def build(self):
        return Pet(self)

@staticmethod
def find_pet_by_id(pet_id):
    try:
        pet_doc = pets_collection.find_one({"_id": ObjectId(pet_id)})
        if pet_doc:
            pet_doc["_id"] = str(pet_doc["_id"])
            return pet_doc
        return None
    except Exception as e:
        print(f"Error finding pet by ID {pet_id}: {e}")
        return None


def delete_pet_by_id(pet_id):
    result = pets_collection.delete_one({"_id": ObjectId(pet_id)})
    return result.deleted_count == 1

def update_pet_by_id(pet_id, update_fields):
    pets_collection.update_one(
        {"_id": ObjectId(pet_id)},
        {"$set": update_fields}
    )
