"use client";

import React, { useState } from "react";
import { LuFilter, LuSearch, LuCloudUpload } from "react-icons/lu";
import { pdfData } from "@/lib/kindBossing/data";

export default function Documents() {
  const [activeTab, setActiveTab] = useState("All");
  const filteredDocs =
    activeTab === "All"
      ? pdfData
      : pdfData.filter((doc) => doc.type === activeTab);

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
          <div className="w-full pt-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {["All", "Contracts", "PDF"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1 rounded-lg text-sm transition ${
                    activeTab === tab
                      ? "bg-red-600 text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredDocs.map((doc, i) => (
                <div
                  key={i}
                  className="rounded-4xl overflow-hidden shadow border border-gray-200 bg-white"
                >
                  {/* Image Section */}
                  <div className="relative">
                    <img
                      src="/documents/document.png"
                      alt="Document Preview"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60"></div>

                    <img
                      src="/icons/pdf.png"
                      alt="PDF Icon"
                      className="absolute top-4 left-2 w-7 h-7"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-xs text-red-500 mb-1">{doc.date}</p>
                    <h3 className="text-sm font-medium text-gray-800 mb-3">
                      {doc.name}
                    </h3>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button className="flex-1 rounded-lg bg-[#cb0000] text-white text-sm py-1.5 hover:bg-red-800">
                        Download
                      </button>
                      <button className="flex-1 rounded-lg bg-[#cb0000] text-white text-sm py-1.5 hover:bg-red-800">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
