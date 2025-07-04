from datetime import datetime
from bson.objectid import ObjectId, InvalidId
import json
from bson import json_util

from ..db_config import db

class VetService:
    """
    Model representing a veterinary service booking in the system.
    Handles creation, retrieval, and management of vet service bookings.
    """
    
    def __init__(self, data=None):
        """
        Initialize a new VetService instance
        
        Args:
            data (dict, optional): Initial data for the service. Defaults to None.
        """
        self.data = data or {
            "pet": None,          # Pet ID (ObjectId or string)
            "vet": None,          # Vet ID (ObjectId or string)
            "owner": None,        # Owner ID (ObjectId or string)
            "serviceCategory": None,  # Type of service (checkup, vaccination, surgery, etc.)
            "timeSlot": None,     # Appointment time
            "status": "scheduled",  # Status (scheduled, in-progress, completed, cancelled)
            "tracking": [],       # List of tracking events/steps
            "vetNotes": "",       # Notes from the veterinarian
            "images": [],         # List of images related to the service
            "feedback": None,     # Customer feedback after service
            "createdAt": datetime.now(),
            "updatedAt": None,
        }
    
    def to_dict(self):
        """
        Convert the service data to a dictionary
        
        Returns:
            dict: The service data as a dictionary
        """
        return self.data
    
    @staticmethod
    def from_dict(data):
        """
        Create a VetService instance from a dictionary
        
        Args:
            data (dict): Dictionary containing service data
            
        Returns:
            VetService: A new VetService instance
        """
        service = VetService()
        service.data = data
        return service
    
    def save(self):
        """
        Save the service to the database
        
        Returns:
            str: The ID of the saved service
        """
        if "_id" in self.data:
            # Update existing service
            service_id = self.data["_id"]
            if isinstance(service_id, str):
                try:
                    service_id = ObjectId(service_id)
                except InvalidId:
                    pass
                
            self.data["updatedAt"] = datetime.now()
            result = db.vet_services.update_one(
                {"_id": service_id},
                {"$set": self.data}
            )
            return str(service_id)
        else:
            # Insert new service
            result = db.vet_services.insert_one(self.data)
            return str(result.inserted_id)
    
    @staticmethod
    def create_service(pet_id, vet_id, owner_id, service_category, time_slot, additional_data=None):
        """
        Create a new vet service booking
        
        Args:
            pet_id: ID of the pet receiving service
            vet_id: ID of the veterinarian providing service
            owner_id: ID of the pet owner
            service_category: Type of service
            time_slot: Appointment time
            additional_data (dict, optional): Additional data for the service. Defaults to None.
            
        Returns:
            VetService: A new VetService instance
        """
        service = VetService()
        service.data["pet"] = pet_id
        service.data["vet"] = vet_id
        service.data["owner"] = owner_id
        service.data["serviceCategory"] = service_category
        service.data["timeSlot"] = time_slot
        
        # Add any additional data
        if additional_data:
            for key, value in additional_data.items():
                if key not in ["pet", "vet", "owner", "serviceCategory", "timeSlot"]:
                    service.data[key] = value
                    
        return service
    
    @staticmethod
    def find_by_id(service_id):
        """
        Find a service by its ID
        
        Args:
            service_id: ID of the service
            
        Returns:
            VetService: The found service or None
        """
        try:
            if isinstance(service_id, str):
                service_id = ObjectId(service_id)
        except InvalidId:
            return None
            
        service_data = db.vet_services.find_one({"_id": service_id})
        if service_data:
            return VetService.from_dict(service_data)
        return None
    
    @staticmethod
    def find_by_vet(vet_id):
        """
        Find all services for a specific veterinarian
        
        Args:
            vet_id: ID of the veterinarian
            
        Returns:
            list: List of VetService objects
        """
        services = []
        for service_data in db.vet_services.find({"vet": vet_id}):
            services.append(VetService.from_dict(service_data))
        return services
    
    @staticmethod
    def find_by_owner(owner_id):
        """
        Find all services for a specific pet owner
        
        Args:
            owner_id: ID of the pet owner
            
        Returns:
            list: List of VetService objects
        """
        services = []
        for service_data in db.vet_services.find({"owner": owner_id}):
            services.append(VetService.from_dict(service_data))
        return services
    
    @staticmethod
    def find_by_pet(pet_id):
        """
        Find all services for a specific pet
        
        Args:
            pet_id: ID of the pet
            
        Returns:
            list: List of VetService objects
        """
        services = []
        for service_data in db.vet_services.find({"pet": pet_id}):
            services.append(VetService.from_dict(service_data))
        return services
    
    @staticmethod
    def find_by_status(status):
        """
        Find all services with a specific status
        
        Args:
            status: Status of the service
            
        Returns:
            list: List of VetService objects
        """
        services = []
        for service_data in db.vet_services.find({"status": status}):
            services.append(VetService.from_dict(service_data))
        return services
    
    def update_status(self, new_status):
        """
        Update the status of the service
        
        Args:
            new_status: New status value
            
        Returns:
            bool: True if successful, False otherwise
        """
        self.data["status"] = new_status
        self.data["updatedAt"] = datetime.now()
        
        # Add tracking event
        tracking_event = {
            "status": new_status,
            "timestamp": datetime.now()
        }
        
        if "tracking" not in self.data:
            self.data["tracking"] = []
            
        self.data["tracking"].append(tracking_event)
        
        return self.save() is not None
    
    def add_notes(self, notes):
        """
        Add veterinarian notes to the service
        
        Args:
            notes: Notes from the veterinarian
            
        Returns:
            bool: True if successful, False otherwise
        """
        self.data["vetNotes"] = notes
        self.data["updatedAt"] = datetime.now()
        return self.save() is not None
    
    def add_image(self, image_id, caption=""):
        """
        Add an image to the service
        
        Args:
            image_id: ID of the uploaded image
            caption: Caption for the image
            
        Returns:
            bool: True if successful, False otherwise
        """
        image_data = {
            "id": str(image_id),
            "caption": caption,
            "timestamp": datetime.now()
        }
        
        if "images" not in self.data:
            self.data["images"] = []
            
        self.data["images"].append(image_data)
        self.data["updatedAt"] = datetime.now()
        
        return self.save() is not None
    
    def add_feedback(self, rating, comment):
        """
        Add customer feedback to the service
        
        Args:
            rating: Numerical rating
            comment: Text comment
            
        Returns:
            bool: True if successful, False otherwise
        """
        self.data["feedback"] = {
            "rating": rating,
            "comment": comment,
            "timestamp": datetime.now()
        }
        self.data["updatedAt"] = datetime.now()
        
        return self.save() is not None
    
    @staticmethod
    def delete(service_id):
        """
        Delete a service by its ID
        
        Args:
            service_id: ID of the service
            
        Returns:
            bool: True if deleted, False otherwise
        """
        try:
            if isinstance(service_id, str):
                service_id = ObjectId(service_id)
        except InvalidId:
            return False
            
        result = db.vet_services.delete_one({"_id": service_id})
        return result.deleted_count > 0 