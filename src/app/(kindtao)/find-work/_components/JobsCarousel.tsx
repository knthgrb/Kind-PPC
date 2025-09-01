"use client";

import { useState, useRef, useEffect } from "react";
import JobCard, { Job } from "@/components/jobsearch/JobCard";
import JobSearch, { Filters } from "@/components/jobsearch/JobSearch";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

import "swiper/css";
import "swiper/css/navigation";

type Props = {
  jobs: Job[];
  locations: string[];
  jobTypes: string[];
  payTypes: string[];
};

export default function JobsCarousel({
  jobs,
  locations,
  jobTypes,
  payTypes,
}: Props) {
  const [filters, setFilters] = useState<Filters>({
    tags: [],
    location: "All",
    jobType: "All",
    payType: "All",
    keyword: "",
  });

  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const filteredJobs = jobs.filter((job) => {
    const text =
      `${job.name} ${job.occupation} ${job.location} ${job.price}`.toLowerCase();

    return (
      filters.tags.every((tag) => text.includes(tag.toLowerCase())) &&
      (filters.location === "All" || job.location === filters.location) &&
      (filters.jobType === "All" || job.occupation === filters.jobType) &&
      (filters.payType === "All" || filters.payType === "Fixed") // placeholder
    );
  });

  // re-init navigation once swiper + refs are ready
  useEffect(() => {
    if (swiperInstance && prevRef.current && nextRef.current) {
      swiperInstance.params.navigation.prevEl = prevRef.current;
      swiperInstance.params.navigation.nextEl = nextRef.current;

      swiperInstance.navigation.destroy();
      swiperInstance.navigation.init();
      swiperInstance.navigation.update();
    }
  }, [swiperInstance, prevRef.current, nextRef.current]);

  return (
    <section className="px-4">
      <div>
        {/* Search */}
        <div className="max-w-6xl mx-auto pb-10">
          <JobSearch
            locations={locations}
            jobTypes={jobTypes}
            payTypes={payTypes}
            onSearch={setFilters}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Carousel */}
          <Swiper
            modules={[Navigation]}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={5}
            spaceBetween={0}
            loop={filteredJobs.length > 5}
            breakpoints={{
              0: {
                slidesPerView: 1,
                spaceBetween: 0,
                loop: filteredJobs.length > 1,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 0,
                loop: filteredJobs.length > 3,
              },
              1300: {
                slidesPerView: 5,
                spaceBetween: 0,
                loop: filteredJobs.length > 5,
              },
            }}
            onSwiper={(swiper) => setSwiperInstance(swiper)}
            className="mySwiper overflow-visible"
          >
            {filteredJobs.map((job) => (
              <SwiperSlide key={job.name}>
                <JobCard job={job} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Arrows */}
          <div className="flex justify-center items-center gap-8 mt-4">
            <button
              ref={prevRef}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              ref={nextRef}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
