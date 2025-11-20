import Link from "next/link";
import {
  FaRegEnvelope,
  FaPhone,
  FaClock,
  FaMapMarkerAlt,
} from "react-icons/fa";
import PageAnimation, {
  AnimatedSection,
} from "@/app/(marketing)/_components/PageAnimation";

export default function ContactPage() {
  return (
    <PageAnimation>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <AnimatedSection>
          <div className="px-6 pt-16 pb-12">
            <div className="mx-auto max-w-6xl">
              <div className="text-center">
                <h1 className="text-[#05264E] text-[32px] md:text-[42px] font-bold leading-tight">
                  We&apos;re Here to Help!
                </h1>
                <p className="mt-4 text-[18px] text-[#66789C] max-w-2xl mx-auto">
                  Whether you have a question, feedback, or need assistance, our
                  <br className="hidden sm:block" />
                  Kind support team is here to assist you.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="px-6 pb-16">
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Information Card */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-[#05264E] text-[24px] font-bold mb-6">
                      Get in Touch
                    </h2>
                    <p className="text-[#66789C] text-[16px] mb-8">
                      Please fill out the form, and we will respond promptly.
                    </p>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="shrink-0 w-10 h-10 bg-[#E11F26]/10 rounded-full flex items-center justify-center">
                        <FaRegEnvelope className="h-5 w-5 text-[#E11F26]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#05264E] text-[16px]">
                          Email
                        </h3>
                        <p className="text-[#4F5E64] text-[15px] mt-1">
                          support@getkind.ph
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="shrink-0 w-10 h-10 bg-[#E11F26]/10 rounded-full flex items-center justify-center">
                        <FaPhone className="h-5 w-5 text-[#E11F26]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#05264E] text-[16px]">
                          Phone
                        </h3>
                        <p className="text-[#4F5E64] text-[15px] mt-1">
                          +123 456 78946
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="shrink-0 w-10 h-10 bg-[#E11F26]/10 rounded-full flex items-center justify-center">
                        <FaClock className="h-5 w-5 text-[#E11F26]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#05264E] text-[16px]">
                          Office Hours
                        </h3>
                        <p className="text-[#4F5E64] text-[15px] mt-1">
                          Monday-Friday, 9:00 AM-5:00 PM (PH Time)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Form Card */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                  <h3 className="text-[#05264E] text-[20px] font-bold mb-6">
                    Send us a Message
                  </h3>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-[#05264E] mb-2"
                        >
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          placeholder="Enter your first name"
                          className="w-full h-12 rounded-lg border border-[#A8A8A8] px-4 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30 focus:border-[#E11F26] transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-[#05264E] mb-2"
                        >
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          placeholder="Enter your last name"
                          className="w-full h-12 rounded-lg border border-[#A8A8A8] px-4 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30 focus:border-[#E11F26] transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-[#05264E] mb-2"
                        >
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="Enter your email"
                          className="w-full h-12 rounded-lg border border-[#A8A8A8] px-4 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30 focus:border-[#E11F26] transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-[#05264E] mb-2"
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          placeholder="Enter your phone number"
                          className="w-full h-12 rounded-lg border border-[#A8A8A8] px-4 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30 focus:border-[#E11F26] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-[#05264E] mb-2"
                      >
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={6}
                        placeholder="How can we help you today?"
                        className="w-full rounded-lg border border-[#A8A8A8] px-4 py-3 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30 focus:border-[#E11F26] transition-colors resize-none"
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-[#E11F26] px-8 py-4 font-semibold text-white shadow-lg hover:bg-[#C41E3A] transition-colors duration-200"
                        aria-label="Send message"
                      >
                        <FaRegEnvelope className="h-5 w-5" />
                        Send Message
                      </button>

                      <label className="flex items-start gap-3 text-xs text-[#6B7B8C]">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-[#CBD5E1] text-[#E11F26] focus:ring-[#E11F26]/30"
                        />
                        <span>
                          By clicking &apos;Send Message&apos;, you agree to our{" "}
                          <Link
                            href="/terms"
                            className="underline text-[#0D2340] hover:text-[#E11F26] transition-colors"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/privacy"
                            className="underline text-[#0D2340] hover:text-[#E11F26] transition-colors"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </span>
                      </label>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </PageAnimation>
  );
}
