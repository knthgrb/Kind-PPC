"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import PerformanceTemplate from "./PerformanceTemplate";
import Reports from "./Reports";
import Card from "@/components/common/Card";
import Chip from "@/components/common/Chip";

export default function EmployeeProfileClient() {
  const { employee } = useParams<{ employee: string }>();
  console.log(employee);
  const employeeName = employee
    ? decodeURIComponent(employee)
    : "Unknown Employee";

  return (
    <main className="min-h-screen px-4 md:px-6 py-6 flex items-start justify-center">
      <div className="w-full max-w-6xl border border-[#E5E7EB] rounded-[30px] p-6 md:p-5 bg-white grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Personal Information */}
          <Card title="Personal Information">
            <div className="flex items-center gap-4 mt-6 ml-5">
              <div className="relative w-[196px]">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-[13px] font-semibold text-[#21C36D] leading-none">
                    90%
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute -inset-1 rounded-full ring-4 ring-[#21C36D]/30" />
                  <Image
                    src="/profile/profile_placeholder.png"
                    alt="Profile"
                    width={196}
                    height={196}
                    className="relative rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xl sm:text-[1.417rem] font-semibold text-[#222222] mt-1">
                  {employeeName}
                </div>
                <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                  example@gmail.com
                </div>
                <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                  +63 945 4856 456
                </div>
                <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                  Blk 12 Lot 8 Mabuhay St, Brgy <br />
                  San Isidro, Quezon City, Metro Manila, Philippines
                </div>
              </div>
            </div>
          </Card>

          {/* Work History */}
          <Card title="Work History">
            <ul className="space-y-2">
              <li className="rounded-xl bg-white p-3 border border-white">
                <div className="font-medium">Caregiver</div>
                <div className="mt-1 text-sm opacity-80">
                  St. Luke's Hospital
                </div>
                <div className="text-sm opacity-80">Jan 2020 – Dec 2023</div>
                <div className="mt-1 text-sm opacity-80">
                  Assisted elderly patients with daily activities and provided
                  support for medical staff.
                </div>
              </li>
            </ul>
          </Card>

          {/* Skills */}
          <Card title="Skills">
            <div className="flex flex-wrap gap-2">
              <Chip>Cooking</Chip>
              <Chip>Cleaning</Chip>
              <Chip>Driving</Chip>
            </div>
          </Card>

          {/* Availability */}
          <Card title="Availability">
            <div className="flex flex-wrap gap-2 mb-2">
              <Chip>Monday</Chip>
              <Chip>Friday</Chip>
              <Chip>Sunday</Chip>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip>Evening</Chip>
            </div>
          </Card>

          {/* Location Preference */}
          <Card title="Location Preference">
            <div className="flex flex-wrap gap-2">
              <Chip>Manila</Chip>
              <Chip>Ilagan</Chip>
            </div>
          </Card>

          {/* Job Preferences */}
          <Card title="Job Preferences">
            <div className="flex flex-wrap gap-2">
              <Chip>Helper</Chip>
              <Chip>Driver</Chip>
            </div>
          </Card>

          {/* Document Uploads */}
          <Card title="Document Uploads">
            <div className="flex flex-wrap items-center gap-3">
              <Image
                src="/profile/id_placeholder_one.png"
                alt="ID"
                width={110}
                height={72}
                className="rounded-xl border border-white object-cover"
              />
              <Image
                src="/profile/id_placeholder_two.png"
                alt="ID"
                width={110}
                height={72}
                className="rounded-xl border border-white object-cover"
              />
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-6 space-y-4">
          {/* Performance Templates */}
          <PerformanceTemplate />

          {/* Reports */}
          <Reports />
        </div>
      </div>
    </main>
  );
}
