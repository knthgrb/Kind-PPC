import Image from "next/image";
import Hero from "../components/Hero";
import BrowseCategories from "../components/BrowseCategories";
import SectionHeader from "../components/SectionHeading";
import StepsCardGrid from '../components/StepsCardGrid';
import LatestJobsSearch from "../components/LatestJobsSearch";
import PricingCard from '../components/PricingCard';
import FaqAccordion from '../components/FaqAccordion';
import Subscribe from "@/components/Subscribe";
import Footer from "@/components/Footer";
import { FaArrowRight } from "react-icons/fa6";


export default function Home() {
  // Define categories in the Home page
  const categories = [
    { name: 'Yayas', image: '/homepage/yayas.png', description: 'Reliable childcare anytime you need' },
    { name: 'Helpers', image: '/homepage/helpers.png', description: 'Professional cleaning and housekeeping' },
    { name: 'Caregivers', image: '/homepage/caregivers.png', description: 'Compassionate caregivers for seniors' },
    { name: 'Helpers', image: '/homepage/helpersEquipment.png', description: 'Skilled Home and Office Helpers' },
    { name: 'Skilled Labor', image: '/homepage/skilledLabor.png', description: 'Skilled help for home repairs and maintenance' },
    { name: 'Drivers', image: '/homepage/drivers.png', description: 'Reliable transportation support for your family' },
  ];
  const howItWorksSteps = [
    {
      icon: '/homepage/how_it_works_profile.png',
      title: 'Create Your Profile',
      description:
        "Whether you're here to find a job or post one, start by setting up your profile. Showcase your skills or describe your hiring needs in minutes.",
    },
    {
      icon: '/homepage/how_it_works_connect.png',
      title: 'Connect & Search',
      description:
        'Job seekers can explore jobs and apply instantly. Employers can browse verified profiles and connect with the right candidates effortlessly.',
    },
    {
      icon: '/homepage/how_it_works_hire.png',
      title: 'Hire or Get Hired',
      description:
        'Apply with one click or review top applicants — the entire hiring process is quick, transparent, and stress-free.',
    },
  ];

  const benefitsList = [
    {
      icon: '/homepage/one.png',
      title: 'More Jobs, Faster Hiring',
      description:
        'Connect instantly with kindBossing seeking your skills.'
    },
    {
      icon: '/homepage/two.png',
      title: 'Smart, Verified Hiring',
      description:
        'Use built-in tools, trust verified profiles, and stay compliant.'
    },
    {
      icon: '/homepage/three.png',
      title: 'Flexible & Secure Work',
      description:
        'Set your schedule and rely on government-verified hiring.'
    },
  ];

  const locations = ["All", "Cebu City", "Talisay City", "Naga City", "Minglanilla"];
  const jobTypes = ["All", "Maid for Home", "Developer", "Graphic Designer"];
  const payTypes = ["All", "Fixed"]
  
  const latestJobs = [
    { name: 'Jarrel Steward', 
      image: '/homepage/darrellSteward.png', 
      location: 'Cebu City', 
      occupation: 'Maid for Home', 
      price: 550 },
    { name: 'Ralph Edwards', 
      image: '/homepage/ralphEdwards.png', 
      location: 'Cebu City', 
      occupation: 'Developer', 
      price: 550 },
    { name: 'Esther Howard', 
      image: '/homepage/estherHoward.png', 
      location: 'Talisay City', 
      occupation: 'Graphic Designer', 
      price: 550 },
    { name: 'Theresa Webb', 
      image: '/homepage/theresaWebb.png', 
      location: 'Talisay City', 
      occupation: 'Maid for Home', 
      price: 550 },
    { name: 'Devon Lane', 
      image: '/homepage/devonLane.png', 
      location: 'Naga City', 
      occupation: 'Developer', 
      price: 550 },
    { name: 'Kristin Watson', 
      image: '/homepage/kristinWatson.png', 
      location: 'Naga City', 
      occupation: 'Graphic Designer', 
      price: 550 },
    { name: 'Dianne Russell', 
      image: '/homepage/dianneRussell.png', 
      location: 'Minglanilla', 
      occupation: 'Maid for Home', 
      price: 550 },
    { name: 'Jane Cooper', 
      image: '/homepage/janeCooper.png', 
      location: 'Minglanilla', 
      occupation: 'Developer', 
      price: 550 },
  ];

  const pricingList = [
    {
      tier: 'Basic',
      price: 19,
      description: 'Ideal for occasional hiring needs.',
      features: [
        'Unlimited job posts',
        'Standard access to verified profile',
        'Basic messaging features',
        'Customer support'
      ]
    },
    {
      tier: 'Standard',
      price: 29,
      description: 'Perfect for active households.',
      features: [
        'Everything in Basic, plus',
        'Unlimited direct messaging',
        'Custom hiring tools',
        'Background check access',
        'Priority support'
      ]
    },
    {
      tier: 'Enterprise',
      price: 49,
      description: 'Best for clinics, care homes, and high-volume hiring.',
      features: [
        'Everything in Standard, plus',
        'Concierge matching service',
        'Custom onboarding assistance',
        'Corporate compliance features',
        'Dedicated account manager'
      ]
    },
  ];

  const faqs = [
    {
      title: 'What is Kind and how does it work?',
      description: 'Kind is the Philippines\' trusted online marketplace connecting kindBossing with verifiedkindTao. Simply create a profile, browse verified kindTao or job postings, and hire or gethiredquickly and safely. Kind is the Philippines\' trusted online marketplace connecting kindBossing with verifiedkindTao. Simply create a profile, browse verified kindTao or job postings, and hire or gethiredquickly and safely.'
    },
    {
      title: 'Is there a fee to join Kind?',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
    {
      title: 'How do I know if someone is verified?',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
    {
      title: 'Can I communicate with kindTao before hiring?',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
    {
      title: 'What kind of jobs are available on Kind?',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    },
  ];

  return (
    <div>
      <Hero />

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

      <SectionHeader
        title="Latest Jobs"
        description={`Explore the newest job listings from trusted kindBossing.`}
        className="pt-30 bg-white"
      />

      <LatestJobsSearch
        latestJobs={latestJobs}
        locations={locations}
        jobTypes={jobTypes}
        payTypes={payTypes}
      />

      <div className="flex justify-center w-full my-8">
        <button className="py-3 px-8 bg-white text-[#CC0000] border-2 border-[#CC0000] rounded-lg text-lg hover:bg-[#CC0000] hover:text-white w-full sm:w-auto">
          <span className="flex items-center gap-2 text-sm">View All<FaArrowRight /></span>
        </button>
      </div>

      <SectionHeader
        title="Benefits"
        description={`Lorem Ipsum is simply dummy text of the printing and typesetting.`}
        className="pt-30 bg-white"
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

      <Footer />
    </div>
  );
}
