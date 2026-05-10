from flask import Blueprint, request, jsonify

from app.repositories.hospitalRepo import find_all_hospitals
from app.repositories.payerRepo import find_all_payers,find_payers_by_name
from app.services.pricingService import compare_pricing_between_hospitals

''' This is the new search.py file. Instead of focusing on using geolocation this one will search the entered Current Procedural Terminology (CPT) code and
payer( insurance companies) from hospitals' national provider identifier (NPI) # in our databaseand return the agreed-upon pricing. We will then have to loop 
through the results and return a list of results. We can do the top five lowest prices for now. I'm open to the rest of the group input.'''


#import blueprint to create a blueprint for the search routes

search_bp = Blueprint("search", __name__)

@search_bp.route("/payers", methods=["GET"])
def get_payers():
    payers = find_all_payers()
    
    return jsonify({"payers" : payers
}), 200
    


@search_bp.route("/compare-prices", methods=["POST"])
def compare_prices():
    data = request.get_json()
    cpt_code = data.get("cpt_code")
    payer_name = data.get("payer_name")

    if not cpt_code:
        return jsonify({"error" : "CPT code is required"}), 400

    if not payer_name:
        return jsonify({"error" : "Payer name is required"}), 400

    payer = find_payers_by_name(payer_name)
    if not payer:
        return jsonify({"error" : "Payer not found"}), 404

    hospitals = find_all_hospitals()
    
    results = compare_pricing_between_hospitals(
        hospitals = hospitals,
        cpt_code = cpt_code,
        payer_name = payer["name"]
        limit = 5 #as it appears in payerbenchmark's api
    )

    
    
    
    
    return jsonify({

        "cpt_code" : cpt_code,
        "payer": payer_name,
        "hospitals_checked": len(hospitals),
        "results_found": len(results),
        "results": results
    }), 200
