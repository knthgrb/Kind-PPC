import React from "react";
import Link from "next/link";
import StatCard from "@/app/(admin)/_components/StatCard";
import { attendees, stats } from "@/lib/kindBossing/data";
import AttendeesTable from "./_components/AttendeesTable";

export default function MyDashboard() {
  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl space-y-8 border border-[#D9E0E8] rounded-2xl p-4 md:p-6 bg-white">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/platform-usage-pipeline">
            <div className="rounded-xl border border-[#D0D0D0] bg-white">
              <StatCard label="Total Employees" value={stats.totalEmployees} />
            </div>
          </Link>
          <Link href="/revenue">
            <div className="rounded-xl border border-[#D0D0D0] bg-white">
              <StatCard
                label="Total Hours Worked"
                value={`₱${stats.totalHours}`}
                unit="/hr"
              />
            </div>
          </Link>
          <Link href="/verified-badge">
            <div className="rounded-xl border border-[#D0D0D0] bg-white">
              <StatCard
                label="Pending Payslips"
                value={stats.pendingPayslips}
              />
            </div>
          </Link>
          <Link href="/support">
            <div className="rounded-xl border border-[#D0D0D0] bg-white">
              <StatCard
                label="Documents Uploaded"
                value={stats.documentsUploaded}
              />
            </div>
          </Link>
        </div>

        {/* Table */}
        <AttendeesTable attendees={attendees} />
      </div>
    </div>
  );
}
