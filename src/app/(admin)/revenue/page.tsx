"use client";

import React from "react";
import StatCard from "../_components/StatCard";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { GoTriangleUp } from "react-icons/go";
import MonthlyRevenueLineChart from "../_components/MonthlyRevenueLineChart";
import MonthlyRevenueDonutChart from "./_components/MonthlyRevenueDonutChart";
import PlansTable from "./_components/PlansTable";
import {
  monthlyRevenueData,
  revenueData,
  revenueBreakdownData,
} from "@/lib/admin/adminData";

export default function Revenue() {
  const { stats, pricingPlans } = revenueData;

  return (
    <div className="px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="Total Revenue"
              value={`₱${stats.totalRevenue.toLocaleString()}`}
            />
          </div>
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="Active Subscriptions"
              value={stats.activeSubscriptions}
            />
          </div>
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="Cancelled Subscriptions"
              value={stats.cancelledSubscriptions}
            />
          </div>
        </div>

        {/* Charts */}
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Line Chart */}
          <div className="rounded-xl border border-[#D0D0D0] bg-white p-5">
            <h3 className="font-semibold text-[#3D434A] pb-4">
              Monthly Revenue
            </h3>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Left Section (Text Info) */}
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

              {/* Right Section (Chart) */}
              <div className="w-full md:flex-1 h-[300px]">
                <MonthlyRevenueLineChart data={monthlyRevenueData} />
              </div>
            </div>
          </div>

          {/* Pie / Donut Chart */}
          <div className="rounded-xl border border-[#D0D0D0] bg-white p-5">
            <h3 className="font-semibold text-[#3D434A] pb-4">
              Revenue Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="flex justify-center md:block">
                {" "}
                <div className="w-[250px] h-[250px] md:w-[300px] md:h-[300px] overflow-visible">
                  <MonthlyRevenueDonutChart data={revenueBreakdownData} />
                </div>
              </div>
              <div className="flex flex-col space-y-3 mx-auto">
                {revenueBreakdownData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="!font-bold !text-[1.108rem]">
                      ₱{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Plans Table */}
        <div className="border border-[#D0D0D0] rounded-3xl p-8 bg-white mt-6 overflow-x-auto">
          <PlansTable plans={pricingPlans} />
        </div>
      </div>
    </div>
  );
}
