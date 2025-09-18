import React from "react";
import StatCard from "../_components/StatCard";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { GoTriangleUp } from "react-icons/go";
import Link from "next/link";
import MonthlyRevenueLineChart from "../_components/MonthlyRevenueLineChart";
import {
  monthlyRevenueData,
  employeeEngagementData,
  dashboardData,
} from "@/lib/admin/adminData";
import EmployeeEngagementBarChart from "./EmployeeEngagementBarChart";
import AdminHeader from "./AdminHeader";

export default function Dashboard() {
  const { stats } = dashboardData;

  return (
    <>
      <AdminHeader />
      <div className="px-6 pt-10 pb-16">
        <div className="mx-auto max-w-7xl">
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/platform-usage-pipeline">
              <div className="rounded-xl border border-[#D0D0D0] bg-white">
                <StatCard label="Total Users" value={stats.totalUsers} />
              </div>
            </Link>
            <Link href="/revenue">
              <div className="rounded-xl border border-[#D0D0D0] bg-white">
                <StatCard
                  label="Total Revenue"
                  value={`₱${stats.totalRevenue}`}
                />
              </div>
            </Link>
            <Link href="/verified-badge">
              <div className="rounded-xl border border-[#D0D0D0] bg-white">
                <StatCard
                  label="Pending Verifications"
                  value={stats.pendingVerifications}
                />
              </div>
            </Link>
            <Link href="/support">
              <div className="rounded-xl border border-[#D0D0D0] bg-white">
                <StatCard
                  label="Open Support Tickets"
                  value={stats.openTickets}
                />{" "}
              </div>
            </Link>
          </div>

          <div className="pt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Monthly Revenue */}
            <div className="rounded-xl border border-[#D0D0D0] bg-white p-5">
              <h3 className="font-semibold text-[#3D434A] pb-4">
                Monthly Revenue
              </h3>

              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="w-full md:w-auto">
                  <div className="text-[2.145rem] text-[#CB0000] font-bold">
                    ₱37.5K
                  </div>
                  <div className="flex items-center gap-1 text-[#A3AED0] text-sm">
                    Total Spent
                    <GoTriangleUp className="text-[#CB0000]" />
                    <span className="text-[#CB0000] font-bold">+2.45%</span>
                  </div>
                  <div className="flex items-center gap-2 pt-3">
                    <IoIosCheckmarkCircle className="text-xl text-[#CB0000]" />
                    <span className="text-[#CB0000] font-bold">On track</span>
                  </div>
                </div>

                <div className="w-full md:flex-1 h-[300px]">
                  <MonthlyRevenueLineChart data={monthlyRevenueData} />
                </div>
              </div>
            </div>

            {/* Employee Engagement */}
            <div className="rounded-xl p-5 bg-white shadow-sm border border-gray-200">
              <h3 className="text-[1.034rem] text-[#3D434A] font-semibold pb-4">
                Employee Engagement
              </h3>
              <EmployeeEngagementBarChart data={employeeEngagementData} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
