"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type StepCard = {
  icon: string; // relative path to image in /public
  title: string;
  description: string;
};

type StepsCardGridProps = {
  steps: StepCard[];
  className?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
};

export default function StepsCardGrid({
  steps,
  className = "",
}: StepsCardGridProps) {
  return (
    <section className={`bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#C60000] flex items-center justify-center mb-6 shrink-0">
                <div className="w-8 h-8 relative">
                  <Image
                    src={step.icon}
                    alt={step.title}
                    fill
                    className="object-contain"
                    sizes="32px"
                  />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-[#05264E] mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-base">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
