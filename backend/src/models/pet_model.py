from src.db_config import db

pet_collection = db["pets"]

class Pet:
    def __init__(self,  name, condition, image, price, type, distance):
        self.name = name
        self.condition = condition
        self.image = image
        self.price = price
        self.type = type
        self.distance = distance

    def to_dict(self):
        return {
            "name": self.name,
            "condition": self.condition,
            "image": self.image,
            "price": self.price,
            "type": self.type,
            "distance": self.distance
        }

def insert_pet(pet_obj):
    pet_collection.insert_one(pet_obj.to_dict())

def get_all_pets():
    return list(pet_collection.find({}, {"_id": 0}))