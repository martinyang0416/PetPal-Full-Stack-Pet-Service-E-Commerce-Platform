import os
from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from src.db_config import db
from src.routes.auth_routes import auth_bp
from src.routes.service_board_routes import service_board_bp
from src.routes.profile_routes import profile_bp
from src.routes.event_routes import event_bp
from src.routes.vet_service_routes import vet_service_bp
from src.routes.pet_routes import pet_bp
from src.routes.chat_routes import chat_bp

from src.socket_config import socketio, init_socketio

# Initialize Flask app
app = Flask(__name__)

# Load environment variables
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-default-secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret')

# Configure JWT to be stored in cookies
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['cookies', 'headers']
app.config['JWT_ACCESS_COOKIE_PATH'] = '/'
app.config['JWT_COOKIE_SECURE'] = False  
app.config['JWT_COOKIE_CSRF_PROTECT'] = False
app.config['JWT_COOKIE_HTTPONLY'] = True
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'  
# app.config['JWT_HEADER_NAME'] = 'Authorization'
# app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Configure CORS to allow all necessary headers and methods
CORS(app, 
     origins=["http://localhost:3000", "http://localhost:3001"], 
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Initialize SocketIO
init_socketio(app)

# Initialize extensions
bcrypt = Bcrypt(app)
app.extensions["bcrypt"] = bcrypt
jwt = JWTManager(app)

# Register routes
app.register_blueprint(auth_bp)
app.register_blueprint(service_board_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(event_bp)
app.register_blueprint(vet_service_bp)
app.register_blueprint(pet_bp)
app.register_blueprint(chat_bp, url_prefix="/chats")


@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to Pawfectly Server!"})


# Run the application
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app=app, debug=True, host='0.0.0.0', port=port)
