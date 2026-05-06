'use client';

import { useState } from 'react';

interface Hospital {
  name: string;
  zip: string;
  address: string;
  price?: number;

  pricing?: {
    procedure: string;
    insurance_type: string;
    base_cost: number;
    insurance_coverage: number;
    out_of_pocket: number;
    disclaimer: string;
  };
}

interface ModalAnswers {
  isFirstVisit: boolean | null;
  hasReferral: boolean | null;
  isEmergency: boolean | null;
}

const INSURANCE_OPTIONS = [
  { value: 'uninsured', label: 'Uninsured' },
  { value: 'private', label: 'Private Insurance' },
  { value: 'medicare', label: 'Medicare' },
  { value: 'medicaid', label: 'Medicaid' },
];

const PROCEDURE_OPTIONS = [
  { value: 'general_visit', label: 'General Visit' },
  { value: 'lab_work', label: 'Lab Work' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'ct_scan', label: 'CT Scan' },
  { value: 'mri', label: 'MRI' },
  { value: 'minor_surgery', label: 'Minor Surgery' },
];

export default function SearchBox() {
  const [zipCode, setZipCode] = useState('');
  const [radius, setRadius] = useState(10);
  const [insuranceType, setInsuranceType] = useState('uninsured');
  const [procedureType, setProcedureType] = useState('general_visit');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Hospital[]>([]);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [modalAnswers, setModalAnswers] = useState<ModalAnswers>({
    isFirstVisit: null,
    hasReferral: null,
    isEmergency: null,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!zipCode || zipCode.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setHasSearched(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/search/hospitals?zip=${zipCode}&radius=${radius}&insurance=${insuranceType}&procedure=${procedureType}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search hospitals');
      }

      setResults(data.places || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (hospital: Hospital) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      hospital.name + " " + hospital.address
    )}`;
    window.open(url, '_blank');
  };

  const openModal = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setModalAnswers({
      isFirstVisit: null,
      hasReferral: null,
      isEmergency: null,
    });
  };

  const closeModal = () => {
    setSelectedHospital(null);
    setModalAnswers({
      isFirstVisit: null,
      hasReferral: null,
      isEmergency: null,
    });
  };

  const calculateAdjustedPricing = (hospital: Hospital) => {
    const baseCost = hospital.price ?? 350;

    // Calculate insurance coverage based on selected insurance type
    let insuranceCoveragePercent = 0;
    switch (insuranceType) {
      case 'private':
        insuranceCoveragePercent = 0.80; // 80% coverage
        break;
      case 'medicare':
        insuranceCoveragePercent = 0.70; // 70% coverage
        break;
      case 'medicaid':
        insuranceCoveragePercent = 0.85; // 85% coverage
        break;
      case 'uninsured':
      default:
        insuranceCoveragePercent = 0; // No coverage
        break;
    }

    const adjustedBaseCost = baseCost;
    let newPatientFee = 0;
    let noReferralFee = 0;
    let emergencySurcharge = 0;

    if (modalAnswers.isFirstVisit === true) {
      newPatientFee = 50;
    }
    if (modalAnswers.hasReferral === false) {
      noReferralFee = 25;
    }
    if (modalAnswers.isEmergency === true) {
      emergencySurcharge = Math.round(baseCost * 0.3);
    }

    const totalCost = adjustedBaseCost + newPatientFee + noReferralFee + emergencySurcharge;
    const insuranceCoverage = Math.round(totalCost * insuranceCoveragePercent);
    const youPay = Math.max(0, totalCost - insuranceCoverage);

    return {
      baseCost: adjustedBaseCost,
      newPatientFee,
      noReferralFee,
      emergencySurcharge,
      insuranceCoverage,
      youPay,
      totalBeforeInsurance: totalCost,
    };
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4">
        {/* Row 1: ZIP Code + Search Button */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Enter your ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-0 rounded-xl text-neutral-900 text-lg placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
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
                Search
              </>
            )}
          </button>
        </div>

        {/* Row 2: Radius, Insurance, Procedure */}
        <div className="grid grid-cols-3 gap-3">
          {/* Radius Select */}
          <div className="relative">
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="appearance-none w-full px-4 py-3 bg-neutral-50 border-0 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value={5}>5 miles</option>
              <option value={10}>10 miles</option>
              <option value={15}>15 miles</option>
              <option value={20}>20 miles</option>
              <option value={25}>25 miles</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Insurance Type Select */}
          <div className="relative">
            <select
              value={insuranceType}
              onChange={(e) => setInsuranceType(e.target.value)}
              className="appearance-none w-full px-4 py-3 bg-neutral-50 border-0 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer"
            >
              {INSURANCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Procedure Type Select */}
          <div className="relative">
            <select
              value={procedureType}
              onChange={(e) => setProcedureType(e.target.value)}
              className="appearance-none w-full px-4 py-3 bg-neutral-50 border-0 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all cursor-pointer"
            >
              {PROCEDURE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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
            Found {results.length} option{results.length !== 1 ? 's' : ''} near {zipCode}
          </p>
          <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-1">
            {results.map((hospital, index) => (
              <div
                key={index}
                onClick={() => openModal(hospital)}
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
                        {hospital.name}
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-500 mt-2 ml-10">{hospital.address}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-neutral-100 group-hover:bg-primary-100 rounded-lg flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                {hospital.price != null && (
                  <div className="mt-3 ml-10 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="text-center">
                      <p className="text-xs text-neutral-500">Est. Cost</p>
                      <p className="font-semibold text-primary-600">
                        ${hospital.price ?? "N/A"}
                      </p>
                    </div>
                  </div>
                )}
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
          <p className="text-neutral-600">No facilities found in this area</p>
          <p className="text-sm text-neutral-400 mt-1">Try increasing the search radius</p>
        </div>
      )}

      {/* Hospital Detail Modal */}
      {selectedHospital && (
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
                      {selectedHospital.name}
                    </h2>
                    <p className="text-sm text-neutral-500">{selectedHospital.address}</p>
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

            {/* Questions Section */}
            <div className="p-5 border-b border-neutral-100">
              <h3 className="text-sm font-medium text-neutral-700 mb-4">A few quick questions:</h3>
              <div className="space-y-4">
                {/* First Visit Question */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Is this your first visit?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalAnswers({ ...modalAnswers, isFirstVisit: true })}
                      className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                        modalAnswers.isFirstVisit === true
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setModalAnswers({ ...modalAnswers, isFirstVisit: false })}
                      className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                        modalAnswers.isFirstVisit === false
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Referral Question */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Do you have a referral?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalAnswers({ ...modalAnswers, hasReferral: true })}
                      className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                        modalAnswers.hasReferral === true
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setModalAnswers({ ...modalAnswers, hasReferral: false })}
                      className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                        modalAnswers.hasReferral === false
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Emergency Question */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Is this an emergency?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalAnswers({ ...modalAnswers, isEmergency: true })}
                      className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                        modalAnswers.isEmergency === true
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setModalAnswers({ ...modalAnswers, isEmergency: false })}
                      className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                        modalAnswers.isEmergency === false
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-5 border-b border-neutral-100">
              <h3 className="text-sm font-medium text-neutral-700 mb-4">Your Estimated Cost Breakdown</h3>
              {(() => {
                const pricing = calculateAdjustedPricing(selectedHospital);
                return (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Base Cost:</span>
                      <span className="font-medium text-neutral-900">${pricing.baseCost}</span>
                    </div>
                    {pricing.newPatientFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">New Patient Fee:</span>
                        <span className="font-medium text-amber-600">+${pricing.newPatientFee}</span>
                      </div>
                    )}
                    {pricing.noReferralFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">No Referral Fee:</span>
                        <span className="font-medium text-amber-600">+${pricing.noReferralFee}</span>
                      </div>
                    )}
                    {pricing.emergencySurcharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Emergency Surcharge (30%):</span>
                        <span className="font-medium text-amber-600">+${pricing.emergencySurcharge}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Insurance Pays:</span>
                      <span className="font-medium text-green-600">-${pricing.insuranceCoverage}</span>
                    </div>
                    <div className="border-t border-neutral-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-neutral-900">You Pay:</span>
                        <span className="font-bold text-primary-600 text-lg">${pricing.youPay}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <p className="text-xs text-neutral-400 mt-4 text-center">
                * Estimated costs for demonstration only
              </p>
            </div>

            {/* Open in Maps Button */}
            <div className="p-5">
              <button
                onClick={() => openInMaps(selectedHospital)}
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