"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaCoins, FaRocket, FaCheck } from "react-icons/fa";
import { BOOST_PACKAGES } from "@/constants/subscriptionPlans";
import { useToastActions } from "@/stores/useToastStore";

type CreditType = "swipe_credits" | "boost_credits";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditType: CreditType;
  currentCredits: number;
}

export default function CreditPurchaseModal({
  isOpen,
  onClose,
  creditType,
  currentCredits,
}: CreditPurchaseModalProps) {
  const [processingPackageId, setProcessingPackageId] = useState<string | null>(
    null
  );
  const { showError, showSuccess } = useToastActions();

  if (!isOpen) return null;

  const packages = BOOST_PACKAGES[creditType];
  const creditTypeLabel = creditType.replace("_", " ");

  const handlePurchase = async (packageId: string) => {
    setProcessingPackageId(packageId);

    try {
      const response = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          creditType,
        }),
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        // Redirect to Xendit payment page
        window.location.href = result.paymentUrl;
      } else {
        showError(result.error || "Failed to create payment link");
        setProcessingPackageId(null);
      }
    } catch (error: any) {
      showError(error.message || "An unexpected error occurred");
      setProcessingPackageId(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {creditType === "swipe_credits" ? (
              <FaCoins className="w-8 h-8 text-orange-500" />
            ) : (
              <FaRocket className="w-8 h-8 text-purple-500" />
            )}
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              Buy {creditTypeLabel}
            </h2>
          </div>
          <p className="text-gray-600">
            Swipes left: <span className="font-semibold">{currentCredits}</span>
          </p>
        </div>

        {/* Packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-lg flex flex-col ${
                pkg.id.includes("unlimited")
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-[#CC0000]"
              }`}
            >
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {pkg.name}
                </h3>
                <div className="mb-3">
                  <span className="text-3xl font-bold text-[#CC0000]">
                    ₱{pkg.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
              </div>

              <div className="space-y-2 mb-4 grow">
                <div className="flex items-center justify-center text-sm">
                  <FaCheck className="text-green-500 mr-2" />
                  <span className="text-gray-700">
                    {pkg.quantity === -1
                      ? "Unlimited"
                      : `${pkg.quantity} ${creditType.replace("_", " ")}`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={processingPackageId === pkg.id}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  pkg.id.includes("unlimited")
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-[#CC0000] text-white hover:bg-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processingPackageId === pkg.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  "Buy Now"
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Credits are added to your account immediately after successful
            payment. All payments are secure and powered by Xendit.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
