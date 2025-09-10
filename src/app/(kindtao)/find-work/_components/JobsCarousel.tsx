"use client";

import { useState, useRef, useEffect } from "react";
import JobCard from "@/components/jobs/JobCard";
import { JobPost } from "@/types/jobPosts";
import JobSearch, { Filters } from "@/components/jobs/JobSearch";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { JobService } from "@/services/JobService";

import "swiper/css";
import "swiper/css/navigation";

type Props = {
  jobs: JobPost[];
  locations: string[];
  jobTypes: string[];
  payTypes: string[];
  initialFilters?: Filters;
};

export default function JobsCarousel({
  jobs,
  locations,
  jobTypes,
  payTypes,
  initialFilters,
}: Props) {
  const [filters, setFilters] = useState<Filters>(
    initialFilters || {
      tags: [],
      location: "All",
      jobType: "All",
      payType: "All",
      keyword: "",
    }
  );

  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [items, setItems] = useState<JobPost[]>(jobs);
  const [offset, setOffset] = useState<number>(jobs.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 24;

  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const filteredJobs = items.filter((job) => {
    const text = `${job.title} ${job.description} ${job.job_type ?? ""} ${
      job.location
    } ${job.salary_min} ${job.salary_max} ${job.salary_rate}`.toLowerCase();

    return (
      filters.tags.every((tag) => text.includes(tag.toLowerCase())) &&
      (filters.location === "All" || job.location === filters.location) &&
      (filters.jobType === "All" || (job.job_type ?? "") === filters.jobType) &&
      (filters.payType === "All" || job.salary_rate === filters.payType)
    );
  });

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const more = await JobService.fetchJobsClient({
        location: filters.location,
        jobType: filters.jobType,
        payType: filters.payType as any,
        keyword: filters.keyword,
        tags: filters.tags,
        limit: PAGE_SIZE,
        offset,
      });
      if (more.length > 0) {
        setItems((prev) => [...prev, ...more]);
        setOffset((prev) => prev + more.length);
        // If we got fewer jobs than requested, we've reached the end
        if (more.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error("Failed to load more jobs", e);
    } finally {
      setLoadingMore(false);
    }
  };

  // reset items when filters change (skip first render to keep SSR items)
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoadingMore(true);
      try {
        const first = await JobService.fetchJobsClient({
          location: filters.location,
          jobType: filters.jobType,
          payType: filters.payType as any,
          keyword: filters.keyword,
          tags: filters.tags,
          limit: PAGE_SIZE,
          offset: 0,
        });
        if (!cancelled) {
          setItems(first);
          setOffset(first.length);
          setHasMore(first.length === PAGE_SIZE);
        }
      } finally {
        if (!cancelled) setLoadingMore(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    filters.location,
    filters.jobType,
    filters.payType,
    filters.keyword,
    filters.tags.join(","),
  ]);

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
            initialFilters={initialFilters}
          />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* No jobs found state */}
          {filteredJobs.length === 0 && !loadingMore && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or clear all filters.
              </p>
              <button
                onClick={() =>
                  setFilters({
                    tags: [],
                    location: "All",
                    jobType: "All",
                    payType: "All",
                    keyword: "",
                  })
                }
                className="px-4 py-2 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Carousel */}
          {filteredJobs.length > 0 && (
            <Swiper
              modules={[Navigation]}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={5}
              spaceBetween={0}
              loop={filteredJobs.length > 5}
              onReachEnd={hasMore ? loadMore : undefined}
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
                <SwiperSlide key={job.id}>
                  <JobCard job={job} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          {/* Custom Navigation Arrows */}
          {filteredJobs.length > 0 && (
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
          )}
        </div>
      </div>
    </section>
  );
}
