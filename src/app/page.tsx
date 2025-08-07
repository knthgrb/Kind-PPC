import Image from "next/image";
import Hero from "../components/Hero";
import BrowseCategories from "../components/BrowseCategories";
import SectionHeader from "../components/SectionHeading";
import StepsCardGrid from '../components/StepsCardGrid';

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
    </div>
  );
}
