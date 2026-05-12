from flask import Blueprint, request, jsonify

from app.db import mongo
from app.repositories.hospitalRepo import find_all_hospitals
from app.services.mockPricingService import compare_pricing_between_hospitals

bp = Blueprint("search", __name__, url_prefix="/api/search")


def fetch_payers():
    return list(
        mongo.db.payers.find(
            {"active": True},
            {"_id": 0}
        )
    )


@bp.route("/payers", methods=["GET"])
def get_payers():
    payers = fetch_payers()

    return jsonify({
        "payers": payers,
        "count": len(payers)
    }), 200


@bp.route("/procedures", methods=["GET"])
def get_procedures():
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
    data = request.get_json() or {}

    cpt_code = str(data.get("cpt_code", "")).strip()
    payer_name = str(data.get("payer_name", "")).strip()

    if not cpt_code:
        return jsonify({"error": "CPT code is required"}), 400

    if not payer_name:
        return jsonify({"error": "Payer name is required"}), 400

    payers = fetch_payers()
    allowed_payers = [payer.get("name") for payer in payers]

    if payer_name not in allowed_payers:
        return jsonify({
            "error": "Invalid payer",
            "allowed_payers": allowed_payers
        }), 400

    procedure = mongo.db.procedures.find_one(
        {"code": cpt_code},
        {"_id": 0}
    )

    hospitals = find_all_hospitals()

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