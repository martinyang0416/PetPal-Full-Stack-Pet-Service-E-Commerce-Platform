from datetime import datetime
from ..db_config import db
from bson import ObjectId

class Review:
    def __init__(self, reviewer, target_user, rating, comment=None):
        self.reviewer = reviewer
        self.target_user = target_user
        self.rating = rating
        self.comment = comment
        self.date = datetime.utcnow()

    def to_dict(self):
        return {
            "reviewer": self.reviewer,
            "target_user": self.target_user,
            "rating": self.rating,
            "comment": self.comment,
            "date": self.date
        }

    @staticmethod
    def create_review(reviewer, target_user, rating, comment=None):
        """Create a new review"""
        review = Review(reviewer, target_user, rating, comment)
        review_data = review.to_dict()
        
        # Add review to user's reviews array and update average rating
        current_user = db.users.find_one({"user_name": target_user})
        if not current_user:
            return None

        # Get current reviews
        reviews = current_user.get("review", [])
        reviews.append(review_data)

        # Calculate new average rating
        total_ratings = sum(r["rating"] for r in reviews)
        new_rating = total_ratings / len(reviews)

        # Update user document
        db.users.update_one(
            {"user_name": target_user},
            {
                "$set": {
                    "review": reviews,
                    "rating": round(new_rating, 2)
                }
            }
        )

        return review_data

    @staticmethod
    def get_user_reviews(username):
        """Get all reviews for a user"""
        user = db.users.find_one({"user_name": username})
        if not user:
            return None
        
        reviews = user.get("review", [])
        rating = user.get("rating", 0)
        
        return {
            "reviews": reviews,
            "rating": rating,
            "total_reviews": len(reviews)
        }

    @staticmethod
    def delete_review(reviewer, target_user, review_date):
        """Delete a review"""
        user = db.users.find_one({"user_name": target_user})
        if not user:
            return False

        reviews = user.get("review", [])
        reviews = [r for r in r if r["reviewer"] != reviewer or r["date"] != review_date]

        # Recalculate average rating
        if reviews:
            total_ratings = sum(r["rating"] for r in reviews)
            new_rating = total_ratings / len(reviews)
        else:
            new_rating = 0

        # Update user document
        db.users.update_one(
            {"user_name": target_user},
            {
                "$set": {
                    "review": reviews,
                    "rating": round(new_rating, 2)
                }
            }
        )

        return True 