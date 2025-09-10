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
  pricingList,
  faqs,
} from "@/lib/marketing/homeData";
import { JobService } from "@/services/JobService";

export default async function Home() {
  const [{ locations, jobTypes, payTypes }, latestJobs] = await Promise.all([
    JobService.fetchJobFilterOptions(),
    JobService.fetchLatestJobs(8),
  ]);

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
          description={`Lorem Ipsum is simply dummy text of the printing and typesetting`}
          className="pt-30 bg-white"
        />

        <StepsCardGrid steps={howItWorksSteps} />

        <div className="bg-[#fcf7f7] py-15 my-15">
          <SectionHeader
            title="Find Your Perfect Match"
            description="Search and discover the right kindTao for your needs."
            className="bg-transparent"
          />

          <JobsGrid
            locations={locations}
            jobTypes={jobTypes}
            payTypes={payTypes}
            latestJobs={latestJobs}
          />
        </div>

        <SectionHeader
          title="Benefits"
          description={`Lorem Ipsum is simply dummy text of the printing and typesetting.`}
          className="pt-15 bg-white"
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          {benefitsList.map((benefit, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <div className="w-16 h-16 bg-[#CC0000] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">
                  {benefit.icon}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>

        <SectionHeader
          title="Pricing"
          description={`Choose the plan that works best for you`}
          className="pt-30 bg-white"
        />

        <PricingCard pricing={pricingList} />

        <SectionHeader
          title="Frequently Asked Questions"
          description={`Get answers to common questions about our platform`}
          className="pt-30 bg-white"
        />

        <FaqAccordion faq={faqs} />

        <Subscribe />
      </div>
    </div>
  );
}
