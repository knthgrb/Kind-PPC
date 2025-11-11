"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StepsCardGrid from "@/app/(marketing)/_components/StepsCardGrid";
import SegmentedToggle from "@/app/(marketing)/_components/SegmentedToggle";
import {
  howItWorksStepsKindTao,
  howItWorksStepsKindBossing,
} from "@/lib/marketing/homeData";

export default function HowItWorks() {
  const [selectedRole, setSelectedRole] = useState<"kindtao" | "kindbossing">(
    "kindtao"
  );

  const steps =
    selectedRole === "kindtao"
      ? howItWorksStepsKindTao
      : howItWorksStepsKindBossing;

  const description =
    selectedRole === "kindtao"
      ? "Find work opportunities in three simple steps. Create your profile, browse personalized job matches, and get hired by kindBossing who need your skills."
      : "Hire skilled workers in three simple steps. Post jobs, review applications from qualified kindTao, and hire the perfect match for your needs.";

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8 lg:mb-12">
          <div className="mb-8 lg:mb-0 max-w-3xl mx-auto">
            <h2 className="sectionH2 mb-4">How it Works</h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={selectedRole}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="sectionP mt-2 sm:mt-4"
              >
                {description}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex justify-center mt-6 lg:mt-4">
            <SegmentedToggle
              options={[
                { label: "For kindTao", value: "kindtao" },
                { label: "For kindBossing", value: "kindbossing" },
              ]}
              selected={selectedRole}
              onSelect={(value) =>
                setSelectedRole(value as "kindtao" | "kindbossing")
              }
            />
          </div>
        </div>

        {/* Steps Grid with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRole}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex justify-center"
          >
            <div className="w-full max-w-6xl">
              <StepsCardGrid steps={steps} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
