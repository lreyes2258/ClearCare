'use client';

import { useEffect, useState } from 'react';

interface Payer {
  name: string;
  active?: boolean;
}

interface Procedure {
  code: string;
  name: string;
}

interface PriceResult {
  hospital_name: string;
  hospital_npi: string | number;
  address: string;
  zip: string;
  payer: string;
  procedure_code: string;
  negotiated_rate: number;
  data_source: string;
}

const DEFAULT_PAYERS: Payer[] = [
  { name: 'Aetna' },
  { name: 'Cigna' },
  { name: 'UnitedHealthcare' },
  { name: 'Blue Shield of California' },
  { name: 'Anthem Blue Cross' },
];

const DEFAULT_PROCEDURES: Procedure[] = [
  { code: '70551', name: 'MRI Brain (no contrast)' },
  { code: '70553', name: 'MRI Brain (with and without contrast)' },
  { code: '71046', name: 'Chest X-ray (2 views)' },
  { code: '72148', name: 'MRI Lumbar Spine (no contrast)' },
  { code: '73721', name: 'MRI Knee (no contrast)' },
  { code: '74177', name: 'CT Abdomen and Pelvis (with contrast)' },
  { code: '71260', name: 'CT Chest (with contrast)' },
  { code: '45378', name: 'Colonoscopy (diagnostic)' },
  { code: '43235', name: 'Upper GI Endoscopy' },
  { code: '80053', name: 'Comprehensive Metabolic Panel' },
  { code: '80061', name: 'Lipid Panel' },
  { code: '83036', name: 'Hemoglobin A1C' },
  { code: '36415', name: 'Blood Draw (Venipuncture)' },
  { code: '93000', name: 'Electrocardiogram (EKG)' },
  { code: '97110', name: 'Physical Therapy (therapeutic exercise)' },
];

export default function SearchBox() {
  const [payerName, setPayerName] = useState('Aetna');
  const [cptCode, setCptCode] = useState('70551');
  const [payers, setPayers] = useState<Payer[]>(DEFAULT_PAYERS);
  const [procedures, setProcedures] = useState<Procedure[]>(DEFAULT_PROCEDURES);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [results, setResults] = useState<PriceResult[]>([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedResult, setSelectedResult] = useState<PriceResult | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);

      try {
        const [payerResponse, procedureResponse] = await Promise.all([
          fetch('http://localhost:5000/api/search/payers'),
          fetch('http://localhost:5000/api/search/procedures'),
        ]);

        if (payerResponse.ok) {
          const payerData = await payerResponse.json();
          if (Array.isArray(payerData.payers) && payerData.payers.length > 0) {
            setPayers(payerData.payers);
            setPayerName(payerData.payers[0].name);
          }
        }

        if (procedureResponse.ok) {
          const procedureData = await procedureResponse.json();
          if (Array.isArray(procedureData.procedures) && procedureData.procedures.length > 0) {
            setProcedures(procedureData.procedures);
            setCptCode(procedureData.procedures[0].code);
          }
        }
      } catch {
        setPayers(DEFAULT_PAYERS);
        setProcedures(DEFAULT_PROCEDURES);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cptCode) {
      setError('Please select or enter a CPT code');
      return;
    }

    if (!payerName) {
      setError('Please select a payer');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setHasSearched(true);

    try {
      const response = await fetch('http://localhost:5000/api/search/compare-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpt_code: cptCode,
          payer_name: payerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare prices');
      }

      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (result: PriceResult) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      result.hospital_name + ' ' + result.address
    )}`;
    window.open(url, '_blank');
  };

  const openModal = (result: PriceResult) => {
    setSelectedResult(result);
  };

  const closeModal = () => {
    setSelectedResult(null);
  };

  const selectedProcedure = procedures.find((procedure) => procedure.code === cptCode);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4">
        {/* Row 1: CPT Code + Search Button */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <select
              value={cptCode}
              onChange={(e) => setCptCode(e.target.value)}
              disabled={loadingOptions}
              className="appearance-none w-full px-4 py-4 bg-neutral-50 border-0 rounded-xl text-neutral-900 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer"
            >
              {procedures.map((procedure) => (
                <option key={procedure.code} value={procedure.code}>
                  {procedure.code} - {procedure.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loadingOptions}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-primary-300 disabled:to-primary-400 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 min-w-[140px] shadow-lg shadow-primary-500/25"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Compare
              </>
            )}
          </button>
        </div>

        {/* Row 2: Payer */}
        <div className="relative">
          <select
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            disabled={loadingOptions}
            className="appearance-none w-full px-4 py-3 bg-neutral-50 border-0 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer"
          >
            {payers.map((payer) => (
              <option key={payer.name} value={payer.name}>
                {payer.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && !error && results.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-neutral-500 text-left">
            Found {results.length} price option{results.length !== 1 ? 's' : ''} for {selectedProcedure?.name || cptCode} with {payerName}
          </p>

          <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-1">
            {results.map((result, index) => (
              <div
                key={`${result.hospital_npi}-${result.procedure_code}-${index}`}
                onClick={() => openModal(result)}
                className="bg-white/90 backdrop-blur-sm border border-neutral-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-lg transition-all text-left cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                        {result.hospital_name}
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-500 mt-2 ml-10">{result.address}</p>
                    <p className="text-xs text-neutral-400 mt-1 ml-10">ZIP: {result.zip}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-neutral-500">Negotiated Rate</p>
                    <p className="font-bold text-primary-600 text-lg">
                      ${result.negotiated_rate.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="mt-3 ml-10 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-neutral-500">Payer</p>
                      <p className="font-semibold text-neutral-900 text-sm">{result.payer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">CPT Code</p>
                      <p className="font-semibold text-neutral-900 text-sm">{result.procedure_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">NPI</p>
                      <p className="font-semibold text-neutral-900 text-sm">{result.hospital_npi}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {hasSearched && !loading && !error && results.length === 0 && (
        <div className="mt-6 p-8 bg-neutral-50 rounded-xl text-center">
          <svg className="w-12 h-12 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-neutral-600">No negotiated prices found</p>
          <p className="text-sm text-neutral-400 mt-1">Try a different CPT code or payer</p>
        </div>
      )}

      {/* Price Detail Modal */}
      {selectedResult && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-neutral-900 text-lg">
                      {selectedResult.hospital_name}
                    </h2>
                    <p className="text-sm text-neutral-500">{selectedResult.address}</p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Price Details */}
            <div className="p-5 border-b border-neutral-100">
              <h3 className="text-sm font-medium text-neutral-700 mb-4">Negotiated Price Details</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Procedure:</span>
                  <span className="font-medium text-neutral-900 text-right">
                    {selectedProcedure?.name || selectedResult.procedure_code}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">CPT Code:</span>
                  <span className="font-medium text-neutral-900">{selectedResult.procedure_code}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">Payer:</span>
                  <span className="font-medium text-neutral-900">{selectedResult.payer}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600">Hospital NPI:</span>
                  <span className="font-medium text-neutral-900">{selectedResult.hospital_npi}</span>
                </div>

                <div className="border-t border-neutral-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-900">Negotiated Rate:</span>
                    <span className="font-bold text-primary-600 text-lg">
                      ${selectedResult.negotiated_rate.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-neutral-400 mt-4 text-center">
                * Pricing is based on currently available mock negotiated-rate data.
              </p>
            </div>

            {/* Open in Maps Button */}
            <div className="p-5">
              <button
                onClick={() => openInMaps(selectedResult)}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open in Google Maps
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}