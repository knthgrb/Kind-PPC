import React from "react";
import { HiOutlineUpload } from "react-icons/hi";

export default function VerifiedBadgeUpload() {
  return (
    <div className="px-4 sm:px-6 lg:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-3xl p-6 sm:p-8 bg-white">
        <h3 className="mb-4 text-[1.578rem] font-medium text-black text-center lg:text-left">
          Verified Badge
        </h3>
        <div className="w-full max-w-2xl mx-auto grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <p className="text-[0.934rem] text-[#12223B] font-medium text-center lg:text-left">
              Upload ID Proof
            </p>
            <div className="pt-4 flex justify-center lg:justify-start">
              <button className="rounded-lg flex items-center gap-2 border border-[#CB0000] bg-white p-6 lg:p-8 text-[0.801rem] text-[#CB0000] font-semibold hover:bg-gray-100">
                <HiOutlineUpload className="text-xl" />
                Upload Your ID
              </button>
            </div>
          </div>
          <div>
            <p className="text-[0.934rem] text-[#12223B] font-medium text-center lg:text-left">
              Upload Selfie
            </p>
            <div className="pt-4 flex justify-center lg:justify-start">
              <button className="rounded-lg flex items-center gap-2 border border-[#CB0000] bg-white p-6 lg:p-8 text-[0.801rem] text-[#CB0000] font-semibold hover:bg-gray-100">
                <HiOutlineUpload className="text-xl" />
                Upload Your Selfie
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
