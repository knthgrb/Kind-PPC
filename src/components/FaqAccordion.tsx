"use client"

import { useState } from 'react';

type Faqs = {
  title: string;
  description: string;
};

type FaqsAccordionProps = {
  faq: Faqs[];
};

export default function PricingList({ faq }: FaqsAccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="bg-white">
      <div className="max-w-7xl bg-white mx-auto space-y-4">        
        {faq.map((faq, index) => (
          <div 
            key={index} 
            className={`border border-[#E6E7E9] hover:border-gray-400 rounded-2xl transition-all ${
                activeIndex === index ? 'bg-red-700' : ''
            }`}
          >
            <button
              onClick={() => toggleAccordion(index)}
              className={`flex items-center gap-4 w-full p-6 text-left ${
                activeIndex === index ? 'text-[#FFFFFF]' : ''
              }`}
            >
              <div className={`flex items-center justify-center w-[40px] h-[40px] rounded-xl ${
                activeIndex === index ? 'bg-white' : 'bg-[#1C2436]/[0.12]'
              }`}>
                <svg
                  className={`w-6 h-6 ${
                    activeIndex === index ? 'stroke-red-700' : 'stroke-current'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {activeIndex === index ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  )}
                </svg>
              </div>
              <p className="faqTitle">{faq.title}</p>
            </button>
            {activeIndex === index && (
              <div className="px-6 pb-6 ml-[64px]">
                <p className="faqP">{faq.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}