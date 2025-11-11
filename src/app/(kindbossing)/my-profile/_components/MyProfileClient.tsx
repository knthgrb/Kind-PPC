"use client";

import Image from "next/image";
import { useState } from "react";
import { LuPencil } from "react-icons/lu";
import Card from "@/components/common/Card";
import { KindBossingProfile } from "@/types/kindBossingProfile";

type MyProfileClientProps = {
  user: KindBossingProfile;
};

export default function MyProfileClient({ user }: MyProfileClientProps) {
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

  return (
    <main className="min-h-screen px-4 md:px-6 py-6 flex items-start justify-center">
      <div className="w-full max-w-4xl border border-[#ABABAB] rounded-[30px] p-6 md:p-5 bg-white">
        <div className="flex flex-col h-full">
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
                  className="w-full h-10 rounded-xl text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  placeholder="Last Name"
                  className="w-full h-10 rounded-xl text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="Email"
                  className="w-full h-10 rounded-xl text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Phone"
                  className="w-full h-10 rounded-xl text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Address"
                  className="w-full h-10 rounded-xl text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="City"
                  className="w-full h-10 rounded-xl text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.province}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, province: e.target.value }))
                  }
                  placeholder="Province"
                  className="w-full h-10 rounded-xl text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />
                <input
                  value={form.postal_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, postal_code: e.target.value }))
                  }
                  placeholder="Postal Code"
                  className="w-full h-10 rounded-xl text-[#667282] border border-[#ADADAD] px-3 bg-white focus:outline-none"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 border rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-xl"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
