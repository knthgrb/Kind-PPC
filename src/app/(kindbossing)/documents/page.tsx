import React from "react";
import { LuFilter, LuSearch, LuCloudUpload } from "react-icons/lu";
import { pdfData } from "@/lib/kindBossing/data";
import Document from "./_components/Document";

export default function Documents() {
  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-4xl p-4 md:p-6 bg-white">
        <div className="border border-[#D9E0E8] rounded-3xl p-6 md:p-8 bg-white">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-[1.578rem] font-medium">Documents</h1>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-7 md:gap-11 w-full md:w-auto">
              <button className="mt-2 md:mt-0 w-full md:w-auto flex items-center justify-center px-6 py-2 bg-[#CC0000] hover:bg-red-800 text-sm text-white rounded-lg gap-2">
                <LuCloudUpload className="text-xl" />
                <span>Upload</span>
                <span className="text-xs">(Word, PPT & PDF only)</span>
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-400 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 w-full md:w-auto">
                <LuFilter className="text-base" />
                <span>Filter</span>
              </button>

              <label className="relative w-full md:w-52">
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                />
              </label>
            </div>
          </div>

          {/* Documents */}
          <Document pdfData={pdfData} />
        </div>
      </div>
    </div>
  );
}
