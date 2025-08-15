import Image from "next/image";
import Hero from "@/app/(marketing)/_components/Hero";
import FaqAccordion from "@/app/(marketing)/_components/FaqAccordion";
import Subscribe from "@/app/(marketing)/_components/Subscribe";
import Footer from "@/app/(marketing)/_components/Footer";
import SectionHeader from "@/app/(marketing)/_components/SectionHeading";
import PricingCard from "@/app/(marketing)/_components/PricingCard";

export default function Pricing() {
  const faqs = [
    {
      title: "What is Kind and how does it work?",
      description:
        "Kind is the Philippines' trusted online marketplace connecting kindBossing with verifiedkindTao. Simply create a profile, browse verified kindTao or job postings, and hire or gethiredquickly and safely. Kind is the Philippines' trusted online marketplace connecting kindBossing with verifiedkindTao. Simply create a profile, browse verified kindTao or job postings, and hire or gethiredquickly and safely.",
    },
    {
      title: "Is there a fee to join Kind?",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    {
      title: "How do I know if someone is verified?",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    {
      title: "Can I communicate with kindTao before hiring?",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
    {
      title: "What kind of jobs are available on Kind?",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
  ];

  const pricingList = [
    {
      tier: "Basic",
      price: 149,
      description: "Ideal for quick, one-time hiring needs.",
      features: [
        "Unlock up to 3 detailed kindTao profiles",
        "Access valid for 14 days",
        "Basic customer support",
        "Secure in-platform messaging",
        "Barangay verification included",
      ],
    },
    {
      tier: "Standard",
      price: 299,
      description: "Perfect for regular household hiring.",
      features: [
        "Unlimited access to verified kindTao profiles",
        "Unlimited job postings",
        "Direct messaging with kindTao",
        "Comprehensive background checks",
        "Priority customer support",
        "HR management tools (payroll & compliance)",
      ],
    },
    {
      tier: "Enterprise",
      price: 3999,
      description:
        "Ideal for businesses, clinics, care facilities, and high-volume hiring needs.",
      features: [
        "All features from Standard",
        "Dedicated concierge matching service",
        "Advanced HR & compliance tools",
        "Personalized onboarding assistance",
        "Priority account management",
        "Exclusive enterprise dashboard",
      ],
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Pricing"
        description={`Choose the plan that's right for your household needs.`}
        className="pt-10 bg-white"
      />

      <div className="space-y-30">
        <PricingCard pricing={pricingList} />
        <FaqAccordion faq={faqs} />
      </div>

      <Subscribe />
    </div>
  );
}
