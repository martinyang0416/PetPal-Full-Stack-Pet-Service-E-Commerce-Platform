from datetime import datetime
from bson import ObjectId
from src.db_config import db

class ChatMessage:
    def __init__(self, item_id, sender_id, sender_name, content, timestamp=None, _id=None):
        self.item_id = item_id
        self.sender_id = sender_id
        self.sender_name = sender_name
        self.content = content
        self.timestamp = timestamp or datetime.utcnow()
        self._id = _id or str(ObjectId())

    def to_dict(self):
        return {
            "_id": self._id,
            "item_id": self.item_id,
            "sender_id": self.sender_id,
            "sender_name": self.sender_name,
            "content": self.content,
            "timestamp": self.timestamp,
        }

class ChatModel:
    collection = db["chats"]

    @staticmethod
    def add_message(msg: ChatMessage):
        return ChatModel.collection.insert_one(msg.to_dict()).inserted_id

    @staticmethod
    def get_messages_by_item(item_id):
        cur = ChatModel.collection.find({"item_id": item_id}).sort("timestamp", 1)
        return list(cur)

    @staticmethod
    def get_conversations_by_user(user_id):
        pipeline = [
        {"$match": {"sender_id": user_id}},
        {"$sort": {"timestamp": -1}},
        {"$group": {"_id": "$item_id", "doc": {"$first": "$$ROOT"}}},
        {"$replaceRoot": {"newRoot": "$doc"}},
        {"$lookup": {
            "from": "pets",
            "localField": "item_id",
            "foreignField": "_id",
            "as": "pet"
        }},
        {"$unwind": {"path": "$pet", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "item": {
                "name":  {"$ifNull": ["$pet.name",  "Unknown"]},
                "image": {"$ifNull": ["$pet.image", ""]},
                "sellerId": {"$ifNull": ["$pet.userId", "unknown-seller"]},
            }
        }},
        {"$project": {"pet": 0}},  # 去掉中间字段
        {"$sort": {"timestamp": -1}}
        ]
        return list(ChatModel.collection.aggregate(pipeline))
