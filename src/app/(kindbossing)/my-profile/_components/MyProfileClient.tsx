"use client";

import Image from "next/image";
import { useState } from "react";
import PostedJobGrid from "./PostedJobsGrid";
import { FiLogOut } from "react-icons/fi";
import { LuPencil } from "react-icons/lu";
import Card from "@/components/Card";
import { JobPost } from "@/types/jobPosts";
import { KindBossingProfile } from "@/types/kindBossingProfile";

type MyProfileClientProps = {
  user: KindBossingProfile;
  familyId: string;
  postedJobs: JobPost[];
  page: number;
  totalPages: number;
};

export default function MyProfileClient({
  user,
  familyId,
  postedJobs,
  page,
  totalPages,
}: MyProfileClientProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    city: user.city || "",
    province: user.province || "",
    postal_code: user.postal_code || "",
  });

  const {
    first_name,
    last_name,
    email,
    phone,
    profile_image_url,
    address,
    city,
    province,
    postal_code,
  } = user;

  const fullName = [first_name, last_name].filter(Boolean).join(" ");
  const fullAddress = [address, city, province, postal_code]
    .filter(Boolean)
    .join(", ");

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
          <Card className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="profileH1">Personal Information</h3>
              <button
                onClick={() => setEditingProfile((v) => !v)}
                className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-lg hover:bg-gray-200"
                aria-label="Edit Profile"
              >
                <LuPencil />
              </button>
            </div>

            {!editingProfile ? (
              // --- VIEW MODE ---
              <div className="flex items-center gap-4 mt-6 ml-5">
                <div className="relative w-32 sm:w-40 aspect-square rounded-full overflow-hidden bg-white">
                  <Image
                    src={
                      profile_image_url || "/profile/profile_placeholder.png"
                    }
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xl sm:text-[1.417rem] font-semibold text-[#222222] mt-1">
                    {fullName || "No name"}
                  </div>
                  <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                    {email}
                  </div>
                  <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                    {phone || "No phone"}
                  </div>
                  <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                    {fullAddress || "No address provided"}
                  </div>
                </div>
              </div>
            ) : (
              // --- EDIT MODE ---
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Submitted profile data:", form);
                  setEditingProfile(false);
                }}
                className="space-y-3 mt-4"
              >
                <input
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  placeholder="First Name"
                  className="w-full h-10 rounded-md text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  placeholder="Last Name"
                  className="w-full h-10 rounded-md text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="Email"
                  className="w-full h-10 rounded-md text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Phone"
                  className="w-full h-10 rounded-md text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Address"
                  className="w-full h-10 rounded-md text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="City"
                  className="w-full h-10 rounded-md text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.province}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, province: e.target.value }))
                  }
                  placeholder="Province"
                  className="w-full h-10 rounded-md text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.postal_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, postal_code: e.target.value }))
                  }
                  placeholder="Postal Code"
                  className="w-full h-10 rounded-md text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
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
            <PostedJobGrid
              jobs={postedJobs}
              familyId={familyId}
              page={page}
              totalPages={totalPages}
            />
          </Card>
        </div>
      </div>
    </main>
  );
}
