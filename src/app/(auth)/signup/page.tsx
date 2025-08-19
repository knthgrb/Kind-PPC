"use client";

import { useState } from "react";
import Link from "next/link";
import RoleCard from "@/app/(marketing)/_components/RoleCard";

type Role = "bossing" | "tao" | null;

export default function RegisterChooseRolePage() {
  const [role, setRole] = useState<Role>(null);

  const onContinue = () => {
    if (!role) return;
    const next = role === "bossing" ? "/signup/bossing" : "/signup/tao";
    window.location.href = next;
  };

  return (
    <main className="min-h-screen flex items-start justify-center px-4">
      <section className="w-full max-w-5xl">
        <div className="text-center mt-10 mb-8">
          <h1 className="mb-2 signupH1">Join Kind Today!</h1>
          <h2 className="signupH2">
            Are you looking to hire help or find rewarding
            <br /> household work?
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          <RoleCard
            selected={role === "bossing"}
            onSelect={() => setRole("bossing")}
            iconSrc="/icons/reg_kind_bossing.png"
            title="I'm a kindBossing, looking to hire:"
            bullets={[
              "Quickly find verified, reliable help tailored to your family’s needs.",
              "Access trusted yayas, caregivers, helpers, drivers, and skilled labor.",
              "Benefit from built-in HR management tools for stress-free hiring.",
            ]}
          />

          <RoleCard
            selected={role === "tao"}
            onSelect={() => setRole("tao")}
            iconSrc="/icons/reg_kind_tao.png"
            title="I'm a kindTao, looking for work:"
            bullets={[
              "Easily find flexible and rewarding household employment.",
              "Showcase your skills and connect with kindBossing who value you.",
              "Enjoy secure communication and straightforward job applications.",
            ]}
          />
        </div>

        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={onContinue}
            disabled={!role}
            className={`h-12 w-[230px] rounded-md px-6 
      ${role ? "bg-[#CC0000] text-white" : "bg-[#CECECE] text-[#A2A2A2]"}
    `}
          >
            Create Your Account
          </button>
        </div>

        <p className="text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="underline underline-offset-2">
            Log In
          </Link>
        </p>
      </section>
    </main>
  );
}
