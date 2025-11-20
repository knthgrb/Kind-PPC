import Hero from "@/app/(marketing)/_components/Hero";
import SectionHeader from "@/app/(marketing)/_components/SectionHeading";
import WhyChooseKind from "@/app/(marketing)/_components/WhyChooseKind";
import HowItWorks from "@/app/(marketing)/_components/HowItWorks";
import PricingCTA from "@/app/(marketing)/_components/PricingCTA";
import FaqAccordion from "@/app/(marketing)/_components/FaqAccordion";
import PageAnimation, {
  AnimatedSection,
} from "@/app/(marketing)/_components/PageAnimation";
import Image from "next/image";
import Link from "next/link";

import { benefitsList, faqs } from "@/lib/marketing/homeData";
import { JobService } from "@/services/JobService";
import JobsGrid from "@/components/common/JobsGrid";
import Header from "@/app/(marketing)/_components/Header";
import Footer from "@/app/(marketing)/_components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kind - Find Your Perfect Match",
  description: "Find your perfect kindTao",
  keywords: ["Kind", "KindTao", "KindBossing", "KindTao", "KindBossing"],
  authors: [{ name: "Kind", url: "https://kind.com" }],
  creator: "Kind",
  publisher: "Kind",
  openGraph: {
    title: "Kind - Find Your Perfect Match",
    description: "Find your perfect kindTao",
  },
};

export default async function Home() {
  return (
    <PageAnimation>
      <Header />
      <AnimatedSection>
        <Hero />
      </AnimatedSection>
      <div className="px-4 mb-20 lg:px-0 max-w-7xl mx-auto">
        <AnimatedSection>
          <HowItWorks />
        </AnimatedSection>

        <AnimatedSection>
          <SectionHeader
            title="Features"
            description={`Powerful features designed to make hiring and finding work simple, safe, and successful.`}
            className="pt-8 bg-white"
          />
        </AnimatedSection>

        <AnimatedSection>
          <div className="bg-linear-to-br from-gray-50 to-white py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {benefitsList.map((benefit, index) => (
                  <AnimatedSection
                    key={index}
                    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group text-center hover:-translate-y-2"
                  >
                    <div className="w-20 h-20 bg-[#CC0000] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative">
                      <Image
                        src={benefit.icon}
                        alt={benefit.title}
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#CC0000] transition-colors duration-300">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <PricingCTA />
        </AnimatedSection>

        <AnimatedSection>
          <SectionHeader
            title="Frequently Asked Questions"
            description={`Get answers to common questions about our platform`}
            className="pt-8 bg-white"
          />
        </AnimatedSection>

        <AnimatedSection className="pb-0! mb-0!">
          <FaqAccordion faq={faqs} />
        </AnimatedSection>
      </div>

      {/* CTA Section - Full Width */}
      <AnimatedSection>
        <section className="relative py-20 md:py-24 bg-linear-to-br from-red-600 to-red-700 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Ready to Find Your Perfect Match?
              </h2>
              <p className="text-xl text-red-100 mb-10 leading-relaxed">
                Join thousands of families who trust Kind to connect them with
                verified, professional household help. Start your journey today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/recs"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-white text-red-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1"
                >
                  <span>Find Help Now</span>
                  <svg
                    className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
                <Link
                  href="/find-help"
                  className="group inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-red-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  <span>Post a Job</span>
                  <svg
                    className="ml-2 w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
      <AnimatedSection>
        <Footer />
      </AnimatedSection>
    </PageAnimation>
  );
}
