from flask import Blueprint, request, jsonify

from app import mongo

from app.repositories.hospitalRepo import find_all_hospitals
from app.services.pricingService import compare_pricing_between_hospitals

# CHANGE:
# Keep this named "bp" because app/__init__.py registers search.bp.
# If you rename this to search_bp, then we'll also have to update app/__init__.py.
bp = Blueprint("search", __name__, url_prefix="/api/search" )

bp.route("/payers", methods=["GET"])

def get_payer_names():
    """
    CHANGE:
    This replaces payerRepo for now.

    It tries to get payer names from the MongoDB payers collection.
    If no payers are found, it returns none.
    """

   payers = list(
        mongo.db.payers.find(
            {"active": True},
            {"_id": 0}
        )
    )

    return jsonify({
        "payers": payers,
        "count": len(payers)
    }), 200


@bp.route("/payers", methods=["GET"])

def get_payers():
    """
    Returns payer names for the frontend dropdown. I'm not sure if the front end has that feature yet. If
    not , we'll discuss.
    """

    payers = get_payer_names()

    return jsonify({
        "payers": payers
    }), 200


@bp.route("/procedures", methods=["GET"])

def get_procedures():
    """
    CHANGE:
    Added this route because we now have a  mock procedures collection.

    The frontend can use this to show CPT codes and procedure names.
    """

    procedures = list(
        mongo.db.procedures.find(
            {},
            {"_id": 0}
        )
    )

    return jsonify({
        "procedures": procedures
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

    
    # Validate payer using MongoDB payers collection.
    allowed_payers = get_payer_names()

    if payer_name not in allowed_payers:
        return jsonify({
            "error": "Invalid payer",
            "allowed_payers": allowed_payers
        }), 400

    
    # Optional lookup so the response can include the procedure name.
    # This does not block the search if the procedure is missing.
    procedure = mongo.db.procedures.find_one(
        {"code": cpt_code},
        {"_id": 0}
    )

    #hospitalRepo can remain the same, it just returns hospitals from MongoDB vs. an API 
    hospitals = find_all_hospitals()

    
    # This now calls the mock MongoDB pricing logic.
    # No external API key is needed.
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
