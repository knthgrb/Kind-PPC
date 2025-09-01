"use client";

import React, { useState } from "react";
import ToggleButton from "./_components/toggleButton";

export default function Notifications() {
  const [pushToggled, setPushToggled] = useState(true);
  const [emailToggled, setEmailToggled] = useState(false);

  return (
    <div className="px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-3xl p-8 bg-white">
        <h3 className="mb-4 text-[1.578rem] font-medium text-black">
          Notifications
        </h3>
        <div className="max-w-5xl grid grid-cols-1 gap-20 lg:grid-cols-2">
          <div className="flex justify-between py-10">
            <p className="text-[0.934rem] text-[#12223B] !font-medium">
              Push Notifications
            </p>
            <ToggleButton toggled={pushToggled} onToggle={setPushToggled} />
          </div>
          <div className="flex justify-between py-10">
            <p className="text-[0.934rem] text-[#12223B] !font-medium">
              Email Notifications
            </p>
            <ToggleButton toggled={emailToggled} onToggle={setEmailToggled} />
          </div>
        </div>
      </div>
    </div>
  );
}
