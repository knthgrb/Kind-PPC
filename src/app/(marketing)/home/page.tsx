import Hero from "../_components/Hero";
import SectionHeader from "../_components/SectionHeading";
import BrowseCategories from "../_components/BrowseCategories";
import StepsCardGrid from "../_components/StepsCardGrid";
import PricingCard from "../_components/PricingCard";
import FaqAccordion from "../_components/FaqAccordion";
import Subscribe from "../_components/Subscribe";
import JobsGrid from "./_components/JobsGrid";
import {
  categories,
  howItWorksSteps,
  benefitsList,
  locations,
  jobTypes,
  payTypes,
  latestJobs,
  pricingList,
  faqs,
} from "@/lib/marketing/homeData";
export default function Home() {
  return (
    <div>
      <Hero />
      <div className="px-4 lg:px-0">
        <SectionHeader
          title="Browse by Category"
          description={`Find exactly the help you're looking for. Hundreds of<br/> new jobs and kindTao available everyday.`}
          className="pt-30 bg-white"
        />

        {/* Pass categories to BrowseCategories */}
        <BrowseCategories categories={categories} />

        <SectionHeader
          title="How it Works"
          description={`Lorem Ipsum is simply dummy text of the printing and typesetting`}
          className="pt-30 bg-white"
        />

        <StepsCardGrid steps={howItWorksSteps} />

        <div className="bg-[#fcf7f7] py-15 my-15">
          <SectionHeader
            title="Latest Jobs"
            description="Explore the newest job listings from trusted kindBossing."
            className="bg-transparent"
          />

          <JobsGrid
            latestJobs={latestJobs}
            locations={locations}
            jobTypes={jobTypes}
            payTypes={payTypes}
          />
        </div>

        <SectionHeader
          title="Benefits"
          description={`Lorem Ipsum is simply dummy text of the printing and typesetting.`}
          className="pt-15 bg-white"
        />

        <StepsCardGrid steps={benefitsList} />

        <SectionHeader
          title="Pricing"
          description={`Choose the plan that's right for your household needs.`}
          className="pt-30 bg-white"
        />

        <PricingCard pricing={pricingList} />

        <SectionHeader
          title="FAQ's"
          description={`Lorem Ipsum is simply dummy text of the printing and typesetting.`}
          className="pt-30 bg-white"
        />

        <FaqAccordion faq={faqs} />

        <Subscribe />
      </div>
    </div>
  );
}
