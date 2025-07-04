from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.chat_model import ChatModel, ChatMessage
from src.models.pets_model import find_pet_by_id  
from src.models.user_model import find_user_by_username 

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/<item_id>", methods=["GET"])
def get_messages(item_id):
    messages = ChatModel.get_messages_by_item(item_id)
    for m in messages:
        if isinstance(m["timestamp"], datetime):
            m["timestamp"] = m["timestamp"].isoformat()
    return jsonify({"messages": messages})

@chat_bp.route("/send", methods=["POST"])
def send_message():
    data = request.json
    item_id = data["itemId"]
    m      = data["message"]
    msg = ChatMessage(
        item_id=item_id,
        sender_id=m["senderId"],
        sender_name=m["senderName"],
        content=m["content"],
    )
    ChatModel.add_message(msg)
    return jsonify({"success": True, "id": str(msg._id)})

@chat_bp.route("/conversations/<user_id>", methods=["GET"])
def conversations(user_id):
    convs = ChatModel.get_conversations_by_user(user_id)
    return jsonify({"conversations": convs})
