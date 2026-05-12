export default function About() {
  return (
    <section id="about" className="py-16 lg:py-24 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
          About ClearCare
        </h2>

        <p className="text-lg text-neutral-600 mb-5 leading-relaxed">
          ClearCare is a web application designed to help users compare medical procedure costs across hospitals.
        </p>

        <p className="text-neutral-600 mb-5 leading-relaxed">
          Users select a CPT code and insurance provider, and the system compares available negotiated rates across hospitals to help identify lower-cost care options.
        </p>

        <p className="text-neutral-600 mb-5 leading-relaxed">
          This version uses mock hospital, procedure, payer, and pricing data to demonstrate how healthcare price comparison can work.
        </p>

        <p className="text-sm text-neutral-500">
          * Pricing shown is simulated for demonstration purposes and may not reflect real-world costs.
        </p>
      </div>
    </section>
  );
}