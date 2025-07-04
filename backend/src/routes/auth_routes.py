from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_jwt_extended import set_access_cookies
from flask_jwt_extended import unset_jwt_cookies
from src.models.user_model import User, find_user_by_username, insert_user, UserBuilder

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    user_name = data.get("user_name")
    email = data.get("email")
    password = data.get("password")

    if not user_name or not email or not password:
        return jsonify({"msg": "Missing fields"}), 400

    if find_user_by_username(user_name):
        return jsonify({"msg": "User already exists"}), 409

    hashed_pw = current_app.extensions["bcrypt"].generate_password_hash(password).decode("utf-8")

    builder = UserBuilder(user_name, email, hashed_pw)
    new_user = builder.build()

    insert_user(new_user)
    return jsonify({"msg": "User created successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user_name = data.get("user_name")
    password = data.get("password")

    if not user_name or not password:
        return jsonify({"msg": "Missing credentials"}), 400

    user = find_user_by_username(user_name)
    if not user or not current_app.extensions["bcrypt"].check_password_hash(user["password"], password):
        return jsonify({"msg": "Invalid username or password"}), 401

    token = create_access_token(identity=user_name)
    response = jsonify({"msg": "Login successful!",
                       "has_completed_profile": user.get("has_completed_profile", False)
                       })
    set_access_cookies(response, token)  # set JWT in cookie
    return response, 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"msg": "Logout successful!"})
    unset_jwt_cookies(response)  # clears the JWT cookie
    return response, 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user_info():
    user_name = get_jwt_identity()
    user = find_user_by_username(user_name)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    user["_id"] = str(user["_id"])

    return jsonify(user), 200
