from flask import Blueprint, request, jsonify, send_file, current_app as app
from bson.objectid import ObjectId, InvalidId
from datetime import datetime
import json
from bson import json_util
import io
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..db_config import db, fs
from ..models.vet_service_model import VetService

vet_service_bp = Blueprint('vet_service_routes', __name__)

# Helper function to parse MongoDB BSON to JSON
def parse_json(data):
    return json.loads(json_util.dumps(data))

# Get all vet services with optional filtering
@vet_service_bp.route('/api/vet-services', methods=['GET'])
def get_vet_services():
    try:
        query = {}
        
        # Filter by vet ID
        vet_id = request.args.get('vetId')
        if vet_id:
            query['vetId'] = vet_id
        
        # Filter by pet owner ID (support both userId and ownerId for compatibility)
        user_id = request.args.get('userId')
        owner_id = request.args.get('ownerId')
        
        if user_id:
            print(f"Filtering services by userId: {user_id}")
            query['ownerId'] = user_id
        elif owner_id:
            print(f"Filtering services by ownerId: {owner_id}")
            query['ownerId'] = owner_id
        
        # Filter by status
        status = request.args.get('status')
        if status:
            query['status'] = status
        
        print(f"Query filter: {query}")
        
        # Get all services matching the query
        services = list(db.vet_services.find(query).sort('createdAt', -1))
        print(f"Found {len(services)} services matching the query")
        
        # Debug first few services
        if services and len(services) > 0:
            print(f"First service: {services[0].get('_id')} - Owner: {services[0].get('ownerId')}, Pet: {services[0].get('petName')}")
        
        return jsonify(parse_json(services)), 200
    except Exception as e:
        print(f"Error in get_vet_services: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Support underscore version of the endpoint for consistency
@vet_service_bp.route('/api/vet_services', methods=['GET'])
def get_vet_services_underscore():
    return get_vet_services()

# Get a single vet service by ID
@vet_service_bp.route('/api/vet-services/<service_id>', methods=['GET'])
def get_vet_service(service_id):
    try:
        service = db.vet_services.find_one({'_id': ObjectId(service_id)})
        
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        return jsonify(parse_json(service)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Upload an image for a vet service
@vet_service_bp.route('/api/vet-services/upload-image', methods=['POST'])
def upload_service_image():
    try:
        # Check if image is in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file uploaded'}), 400
            
        # Get the image file
        image = request.files['image']
        caption = request.form.get('caption', '')
        service_id = request.form.get('serviceId')
        
        # Validate service ID
        if not service_id:
            return jsonify({'error': 'Service ID is required'}), 400
            
        # Check if service exists
        service = VetService.find_by_id(service_id)
        if not service:
            return jsonify({'error': 'Service not found'}), 404
            
        # Store image in GridFS
        image_id = fs.put(
            image.stream, 
            filename=image.filename,
            content_type=image.content_type,
            metadata={
                'service_id': service_id,
                'caption': caption,
                'upload_date': datetime.utcnow()
            }
        )
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'imageId': str(image_id)
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get an image by ID
@vet_service_bp.route('/api/images/<image_id>', methods=['GET'])
def get_service_image(image_id):
    try:
        # Get the image from GridFS
        image_file = fs.get(ObjectId(image_id))
        
        # Return the image
        return send_file(
            io.BytesIO(image_file.read()),
            mimetype=image_file.content_type,
            download_name=image_file.filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

# Create a new vet service booking
@vet_service_bp.route('/api/vet-services', methods=['POST'])
@jwt_required(optional=True)  # Make JWT optional to handle auth header
def create_vet_service():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['petId', 'vetId', 'serviceCategory', 'timeSlot']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Extract data from request
        pet_id = data.get('petId')
        vet_id = data.get('vetId')
        service_category = data.get('serviceCategory')
        time_slot = data.get('timeSlot')
        owner_data = data.get('ownerData', {})
        
        # Find pet by ID
        try:
            pet_obj_id = ObjectId(pet_id)
            pet = db.pets.find_one({'_id': pet_obj_id})
        except (InvalidId, TypeError):
            pet = db.pets.find_one({'_id': pet_id})
        
        if not pet:
            return jsonify({'error': f'Pet not found with id: {pet_id}'}), 404

        # Find vet by ID
        try:
            vet_obj_id = ObjectId(vet_id)
            vet = db.users.find_one({'_id': vet_obj_id})
        except (InvalidId, TypeError):
            vet = db.users.find_one({'_id': vet_id})
            
        if not vet:
            return jsonify({'error': f'Veterinarian not found with id: {vet_id}'}), 404

        # Get owner information
        owner = None
        jwt_identity = get_jwt_identity()

        # Try to get the owner from the JWT identity
        if jwt_identity:
            if isinstance(jwt_identity, dict) and '_id' in jwt_identity:
                try:
                    owner = db.users.find_one({'_id': ObjectId(jwt_identity['_id'])})
                except:
                    owner = db.users.find_one({'_id': jwt_identity['_id']})
            else:
                owner = db.users.find_one({'user_name': jwt_identity})
        
        # If not found, try to get from request data
        if not owner and owner_data:
            # First try to get by ID if available
            owner_id = owner_data.get('_id')
            if owner_id:
                try:
                    owner = db.users.find_one({'_id': ObjectId(owner_id)})
                except:
                    owner = db.users.find_one({'_id': owner_id})
            
            # If still not found, try by username
            if not owner and (owner_data.get('user_name') or owner_data.get('username')):
                username = owner_data.get('user_name') or owner_data.get('username')
                owner = db.users.find_one({'user_name': username})
            
            # If still not found, create a minimal owner data from the request
            if not owner:
                print("Creating owner data from request payload")
                owner = {
                    '_id': owner_id or 'temp_id',
                    'name': owner_data.get('name') or 'Unknown Owner',
                    'user_name': owner_data.get('user_name') or owner_data.get('username') or 'Unknown',
                    'contact': {
                        'email': owner_data.get('email') or owner_data.get('contact', {}).get('email', ''),
                        'phone_number': owner_data.get('phone') or owner_data.get('contact', {}).get('phone_number', '')
                    }
                }
        
        # If still not found, see if pet has an owner reference
        if not owner and 'owner_id' in pet:
            owner_id = pet['owner_id']
            try:
                if isinstance(owner_id, str):
                    owner_id = ObjectId(owner_id)
                owner = db.users.find_one({'_id': owner_id})
            except:
                pass
            
        if not owner:
            return jsonify({'error': 'Owner information not found'}), 400

        # Extract owner name with fallbacks
        owner_name = None
        if owner:
            # Try multiple fields where name might be stored
            owner_name = (
                owner.get('name') or 
                owner.get('user_name') or 
                owner_data.get('name') or 
                owner_data.get('user_name') or 
                owner_data.get('username') or 
                'Unknown Owner'
            )
            
        # Extract owner contact information
        owner_contact = {
            'phone': '',
            'email': ''
        }
        
        # Try to get from owner database record
        if owner and owner.get('contact'):
            owner_contact['phone'] = owner.get('contact', {}).get('phone_number', '')
            owner_contact['email'] = owner.get('contact', {}).get('email', '')
        
        # Fallback to direct fields from owner data
        if not owner_contact['phone']:
            owner_contact['phone'] = (
                owner_data.get('phone') or 
                owner_data.get('contact', {}).get('phone_number', '') or 
                ''
            )
        
        if not owner_contact['email']:
            owner_contact['email'] = (
                owner_data.get('email') or 
                owner_data.get('contact', {}).get('email', '') or 
                ''
            )
            
        print(f"Using owner name: {owner_name}")
        print(f"Using owner contact: {owner_contact}")

        # Create service object
        service = {
            'petId': pet_id,
            'vetId': vet_id,
            'ownerId': str(owner.get('_id')),
            'petName': pet.get('name', ''),
            'petSpecies': pet.get('species', '') or pet.get('pet_type', ''),
            'petBreed': pet.get('breed', ''),
            'vetName': vet.get('name', ''),
            'ownerName': owner_name,
            'ownerContact': owner_contact,
            'serviceCategory': service_category,
            'serviceType': data.get('serviceType', 'in_person'),
            'timeSlot': time_slot,
            'notes': data.get('notes', ''),
            'status': 'pending',
            'tracking': [
                {'step': 'check-in', 'completed': False},
                {'step': 'examination', 'completed': False},
                {'step': 'treatment', 'completed': False},
                {'step': 'checkout', 'completed': False}
            ],
            'images': [],
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Insert into database
        result = db.vet_services.insert_one(service)
        service['_id'] = str(result.inserted_id)
        
        return jsonify({'message': 'Booking created successfully', 'service': service}), 201
    except Exception as e:
        print(f"Error creating booking: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add support for underscore format route
@vet_service_bp.route('/api/vet_services', methods=['POST'])
@jwt_required(optional=True)  # Make JWT optional for this route
def create_vet_service_underscore():
    # Simply call the dash version
    return create_vet_service()

# Update a vet service
@vet_service_bp.route('/api/vet-services/<service_id>', methods=['PUT'])
@jwt_required(optional=True)
def update_vet_service(service_id):
    try:
        # Get data from request
        data = request.get_json()
        
        # Find service by ID
        service = VetService.find_by_id(service_id)
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        # Update fields that are provided
        update_data = {}
        
        if 'status' in data:
            update_data['status'] = data['status']
            update_data['updatedAt'] = datetime.now()
        
        if 'tracking' in data:
            update_data['tracking'] = data['tracking']
            update_data['updatedAt'] = datetime.now()
        
        if 'images' in data:
            update_data['images'] = data['images']
            update_data['updatedAt'] = datetime.now()
            
        if 'feedback' in data:
            update_data['feedback'] = data['feedback']
            update_data['updatedAt'] = datetime.now()
        
        # Handle notes
        if 'vetNotes' in data:
            update_data['vetNotes'] = data['vetNotes']
            
            # Also update medicalNotes for pet owner view
            if 'medicalNotes' not in data:
                update_data['medicalNotes'] = data['vetNotes']
                
            update_data['updatedAt'] = datetime.now()
        
        if 'medicalNotes' in data:
            update_data['medicalNotes'] = data['medicalNotes']
            update_data['updatedAt'] = datetime.now()
            
        if 'cancellationReason' in data:
            update_data['cancellationReason'] = data['cancellationReason']
            update_data['updatedAt'] = datetime.now()
        
        # Update in database if we have data to update
        if update_data:
            db.vet_services.update_one(
                {'_id': ObjectId(service_id)},
                {'$set': update_data}
            )
            
            # Get updated service
            updated_service = VetService.find_by_id(service_id)
            return jsonify(parse_json(updated_service.to_dict())), 200
        
        return jsonify({'message': 'No changes to update'}), 200
        
    except Exception as e:
        print(f"Error updating service: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add endpoint with underscore for consistency
@vet_service_bp.route('/api/vet_services/<service_id>', methods=['PUT'])
@jwt_required(optional=True)
def update_vet_service_underscore(service_id):
    return update_vet_service(service_id)

# Delete a vet service
@vet_service_bp.route('/api/vet_services/<service_id>', methods=['DELETE'])
@jwt_required()
def delete_vet_service(service_id):
    """
    Delete a vet service
    """
    service = VetService.find_by_id(service_id)
    
    if not service:
        return jsonify({
            'success': False,
            'message': f'Service with ID {service_id} not found'
        }), 404
    
    # Only allow deletion by the owner or vet
    if (str(service.data.get('owner')) != str(get_jwt_identity().get('_id')) and
        str(service.data.get('vet')) != str(get_jwt_identity().get('_id'))):
        return jsonify({
            'success': False,
            'message': 'Not authorized to delete this service'
        }), 403
    
    deleted = VetService.delete(service_id)
    
    if deleted:
        return jsonify({
            'success': True,
            'message': 'Service deleted successfully'
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Failed to delete service'
        }), 500

# Submit feedback for a completed service
@vet_service_bp.route('/api/vet-services/<service_id>/feedback', methods=['POST'])
@jwt_required()
def submit_feedback(service_id):
    try:
        data = request.json
        
        # Required fields
        if 'rating' not in data or 'comment' not in data:
            return jsonify({'error': 'Missing required fields: rating and comment'}), 400
        
        # Get the current service
        service = db.vet_services.find_one({'_id': ObjectId(service_id)})
        if not service:
            return jsonify({'error': 'Service not found'}), 404
        
        # Service must be completed to receive feedback
        if service['status'] != 'completed':
            return jsonify({'error': 'Feedback can only be submitted for completed services'}), 400
        
        # Create feedback object
        feedback = {
            'rating': data['rating'],
            'comment': data['comment'],
            'timestamp': datetime.now()
        }
        
        # Update the service with feedback
        db.vet_services.update_one(
            {'_id': ObjectId(service_id)},
            {
                '$set': {
                    'feedback': feedback,
                    'updatedAt': datetime.now()
                }
            }
        )
        
        # Get the updated service
        updated_service = db.vet_services.find_one({'_id': ObjectId(service_id)})
        
        return jsonify(parse_json(updated_service)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get all vets (users with vet identity)
@vet_service_bp.route('/api/vets', methods=['GET'])
def get_vets():
    try:
        # Find users with vet identity - handle both string and array identity fields
        vets = list(db.users.find({
            '$or': [
                {'identity': 'vet'},
                {'identity': ['vet']},
                {'identity': {'$in': ['vet']}},
                {'identity': {'$elemMatch': {'$eq': 'vet'}}}
            ]
        }))
        
        print(f"Found {len(vets)} veterinarians in the database")
        
        # Filter sensitive information
        filtered_vets = []
        for vet in vets:
            filtered_vet = {
                '_id': str(vet['_id']),
                'name': vet.get('name', ''),
                'profile_picture': vet.get('profile_picture', ''),
                'bio': vet.get('bio', ''),
                'specialty': vet.get('specialty', 'General Veterinarian'),
                'location': vet.get('location', {}),
                'availability': vet.get('availability', {}),
                'contact': {
                    'email': vet.get('contact', {}).get('email', ''),
                    'phone_number': vet.get('contact', {}).get('phone_number', '')
                }
            }
            filtered_vets.append(filtered_vet)
        
        return jsonify(filtered_vets), 200
    except Exception as e:
        print(f"Error fetching vets: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get a single vet by ID
@vet_service_bp.route('/api/vets/<vet_id>', methods=['GET'])
def get_vet_by_id(vet_id):
    try:
        # Convert string ID to ObjectId
        vet = db.users.find_one({'_id': ObjectId(vet_id)})
        
        if not vet:
            return jsonify({'error': 'Veterinarian not found'}), 404
        
        # Check if the user is a vet
        is_vet = False
        if isinstance(vet.get('identity'), list) and 'vet' in vet.get('identity'):
            is_vet = True
        elif vet.get('identity') == 'vet':
            is_vet = True
            
        if not is_vet:
            return jsonify({'error': 'User is not a veterinarian'}), 404
        
        # Filter sensitive information
        filtered_vet = {
            '_id': str(vet['_id']),
            'name': vet.get('name', ''),
            'profile_picture': vet.get('profile_picture', ''),
            'bio': vet.get('bio', ''),
            'specialty': vet.get('specialty', 'General Veterinarian'),
            'location': vet.get('location', {}),
            'availability': vet.get('availability', {}),
            'contact': {
                'email': vet.get('contact', {}).get('email', ''),
                'phone_number': vet.get('contact', {}).get('phone_number', '')
            }
        }
        
        return jsonify(filtered_vet), 200
    except Exception as e:
        print(f"Error fetching vet by ID: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get pets for a user
@vet_service_bp.route('/api/users/<user_id>/pets', methods=['GET'])
def get_user_pets(user_id):
    try:
        # Try to convert user_id to ObjectId but handle string format too
        try:
            # If it's a valid ObjectId, use it directly
            object_id = ObjectId(user_id)
            query = {'owner_id': object_id}
        except:
            # If conversion fails, it might be a string ID
            query = {'owner_id': user_id}
            
        # Try both formats as a fallback
        pets = list(db.pets.find(query))
        
        if not pets:
            # If no pets found with the above query, try with string ID
            pets = list(db.pets.find({'owner_id': str(user_id)}))
        
        return jsonify(parse_json(pets)), 200
    except Exception as e:
        print(f"Error fetching pets for user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500 