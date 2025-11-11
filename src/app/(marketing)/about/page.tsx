import Image from "next/image";
import Link from "next/link";
import FaqAccordion from "@/app/(marketing)/_components/FaqAccordion";
import Subscribe from "@/app/(marketing)/_components/Subscribe";
import Footer from "@/app/(marketing)/_components/Footer";
import SectionHeader from "@/app/(marketing)/_components/SectionHeading";
import PageAnimation, {
  AnimatedSection,
} from "@/app/(marketing)/_components/PageAnimation";
import { AnimatedAboutImages } from "@/app/(marketing)/_components/AnimatedAboutImages";
import { faqs } from "@/lib/marketing/homeData";

export default function About() {
  return (
    <PageAnimation>
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-white">
        {/* Hero Section */}
        <AnimatedSection>
          <section className="relative overflow-hidden pt-20 pb-32">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-linear-to-br from-red-50/30 via-transparent to-blue-50/20"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-red-100/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>

            <div className="relative max-w-7xl mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Content */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                      Find the{" "}
                      <span
                        className="text-transparent bg-clip-text bg-linear-to-r from-red-600 to-red-500"
                        style={{ fontWeight: "bold" }}
                      >
                        Perfect
                      </span>{" "}
                      Match for Your Household
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                      We connect families with verified, trustworthy household
                      help through our rigorous verification process. From yayas
                      to skilled labor, we ensure your family receives
                      professional care every time.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/recs"
                      className="inline-flex items-center justify-center px-8 py-4 bg-linear-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Search Jobs
                      <svg
                        className="ml-2 w-5 h-5"
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
                      href="/about-us/learn-more"
                      className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-red-300 hover:text-red-600 transition-all duration-300"
                    >
                      Learn More
                      <svg
                        className="ml-2 w-5 h-5"
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
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        10K+
                      </div>
                      <div className="text-sm text-gray-600">
                        Happy Families
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        5K+
                      </div>
                      <div className="text-sm text-gray-600">
                        Verified Helpers
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        99%
                      </div>
                      <div className="text-sm text-gray-600">
                        Satisfaction Rate
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image */}
                <AnimatedAboutImages />
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Mission & Vision Section */}
        <AnimatedSection>
          <section className="py-24 bg-linear-to-br from-gray-50 to-white relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-100/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-red-50/30 rounded-full blur-3xl"></div>

            <div className="relative max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
                  Mission & Vision
                </h2>
                <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                  We're revolutionizing household employment in the Philippines
                  through innovative technology, unwavering trust, and genuine
                  human connections.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-20 items-start">
                {/* Mission Card */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gray-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
                    <div className="flex items-center mb-8">
                      <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">
                          Our Mission
                        </h3>
                        <div className="w-16 h-1 bg-red-600 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed mb-8">
                      To transform household employment in the Philippines by
                      creating a safe, transparent, and respectful marketplace
                      that benefits both families (kindBossing) and service
                      providers (kindTao). We're building bridges of trust in
                      every home, one connection at a time.
                    </p>
                    <div className="flex items-center text-red-600 font-semibold">
                      <span className="mr-2">Learn more about our mission</span>
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
                    </div>
                  </div>
                </div>

                {/* Vision Card */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gray-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
                    <div className="flex items-center mb-8">
                      <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">
                          Our Vision
                        </h3>
                        <div className="w-16 h-1 bg-gray-600 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed mb-8">
                      Building a community grounded in mutual trust, kindness,
                      and fair employment practices. By simplifying the hiring
                      process, we foster positive relationships, empower
                      workers, and provide peace of mind to every family we
                      serve across the Philippines.
                    </p>
                    <div className="flex items-center text-red-600 font-semibold">
                      <span className="mr-2">Explore our vision</span>
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Stats */}
              <div className="mt-20 grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-10 h-10 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    10,000+
                  </h4>
                  <p className="text-gray-600">Families Connected</p>
                </div>
                <div className="text-center group">
                  <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-10 h-10 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    5,000+
                  </h4>
                  <p className="text-gray-600">Verified Helpers</p>
                </div>
                <div className="text-center group">
                  <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-10 h-10 text-red-600"
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
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">99%</h4>
                  <p className="text-gray-600">Satisfaction Rate</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center mt-16">
                <Link
                  href="/find-help"
                  className="inline-flex items-center justify-center px-10 py-5 bg-red-600 text-white font-bold text-lg rounded-2xl hover:bg-red-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Find Help Now
                  <svg
                    className="ml-3 w-6 h-6"
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
                  href="/about-us/mission-vision"
                  className="inline-flex items-center justify-center px-10 py-5 border-2 border-gray-300 text-gray-700 font-bold text-lg rounded-2xl hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                >
                  Learn More About Us
                  <svg
                    className="ml-3 w-6 h-6"
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
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Values Section */}
        <AnimatedSection>
          <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Our Core Values
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  These principles guide everything we do and shape the
                  experience we create for both families and helpers.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    icon: (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ),
                    title: "Trust & Safety",
                    description:
                      "Every helper undergoes rigorous background checks and verification to ensure your family's safety and peace of mind.",
                  },
                  {
                    icon: (
                      <svg
                        className="w-8 h-8"
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
                    ),
                    title: "Compassion",
                    description:
                      "We believe in treating everyone with dignity and respect, fostering meaningful relationships between families and helpers.",
                  },
                  {
                    icon: (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    ),
                    title: "Innovation",
                    description:
                      "We continuously improve our platform to make hiring household help easier, faster, and more reliable.",
                  },
                  {
                    icon: (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    ),
                    title: "Community",
                    description:
                      "We're building a supportive community where families and helpers can connect, grow, and thrive together.",
                  },
                  {
                    icon: (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    ),
                    title: "Transparency",
                    description:
                      "Clear communication, fair pricing, and honest reviews create an environment where everyone can succeed.",
                  },
                  {
                    icon: (
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    ),
                    title: "Fair Employment",
                    description:
                      "We advocate for fair wages, proper working conditions, and mutual respect in all employment relationships.",
                  },
                ].map((value, index) => (
                  <div
                    key={index}
                    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="w-16 h-16 bg-linear-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center text-red-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* FAQ Section */}
        <AnimatedSection>
          <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Frequently Asked Questions
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Everything you need to know about Kind and how we're
                  transforming household employment in the Philippines.
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <FaqAccordion faq={faqs} />
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection>
          <section className="py-24 bg-linear-to-br from-red-600 to-red-700">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                  Ready to Find Your Perfect Match?
                </h2>
                <p className="text-xl text-red-100 mb-8 leading-relaxed">
                  Join thousands of families who trust Kind to connect them with
                  verified, professional household help. Start your journey
                  today.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/recs"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white text-red-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Find Help Now
                    <svg
                      className="ml-2 w-5 h-5"
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
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-red-600 transition-all duration-300"
                  >
                    Post a Job
                    <svg
                      className="ml-2 w-5 h-5"
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
      </div>
    </PageAnimation>
  );
}
