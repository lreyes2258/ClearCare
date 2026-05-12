from flask import Blueprint, request, jsonify

from app.db import mongo

from app.repositories.hospitalRepo import find_all_hospitals
from app.services.mockPricingService import compare_pricing_between_hospitals

# CHANGE:
# Keep this named "bp" because app/__init__.py registers search.bp.
# If you rename this to search_bp, then we'll also have to update app/__init__.py.
bp = Blueprint("search", __name__, url_prefix="/api/search")


def fetch_payers():
    """
    CHANGE:
    Replaces get_payer_names() to return raw data instead of a Flask response.

    This allows proper validation and reuse inside other routes.
    """
    return list(
        mongo.db.payers.find(
            {"active": True},
            {"_id": 0}
        )
    )


@bp.route("/payers", methods=["GET"])
def get_payers():
    """
    Returns payer names for the frontend dropdown.

    CHANGE:
    Uses fetch_payers() instead of returning a response object incorrectly.
    """
    payers = fetch_payers()

    return jsonify({
        "payers": payers,
        "count": len(payers)
    }), 200


@bp.route("/procedures", methods=["GET"])
def get_procedures():
    """
    CHANGE:
    Added this route because we now have a mock procedures collection.

    The frontend uses this to populate CPT code selection.
    """
    procedures = list(
        mongo.db.procedures.find(
            {},
            {"_id": 0}
        )
    )

    return jsonify({
        "procedures": procedures,
        "count": len(procedures)
    }), 200


@bp.route("/compare-prices", methods=["POST"])
def compare_prices():
    """
    Main search route.

    Frontend sends:
    {
        "cpt_code": "70551",
        "payer_name": "Aetna"
    }

    Backend:
    - validates inputs
    - validates payer
    - gets hospitals from MongoDB
    - compares mock_prices by hospital NPI
    - returns top 5 cheapest results
    """

    data = request.get_json() or {}

    cpt_code = str(data.get("cpt_code", "")).strip()
    payer_name = str(data.get("payer_name", "")).strip()

    if not cpt_code:
        return jsonify({
            "error": "CPT code is required"
        }), 400

    if not payer_name:
        return jsonify({
            "error": "Payer name is required"
        }), 400

    # CHANGE:
    # Fetch payer list correctly (not as a Flask response)
    payers = fetch_payers()
    allowed_payers = [payer.get("name") for payer in payers]

    if payer_name not in allowed_payers:
        return jsonify({
            "error": "Invalid payer",
            "allowed_payers": allowed_payers
        }), 400

    # Optional lookup so the response can include the procedure name.
    procedure = mongo.db.procedures.find_one(
        {"code": cpt_code},
        {"_id": 0}
    )

    # hospitalRepo remains unchanged (still returns MongoDB hospitals)
    hospitals = find_all_hospitals()

    # CHANGE:
    # Now correctly uses mockPricingService instead of pricingService
    results = compare_pricing_between_hospitals(
        hospitals=hospitals,
        cpt_code=cpt_code,
        payer_name=payer_name,
        limit=5
    )

    return jsonify({
        "cpt_code": cpt_code,
        "procedure_name": procedure.get("name") if procedure else None,
        "payer": payer_name,
        "hospitals_checked": len(hospitals),
        "results_found": len(results),
        "results": results
    }), 200