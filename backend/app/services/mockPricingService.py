from app.db import mongo


def find_mock_price_for_hospital(cpt_code, payer_name, npi_number):
    '''
    CHANGE:
    This replaces the real external API call.

    Instead of calling PayerBenchmark or Turquoise Health if we get it , this searches the MongoDB
    mock_prices collection for a matching price.

    It looks for:
    - same NPI
    - same payer
    - same procedure code
    '''

    # CHANGE:
    # hospital JSON stores NPI as a number.
    # This makes the query flexible in case one value is stored as a string later.
    
    npi_options = [npi_number]

    try:
        npi_as_int = int(npi_number)
        npi_as_string = str(npi_number)

        if npi_as_int not in npi_options:
            npi_options.append(npi_as_int)

        if npi_as_string not in npi_options:
            npi_options.append(npi_as_string)

    except ValueError:
        pass

    price = mongo.db.mock_prices.find_one(
        {
            "npi": {"$in": npi_options},
            "payer": payer_name,
            "procedure_code": str(cpt_code)
        },
        {"_id": 0}
    )

    return price


def compare_pricing_between_hospitals(hospitals, cpt_code, payer_name, limit=5):
    """
    CHANGE:
    This function now compares prices across all hospitals.

   

    hospitals: list of hospital documents from MongoDB
    cpt_code: CPT code entered by the user
    payer_name: insurance company selected by the user
    limit: number of cheapest results to return
    """

    results = []

    for hospital in hospitals:
        # CHANGE:
        #  hospital documents use "npi", not "npi_number".We can match everything later. 
        # This supports both, just in case we forget. This might cause ambiguous calls. We'll see in testing
        npi_number = hospital.get("npi") or hospital.get("npi_number")

        if not npi_number:
            continue

        # CHANGE:
        # Instead of calling PayerBenchmark, we query MongoDB mock_prices.
        price_info = find_mock_price_for_hospital(
            cpt_code=cpt_code,
            payer_name=payer_name,
            npi_number=npi_number
        )

        if not price_info:
            continue

        negotiated_rate = price_info.get("negotiated_rate")

        if negotiated_rate is None:
            continue

        try:
            negotiated_rate = float(negotiated_rate)
        except ValueError:
            continue

        results.append({
            "hospital_name": hospital.get("name"),
            "hospital_npi": npi_number,
            "address": hospital.get("address"),
            "zip": hospital.get("zip"),
            "payer": payer_name,
            "procedure_code": str(cpt_code),
            "negotiated_rate": negotiated_rate,

            # CHANGE:
            #  from  mock DB,
            # not from the real  API.
            "data_source": "mock_prices"
        })

    # Sort cheapest to most expensive
    results.sort(key=lambda item: item["negotiated_rate"])

    # Return only the  cheapest results
    return results[:limit]
