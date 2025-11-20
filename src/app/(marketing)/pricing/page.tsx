"use client";

import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import SectionHeader from "@/app/(marketing)/_components/SectionHeading";
import PageAnimation, {
  AnimatedSection,
} from "@/app/(marketing)/_components/PageAnimation";
import { SUBSCRIPTION_PLANS } from "@/constants/subscriptionPlans";
import Link from "next/link";

export default function Pricing() {
  const [selectedRole, setSelectedRole] = useState<"kindbossing" | "kindtao">(
    "kindbossing"
  );

  // Get Basic and Premium plans for selected role
  const availablePlans = SUBSCRIPTION_PLANS.filter(
    (plan) =>
      plan.userRole === selectedRole &&
      (plan.tier === "basic" || plan.tier === "premium")
  );

  // Get simplified features for each plan
  const getPlanFeatures = (tier: string) => {
    if (tier === "basic") {
      return [
        "All features",
        "10 swipes per day",
        "5 matches per week",
        "5 boost credits per month",
      ];
    } else if (tier === "premium") {
      return [
        "All features",
        "Unlimited swipes per day",
        "Unlimited matches",
        "10 boost credits per month",
      ];
    }
    return [];
  };

  return (
    <PageAnimation>
      <div className="px-4 lg:px-0 max-w-7xl mx-auto">
        <AnimatedSection>
          <SectionHeader
            title="Pricing"
            description={`Choose the plan that's right for your needs.`}
            className="pt-10 bg-white"
          />
        </AnimatedSection>

        {/* Role Toggle */}
        <AnimatedSection>
          <div className="flex justify-center mb-12">
            <div className="relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1">
              <button
                onClick={() => setSelectedRole("kindbossing")}
                className={`relative cursor-pointer px-6 py-2.5 text-sm font-medium transition-all duration-300 rounded-full ${
                  selectedRole === "kindbossing"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                For kindBossing
              </button>
              <button
                onClick={() => setSelectedRole("kindtao")}
                className={`relative cursor-pointer px-6 py-2.5 text-sm font-medium transition-all duration-300 rounded-full ${
                  selectedRole === "kindtao"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                For kindTao
              </button>
            </div>
          </div>
        </AnimatedSection>

        {/* Pricing Cards */}
        <AnimatedSection>
          <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto pb-16">
            {availablePlans.map((plan) => {
              const isPremium = plan.tier === "premium";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border-2 p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 w-full sm:w-80 flex flex-col ${
                    isPremium
                      ? "border-[#CC0000] bg-white"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {isPremium && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#CC0000] text-white px-4 py-1 rounded-full text-sm font-medium">
                        Best Value
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-[#12223B] mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-3">
                      <span className="text-4xl font-bold text-[#CC0000]">
                        ₱{plan.priceMonthly.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">/month</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {plan.description}
                    </p>
                  </div>

                  <div className="space-y-3 mb-8 grow">
                    {getPlanFeatures(plan.tier).map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-start gap-3"
                      >
                        <FaCheck className="text-green-500 text-sm mt-0.5 shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-auto">
                    <Link
                      href="/signup"
                      className={`block w-full cursor-pointer py-3 px-4 rounded-lg font-medium transition-colors ${
                        isPremium
                          ? "bg-[#CC0000] text-white hover:bg-red-700"
                          : "bg-white text-[#CC0000] border-2 border-[#CC0000] hover:bg-[#CC0000] hover:text-white"
                      }`}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      </div>
    </PageAnimation>
  );
}
