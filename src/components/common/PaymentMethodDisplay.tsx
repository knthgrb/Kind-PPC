import React from "react";
import {
  PHILIPPINE_PAYMENT_METHODS,
  PAYMENT_METHOD_DISPLAY_NAMES,
  PAYMENT_METHOD_ICONS,
} from "@/constants/paymentMethods";

interface PaymentMethodDisplayProps {
  className?: string;
  showIcons?: boolean;
  showAll?: boolean;
}

export default function PaymentMethodDisplay({
  className = "",
  showIcons = true,
  showAll = false,
}: PaymentMethodDisplayProps) {
  const methods = showAll
    ? PHILIPPINE_PAYMENT_METHODS
    : (["CREDIT_CARD", "DEBIT_CARD", "GCASH"] as const);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {methods.map((method) => (
        <div
          key={method}
          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-xl text-sm"
        >
          {showIcons && (
            <span className="text-sm">{PAYMENT_METHOD_ICONS[method]}</span>
          )}
          <span className="text-gray-700">
            {PAYMENT_METHOD_DISPLAY_NAMES[method]}
          </span>
        </div>
      ))}
    </div>
  );
}
