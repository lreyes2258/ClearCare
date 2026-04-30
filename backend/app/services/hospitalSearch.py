from app.db import mongo


def find_hospitals_by_zip(zip_code: str, radius: int = 10, procedure: str = "general_visit"):
    if not zip_code:
        raise ValueError("zip_code is required")

    # get zip + nearby zips
    zip_doc = mongo.db.zip_codes.find_one({"zip": zip_code})

    if not zip_doc:
        return {"places": [], "count": 0}

    zip_list = [zip_code]

    if radius >= 10:
        zip_list += zip_doc.get("nearby_zips", [])

    # get hospitals in area
    hospitals = list(
        mongo.db.hospitals.find({"zip": {"$in": zip_list}}, {"_id": 0})
    )

    # filter procedure pricing
    for h in hospitals:
        matched = None

        for p in h.get("procedures", []):
            if p["type"] == procedure:
                matched = p["price"]
                break

        h["procedure"] = procedure
        h["price"] = matched  # can be null if not offered

        # optional cleanup
        h.pop("procedures", None)

    return {
        "places": hospitals,
        "count": len(hospitals)
    }