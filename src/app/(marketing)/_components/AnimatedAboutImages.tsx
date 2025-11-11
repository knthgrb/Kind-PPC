"use client";

import Image from "next/image";
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

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
};

export function AnimatedAboutImages() {
  return (
    <div className="relative">
      {/* Main Image */}
      <motion.div
        variants={imageVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl"
      >
        <Image
          src="/aboutUs/missionVission.png"
          alt="Younger and older hands together"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
      </motion.div>

      {/* Floating Cards */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="absolute -top-4 -left-4 bg-white rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Verified</div>
            <div className="text-sm text-gray-600">Background Checked</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.6 }}
        className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-6 shadow-xl"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900">24/7</div>
            <div className="text-sm text-gray-600">Support</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

