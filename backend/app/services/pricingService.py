import os
import requests

PAYERBENCHMARK_API_KEY = os.getenv("PAYERBENCHMARK_API_KEY") 

def call_pricing_api(cpt_code, payer_name, npi_number):
    """ Calls the PayerBenchmark API to retrieve pricing information for a given CPT code, 
    payer name, and NPI number. All of these are rates that are negotiated by the hospitals and payers
    This API should have access to this info."""
    
    
    url = "https://api.payerbenchmark.com/v1/rates"
    
    headers = { "Accept": "application/json" }
    
    if PAYERBENCHMARK_API_KEY:
        headers["Authorization"] = f"Bearer {PAYERBENCHMARK_API_KEY}"

    params = {
        "procedure_code": cpt_code,
        "payer": payer_name,
        "npi": npi_number
    }
    
    try:
        response = requests.get(url, headers =headers, params =params, timeout =30)

        if response.status_code != 200:
            return None
        return response.json()
        
        
    except requests.exceptions.RequestException as e:
        print(f"Error calling API: {e}")
        return None

def find_lowest_price(api_response):
    if not api_response:
        return None

    rates = api_response.get("data") or api_response.get("rates") or []

    if not rates:
        return None

    valid_rates = []

    for rate in rates:
        negotiated_rate = rate.get("negotiated_rate")

        if negotiated_rate is None:
            continue

        try:
            negotiated_rate = float(negotiated_rate)
        except ValueError:
            continue

        valid_rates.append({
            "negotiated_rate": negotiated_rate,
            "payer": rate.get("payer"),
            "network_key": rate.get("network_key"),
            "procedure_code": rate.get("procedure_code"),
            "rate_type": rate.get("rate_type"),
            "effective_date": rate.get("effective_date")
        })

    if not valid_rates:
        return None

    return min(valid_rates, key=lambda item: item["negotiated_rate"])


def compare_pricing_between_hospitals(hospitals, cpt_code, payer_name, limit = 5):
    api_response = call_pricing_api(cpt_code, payer_name, npi_number)

    results = []
    for hospital in hospitals:
        # go through hospitals by NPI # and call the API for each hospital
        npi_number = hospital.get("npi_number") or hospital.get("npi")

        # Skip hospitals that do not have an NPI
        if not npi_number:
            continue

        # Call the pricing API for this specific hospital
        api_response = call_pricing_api(
            cpt_code=cpt_code,
            payer_name=payer_name,
            npi_number=npi_number
        )

        results.append({
        "hospital_npi": npi_number,
        "address": hospital.get("address"),
        "city": hospital.get("city"),
        "state": hospital.get("state"),
        "zip": hospital.get("zip"),
        "lowest_price": lowest_price_info["negotiated_rate"],
        "payer": lowest_price_info["payer"],
        "procedure_code": lowest_price_info["procedure_code"],
        "rate_type": lowest_price_info["rate_type"],
        "effective_date": lowest_price_info["effective_date"]
        
    })

    if not api_response:
        continue

    lowest_price_info = find_lowest_price(api_response)
    

    #No price found 
    if not lowest_price_info:
        print("No valid rates found ")
        continue
          

    # Sort cheapest to most expensive
    results.sort(key=lambda item: item["negotiated_rate"])

    # Return only the top cheapest results
    return results[:limit]
