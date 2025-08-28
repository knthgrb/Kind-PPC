import FaqAccordion from "@/app/(marketing)/_components/FaqAccordion";
import Subscribe from "@/app/(marketing)/_components/Subscribe";
import SectionHeader from "@/app/(marketing)/_components/SectionHeading";
import PricingCard from "@/app/(marketing)/_components/PricingCard";
import { pricingList, faqs } from "@/lib/marketing/homeData";

export default function Pricing() {
  return (
    <div className="px-4 lg:px-0">
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
