import Link from "next/link";
import { FaRegEnvelope } from "react-icons/fa";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <div>
      <div className="px-6 pt-10 pb-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-center text-[#05264E] text-[28px] md:text-[36px] font-bold">
            We&apos;re Here to Help!
          </h1>
          <p className="mt-2 text-center text-[18px] text-[#66789C]">
            Whether you have a question, feedback, or need assistance, our
            <br className="hidden sm:block" />
            Kind support team is here to assist you.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-6 text-center sm:grid-cols-[auto_1fr_auto]">
            <div>
              <div className="font-bold text-[#05264E] text-[18px]">Email</div>
              <div className="text-[#4F5E64] text-[17px]">
                support@getkind.ph
              </div>
            </div>
            <div>
              <div className="font-bold text-[#05264E] text-[18px]">
                Office Hours
              </div>
              <div className="text-[#4F5E64] text-[17px]">
                Monday-Friday, 9:00 AM-5:00 PM (PH Time)
              </div>
            </div>
            <div>
              <div className="font-bold text-[#05264E] text-[18px]">Phone</div>
              <div className="text-[#4F5E64] text-[17px]">+123 456 78946</div>
            </div>
          </div>

          <p className="mt-7 text-[#66789C]">
            Please fill out the form below, and we will respond promptly.
          </p>

          <form className="mt-3 grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="text"
                name="firstName"
                placeholder="First Name*"
                className="h-11 rounded-md border border-[#A8A8A8] px-3 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30"
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name*"
                className="h-11 rounded-md border border-[#A8A8A8] px-3 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="email"
                name="email"
                placeholder="Email Address*"
                className="h-11 rounded-md border border-[#A8A8A8] px-3 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                className="h-11 rounded-md border border-[#A8A8A8] px-3 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30"
              />
            </div>

            <textarea
              name="message"
              rows={6}
              placeholder="How can we help you today?"
              className="rounded-md border border-[#A8A8A8] px-3 py-3 text-sm outline-none placeholder:text-[#808AA0] focus:ring-2 focus:ring-[#E11F26]/30"
            />

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#E11F26] px-6 py-4 font-semibold text-white shadow-sm"
                aria-label="Send message"
              >
                <FaRegEnvelope className="h-5 w-5" />
                Send message
              </button>

              <label className="flex items-start gap-2 text-xs text-[#6B7B8C]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded border-[#CBD5E1]"
                />
                <span>
                  By clicking &apos;Send Message&apos;, you agree to our{" "}
                  <Link href="/terms" className="underline text-[#0D2340]">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline text-[#0D2340]">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
