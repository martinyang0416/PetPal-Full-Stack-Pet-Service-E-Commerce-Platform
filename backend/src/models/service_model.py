from abc import ABC, abstractmethod
from bson.objectid import ObjectId
from src.db_config import db
from datetime import datetime



"""
The service model is used to manage service requests and offers in the pet service application and is designed based on the Builder design pattern.
It allows for the creation of service requests and offers with various attributes such as pet type, breed, service type, location, availability, and user information. 
"""

services_collection = db["service"]
users_collection = db["users"]

STATUS_TO_INT = {
    "pending": 0,
    "matched": 1,
    "completed": 2,
    "canceled": 3
}

INT_TO_STATUS = {v: k for k, v in STATUS_TO_INT.items()}

REQUEST_SERVICE_TYPE = 0
OFFER_SERVICE_TYPE = 1

CATEGORY_TO_INT = {
    "pet_spa": 0,
    "pet_walking": 1,
    "pet_daycare": 2,
    "pet_house_sitting": 3,
}

'''
=== Builder interface
Declares construction steps with separate setters. 
'''
class ServiceBuilder(ABC):
    @abstractmethod
    def reset(self): pass

    @abstractmethod
    def set_user(self, user): pass

    @abstractmethod
    def set_service_type(self, service_type): pass

    @abstractmethod
    def set_service_category(self, service_category): pass

    @abstractmethod
    def set_pet_name(self, pet_name): pass

    @abstractmethod
    def set_pet_image(self, pet_image): pass

    @abstractmethod
    def set_pet_type(self, pet_type): pass

    @abstractmethod
    def set_breed(self, breed): pass

    @abstractmethod
    def set_location(self, location): pass

    @abstractmethod
    def set_availability(self, availability): pass

    @abstractmethod
    def set_owner_or_provider_info(self, user_name): pass

    @abstractmethod
    def set_replies(self, replies): pass

    @abstractmethod
    def set_notes(self, note): pass

    @abstractmethod
    def set_post_time(self, note): pass

    @abstractmethod
    def get_product(self): pass


'''
=== Product (Genereal Product)
This class defines the product that is being built with common fields of service requests and offers.
'''
class Service:
    def __init__(self):
        self.data = {
            "user_name": None,
            "user_id": None,
            "service_type": None,
            "service_category": None,
            "pet_name": None,
            "pet_type": None,
            "pet_image": None,
            "breed": None,
            "location": None,
            "availability": None,
            "matched_user": None,
            "status": STATUS_TO_INT["pending"],
            "replies": None,
            "notes": None,
            "post_time": None
        }

    def to_dict(self):
        return self.data
    
'''
=== Concrete Builder: ServiceRequestBuilder
This class builds the service request (product) in a step-by-step fashion while allowing optional fields to be set only when needed.
'''
class ServiceRequestBuilder(ServiceBuilder):
    def __init__(self):
        self.reset()

    def reset(self):
        self.request = Service()

    def set_user(self, user):
        self.request.data["user_name"] = user["user_name"]
        self.request.data["user_id"] = str(user["_id"])
        print("User set:", self.request.data["user_name"])
        return self

    def set_pet_name(self, pet_name):
        self.request.data["pet_name"] = pet_name
        return self
    
    def set_pet_type(self, pet_type):
        self.request.data["pet_type"] = pet_type
        return self
    
    def set_pet_image(self, pet_image):
        self.request.data["pet_image"] = str(pet_image) if pet_image else None
        return self


    def set_breed(self, breed = ""):
        self.request.data["breed"] = breed
        return self

    def set_service_type(self, service_type = REQUEST_SERVICE_TYPE):
        self.request.data["service_type"] = service_type
        return self
    
    def set_service_category(self, service_category):
        self.request.data["service_category"] = CATEGORY_TO_INT[service_category]
        return self

    def set_location(self, location = ""):
        self.request.data["location"] = location
        return self

    def set_availability(self, availability):
        self.request.data["availability"] = availability
        return self

    def set_owner_or_provider_info(self, user_name = ""):
        if user_name == "":
            self.request.data["matched_user"] = None
            return self
        matched_user = users_collection.find_one({"user_name": user_name})
        self.request.data["matched_user"] = matched_user
        return self
    
    def set_replies(self, replies = {}):
        return super().set_replies(replies)
    
    def set_notes(self, notes = ""):
        self.request.data["notes"] = notes
        return self
    
    def set_post_time(self, time = datetime.now().isoformat() + 'Z'):
        self.request.data["post_time"] = time
        return self

    def get_product(self):
        product = self.request
        self.reset()
        return product

'''
=== Concrete Builder: ServiceOfferBuilder
This class builds the service offer (product) in a step-by-step fashion while allowing optional fields to be set only when needed.
'''
class ServiceOfferBuilder(ServiceBuilder):
    def __init__(self):
        self.reset()
    
    def reset(self):
        self.offer = Service()

    def set_user(self, user):
        self.offer.data["user_name"] = user["user_name"]
        self.offer.data["user_id"] = str(user["_id"])
        return self

    def set_pet_type(self, pet_type):
        self.offer.data["pet_type"] = pet_type
        return self
    
    def set_pet_name(self, pet_name=""):
        return super().set_pet_name(pet_name)
    
    def set_pet_image(self, pet_image=None):
        return super().set_pet_image(pet_image)
    
    def set_breed(self, breed=""):
        self.offer.data["breed"] = breed
        return self

    def set_service_type(self, service_type = OFFER_SERVICE_TYPE):
        self.offer.data["service_type"] = service_type
        return self

    def set_service_category(self, service_category):
        self.offer.data["service_category"] = CATEGORY_TO_INT[service_category]
        return self
    
    def set_location(self, location):
        self.offer.data["location"] = location
        return self

    def set_availability(self, availability):
        self.offer.data["availability"] = availability
        return self

    def set_owner_or_provider_info(self, user_name = ""):
        if user_name == "":
            self.offer.data["matched_user"] = None
            return self
        matched_user = users_collection.find_one({"user_name": user_name})
        self.offer.data["matched_user"] = matched_user
        return self
    
    def set_replies(self, replies = {}):
        return super().set_replies(replies)
    
    def set_notes(self, notes = ""):
        self.offer.data["notes"] = notes
        return self
    
    def set_post_time(self, time = datetime.now().isoformat() + 'Z'):
        self.offer.data["post_time"] = time
        return self

    def get_product(self):
        product = self.offer
        print("Product built:", product.to_dict())
        self.reset()
        return product
    