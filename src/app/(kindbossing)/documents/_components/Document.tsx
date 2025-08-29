"use client";

import React, { useState } from "react";

interface pdfData {
  date: string;
  name: string;
  type: string;
}

interface DocumentsProps {
  pdfData: pdfData[];
}

export default function Documents({ pdfData }: DocumentsProps) {
  const [activeTab, setActiveTab] = useState("All");

  const filteredDocs =
    activeTab === "All"
      ? pdfData
      : pdfData.filter((doc) => doc.type === activeTab);

  return (
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

            <div className="p-4">
              <p className="text-xs text-red-500 mb-1">{doc.date}</p>
              <h3 className="text-sm font-medium text-gray-800 mb-3">
                {doc.name}
              </h3>

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
  );
}
