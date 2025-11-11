import Link from "next/link";

export default function PricingCTA() {
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="sectionH2 font-bold text-[#05264E] mb-6">
          Simple pricing. Trusted connections only.
        </h2>

        <p className="sectionP text-gray-600 mb-8 max-w-2xl mx-auto">
          Start connecting with verified kindTao for free. When you're ready to
          unlock more features and grow your network — you choose your plan.
        </p>

        <div className="space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3 text-lg text-gray-700">
            <span className="w-2 h-2 bg-[#CC0000] rounded-full"></span>
            <span>No hidden fees.</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-lg text-gray-700">
            <span className="w-2 h-2 bg-[#CC0000] rounded-full"></span>
            <span>No feature restrictions.</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-lg text-gray-700">
            <span className="w-2 h-2 bg-[#CC0000] rounded-full"></span>
            <span>Just one platform. Built for trust.</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/pricing"
            className="group inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <span>View Pricing</span>
            <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
          </Link>

          <Link
            href="/signup"
            className="group inline-flex items-center justify-center px-8 py-3 bg-[#CC0000] text-white font-medium rounded-lg hover:bg-[#a00000] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <span>Start Free</span>
            <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
