class Specification:
    def to_query(self):
        raise NotImplementedError("You must implement to_query() in subclasses")


class PriceRangeSpec(Specification):
    def __init__(self, min_price, max_price):
        self.min_price = min_price
        self.max_price = max_price

    def to_query(self):
        return {
            "price": {
                "$gte": self.min_price,
                "$lte": self.max_price
            }
        }


class TypeSpec(Specification):
    def __init__(self, type_name):
        self.type_name = type_name

    def to_query(self):
        return {
            "type": self.type_name
        }


class DistanceSpec(Specification):
    def __init__(self, lng, lat, radius_meters):
        self.lng = lng
        self.lat = lat
        self.radius = radius_meters

    def to_query(self):
        return {
            "location": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [self.lng, self.lat]
                    },
                    "$maxDistance": self.radius
                }
            }
        }


def combine_specifications(specs):
    query = {}
    for spec in specs:
        query.update(spec.to_query())
    return query
