"use client";

import React, { useState } from "react";
import { PaymentFormData, PaymentPlan } from "@/types/payment";
import { useAuthStore } from "@/stores/useAuthStore";

interface PaymentFormProps {
  plan: PaymentPlan;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export default function PaymentForm({
  plan,
  onSuccess,
  onError,
  onCancel,
}: PaymentFormProps) {
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    paymentMethod: "card",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvc: "",
    cardholderName: "",
    email: user?.email || "",
    phone: "",
    gcashNumber: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      cardNumber: formatted,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onError("User not authenticated");
      return;
    }

    setIsProcessing(true);
    try {
      // const result = await processPayment(plan, formData, user.id);
      // if (result.success && result.redirectUrl) {
      //   // Redirect to PayMongo payment page
      //   window.location.href = result.redirectUrl;
      // } else {
      //   onError(result.error || "Payment processing failed");
      // }
    } catch (error: any) {
      onError(error.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormValid = () => {
    if (formData.paymentMethod === "card") {
      return (
        formData.cardNumber.replace(/\s/g, "").length >= 13 &&
        formData.expiryMonth &&
        formData.expiryYear &&
        formData.cvc.length >= 3 &&
        formData.cardholderName.trim() &&
        formData.email.trim()
      );
    } else if (formData.paymentMethod === "gcash") {
      return (
        formData.gcashNumber &&
        formData.gcashNumber.replace(/\s/g, "").length >= 11 &&
        formData.cardholderName.trim() &&
        formData.email.trim()
      );
    }
    return false;
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#12223B] mb-2">
          Complete Your Payment
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">{plan.name} Plan</span>
            <span className="text-lg font-bold text-[#CC0000]">
              ₱{plan.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, paymentMethod: "card" }))
              }
              className={`p-3 border rounded-lg text-center transition-colors ${
                formData.paymentMethod === "card"
                  ? "border-[#CC0000] bg-red-50 text-[#CC0000]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              💳 Credit/Debit Card
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, paymentMethod: "gcash" }))
              }
              className={`p-3 border rounded-lg text-center transition-colors ${
                formData.paymentMethod === "gcash"
                  ? "border-[#CC0000] bg-red-50 text-[#CC0000]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              📱 GCash
            </button>
          </div>
        </div>

        {/* Card Payment Fields */}
        {formData.paymentMethod === "card" && (
          <>
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                maxLength={19}
                required
              />
            </div>

            {/* Expiry and CVC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Month
                </label>
                <select
                  name="expiryMonth"
                  value={formData.expiryMonth}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiryMonth: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                  required
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Year
                </label>
                <select
                  name="expiryYear"
                  value={formData.expiryYear}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiryYear: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                  required
                >
                  <option value="">Year</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* CVC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVC
              </label>
              <input
                type="text"
                name="cvc"
                value={formData.cvc}
                onChange={handleInputChange}
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                maxLength={4}
                required
              />
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                required
              />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+63 912 345 6789"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
              />
            </div>
          </>
        )}

        {/* GCash Payment Fields */}
        {formData.paymentMethod === "gcash" && (
          <>
            {/* GCash Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GCash Mobile Number
              </label>
              <input
                type="tel"
                name="gcashNumber"
                value={formData.gcashNumber}
                onChange={handleInputChange}
                placeholder="0912 345 6789"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                required
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                required
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid() || isProcessing}
            className="flex-1 cursor-pointer px-4 py-2 bg-[#CC0000] text-white rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing
              ? "Processing..."
              : `Pay ₱${plan.price.toLocaleString()}`}
          </button>
        </div>
      </form>
    </div>
  );
}
