from flask import Blueprint, jsonify, request
from app.services.hospitalSearch import find_hospitals_by_zip

bp = Blueprint("search", __name__, url_prefix="/api/search")


@bp.route("/hospitals", methods=["GET"])
def search_hospitals():
    zip_code = request.args.get("zip")
    radius = request.args.get("radius", default=10, type=int)
    insurance = request.args.get("insurance", default="uninsured")
    procedure = request.args.get("procedure", default="general_visit")

    # Validate input
    if not zip_code:
        return jsonify({"error": "zip is required"}), 400

    try:
        results = find_hospitals_by_zip(
            zip_code=zip_code,
            radius=radius,
            procedure=procedure,
        )

        return jsonify({
            "places": results.get("places", []),
            "zip": zip_code,
            "radius": radius,
            "insurance": insurance,
            "procedure": procedure,
            "count": results.get("count", 0),
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500