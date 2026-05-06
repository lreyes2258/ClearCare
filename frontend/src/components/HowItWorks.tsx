export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Enter Your ZIP Code',
      description: 'Enter your ZIP code to find care options near you.',
    },
    {
      number: '02',
      title: 'Set Your Radius',
      description: 'Set how far you\'re willing to travel for the best value.',
    },
    {
      number: '03',
      title: 'View Results',
      description: 'View facilities with cost estimates based on your insurance status.',
    },
    {
      number: '04',
      title: 'Choose Your Care',
      description: 'Choose the best value option and take the next step.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            How it works
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Finding affordable care has never been easier. Just four simple steps.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-[32px] left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative z-10 text-center">
                {/* Step Number Circle */}
                <div className="relative z-10 w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-xl font-bold">{step.number}</span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="#search"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg shadow-primary-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Affordable Care
          </a>
        </div>
      </div>
    </section>
  );
}
