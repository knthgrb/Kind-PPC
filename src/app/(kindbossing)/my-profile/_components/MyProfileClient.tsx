"use client";

import Image from "next/image";
import PostedJobGrid from "./PostedJobsGrid";
import { FiLogOut } from "react-icons/fi";
import { LuPencil } from "react-icons/lu";
import Card from "@/components/Card";

interface Job {
  name: string;
  image: string;
  location: string;
  occupation: string;
  price: number;
}

interface MyProfileClientProps {
  jobs: Job[];
}

export default function MyProfileClient({ jobs }: MyProfileClientProps) {
  const handleEditPlans = () => {
    console.log("Edit plans clicked");
  };

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const handleEditProfile = () => {
    console.log("Edit profile clicked");
  };

  return (
    <main className="min-h-screen px-4 md:px-6 py-6 flex items-start justify-center">
      <div className="w-full max-w-6xl border border-[#ABABAB] rounded-[30px] p-6 md:p-5 bg-white grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-start">
        <div className="lg:col-span-7 flex flex-col h-full">
          {/* Personal Information */}
          <Card className="flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <h3 className="profileH1">Personal Information</h3>
              <button
                onClick={handleEditProfile}
                className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-lg hover:bg-gray-200"
                aria-label="Edit Profile"
              >
                <LuPencil />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-6 ml-5">
              <div className="relative w-32 sm:w-40 aspect-square rounded-full overflow-hidden bg-white ring-4 ring-[#D0D0D0]">
                <Image
                  src="/people/user-profile.png"
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="text-xl sm:text-[1.417rem] font-semibold text-[#222222] mt-1">
                  Alwin Smith
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
        </div>

        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* My Plan */}
          <Card className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="profileH1">My Plan</h3>
              <button
                onClick={handleEditPlans}
                className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-700"
              >
                Edit Plans
              </button>
            </div>
            <div>
              <div className="font-bold text-[1.438rem] text-[#05264E]">
                Basic
              </div>
              <div className="text-[2.877rem] font-extrabold text-[#CC0000]">
                ₱19
                <span className="text-[0.924rem] font-normal text-[#A0ABB8]">
                  /month
                </span>
              </div>
              <p className="text-[0.719rem] text-[#4F5E64] mt-1">
                Ideal for occasional hiring needs.
              </p>
            </div>
          </Card>

          {/* Logout */}
          <Card className="relative">
            <div className="flex items-center justify-between">
              <h3 className="profileH1">Logout</h3>
              <button
                type="button"
                onClick={handleLogout}
                className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-lg text-[#FF0000] hover:bg-gray-200"
                aria-label="Logout"
              >
                <FiLogOut />
              </button>
            </div>
          </Card>
        </div>

        {/* Posted Jobs */}
        <div className="lg:col-span-12">
          <Card title="Posted Jobs">
            <PostedJobGrid jobs={jobs} />
          </Card>
        </div>
      </div>
    </main>
  );
}
