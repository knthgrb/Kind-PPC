import StatCard from "../_components/StatCard";
import UsageGrowthChart from "./_components/UsageGrowthChart";
import {
  platformUsagePipelineData,
  expectedUsage,
  usageGrowthData,
} from "@/lib/admin/adminData";
export default function PlatformUsagePipeline() {
  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 pb-6">
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="Total Active Users"
              value={platformUsagePipelineData.totalActiveUsers}
            />
          </div>
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="New Signups This Month"
              value={platformUsagePipelineData.newSignups}
            />
          </div>
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="Total Jobs Posted"
              value={platformUsagePipelineData.totalJobsPosted}
            />
          </div>
        </div>

        {/* Usage Growth */}
        <div className="rounded-xl border border-[#D0D0D0] p-5 bg-white">
          <h3 className="text-[1.034rem] text-[#3D434A] font-semibold pb-6">
            Usage Growth
          </h3>
          <UsageGrowthChart
            data={usageGrowthData}
            expectedUsage={expectedUsage}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-6">
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="Registered Users"
              value={platformUsagePipelineData.registeredUsers}
            />
          </div>
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="Verified Users"
              value={platformUsagePipelineData.verifiedUsers}
            />
          </div>
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="Jobs Created"
              value={platformUsagePipelineData.jobsCreated}
            />
          </div>
          <div className="rounded-xl border border-[#D0D0D0] bg-white">
            <StatCard
              label="Jobs Completed"
              value={platformUsagePipelineData.jobsCompleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
