"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const imageVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-6 sm:pt-10 w-full px-4 sm:px-0 max-w-7xl mx-auto my-20 sm:my-10">
      {/* Background Elements with Gradient */}
      {/* <div className="absolute inset-0 bg-linear-to-br from-red-50/30 via-transparent to-blue-50/20 -z-10"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-red-100/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl -z-10"></div> */}

      <div className="relative w-full flex flex-col sm:flex-row justify-between items-start">
        {/* Hero Text */}
        <div className="w-full sm:w-2/3 flex flex-col justify-start grow px-2 sm:px-4 text-center md:text-left max-w-2xl">
          <h1 className="text-[#05264E] leading-tight mb-3 sm:mb-4 md:max-w-[90%] text-4xl sm:text-5xl lg:text-6xl font-bold">
            Connecting{" "}
            <span
              className="text-transparent bg-clip-text bg-linear-to-r from-red-600 to-red-500"
              style={{ fontWeight: "bold" }}
            >
              kindBossing
            </span>{" "}
            with Trusted{" "}
            <span
              className="text-transparent bg-clip-text bg-linear-to-r from-red-600 to-red-500"
              style={{ fontWeight: "bold" }}
            >
              kindTaos
            </span>
          </h1>
          <p className="headingP mb-6 sm:mb-8 mt-2 sm:mt-4 md:max-w-[90%] text-lg sm:text-xl text-gray-600 leading-relaxed">
            Easily find verified yayas, caregivers, drivers, and household
            service providers near you. Safe, fast, and reliable hiring has
            never been simpler.
          </p>

          {/* CTA Buttons */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-4 w-full md:max-w-[90%]">
            <Link
              href="/recs"
              className="inline-flex items-center justify-center px-8 py-4 bg-linear-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
            >
              Find Help Now
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <Link
              href="/my-jobs"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-red-300 hover:text-red-600 bg-white hover:bg-white transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
            >
              Post a Job
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Right Image */}
        <div className="hidden md:block mt-6 sm:mt-0 relative w-full sm:w-1/2 px-4 ml-2">
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Image
              src="/homepage/hero-1.png"
              alt="Hero Right Image"
              width={378}
              height={335}
              className="object-cover w-[80%] h-auto"
            />
          </motion.div>
          <motion.div
            variants={imageVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="absolute top-1/2 right-4 translate-y-1/3 w-[60%]"
          >
            <Image
              src="/homepage/hero-2.png"
              alt="Hero Left Image"
              width={307}
              height={193.2}
              className="object-cover w-full h-auto"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
