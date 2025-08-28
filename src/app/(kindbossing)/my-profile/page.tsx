// app/profile/page.tsx
"use client";

import Image from "next/image";
import PostedJobGrid from "./_components/PostedJobsGrid";
import { FiLogOut } from "react-icons/fi";

const postedJobs = [
  {
    name: "Jarrel Steward",
    image: "/people/darrellSteward.png",
    location: "Cebu City",
    occupation: "Maid for Home",
    price: 550,
  },
  {
    name: "Ralph Edwards",
    image: "/people/ralphEdwards.png",
    location: "Cebu City",
    occupation: "Electrician",
    price: 550,
  },
  {
    name: "Esther Howard",
    image: "/people/estherHoward.png",
    location: "Talisay City",
    occupation: "Plumber",
    price: 550,
  },
  {
    name: "Theresa Webb",
    image: "/people/theresaWebb.png",
    location: "Talisay City",
    occupation: "Maid for Home",
    price: 550,
  },
  {
    name: "Devon Lane",
    image: "/people/devonLane.png",
    location: "Naga City",
    occupation: "Electrician",
    price: 550,
  },
  {
    name: "Kristin Watson",
    image: "/people/kristinWatson.png",
    location: "Naga City",
    occupation: "Plumber",
    price: 550,
  },
  {
    name: "Dianne Russell",
    image: "/people/dianneRussell.png",
    location: "Minglanilla",
    occupation: "Maid for Home",
    price: 550,
  },
  {
    name: "Jane Cooper",
    image: "/people/janeCooper.png",
    location: "Minglanilla",
    occupation: "Electrician",
    price: 550,
  },
];

export default function MyProfilePage() {
  return (
    <main className="min-h-screen px-4 md:px-6 py-6 flex items-start justify-center">
      {/* Outer bordered container */}
      <div className="w-full max-w-6xl border border-[#ABABAB] rounded-[30px] p-6 md:p-5 bg-white grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Personal Info */}
          <section className="rounded-2xl border border-[#F6F6F6] bg-[#F6F6F6] p-4 md:p-5">
            <h3 className="profileH1 mb-3">Personal Information</h3>
            <div className="flex items-start gap-4 mt-6 ml-5">
              <div className="relative w-[196px]">
                <Image
                  src="/profile/profile_placeholder.png"
                  alt="Profile"
                  width={196}
                  height={196}
                  className="relative rounded-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[#12223B]">Alwin Smith</div>
                <div className="text-sm opacity-80">example@gmail.com</div>
                <div className="text-sm opacity-80">+63 945 4856 456</div>
                <div className="text-sm opacity-80">
                  Blk 12 Lot 8 Mabuhay St, Brgy <br />
                  San Isidro, Quezon City, Metro Manila, Philippines
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-4">
          {/* My Plan */}
          <section className="rounded-2xl border border-[#F6F6F6] bg-[#F6F6F6] p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="profileH1">My Plan</h3>
              <button className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold">
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
          </section>

          {/* Logout */}
          <section className="rounded-2xl border border-[#F6F6F6] bg-[#F6F6F6] p-4 md:p-5">
            <div className="flex items-center justify-between">
              <h3 className="profileH1">Logout</h3>
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-xl text-[#FF0000]"
                aria-label="Logout"
              >
                <FiLogOut />
              </button>
            </div>
          </section>
        </div>

        {/* Posted Jobs (full width) */}
        <div className="lg:col-span-12">
          <section className=" p-4 md:p-5">
            <h3 className="profileH1 mb-3">Posted Jobs</h3>
            <PostedJobGrid jobs={postedJobs} />
          </section>
        </div>
      </div>
    </main>
  );
}
