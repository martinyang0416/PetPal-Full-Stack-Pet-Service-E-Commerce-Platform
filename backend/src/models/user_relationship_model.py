from src.db_config import db
from datetime import datetime

users_relationship_collection = db["users_relationship"]

class UserRelationship:
    @staticmethod
    def follow_user(follower_username, following_username):
        # Check if already following
        if UserRelationship.is_following(follower_username, following_username):
            return False

        relationship = {
            "follower": follower_username,
            "following": following_username,
            "created_at": datetime.utcnow()
        }
        
        result = users_relationship_collection.insert_one(relationship)
        return bool(result.inserted_id)

    @staticmethod
    def unfollow_user(follower_username, following_username):
        result = users_relationship_collection.delete_one({
            "follower": follower_username,
            "following": following_username
        })
        return result.deleted_count > 0

    @staticmethod
    def is_following(follower_username, following_username):
        relationship = users_relationship_collection.find_one({
            "follower": follower_username,
            "following": following_username
        })
        return bool(relationship)

    @staticmethod
    def get_followers(username):
        followers = users_relationship_collection.find({"following": username})
        return [rel["follower"] for rel in followers]

    @staticmethod
    def get_following(username):
        following = users_relationship_collection.find({"follower": username})
        return [rel["following"] for rel in following]

    @staticmethod
    def get_followers_count(username):
        return users_relationship_collection.count_documents({"following": username})

    @staticmethod
    def get_following_count(username):
        return users_relationship_collection.count_documents({"follower": username})

    @staticmethod
    def get_mutual_followers(username1, username2):
        user1_followers = set(UserRelationship.get_followers(username1))
        user2_followers = set(UserRelationship.get_followers(username2))
        return list(user1_followers.intersection(user2_followers)) 