"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/app/(admin)/_components/StatCard";
import { getKindBossingDashboardStats } from "@/actions/kindbossing/get-dashboard-stats";

export default function MyDashboard() {
  const [stats, setStats] = useState({
    totalJobPosts: 0,
    pendingApplications: 0,
    activeMatches: 0,
    activeConversations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getKindBossingDashboardStats();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome to your dashboard! View your jobs, applications, matches, and
        conversations here.
      </p>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/kindbossing/my-jobs">
          <div className="rounded-xl border border-[#D0D0D0] bg-white cursor-pointer hover:border-[#CB0000] transition-colors">
            <StatCard label="Active Job Posts" value={stats.totalJobPosts} />
          </div>
        </Link>
        <Link href="/kindbossing/applications">
          <div className="rounded-xl border border-[#D0D0D0] bg-white cursor-pointer hover:border-[#CB0000] transition-colors">
            <StatCard
              label="Pending Applications"
              value={stats.pendingApplications}
            />
          </div>
        </Link>
        <Link href="/matches">
          <div className="rounded-xl border border-[#D0D0D0] bg-white cursor-pointer hover:border-[#CB0000] transition-colors">
            <StatCard label="Active Matches" value={stats.activeMatches} />
          </div>
        </Link>
        <Link href="/matches">
          <div className="rounded-xl border border-[#D0D0D0] bg-white cursor-pointer hover:border-[#CB0000] transition-colors">
            <StatCard
              label="Active Conversations"
              value={stats.activeConversations}
            />
          </div>
        </Link>
      </div>
    </div>
  );
}
