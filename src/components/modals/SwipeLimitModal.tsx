"use client";

import { useState } from "react";
import { FaTimes, FaClock, FaCrown, FaGift, FaCoins } from "react-icons/fa";
import SubscriptionModal from "./SubscriptionModal";
import CreditPurchaseModal from "./CreditPurchaseModal";

type SwipeLimitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  remainingSwipes: number;
  dailyLimit: number;
  onUpgrade?: () => void;
  userRole?: "kindbossing" | "kindtao";
};

export default function SwipeLimitModal({
  isOpen,
  onClose,
  remainingSwipes,
  dailyLimit,
  onUpgrade,
  userRole = "kindtao",
}: SwipeLimitModalProps) {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);

  const handleUpgrade = () => {
    setShowPricingModal(true);
    if (onUpgrade) {
      onUpgrade();
    }
  };

  const handlePricingModalClose = () => {
    setShowPricingModal(false);
    // Also close the swipe limit modal when pricing modal is closed
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <FaClock className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Daily Swipe Limit Reached
          </h2>
          <p className="text-gray-600 mb-6">
            {dailyLimit >= 999999
              ? "You have unlimited swipes available!"
              : `You've used all ${dailyLimit} of your daily swipes. Upgrade to get unlimited swipes!`}
          </p>

          {/* Swipe counter */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Swipes used today:</span>
              <span className="font-semibold text-gray-900">
                {dailyLimit >= 999999
                  ? "Unlimited"
                  : `${dailyLimit - remainingSwipes} / ${dailyLimit}`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width:
                    dailyLimit >= 999999
                      ? "0%"
                      : `${
                          ((dailyLimit - remainingSwipes) / dailyLimit) * 100
                        }%`,
                }}
              />
            </div>
          </div>

          {/* Benefits of upgrading */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <FaCrown className="w-4 h-4 mr-2" />
              Why Upgrade?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Get daily swipe credits
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Get monthly boost credits
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Priority in search results
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Access to non-free features
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Cancel anytime
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => setShowCreditPurchaseModal(true)}
              className="w-full cursor-pointer bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
            >
              <FaCoins className="w-4 h-4" />
              <span>Buy Swipe Credits</span>
            </button>

            <button
              onClick={handleUpgrade}
              className="w-full cursor-pointer bg-gradient-to-r from-[#CC0000] to-red-600 text-white py-3 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
            >
              <span>Subscribe to a Plan</span>
            </button>

            <button
              onClick={onClose}
              className="w-full cursor-pointer bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Additional info */}
          <p className="text-xs text-gray-500 mt-4">
            Your daily swipe limit resets at midnight
          </p>
        </div>
      </div>

      {/* Swipe Subscription Pricing Modal */}
      <SubscriptionModal
        isOpen={showPricingModal}
        onClose={handlePricingModalClose}
        userRole={userRole}
      />

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditPurchaseModal}
        onClose={() => {
          setShowCreditPurchaseModal(false);
          onClose();
        }}
        creditType="swipe_credits"
        currentCredits={remainingSwipes}
      />
    </div>
  );
}
