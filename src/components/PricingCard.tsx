import { FaCheck } from "react-icons/fa6";

type Pricing = {
  tier: string;
  price: number;
  description: string;
  features: string[];
};

type PricingProps = {
  pricing: Pricing[];
};

export default function PricingList({ pricing }: PricingProps) {
  return (
    <section className="bg-white">
      <div className="max-w-7xl bg-white mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4">        
        {pricing.map((pricing, index) => (
          <div key={index} className="flex flex-col p-[45px] rounded-2xl bg-white border border-[#E6E7E9] hover:border-gray-400 transition-all w-full h-auto">
            <h3 className="pricingh3">
                {pricing.tier}
            </h3>
            <p>
              <span className="pricingPrice text-[#CC0000]">${pricing.price.toLocaleString()}</span>
              <span className="pricingPriceSubtext">/month</span>
            </p>
            
            <p className="pricingP max-w-[200px]">
                {pricing.description}
            </p>
            <hr  className="pricingP mb-[20px] mt-[20px]"></hr>
            <ul className="mb-[40px]">
              {pricing.features.map((feature, featureIndex) => (
                <li
                  key={featureIndex}
                  className="pricingFeatures mt-[10px] mb-[10px] flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center bg-[#cc00001a]">
                    <FaCheck className="text-[#CC0000] text-xs" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="flex items-center mt-auto">
              <button className="w-full py-2 px-6 bg-white text-[#CC0000] border-2 border-[#CC0000] rounded-lg bold hover:bg-[#CC0000] hover:text-white">
                <span className="text-sm">Choose Plan</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}