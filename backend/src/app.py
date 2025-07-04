from .routes.vet_routes import vet_routes
from .routes.booking_routes import booking_routes
from .routes.vet_service_routes import vet_service_bp
from flask_cors import CORS

def create_app(test_config=None):
    app = Flask(__name__)
    CORS(app, 
         resources={r"/api/*": {"origins": ["http://localhost:3000"], "supports_credentials": True}},
         allow_headers=["Content-Type", "Authorization"],
         expose_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Register blueprints
    app.register_blueprint(auth_routes)
    app.register_blueprint(pet_routes)
    app.register_blueprint(user_routes)
    app.register_blueprint(vet_routes)
    app.register_blueprint(booking_routes)
    app.register_blueprint(vet_service_bp) 