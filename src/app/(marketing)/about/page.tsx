import Image from "next/image";
import Link from "next/link";
import FaqAccordion from "@/app/(marketing)/_components/FaqAccordion";
import Subscribe from "@/app/(marketing)/_components/Subscribe";
import Footer from "@/app/(marketing)/_components/Footer";
import SectionHeader from "@/app/(marketing)/_components/SectionHeading";
import { faqs } from "@/lib/marketing/homeData";
export default function About() {
  return (
    <div className="px-4 lg:px-0">
      <p
        className={`aboutSubtitle mx-auto max-w-7xl px-6 pt-10 text-center md:text-left`}
      >
        About Us
      </p>

      {/* About Section */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-6 grid gap-10 md:grid-cols-[1.1fr_1fr] sm:items-center md:items-start">
          <div className="text-center md:text-left">
            <h1 className={`aboutTitle text-[#05264e]`}>
              Find the{" "}
              <span className={`aboutTitle text-[#CC0000]`}>Perfect</span> Match
              <br /> for Your Household
            </h1>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
              <Link
                href="/jobs"
                className={`aboutP text-white rounded-[10px] bg-[#E11F26] px-6 py-4 w-full sm:w-auto text-center`}
              >
                Search Jobs
              </Link>
              <Link
                href="/about-us/learn-more"
                className={`aboutP text-[#05264e] underline`}
              >
                Learn More
              </Link>
            </div>
          </div>

          <div
            className={`aboutP text-[#05264e] px-2 md:px-0 lg:px-7 text-center md:text-left self-center`}
          >
            <p className="mb-5">
              At Kind, we connect kindBossing like you with reliable, verified
              kindTao for all your household needs—yayas, caregivers, helpers,
              drivers, and skilled labor. Our rigorous verification process
              ensures your family receives trustworthy and professional care
              everytime
            </p>
            <p>
              At Kind, we connect kindBossing like you with reliable, verified
              kindTao for all your household needs—yayas, caregivers, helpers,
              drivers, and skilled labor. Our rigorous verification process
              ensures your family .
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission" className="pb-20">
        <div className="mx-auto max-w-7xl px-6 grid gap-10 md:grid-cols-[1fr_1.3fr] items-center">
          <div className="order-2 md:order-1 text-center md:text-left">
            <h2 className={`aboutSubtitle mb-3`}>Our Mission &amp; Vision</h2>
            <div className={`aboutP text-[#05264e]`}>
              <p className="mb-5">
                At Kind, our mission is clear: to transform household employment
                in the Philippines by creating a safe, transparent, and
                respectful marketplace that benefits both families (kindBossing)
                and service providers (kindTao).
              </p>
              <p>
                We envision building a community grounded in mutual trust,
                kindness, and fair employment practices. By simplifying the
                process of hiring household help, we strive to foster positive
                relationships, empower workers, and provide peace of mind to
                every family we serve.
              </p>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
              <Link
                href="/find-help"
                className={`aboutP text-white rounded-[10px] bg-[#E11F26] px-6 py-4 w-full sm:w-auto text-center`}
              >
                Find Help Now
              </Link>
              <Link
                href="/about-us/mission-vision"
                className={`aboutP text-[#05264e] underline`}
              >
                Learn More
              </Link>
            </div>
          </div>

          <div
            className="
              relative order-1 lg:order-2 
              w-full h-[200px] lg:w-[565px] lg:h-[460px] 
              rounded-2xl overflow-hidden 
              justify-self-center lg:justify-self-end
            "
          >
            <Image
              src="/aboutUs/missionVission.png"
              alt="Younger and older hands together"
              fill
              sizes="(min-width: 900px) 505px, 100vw"
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
      </section>

      <SectionHeader
        title="FAQ's"
        description={`Lorem Ipsum is simply dummy text of the printing and typesetting.`}
        className="pt-5 bg-white"
      />
      <FaqAccordion faq={faqs} />

      <Subscribe />

      <Footer />
    </div>
  );
}
